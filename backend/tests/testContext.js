import dotenv from 'dotenv';
dotenv.config();

import { runContextAgent } from '../agents/contextAgent.js';

const testCases = [
  {
    label: "MetLife Stadium — New Jersey",
    intakeOutput: {
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
      type: "crowd",
      severity: "high",
      confidence: 0.9
    }
  },
  {
    label: "SoFi Stadium — Los Angeles",
    intakeOutput: {
      stadium: {
        name: "SoFi Stadium",
        city: "Los Angeles (Inglewood)",
        capacity: 70000,
        latitude: 33.9535,
        longitude: -118.3390
      },
      zoneLocation: "Section 12"
    },
    classificationOutput: {
      type: "medical",
      severity: "critical",
      confidence: 0.9
    }
  },
  {
    label: "Hard Rock Stadium — Miami",
    intakeOutput: {
      stadium: {
        name: "Hard Rock Stadium",
        city: "Miami (Miami Gardens)",
        capacity: 65000,
        latitude: 25.9580,
        longitude: -80.2389
      },
      zoneLocation: "Medical Bay"
    },
    classificationOutput: {
      type: "medical",
      severity: "high",
      confidence: 0.85
    }
  }
];

async function runTests() {
  console.log("=========================================");
  console.log("TESTING CONTEXT AGENT (LIVE API CALLS)");
  console.log("=========================================\n");

  for (const test of testCases) {
    console.log(`TEST: ${test.label}`);
    
    try {
      const result = await runContextAgent(test.intakeOutput, test.classificationOutput);
      
      console.log(`Stadium Name & City:  ${test.intakeOutput.stadium.name} (${test.intakeOutput.stadium.city})`);
      console.log(`REAL Temperature:     ${result.weather.temperature}°C`);
      console.log(`REAL Weather Desc:    ${result.weather.weatherDescription}`);
      console.log(`REAL Windspeed:       ${result.weather.windspeed} km/h`);
      console.log(`REAL Precipitation:   ${result.weather.precipitation} mm`);
      console.log(`Weather Risk Flags:   [${result.weather.riskFlags.join(', ')}]`);
      
      console.log(`Is Match Today:       ${result.matchStatus.isMatchToday}`);
      console.log(`Current Match Phase:  ${result.matchStatus.phase}`);
      if (result.matchStatus.isMatchToday) {
        console.log(`Teams Playing:        ${result.matchStatus.homeTeam} vs ${result.matchStatus.awayTeam}`);
        console.log(`Current Score:        ${result.matchStatus.score} (Minute: ${result.matchStatus.minute})`);
      }
      console.log(`Crowd Risk Level:     ${result.matchStatus.crowdRiskLevel}`);
      console.log(`Combined Risk Level:  ${result.combinedRisk}`);
      console.log(`Should Escalate Crowd: ${result.shouldEscalateDueToCrowd ? 'YES' : 'NO'}`);
      
      console.log(`Context Summary:`);
      console.log(`"""`);
      console.log(result.contextSummary);
      console.log(`"""`);
      
      console.log(`Processing Time:      ${result.processingTimeMs}ms`);
    } catch (err) {
      console.error(`Error during ${test.label}:`, err);
    }
    console.log('-----------------------------------------\n');
  }
}

runTests();
