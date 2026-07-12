import dotenv from 'dotenv';
dotenv.config();

import { runClassificationAgent } from '../agents/classificationAgent.js';

const testCases = [
  {
    label: "Critical Medical",
    intakeOutput: {
      translatedText: "Person collapsed near Gate 4, appears unconscious, not breathing, needs immediate medical attention",
      stadium: { name: "MetLife Stadium", city: "New York/New Jersey", capacity: 82500 },
      zoneLocation: "Gate 4",
      detectedLanguageName: "English",
      wasTranslated: false
    }
  },
  {
    label: "Security Fight",
    intakeOutput: {
      translatedText: "There is a fight in section 12, two people injured, we need security immediately",
      stadium: { name: "AT&T Stadium", city: "Dallas", capacity: 94000 },
      zoneLocation: "Section 12",
      detectedLanguageName: "Spanish",
      wasTranslated: true
    }
  },
  {
    label: "Crowd Stampede (Hindi)",
    intakeOutput: {
      translatedText: "There is a stampede near Gate 7, people are falling, immediate help is needed",
      stadium: { name: "SoFi Stadium", city: "Los Angeles", capacity: 70000 },
      zoneLocation: "Gate 7",
      detectedLanguageName: "Hindi",
      wasTranslated: true
    }
  },
  {
    label: "Fire/Smoke (Tamil)",
    intakeOutput: {
      translatedText: "Smoke is visible near Gate 5, immediate assistance is required",
      stadium: { name: "Levi's Stadium", city: "San Francisco Bay Area", capacity: 71000 },
      zoneLocation: "Gate 5",
      detectedLanguageName: "Tamil",
      wasTranslated: true
    }
  },
  {
    label: "Lost Child",
    intakeOutput: {
      translatedText: "A child approximately 6 years old is lost near the food court, wearing red shirt, parents are looking for him",
      stadium: { name: "Hard Rock Stadium", city: "Miami", capacity: 65000 },
      zoneLocation: "Food Court",
      detectedLanguageName: "English",
      wasTranslated: false
    }
  },
  {
    label: "Vague/Ambiguous (low confidence)",
    intakeOutput: {
      translatedText: "Something happened near section 5",
      stadium: { name: "Gillette Stadium", city: "Boston", capacity: 65878 },
      zoneLocation: "Section 5",
      detectedLanguageName: "English",
      wasTranslated: false
    }
  }
];

async function runTests() {
  console.log("=========================================");
  console.log("TESTING CLASSIFICATION AGENT (GROQ CALLS)");
  console.log("=========================================\n");

  for (const test of testCases) {
    console.log(`TEST: ${test.label}`);
    console.log(`Input Text: "${test.intakeOutput.translatedText}"`);
    
    try {
      const result = await runClassificationAgent(test.intakeOutput);
      
      console.log(`Type Classified:      ${result.type}`);
      console.log(`Severity:             ${result.severity}`);
      console.log(`Confidence:           ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`Key Indicators:       [${result.keyIndicators.join(', ')}]`);
      console.log(`Recommended Urgency:  ${result.recommendedUrgency}`);
      console.log(`Flagged for Review:   ${result.flaggedForHumanReview ? 'YES' : 'NO'}`);
      console.log(`Reasoning snippet:    "${result.reasoning.substring(0, 150)}${result.reasoning.length > 150 ? '...' : ''}"`);
      console.log(`Processing Time:      ${result.processingTimeMs}ms`);
    } catch (err) {
      console.error(`Error during ${test.label}:`, err);
    }
    console.log('-----------------------------------------\n');
  }
}

runTests();
