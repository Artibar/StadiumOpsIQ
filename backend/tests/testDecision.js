import dotenv from 'dotenv';
dotenv.config();

import { runDecisionAgent } from '../agents/decisionAgent.js';

const testCases = [
  {
    label: "CRITICAL MEDICAL — should dispatch medical + Discord",
    intakeOutput: {
      originalText: "Person collapsed, not breathing",
      translatedText: "Person collapsed, not breathing",
      wasTranslated: false,
      detectedLanguageName: "English",
      stadium: { name: "MetLife Stadium", city: "New York/New Jersey", capacity: 82500 },
      zoneLocation: "Gate 4"
    },
    classificationOutput: {
      type: "medical",
      severity: "critical",
      confidence: 0.9,
      recommendedUrgency: "immediate",
      keyIndicators: ["collapsed", "not breathing"]
    },
    contextOutput: {
      weather: { temperature: 24.6, weatherCode: 2, windspeed: 1, precipitation: 0, riskFlags: [] },
      matchStatus: { isMatchToday: false, phase: "inactive", crowdRiskLevel: "low" },
      combinedRisk: "critical",
      contextSummary: "Partly cloudy, 24.6°C. No match today.",
      weatherSummary: "Partly cloudy, 24.6°C",
      shouldEscalateDueToCrowd: false
    }
  },
  {
    label: "HIGH SECURITY — should escalate + Discord",
    intakeOutput: {
      originalText: "Fight in section 12",
      translatedText: "There is a fight in section 12, two people injured",
      wasTranslated: true,
      detectedLanguageName: "Spanish",
      stadium: { name: "AT&T Stadium", city: "Dallas", capacity: 94000 },
      zoneLocation: "Section 12"
    },
    classificationOutput: {
      type: "security",
      severity: "high",
      confidence: 0.9,
      recommendedUrgency: "immediate",
      keyIndicators: ["fight", "two people injured"]
    },
    contextOutput: {
      weather: { temperature: 30, weatherCode: 0, windspeed: 10, precipitation: 0, riskFlags: [] },
      matchStatus: { isMatchToday: false, phase: "inactive", crowdRiskLevel: "low" },
      combinedRisk: "high",
      contextSummary: "Clear sky, 30°C. No match today.",
      weatherSummary: "Clear sky, 30°C",
      shouldEscalateDueToCrowd: false
    }
  },
  {
    label: "LOW PRIORITY — should auto-resolve",
    intakeOutput: {
      originalText: "Spilled drink near section 8 concessions",
      translatedText: "Spilled drink near section 8 concessions",
      wasTranslated: false,
      detectedLanguageName: "English",
      stadium: { name: "Levi's Stadium", city: "San Francisco Bay Area", capacity: 71000 },
      zoneLocation: "Section 8 Concessions"
    },
    classificationOutput: {
      type: "other",
      severity: "low",
      confidence: 0.85,
      recommendedUrgency: "routine",
      keyIndicators: ["spilled drink", "concessions"]
    },
    contextOutput: {
      weather: { temperature: 18, weatherCode: 1, windspeed: 8, precipitation: 0, riskFlags: [] },
      matchStatus: { isMatchToday: false, phase: "inactive", crowdRiskLevel: "low" },
      combinedRisk: "low",
      contextSummary: "Clear sky, 18°C. No match today.",
      weatherSummary: "Clear sky, 18°C",
      shouldEscalateDueToCrowd: false
    }
  },
  {
    label: "AMBIGUOUS — should flag for human review",
    intakeOutput: {
      originalText: "Something happened near section 5",
      translatedText: "Something happened near section 5",
      wasTranslated: false,
      detectedLanguageName: "English",
      stadium: { name: "Gillette Stadium", city: "Boston", capacity: 65878 },
      zoneLocation: "Section 5"
    },
    classificationOutput: {
      type: "other",
      severity: "low",
      confidence: 0.4,
      recommendedUrgency: "monitor",
      keyIndicators: []
    },
    contextOutput: {
      weather: { temperature: 22, weatherCode: 3, windspeed: 15, precipitation: 0, riskFlags: [] },
      matchStatus: { isMatchToday: false, phase: "inactive", crowdRiskLevel: "low" },
      combinedRisk: "low",
      contextSummary: "Cloudy, 22°C. No match today.",
      weatherSummary: "Cloudy, 22°C",
      shouldEscalateDueToCrowd: false
    }
  }
];

async function runTests() {
  console.log("=========================================");
  console.log("TESTING DECISION AGENT (GROQ TOOL CALLS)");
  console.log("=========================================\n");

  let testIdx = 1;
  for (const test of testCases) {
    console.log(`TEST ${testIdx++}: ${test.label}`);
    
    try {
      const incidentId = `TST-DEC-${Math.floor(Math.random() * 10000)}`;
      const result = await runDecisionAgent(
        test.intakeOutput,
        test.classificationOutput,
        test.contextOutput,
        incidentId
      );

      console.log(`Actions Taken:        [${result.actionsTaken.join(', ')}]`);
      console.log(`Final Status:         ${result.finalStatus}`);
      console.log(`Discord Fired:        ${result.actionsTaken.includes('sendDiscordNotification') ? 'YES' : 'NO'}`);
      console.log(`Final Decision snippet: "${result.finalDecision.substring(0, 200).replace(/\n/g, ' ')}${result.finalDecision.length > 200 ? '...' : ''}"`);
      
      console.log("Reasoning Steps:");
      result.reasoningTrail.forEach(step => {
        console.log(`  - Step ${step.step}: ${step.action} -> Result: ${step.result.substring(0, 100)}`);
      });

      console.log(`Processing Time:      ${result.processingTimeMs}ms`);
    } catch (err) {
      console.error(`Error during ${test.label}:`, err);
    }
    console.log('-----------------------------------------\n');
  }
}

runTests();
