import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { runPipeline } from '../pipeline/agentPipeline.js';

const testCases = [
  {
    label: "END-TO-END: Hindi Medical",
    description: "गेट 4 के पास एक व्यक्ति बेहोश होकर गिर गया है, सांस नहीं आ रही, तुरंत मदद चाहिए",
    stadiumName: "MetLife Stadium",
    zoneLocation: "Gate 4"
  },
  {
    label: "END-TO-END: Spanish Security",
    description: "Hay una pelea violenta en la sección 15, tres personas heridas, necesitamos seguridad y médicos de inmediato",
    stadiumName: "SoFi Stadium",
    zoneLocation: "Section 15"
  },
  {
    label: "END-TO-END: Tamil Fire",
    description: "பகுதி 8 அருகே புகை மற்றும் தீ தெரிகிறது, உடனடியாக தீயணைப்பு உதவி தேவை",
    stadiumName: "AT&T Stadium",
    zoneLocation: "Section 8"
  }
];

async function runTests() {
  console.log("=========================================");
  console.log("TESTING COMPLETE END-TO-END PIPELINE");
  console.log("=========================================\n");

  let idx = 1;
  for (const test of testCases) {
    console.log(`TEST CASE ${idx++}: ${test.label}`);
    console.log(`Original Description:  "${test.description}"`);
    console.log(`Stadium:               ${test.stadiumName}`);
    console.log(`Zone Location:         ${test.zoneLocation}`);
    console.log("Running pipeline...");

    try {
      const result = await runPipeline(test.description, test.stadiumName, test.zoneLocation);
      
      console.log("\nPipeline Output Summary:");
      console.log(`1. Original Description: "${result.originalDescription}"`);
      console.log(`2. Detected Language:    ${result.detectedLanguage}`);
      console.log(`3. Translated Text:      "${result.translatedDescription}"`);
      console.log(`4. Stadium Matched:      ${result.stadiumName} (Coords: ${result.stadiumCoordinates.latitude}, ${result.stadiumCoordinates.longitude})`);
      console.log(`5. Classification:       Type: ${result.type} | Severity: ${result.severity} | Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      
      if (result.liveContext && result.liveContext.weather) {
        const w = result.liveContext.weather;
        console.log(`6. Real Weather:         Temp: ${w.temperature}°C | Desc: ${w.weatherDescription || 'N/A'} | Wind: ${w.windspeed} km/h | Rain: ${w.precipitation} mm | Flags: [${(w.riskFlags || []).join(', ')}]`);
      } else {
        console.log("6. Real Weather:         Unavailable");
      }

      if (result.liveContext && result.liveContext.matchStatus) {
        const m = result.liveContext.matchStatus;
        console.log(`7. Real Match Status:    IsToday: ${m.isMatchToday} | Phase: ${m.phase} | Teams: ${m.homeTeam || 'N/A'} vs ${m.awayTeam || 'N/A'} | Score: ${m.score || 'N/A'}`);
      } else {
        console.log("7. Real Match Status:    Unavailable");
      }

      console.log(`8. Combined Risk Level:  ${result.liveContext?.combinedRiskLevel || 'low'}`);
      console.log(`9. Actions Taken:        [${(result.actionsTaken || []).join(', ')}]`);
      console.log(`10. Final Status:        ${result.status}`);
      console.log(`11. Discord Fired:       ${(result.actionsTaken || []).includes('sendDiscordNotification') ? 'YES' : 'NO'}`);
      console.log(`12. Pipeline Duration:   ${result.pipelineDurationMs}ms`);
      
      console.log("\n13. Full Reasoning Trail Steps:");
      if (result.reasoningTrail && result.reasoningTrail.length > 0) {
        result.reasoningTrail.forEach(step => {
          console.log(`  [Step ${step.step} - ${step.agentName}]`);
          if (step.thought) console.log(`    Thought:  "${step.thought}"`);
          if (step.action)  console.log(`    Action:   ${step.action}`);
          if (step.result)  console.log(`    Result:   ${step.result}`);
        });
      } else {
        console.log("  No reasoning trail found.");
      }

    } catch (error) {
      console.error(`Pipeline failure during case ${test.label}:`, error);
    }
    console.log('\n===========================================================================\n');
  }
}

runTests();
