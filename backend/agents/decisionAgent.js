import Groq from 'groq-sdk';
import { sendDiscordAlert } from '../services/discordService.js';
import Incident from '../models/Incident.js';

let groq = null;

function getGroqClient() {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || ''
    });
  }
  return groq;
}

const DECISION_TOOLS = [
  {
    type: "function",
    function: {
      name: "escalateToSecurity",
      description: `Escalate incident to security team. Use for fights, suspicious activity, threats, crowd aggression, or any security threat requiring physical response. This sets status to pending-confirmation — human must confirm before action is marked as executed.`,
      parameters: {
        type: "object",
        properties: {
          reason: { 
            type: "string",
            description: "Why escalating to security — be specific"
          },
          urgency: {
            type: "string",
            enum: ["immediate", "urgent", "routine"],
            description: "How fast security team must respond"
          },
          recommendedAction: {
            type: "string",
            description: "Specific action security should take"
          }
        },
        required: ["reason", "urgency", "recommendedAction"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "dispatchMedical",
      description: `Dispatch medical team to the incident location. Use for any medical emergency — collapsed person, injury, unconscious, breathing difficulty, heat stroke. This sets status to pending-confirmation — human must confirm before action is marked as executed.`,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Medical situation requiring dispatch"
          },
          estimatedPatientCount: {
            type: "number",
            description: "How many people need medical attention"
          },
          equipmentNeeded: {
            type: "string",
            description: "Medical equipment to bring — AED, stretcher, oxygen, first aid kit etc."
          }
        },
        required: ["reason", "estimatedPatientCount", "equipmentNeeded"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resolveAsLowPriority",
      description: `Mark incident as resolved without escalation. Use ONLY for genuinely low severity incidents that do not require immediate intervention — minor complaints, routine queries, non-urgent issues. This auto-executes without human confirmation.`,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Why this can be safely resolved without escalation"
          },
          suggestedFollowUp: {
            type: "string",
            description: "Any monitoring or follow-up recommended"
          }
        },
        required: ["reason", "suggestedFollowUp"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "flagForHumanReview",
      description: `Flag incident for human review when AI confidence is too low or situation is ambiguous. Use when the incident description is unclear, contradictory, or confidence < 0.6. A human operator will review and decide the appropriate action.`,
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Why human review is needed"
          },
          confidence: {
            type: "number",
            description: "Current confidence score that triggered this flag"
          },
          suggestedPriority: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Suggested priority for human reviewer"
          }
        },
        required: ["reason", "confidence", "suggestedPriority"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sendDiscordNotification",
      description: `Send a real-time alert to the operations team Discord channel. ALWAYS call this tool after escalateToSecurity or dispatchMedical. Also call for critical severity incidents even if auto-resolved.`,
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Alert message for ops team"
          },
          urgency: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Alert urgency level"
          },
          actionTaken: {
            type: "string",
            description: "What action the system has taken or recommended"
          }
        },
        required: ["message", "urgency", "actionTaken"]
      }
    }
  }
];

function buildDecisionSystemPrompt(intakeOutput, classificationOutput, contextOutput) {
  return `You are StadiumOps IQ Decision Agent for FIFA World Cup 2026 stadium operations.
  
  INCIDENT DETAILS:
  Original Report: "${intakeOutput.originalText}"
  ${intakeOutput.wasTranslated ? `Language: ${intakeOutput.detectedLanguageName}\nTranslated: "${intakeOutput.translatedText}"` : ''}
  Zone: ${intakeOutput.zoneLocation}
  Stadium: ${intakeOutput.stadium.name}
  Capacity: ${intakeOutput.stadium.capacity}
  
  CLASSIFICATION RESULT:
  Type: ${classificationOutput.type}
  Severity: ${classificationOutput.severity}
  Confidence: ${Math.round(classificationOutput.confidence * 100)}%
  Urgency: ${classificationOutput.recommendedUrgency}
  Key Indicators: ${classificationOutput.keyIndicators.join(', ')}
  
  LIVE CONTEXT (fetched right now):
  ${contextOutput.contextSummary}
  
  ${contextOutput.shouldEscalateDueToCrowd ? '⚠️ CROWD ESCALATION FLAG: This is a crowd incident during a high-risk match phase. Escalate severity one level higher than classification suggests.' : ''}
  
  DECISION RULES YOU MUST FOLLOW:
  1. ALWAYS call at least one primary tool (escalateToSecurity, dispatchMedical, resolveAsLowPriority, or flagForHumanReview)
  2. ALWAYS call sendDiscordNotification after any escalation or dispatch
  3. For critical severity → dispatchMedical or escalateToSecurity (never auto-resolve)
  4. For high severity → escalate with pending-confirmation
  5. For low/medium → can resolveAsLowPriority but only if truly non-urgent
  6. Always explain your reasoning BEFORE calling each tool
  7. Consider live weather risk flags in your decision
  8. Consider match phase — halftime and post-match increase crowd risk
  9. Maximum 5 tool calls per incident
  10. After calling tools, provide a final summary of actions taken`;
}

async function executeTool(toolName, toolArgs, incidentId, intakeOutput, classificationOutput, contextOutput) {
  switch (toolName) {
    case 'escalateToSecurity':
      return {
        success: true,
        action: 'ESCALATE_TO_SECURITY',
        newStatus: 'pending-confirmation',
        details: toolArgs,
        message: `Security escalation queued. Urgency: ${toolArgs.urgency}. Recommended action: ${toolArgs.recommendedAction}. Awaiting human confirmation.`
      };

    case 'dispatchMedical':
      return {
        success: true,
        action: 'DISPATCH_MEDICAL',
        newStatus: 'pending-confirmation',
        details: toolArgs,
        message: `Medical dispatch queued. ${toolArgs.estimatedPatientCount} patient(s). Equipment needed: ${toolArgs.equipmentNeeded}. Awaiting human confirmation.`
      };

    case 'resolveAsLowPriority':
      return {
        success: true,
        action: 'RESOLVED_LOW_PRIORITY',
        newStatus: 'resolved',
        details: toolArgs,
        message: `Incident auto-resolved. Reason: ${toolArgs.reason}. Follow-up: ${toolArgs.suggestedFollowUp}`
      };

    case 'flagForHumanReview':
      return {
        success: true,
        action: 'FLAGGED_FOR_HUMAN_REVIEW',
        newStatus: 'flagged-for-review',
        details: toolArgs,
        message: `Flagged for human review. Confidence: ${toolArgs.confidence}. Reason: ${toolArgs.reason}`
      };

    case 'sendDiscordNotification':
      try {
        await sendDiscordAlert({
          incidentId: incidentId || 'PENDING',
          type: classificationOutput.type,
          severity: classificationOutput.severity,
          stadium: intakeOutput.stadium.name,
          zone: intakeOutput.zoneLocation,
          matchPhase: contextOutput.matchStatus.phase,
          weatherSummary: contextOutput.weatherSummary,
          recommendedAction: toolArgs.actionTaken,
          reasoningSummary: toolArgs.message,
          confidence: classificationOutput.confidence
        });
        return {
          success: true,
          action: 'DISCORD_NOTIFICATION_SENT',
          message: `Real Discord alert sent to ops team channel.`
        };
      } catch (err) {
        console.error("[ERROR] [DECISION] sendDiscordNotification execution failed:", err.message);
        return {
          success: false,
          action: 'DISCORD_NOTIFICATION_FAILED',
          message: `Discord dispatch crashed: ${err.message}`
        };
      }

    default:
      throw new Error(`Unknown tool name: ${toolName}`);
  }
}

/**
 * Executes the Decision Agent workflow: runs a multi-turn Groq tool calling loop
 * to decide and route action dispatches based on context and rules.
 * @param {Object} intakeOutput - Intake output payload
 * @param {Object} classificationOutput - Classification output payload
 * @param {Object} contextOutput - Context output payload
 * @param {string} incidentId - Database ID of the incident record
 * @returns {Object} Final decision summary, status, actions taken list, and reasoning trail.
 */
export async function runDecisionAgent(intakeOutput, classificationOutput, contextOutput, incidentId) {
  const startTime = Date.now();
  const reasoningTrail = [];
  const actionsTaken = [];
  let finalStatus = 'open';
  let finalDecision = '';

  const messages = [
    {
      role: "system",
      content: buildDecisionSystemPrompt(intakeOutput, classificationOutput, contextOutput)
    },
    {
      role: "user",
      content: `Process this incident and take appropriate action using your available tools. Think step by step and explain your reasoning before each tool call.`
    }
  ];

  try {
    for (let step = 0; step < 5; step++) {
      const response = await getGroqClient().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1500,
        tools: DECISION_TOOLS,
        messages: messages
      });

      const responseMessage = response.choices[0]?.message;
      if (!responseMessage) {
        break;
      }

      messages.push(responseMessage);

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // Execute the tool
          const toolResult = await executeTool(
            toolName,
            toolArgs,
            incidentId,
            intakeOutput,
            classificationOutput,
            contextOutput
          );

          // Track action and status
          actionsTaken.push(toolName);
          if (toolResult.newStatus) {
            finalStatus = toolResult.newStatus;
          }

          // Append to reasoning trail
          reasoningTrail.push({
            agentName: 'Decision Agent',
            step: step + 4, // Intake is 1, Classification is 2, Context is 3, Decision starts at 4
            thought: responseMessage.content || `[DECISION] Executing action: ${toolName}`,
            action: toolName.toUpperCase(),
            result: toolResult.message,
            timestamp: new Date()
          });

          // Feed result back
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        // No more tool calls - done reasoning
        finalDecision = responseMessage.content || '';
        break;
      }
    }

    if (!finalDecision) {
      finalDecision = `Actions taken: ${actionsTaken.join(', ')}. Final status: ${finalStatus}.`;
    }

    return {
      finalDecision: finalDecision,
      finalStatus: finalStatus,
      actionsTaken: actionsTaken,
      reasoningTrail: reasoningTrail,
      processingTimeMs: Date.now() - startTime
    };

  } catch (error) {
    console.error("[ERROR] [DECISION] runDecisionAgent failed:", error.message);
    const endTime = Date.now();
    return {
      finalDecision: 'Decision agent failed — manual review required',
      finalStatus: 'flagged-for-review',
      actionsTaken: ['SYSTEM_ERROR'],
      reasoningTrail: [{
        agentName: 'Decision Agent',
        step: 4,
        thought: `[DECISION] Decision loop crashed due to system error: ${error.message}`,
        action: 'SYSTEM_ERROR',
        result: error.message,
        timestamp: new Date()
      }],
      processingTimeMs: endTime - startTime
    };
  }
}
