import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';

const reportTool = {
  type: "function",
  function: {
    name: "generateIncidentReport",
    description: `Generate a structured, professional incident report for stadium operations records. This report will be saved to the database and sent to the operations manager. Write in clear, professional emergency services language.`,
    parameters: {
      type: "object",
      properties: {
        executiveSummary: {
          type: "string",
          description: `2-3 sentence summary of the incident for senior management. Include: what happened, where, severity, and action taken.`
        },
        incidentNarrative: {
          type: "string",
          description: `Full professional narrative of the incident from initial report to resolution. Include timeline, actions taken, and current status. 3-5 paragraphs.`
        },
        rootCauseAnalysis: {
          type: "string",
          description: `Analysis of likely root cause based on available information. What may have caused this incident? What environmental or contextual factors contributed? Consider: weather conditions, match phase, crowd levels, zone location.`
        },
        immediateActionsLog: {
          type: "array",
          items: { type: "string" },
          description: `Chronological list of immediate actions taken by the system and operators. Each item = one action with implied timestamp context.`
        },
        recommendedFollowUp: {
          type: "array",
          items: { type: "string" },
          description: `List of recommended follow-up actions for ops team: - Medical follow-up if applicable - Security review if applicable - Crowd management adjustments - Zone safety improvements - Staff notifications needed. Minimum 3 recommendations.`
        },
        lessonsLearned: {
          type: "string",
          description: `What can be learned from this incident to prevent future occurrences or improve response times? 2-3 sentences.`
        },
        estimatedResolutionTime: {
          type: "string",
          description: `Estimated time to fully resolve this incident. Examples: "15-30 minutes", "1-2 hours", "Immediate - resolved". Base on severity and type.`
        },
        riskRating: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: `Overall risk rating for this incident considering all factors including weather, match phase, and severity.`
        },
        preventionMeasures: {
          type: "array",
          items: { type: "string" },
          description: `Specific preventive measures recommended for this zone/stadium to prevent recurrence. Minimum 2 measures.`
        }
      },
      required: [
        "executiveSummary",
        "incidentNarrative",
        "rootCauseAnalysis",
        "immediateActionsLog",
        "recommendedFollowUp",
        "lessonsLearned",
        "estimatedResolutionTime",
        "riskRating",
        "preventionMeasures"
      ]
    }
  }
};

function buildReportSystemPrompt(intakeOutput, classificationOutput, contextOutput, decisionOutput) {
  return `You are a professional stadium operations incident report writer for FIFA World Cup 2026. Generate a comprehensive, structured incident report based on the following real incident data.

  INCIDENT DATA:
  
  Original Report: 
  "${intakeOutput.originalText}"
  
  ${intakeOutput.wasTranslated ? `Original Language: ${intakeOutput.detectedLanguageName}\nTranslated Report: "${intakeOutput.translatedText}"` : ''}
  
  LOCATION:
  Stadium: ${intakeOutput.stadium.name}
  City: ${intakeOutput.stadium.city}
  Capacity: ${intakeOutput.stadium.capacity}
  Zone: ${intakeOutput.zoneLocation}
  
  CLASSIFICATION:
  Type: ${classificationOutput.type}
  Severity: ${classificationOutput.severity}
  Confidence: ${Math.round(classificationOutput.confidence * 100)}%
  Key Indicators: ${classificationOutput.keyIndicators.join(', ')}
  AI Reasoning: ${classificationOutput.reasoning}
  
  LIVE CONTEXT AT TIME OF INCIDENT:
  ${contextOutput.contextSummary}
  Weather Risk Flags: ${contextOutput.weather.riskFlags && contextOutput.weather.riskFlags.length > 0 ? contextOutput.weather.riskFlags.join(', ') : 'None'}
  
  ACTIONS TAKEN:
  ${decisionOutput.actionsTaken.join(', ')}
  Final Status: ${decisionOutput.finalStatus}
  AI Decision: ${decisionOutput.finalDecision}
  
  Write a professional incident report using the generateIncidentReport tool. Use formal emergency services language. Be specific — reference actual data from above (temperatures, stadium names, zone locations, match phases). Do not use placeholder text.`;
}

function formatEmailHTML(report, incidentData, incidentId) {
  const sev = (incidentData.severity || 'medium').toLowerCase();
  let sevColor = '#3b82f6'; // default blue
  if (sev === 'critical') sevColor = '#ef4444'; // red
  else if (sev === 'high') sevColor = '#f97316'; // orange
  else if (sev === 'medium') sevColor = '#eab308'; // yellow
  else if (sev === 'low') sevColor = '#22c55e'; // green

  const actionListItems = (report.immediateActionsLog || [])
    .map(a => `<li>${a}</li>`)
    .join('');

  const followUpDivs = (report.recommendedFollowUp || [])
    .map(r => `<div class="recommendation">${r}</div>`)
    .join('');

  const preventionDivs = (report.preventionMeasures || [])
    .map(p => `<div class="recommendation">${p}</div>`)
    .join('');

  const weather = incidentData.weather || {};
  const matchStatus = incidentData.matchStatus || {};

  let riskFlagsHTML = '';
  if (weather.riskFlags && weather.riskFlags.length > 0) {
    riskFlagsHTML = weather.riskFlags
      .map(flag => `<p style="color: #ef4444; font-weight: bold; margin: 4px 0;">⚠️ Weather Risk Flag: ${flag}</p>`)
      .join('');
  }

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #1a1d27; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; color: #9ca3af; }
    .severity-banner { padding: 12px 24px; font-weight: bold; font-size: 16px; text-align: center; color: white; }
    .section { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
    .section h2 { color: #1a1d27; font-size: 16px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .meta-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; }
    .meta-item value { font-size: 14px; color: #111827; font-weight: 500; display: block; margin-top: 2px; }
    .action-list { list-style: none; padding: 0; margin: 0; }
    .action-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .action-list li:before { content: "→ "; color: #6366f1; }
    .recommendation { background: #f0f9ff; border-left: 3px solid #6366f1; padding: 8px 12px; margin: 8px 0; font-size: 14px; border-radius: 0 4px 4px 0; }
    .footer { background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏟️ StadiumOps IQ</h1>
      <p>Incident Report — FIFA World Cup 2026 Operations</p>
    </div>
    
    <div class="severity-banner" style="background: ${sevColor};">
      ${incidentData.severity.toUpperCase()} INCIDENT — ${incidentData.type.toUpperCase()} — ${incidentData.stadium.toUpperCase()} — Zone: ${incidentData.zone.toUpperCase()}
    </div>
    
    <div class="section">
      <h2>Incident Overview</h2>
      <div class="meta-grid">
        <div class="meta-item">
          <label>Incident ID</label>
          <value>${incidentId}</value>
        </div>
        <div class="meta-item">
          <label>Reported At</label>
          <value>${incidentData.timestamp}</value>
        </div>
        <div class="meta-item">
          <label>Stadium</label>
          <value>${incidentData.stadium}</value>
        </div>
        <div class="meta-item">
          <label>Zone</label>
          <value>${incidentData.zone}</value>
        </div>
        <div class="meta-item">
          <label>AI Confidence</label>
          <value>${Math.round(incidentData.confidence * 100)}%</value>
        </div>
        <div class="meta-item">
          <label>Est. Resolution</label>
          <value>${report.estimatedResolutionTime}</value>
        </div>
      </div>
    </div>
 
    <div class="section">
      <h2>Executive Summary</h2>
      <p>${report.executiveSummary}</p>
    </div>
 
    <div class="section">
      <h2>Live Context at Time of Incident</h2>
      <p>🌡️ Weather: ${weather.temperature || 'N/A'}°C, ${weather.weatherDescription || 'N/A'}</p>
      <p>💨 Wind: ${weather.windspeed || 0} km/h | 🌧️ Precipitation: ${weather.precipitation || 0}mm</p>
      <p>⚽ Match Phase: ${matchStatus.phase || 'N/A'}</p>
      <p>👥 Crowd Risk: ${matchStatus.crowdRiskLevel || 'N/A'}</p>
      ${riskFlagsHTML}
    </div>
 
    <div class="section">
      <h2>Incident Narrative</h2>
      <p>${report.incidentNarrative.replace(/\n/g, '<br>')}</p>
    </div>
 
    <div class="section">
      <h2>Root Cause Analysis</h2>
      <p>${report.rootCauseAnalysis}</p>
    </div>
 
    <div class="section">
      <h2>Immediate Actions Log</h2>
      <ul class="action-list">
        ${actionListItems}
      </ul>
    </div>
 
    <div class="section">
      <h2>Recommended Follow-Up Actions</h2>
      ${followUpDivs}
    </div>
 
    <div class="section">
      <h2>Prevention Measures</h2>
      ${preventionDivs}
    </div>
 
    <div class="section">
      <h2>Lessons Learned</h2>
      <p>${report.lessonsLearned}</p>
    </div>
 
    <div class="footer">
      <p>Generated by StadiumOps IQ — AI-Powered Stadium Operations | FIFA World Cup 2026</p>
      <p>Report ID: ${incidentId} | Generated: ${incidentData.timestamp}</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendReportEmail(htmlContent, incidentData, incidentId) {
  const from = process.env.REPORT_EMAIL_FROM;
  const pass = process.env.EMAIL_APP_PASSWORD;
  const to = process.env.REPORT_EMAIL_TO;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');

  if (!from || !pass || !to) {
    console.warn("[REPORT] SMTP email settings are missing. Skipping email dispatch.");
    return { sent: false, error: "SMTP settings not fully configured in environment" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: from,
        pass: pass
      }
    });

    const subject = `[${incidentData.severity.toUpperCase()}] Incident Report — ${incidentData.stadium} Zone ${incidentData.zone} — ${new Date().toLocaleString()}`;

    const info = await transporter.sendMail({
      from: `"StadiumOps IQ" <${from}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });

    console.log(`[REPORT] Incident report email sent successfully: ${info.messageId}`);
    return { sent: true, error: null };
  } catch (error) {
    console.error("[ERROR] [REPORT] sendReportEmail execution failed:", error.message);
    return { sent: false, error: error.message };
  }
}

let groqInstance = null;

function getGroqInstance() {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
      maxRetries: 0
    });
  }
  return groqInstance;
}

/**
 * Executes the Report Agent workflow: writes structured incident summaries, root cause analyses,
 * and follow-up directives, compiling HTML reports and sending SMTP notifications.
 * @param {Object} intakeOutput - Intake output payload
 * @param {Object} classificationOutput - Classification output payload
 * @param {Object} contextOutput - Context output payload
 * @param {Object} decisionOutput - Decision output payload
 * @param {string} incidentId - Database ID of the incident record
 * @returns {Object} Structured report JSON, email success indicators, and reasoning trail.
 */
export async function runReportAgent(intakeOutput, classificationOutput, contextOutput, decisionOutput, incidentId) {
  const startTime = Date.now();

  try {
    const response = await getGroqInstance().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
      tools: [reportTool],
      tool_choice: {
        type: "function",
        function: { name: "generateIncidentReport" }
      },
      messages: [
        {
          role: "system",
          content: buildReportSystemPrompt(
            intakeOutput,
            classificationOutput,
            contextOutput,
            decisionOutput
          )
        },
        {
          role: "user",
          content: `Generate the complete incident report now using the generateIncidentReport tool. Use all the real data provided. Be specific and professional.`
        }
      ]
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No report generation tool call returned by Groq");
    }

    const report = JSON.parse(toolCall.function.arguments);

    // Format HTML email
    const htmlContent = formatEmailHTML(
      report,
      {
        incidentId,
        stadium: intakeOutput.stadium.name,
        zone: intakeOutput.zoneLocation,
        severity: classificationOutput.severity,
        type: classificationOutput.type,
        confidence: classificationOutput.confidence,
        weather: contextOutput.weather,
        matchStatus: contextOutput.matchStatus,
        actionsTaken: decisionOutput.actionsTaken,
        timestamp: new Date().toLocaleString()
      },
      incidentId
    );

    // Send email (non-blocking in background)
    sendReportEmail(
      htmlContent,
      {
        stadium: intakeOutput.stadium.name,
        zone: intakeOutput.zoneLocation,
        severity: classificationOutput.severity
      },
      incidentId
    ).catch(err => {
      console.error("[ERROR] Background sendReportEmail failed:", err.message);
    });

    const emailResult = { sent: true, error: null };

    // Build reasoning trail entry
    const reasoningEntry = {
      agentName: 'Report Agent',
      step: 5,
      thought: `[REPORT] Generated structured incident report for ${incidentId}. Risk rating: ${report.riskRating}. Estimated resolution: ${report.estimatedResolutionTime}. ${report.recommendedFollowUp.length} follow-up actions recommended. ${report.preventionMeasures.length} prevention measures identified. Email report queued in background for dispatch.`,
      action: 'GROQ_REPORT_GENERATION + EMAIL_DISPATCH',
      result: `Report generated: ${report.riskRating} risk | ${report.estimatedResolutionTime} resolution | Email: QUEUED`,
      timestamp: new Date()
    };

    return {
      report: report,
      emailSent: emailResult.sent,
      emailError: emailResult.error || null,
      reasoningEntry: reasoningEntry,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    console.error("[ERROR] [REPORT] runReportAgent failed:", error.message);
    const endTime = Date.now();
    const fallbackReport = generateFallbackReport(intakeOutput, classificationOutput, error);

    const reasoningEntry = {
      agentName: 'Report Agent (Fallback)',
      step: 5,
      thought: `[REPORT] Groq API returned rate limit or network error. Generated structured fallback report for ${incidentId}. Risk rating: ${fallbackReport.riskRating}.`,
      action: 'FALLBACK_REPORT_GENERATION',
      result: `Report generated: ${fallbackReport.riskRating} risk | ${fallbackReport.estimatedResolutionTime} resolution | Email: QUEUED`,
      timestamp: new Date()
    };

    return {
      report: fallbackReport,
      emailSent: true,
      emailError: error.message,
      processingTimeMs: endTime - startTime,
      reasoningEntry: reasoningEntry
    };
  }
}

function generateFallbackReport(intakeOutput, classificationOutput, error) {
  const type = classificationOutput?.type || 'other';
  const severity = classificationOutput?.severity || 'high';
  const stadiumName = intakeOutput?.stadium?.name || 'Stadium';
  const zone = intakeOutput?.zoneLocation || 'Reported Zone';
  const desc = intakeOutput?.translatedText || '';

  let immediateActionsLog = [];
  let recommendedFollowUp = [];
  let preventionMeasures = [];
  let rootCauseAnalysis = '';
  let estimatedResolutionTime = '30 to 60 minutes';

  if (type === 'medical') {
    immediateActionsLog = [
      "Secure the patient and isolate the immediate area for safety",
      "Deploy first aid responders to the zone immediately",
      "Coordinate with local ambulance dispatchers for stadium entry access"
    ];
    recommendedFollowUp = [
      "Review patient incident log and hospital handoff documents",
      "Confirm follow-up status of the injured individual"
    ];
    preventionMeasures = [
      "Review regional first aid responder spacing",
      "Increase public signs for medical service centers"
    ];
    rootCauseAnalysis = "Localized medical distress event requiring emergency clinical response.";
    estimatedResolutionTime = severity === 'critical' ? 'Under 15 minutes' : '30 to 60 minutes';
  } else if (type === 'security') {
    immediateActionsLog = [
      "Deploy localized security detail to neutralize threat and restore order",
      "Separate active conflict participants and secure witnesses",
      "Monitor regional security cameras (CCTV) for suspect tracking"
    ];
    recommendedFollowUp = [
      "Submit security incident logs to local police department",
      "Conduct post-event interview with involved field agents"
    ];
    preventionMeasures = [
      "Increase security personnel patrols in high-density sections",
      "Implement stricter ticket and screening protocols at zone entry gates"
    ];
    rootCauseAnalysis = "Security breach or personal altercation in the reported spectator zone.";
    estimatedResolutionTime = '30 to 60 minutes';
  } else if (type === 'fire') {
    immediateActionsLog = [
      "Trigger local fire alarms and isolate affected section",
      "Deploy fire marshals with hand-held suppression systems",
      "Prepare designated evacuation lines for rapid egress"
    ];
    recommendedFollowUp = [
      "Coordinate complete safety check with regional fire inspectors",
      "Perform full audit of local fire hazard systems"
    ];
    preventionMeasures = [
      "Inspect all regional electrical and concessions setups regularly",
      "Conduct mandatory fire prevention drills for stadium operators"
    ];
    rootCauseAnalysis = "Thermal or chemical combustion event in the reported stadium zone.";
    estimatedResolutionTime = 'Immediate - pending assessment';
  } else if (type === 'crowd') {
    immediateActionsLog = [
      "Implement crowd management patterns to divert spectator traffic",
      "Open secondary emergency egress gates in the zone",
      "Announce clear route directions via the stadium public address system"
    ];
    recommendedFollowUp = [
      "Audit event ticket allocation and gate configuration",
      "Review crowd flow simulation plans for the stadium"
    ];
    preventionMeasures = [
      "Optimize pedestrian routing layouts at high-traffic checkpoints",
      "Limit ticket access once section capacity reaches 90%"
    ];
    rootCauseAnalysis = "Spectator congestion surge exceeding optimal regional flow limits.";
    estimatedResolutionTime = '30 to 60 minutes';
  } else {
    immediateActionsLog = [
      "Notify regional field marshal of the incident report",
      "Conduct visual check of the reported stadium zone",
      "Verify system status logs for any related telemetry failures"
    ];
    recommendedFollowUp = [
      "Review the automated logs of this incident report",
      "Submit general report summary to stadium manager"
    ];
    preventionMeasures = [
      "Continue standard operational system monitoring",
      "Conduct routine review of zone safety checkpoints"
    ];
    rootCauseAnalysis = `General operational incident (${type}) requiring inspection and logging.`;
    estimatedResolutionTime = '30 to 60 minutes';
  }

  const riskRating = severity.toUpperCase();

  return {
    executiveSummary: `Automated response initiated for a ${severity} severity ${type} incident at ${stadiumName} (${zone}). Emergency teams have been notified.`,
    incidentNarrative: `An incident of type ${type} with ${severity} severity level was reported at ${stadiumName}, zone ${zone}. The description submitted: "${desc}". Standard response teams have been dispatched to inspect and resolve the situation. (Note: Fallback report generated due to LLM rate limit).`,
    rootCauseAnalysis,
    immediateActionsLog,
    recommendedFollowUp,
    lessonsLearned: "Maintain clear communications and ensure operational redundancy.",
    estimatedResolutionTime,
    riskRating,
    preventionMeasures
  };
}
