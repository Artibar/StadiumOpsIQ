import dotenv from 'dotenv';
dotenv.config();

import { runIntakeAgent } from '../agents/intakeAgent.js';

const testCases = [
  {
    label: "English incident",
    description: "Person collapsed near Gate 4, appears unconscious, needs immediate medical attention",
    stadium: "MetLife Stadium",
    zone: "Gate 4"
  },
  {
    label: "Hindi incident",
    description: "गेट 7 के पास भीड़ में धक्का-मुक्की हो रही है, लोग गिर रहे हैं, तुरंत मदद चाहिए",
    stadium: "SoFi Stadium",
    zone: "Gate 7"
  },
  {
    label: "Spanish incident",
    description: "Hay una pelea en la sección 12, dos personas heridas, necesitamos seguridad inmediatamente",
    stadium: "AT&T Stadium",
    zone: "Section 12"
  },
  {
    label: "Arabic incident",
    description: "يوجد شخص مصاب في البوابة 3، يحتاج إلى عناية طبية عاجلة",
    stadium: "Hard Rock Stadium",
    zone: "Gate 3"
  },
  {
    label: "Tamil incident",
    description: "வாயில் 5 அருகே தீ புகை தெரிகிறது, உடனடியாக உதவி தேவை",
    stadium: "Levi's Stadium",
    zone: "Gate 5"
  }
];

async function runTests() {
  console.log("=========================================");
  console.log("TESTING INTAKE AGENT WITH 5 LANGUAGES");
  console.log("=========================================\n");
  
  for (const test of testCases) {
    console.log(`TEST: ${test.label}`);
    console.log(`Input: "${test.description}"`);
    
    try {
      const result = await runIntakeAgent(
        test.description,
        test.stadium,
        test.zone
      );
      
      console.log(`Detected Language: ${result.detectedLanguageName} (${result.detectedLanguage})`);
      console.log(`Was Translated: ${result.wasTranslated}`);
      if (result.wasTranslated) {
        console.log(`Translated Text: "${result.translatedText}"`);
      }
      console.log(`Stadium Matched: ${result.stadium.name}, ${result.stadium.city}`);
      console.log(`Coordinates: ${result.stadium.latitude}, ${result.stadium.longitude}`);
      console.log(`Processing Time: ${result.processingTimeMs}ms`);
      console.log(`Reasoning: ${result.reasoningEntry.thought}`);
    } catch (err) {
      console.error(`Error during ${test.label}:`, err);
    }
    console.log('-----------------------------------------\n');
  }
}

runTests();
