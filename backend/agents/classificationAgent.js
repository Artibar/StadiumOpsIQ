import Groq from 'groq-sdk';
import { sanitizeForPrompt } from './intakeAgent.js';

const classificationTool = {
  type: "function",
  function: {
    name: "classifyIncident",
    description: `Classify a stadium incident report. Analyze the description, location, and stadium context to determine the incident type, severity, and confidence. Consider stadium capacity when assessing severity — same incident is more severe in a 90,000 capacity stadium vs 30,000.`,
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["medical", "security", "crowd", "fire", "weather", "lost-item", "other"],
          description: `Type of incident:
            medical = injury/illness/unconscious
            security = fight/theft/suspicious
            crowd = surge/stampede/overcrowding
            fire = fire/smoke/explosion
            weather = storm/lightning/flooding
            lost-item = lost person/child/item
            other = anything else`
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: `Severity level:
            low = minor, no immediate danger
            medium = needs attention soon
            high = urgent, potential serious harm
            critical = immediate life threat, mass casualty risk, or evacuation needed`
        },
        confidence: {
          type: "number",
          description: `Confidence score 0.0-1.0. How certain are you of this classification?
            >0.8 = very clear incident description
            0.6-0.8 = reasonably clear
            <0.6 = ambiguous, needs human review`
        },
        reasoning: {
          type: "string",
          description: `Step by step reasoning explaining WHY you chose this type and severity. Mention specific words from the incident that influenced your decision. Mention if stadium capacity or zone location affected your severity assessment.`
        },
        keyIndicators: {
          type: "array",
          items: { type: "string" },
          description: `List of specific words or phrases from the incident that drove this classification. Example: ["collapsed", "unconscious", "Gate 4", "immediate"]`
        },
        recommendedUrgency: {
          type: "string",
          enum: ["immediate", "urgent", "routine", "monitor"],
          description: `Response urgency:
            immediate = act within 1 minute
            urgent = act within 5 minutes
            routine = act within 30 minutes
            monitor = log and watch only`
        }
      },
      required: ["type", "severity", "confidence", "reasoning", "keyIndicators", "recommendedUrgency"]
    }
  }
};

function buildSystemPrompt(stadiumName, stadiumCapacity, zoneLocation) {
  return `You are an expert stadium operations classifier for FIFA World Cup 2026. Your job is to classify incident reports submitted by on-ground staff with precision and speed.

CURRENT CONTEXT:
Stadium: ${stadiumName}
Capacity: ${stadiumCapacity} spectators
Reported Zone: ${zoneLocation}

CLASSIFICATION RULES:
1. Read the FULL incident description carefully before classifying
2. Base severity on ACTUAL WORDS used —
   "collapsed/unconscious" = high/critical
   "fight/assault" = high
   "pushing/overcrowding" = medium/high
   "smoke/fire" = critical
   "lost child" = high
   "minor complaint" = low
3. Increase severity by ONE level if:
   - Stadium capacity > 80,000
   - Zone is near exits or main gates
   - Multiple people affected
4. Set confidence < 0.6 if:
   - Description is vague or very short
   - Incident type is unclear
   - Contradictory information present
5. ALWAYS provide specific key indicators from the actual text
6. Think step by step in your reasoning`;
}

/**
 * Executes the Classification Agent workflow: invokes Groq model with function calling to determine type, severity, urgency, and confidence metrics.
 * @param {Object} intakeOutput - Output from the Intake Agent
 * @param {string} intakeOutput.translatedText - English translation or original text of the incident report
 * @param {Object} intakeOutput.stadium - Matched stadium object containing metadata
 * @param {string} intakeOutput.zoneLocation - Internal zone coordinates within the stadium
 * @param {string} intakeOutput.detectedLanguageName - Readable name of the intake language
 * @param {boolean} intakeOutput.wasTranslated - Indicates if translation occurred
 * @returns {Object} Classification result with type, severity, confidence, reasoning, recommendedUrgency, and reasoningEntry.
 */
export async function runClassificationAgent(intakeOutput) {
  const startTime = Date.now();
  const apiKey = process.env.GROQ_API_KEY;

  const { 
    translatedText, 
    stadium, 
    zoneLocation,
    detectedLanguageName,
    wasTranslated
  } = intakeOutput;

  // Sanitize input to protect downstream prompt injections
  const sanitizedTranslatedText = sanitizeForPrompt(translatedText);

  if (!apiKey) {
    console.warn("[CLASSIFICATION] GROQ_API_KEY not configured. Falling back to safe defaults.");
    return {
      type: 'other',
      severity: 'high',
      confidence: 0.0,
      reasoning: 'Classification failed — GROQ_API_KEY is not defined. Defaulting to high severity for safety.',
      keyIndicators: [],
      recommendedUrgency: 'urgent',
      flaggedForHumanReview: true,
      processingTimeMs: Date.now() - startTime,
      reasoningEntry: {
        agentName: 'Classification Agent',
        step: 2,
        thought: '[CLASSIFICATION] Groq API Key is missing. Pipeline flagged for human review directly.',
        action: 'FALLBACK_DUE_TO_MISSING_CREDENTIALS',
        result: 'Type: other | Severity: high | Confidence: 0% | Urgency: urgent',
        timestamp: new Date()
      }
    };
  }

  try {
    const groq = new Groq({ apiKey, maxRetries: 0 });

    const userMessage = `
INCIDENT REPORT:
"${sanitizedTranslatedText}"

LOCATION CONTEXT:
Stadium: ${stadium.name}
City: ${stadium.city}
Capacity: ${stadium.capacity} spectators
Zone: ${zoneLocation}

${wasTranslated ? `NOTE: This report was originally submitted in ${detectedLanguageName} and translated to English.` : ''}

Please classify this incident.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 300,
      tools: [classificationTool],
      tool_choice: {
        type: "function",
        function: { name: "classifyIncident" }
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(
            stadium.name,
            stadium.capacity,
            zoneLocation
          )
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call returned by Groq classifier model");
    }

    const classification = JSON.parse(toolCall.function.arguments);

    const reasoningEntry = {
      agentName: 'Classification Agent',
      step: 2,
      thought: `[CLASSIFICATION] Analyzing incident at ${stadium.name} (capacity: ${stadium.capacity}), Zone: ${zoneLocation}. Key indicators found: ${classification.keyIndicators.join(', ')}. Classification: ${classification.type} / ${classification.severity} severity. Confidence: ${Math.round(classification.confidence * 100)}%. ${
        classification.confidence < 0.6 
          ? 'LOW CONFIDENCE — flagging for human review.' 
          : 'Confidence sufficient — proceeding to context analysis.'
      }`,
      action: 'GROQ_FUNCTION_CALLING — classifyIncident tool',
      result: `Type: ${classification.type} | Severity: ${classification.severity} | Confidence: ${Math.round(classification.confidence * 100)}% | Urgency: ${classification.recommendedUrgency}`,
      timestamp: new Date()
    };

    return {
      type: classification.type,
      severity: classification.severity,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      keyIndicators: classification.keyIndicators,
      recommendedUrgency: classification.recommendedUrgency,
      reasoningEntry: reasoningEntry,
      processingTimeMs: Date.now() - startTime,
      flaggedForHumanReview: classification.confidence < 0.6
    };

  } catch (error) {
    console.error("[ERROR] [CLASSIFICATION] runClassificationAgent failed:", error.message);
    const endTime = Date.now();
    return {
      type: 'other',
      severity: 'high',
      confidence: 0.0,
      reasoning: `Classification failed — defaulting to high severity for safety. Error details: ${error.message}`,
      keyIndicators: [],
      recommendedUrgency: 'urgent',
      flaggedForHumanReview: true,
      processingTimeMs: endTime - startTime,
      reasoningEntry: {
        agentName: 'Classification Agent (Failed)',
        step: 2,
        thought: `[CLASSIFICATION] Model invocation crashed with error: ${error.message}. Flagged for safety.`,
        action: 'FALLBACK_SAFETY_MODE',
        result: 'Type: other | Severity: high | Confidence: 0% | Urgency: urgent',
        timestamp: new Date()
      }
    };
  }
}
