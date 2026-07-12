import dotenv from 'dotenv';
dotenv.config();

import { runReportAgent } from '../agents/reportAgent.js';

const testData = {
  intakeOutput: {
    originalText: "गेट 4 के पास एक व्यक्ति बेहोश होकर गिर गया है, सांस नहीं आ रही",
    translatedText: "A person has collapsed unconscious near Gate 4, not breathing",
    wasTranslated: true,
    detectedLanguageName: "Hindi",
    detectedLanguage: "hi",
    stadium: {
      name: "MetLife Stadium",
      city: "New York/New Jersey",
      capacity: 82500,
      latitude: 40.8128,
      longitude: -74.0742
    },
    zoneLocation: "Gate 4"
  },
  classificationOutput: {
    type: "medical",
    severity: "critical",
    confidence: 0.9,
    recommendedUrgency: "immediate",
    keyIndicators: ["collapsed", "unconscious", "not breathing"],
    reasoning: "Person collapsed and not breathing indicates critical medical emergency requiring immediate response"
  },
  contextOutput: {
    weather: {
      temperature: 24.6,
      weatherCode: 2,
      weatherDescription: "Partly cloudy",
      windspeed: 1,
      precipitation: 0,
      riskFlags: []
    },
    matchStatus: {
      isMatchToday: false,
      phase: "inactive",
      crowdRiskLevel: "low"
    },
    combinedRisk: "critical",
    contextSummary: `Stadium context:
      Weather: Partly cloudy, 24.6°C, wind 1km/h. No weather risk flags.
      Match Status: No match today.
      Combined Risk: CRITICAL`,
    weatherSummary: "Partly cloudy, 24.6°C"
  },
  decisionOutput: {
    finalDecision: "Dispatched medical team with AED and stretcher to Gate 4. Awaiting human confirmation.",
    finalStatus: "pending-confirmation",
    actionsTaken: ["dispatchMedical", "sendDiscordNotification"]
  }
};

async function runTest() {
  console.log("Testing Report Agent...\n");
  
  const result = await runReportAgent(
    testData.intakeOutput,
    testData.classificationOutput,
    testData.contextOutput,
    testData.decisionOutput,
    "TEST-RPT-001"
  );
  
  console.log("=== GENERATED REPORT ===\n");
  console.log("Executive Summary:");
  console.log(result.report.executiveSummary);
  console.log("\nRisk Rating:", result.report.riskRating);
  console.log("Est. Resolution:", result.report.estimatedResolutionTime);
  console.log("\nImmediate Actions:");
  (result.report.immediateActionsLog || []).forEach(a => console.log("  →", a));
  console.log("\nRecommended Follow-Up:");
  (result.report.recommendedFollowUp || []).forEach(r => console.log("  →", r));
  console.log("\nPrevention Measures:");
  (result.report.preventionMeasures || []).forEach(p => console.log("  →", p));
  console.log("\nLessons Learned:");
  console.log(result.report.lessonsLearned);
  console.log("\nEmail Sent:", result.emailSent);
  if (result.emailError) {
    console.log("Email Error:", result.emailError);
  }
  console.log("\nProcessing Time:", result.processingTimeMs + "ms");
  console.log("\nReasoning Entry:");
  console.log(result.reasoningEntry.thought);
}

runTest();
