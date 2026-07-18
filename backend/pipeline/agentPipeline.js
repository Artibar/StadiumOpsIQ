import mongoose from 'mongoose';
import { runIntakeAgent } from '../agents/intakeAgent.js';
import { runClassificationAgent } from '../agents/classificationAgent.js';
import { runContextAgent } from '../agents/contextAgent.js';
import { runDecisionAgent } from '../agents/decisionAgent.js';
import { runReportAgent } from '../agents/reportAgent.js';

const CONFIDENCE_THRESHOLD = 0.6;
const MAX_AGENT_ITERATIONS = 5;
const WEATHER_CACHE_DURATION = 3600000;

function buildIncidentObject(
  description, stadiumName, zoneLocation,
  intakeOutput, classificationOutput,
  contextOutput, decisionOutput,
  finalStatus, finalDecision,
  actionsTaken, reasoningTrail,
  pipelineDuration,
  reportOutput = null
) {
  return {
    originalDescription: description,
    detectedLanguage: intakeOutput?.detectedLanguage || 'en',
    translatedDescription: intakeOutput?.translatedText || description,
    stadiumName: intakeOutput?.stadium?.name || stadiumName,
    stadiumCity: intakeOutput?.stadium?.city || '',
    stadiumCapacity: intakeOutput?.stadium?.capacity || 0,
    stadiumCoordinates: {
      latitude: intakeOutput?.stadium?.latitude || 0,
      longitude: intakeOutput?.stadium?.longitude || 0
    },
    zoneLocation: zoneLocation,
    type: classificationOutput?.type || 'other',
    severity: classificationOutput?.severity || 'high',
    status: finalStatus,
    confidence: classificationOutput?.confidence || 0,
    liveContext: contextOutput ? {
      weather: contextOutput.weather,
      matchStatus: contextOutput.matchStatus,
      combinedRiskLevel: contextOutput.combinedRisk,
      contextSummary: contextOutput.contextSummary,
      fetchedAt: new Date()
    } : null,
    reasoningTrail: reasoningTrail,
    finalDecision: finalDecision,
    actionsTaken: actionsTaken,
    humanOverride: false,
    incidentReport: reportOutput ? {
      ...reportOutput.report,
      generatedAt: new Date(),
      emailSent: reportOutput.emailSent
    } : null,
    pipelineDurationMs: pipelineDuration
  };
}

/**
 * Runs the end-to-end multi-agent orchestration pipeline.
 * Passes data sequentially between Intake, Classification, Context, Decision, and Report Agents.
 * @param {string} description - Raw incident description
 * @param {string} stadiumName - Target stadium name
 * @param {string} zoneLocation - Internal zone coordinates
 * @param {mongoose.Types.ObjectId} [preGeneratedId=null] - Pre-generated incident ID
 * @returns {Object} Full structured incident object ready for database storage.
 */
export async function runPipeline(description, stadiumName, zoneLocation, preGeneratedId = null) {
  const pipelineStart = Date.now();
  const allReasoningTrail = [];
  
  // Use pre-generated ObjectID if available (helps link Discord and MongoDB seamlessly)
  const incidentId = preGeneratedId || new mongoose.Types.ObjectId();

  try {
    // AGENT 1 — INTAKE
    console.log('[PIPELINE] 🔵 Agent 1: Intake Agent processing...');
    const intakeOutput = await runIntakeAgent(description, stadiumName, zoneLocation);
    allReasoningTrail.push(intakeOutput.reasoningEntry);
    console.log(`[PIPELINE] ✅ Agent 1 complete: Language: ${intakeOutput.detectedLanguageName}, Stadium: ${intakeOutput.stadium.name}`);
    
    // AGENT 2 — CLASSIFICATION
    console.log('[PIPELINE] 🔵 Agent 2: Classification Agent processing...');
    const classificationOutput = await runClassificationAgent(intakeOutput);
    allReasoningTrail.push(classificationOutput.reasoningEntry);
    console.log(`[PIPELINE] ✅ Agent 2 complete: ${classificationOutput.type} / ${classificationOutput.severity} / ${Math.round(classificationOutput.confidence * 100)}% confidence`);
    
    // AGENT 3 — CONTEXT
    console.log('[PIPELINE] 🔵 Agent 3: Context Agent fetching live data...');
    const contextOutput = await runContextAgent(intakeOutput, classificationOutput);
    allReasoningTrail.push(contextOutput.reasoningEntry);
    console.log(`[PIPELINE] ✅ Agent 3 complete: Weather: ${contextOutput.weather.temperature}°C, Match: ${contextOutput.matchStatus.phase}, Combined risk: ${contextOutput.combinedRisk}`);
    
    // AGENT 4 — DECISION
    console.log('[PIPELINE] 🔵 Agent 4: Decision Agent reasoning...');
    const decisionOutput = await runDecisionAgent(intakeOutput, classificationOutput, contextOutput, incidentId.toString());
    allReasoningTrail.push(...decisionOutput.reasoningTrail);
    console.log(`[PIPELINE] ✅ Agent 4 complete: Actions: ${decisionOutput.actionsTaken.join(', ')}, Status: ${decisionOutput.finalStatus}`);
    
    // AGENT 5 — REPORT
    console.log('[PIPELINE] 🔵 Agent 5: Report Agent generating report + sending email...');
    const reportOutput = await runReportAgent(
      intakeOutput,
      classificationOutput,
      contextOutput,
      decisionOutput,
      incidentId.toString()
    );
    allReasoningTrail.push(reportOutput.reasoningEntry);
    console.log(`[PIPELINE] ✅ Agent 5 complete: Risk rating: ${reportOutput.report.riskRating}, Email sent: ${reportOutput.emailSent}`);

    // If confidence was low or flagged, override final status to review queue
    const isLowConfidence = classificationOutput.confidence < CONFIDENCE_THRESHOLD || classificationOutput.flaggedForHumanReview;
    const finalStatus = isLowConfidence ? 'flagged-for-review' : decisionOutput.finalStatus;
    const finalDecision = isLowConfidence 
      ? `Low confidence classification (${Math.round(classificationOutput.confidence * 100)}%) — requires human review. AI recommendation: ${decisionOutput.finalDecision}`
      : decisionOutput.finalDecision;
    const actionsTaken = isLowConfidence 
      ? [...decisionOutput.actionsTaken, 'flagForHumanReview']
      : decisionOutput.actionsTaken;

    if (isLowConfidence) {
      allReasoningTrail.push({
        agentName: 'Pipeline Controller (Safety Bypass)',
        step: 6,
        thought: `[PIPELINE] Incident flagged for human review because Agent 2 confidence (${Math.round(classificationOutput.confidence * 100)}%) is below ${CONFIDENCE_THRESHOLD * 100}%.`,
        action: 'FLAG_FOR_REVIEW',
        result: 'Staged for supervisor review with generated AI report',
        timestamp: new Date()
      });
    }

    // Build and return complete incident object
    const finalIncident = buildIncidentObject(
      description, stadiumName, zoneLocation,
      intakeOutput, classificationOutput,
      contextOutput, decisionOutput,
      finalStatus,
      finalDecision,
      actionsTaken,
      allReasoningTrail,
      Date.now() - pipelineStart,
      reportOutput
    );

    // Attach pre-generated ObjectID
    finalIncident._id = incidentId;
    return finalIncident;
    
  } catch (error) {
    console.error('[ERROR] [PIPELINE] Pipeline error:', error);
    return {
      _id: incidentId,
      originalDescription: description,
      stadiumName: stadiumName,
      zoneLocation: zoneLocation,
      type: 'other',
      severity: 'high',
      status: 'flagged-for-review',
      confidence: 0,
      finalDecision: 'Pipeline error — manual review required: ' + error.message,
      actionsTaken: ['PIPELINE_ERROR'],
      reasoningTrail: [{
        agentName: 'Pipeline',
        step: 0,
        thought: '[PIPELINE] Critical pipeline error occurred in the execution chain',
        action: 'PIPELINE_ERROR',
        result: error.message,
        timestamp: new Date()
      }],
      pipelineError: error.message,
      pipelineDurationMs: Date.now() - pipelineStart
    };
  }
}
