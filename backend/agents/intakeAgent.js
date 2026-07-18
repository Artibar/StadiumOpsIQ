import langdetect from 'langdetect';
import Groq from 'groq-sdk';
import { findStadium } from '../services/worldCupService.js';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  ar: 'Arabic',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  ta: 'Tamil',
  zh: 'Chinese (Mandarin)',
  sw: 'Swahili',
  mr: 'Marathi',
  kn: 'Kannada',
  ur: 'Urdu',
  nl: 'Dutch',
  ml: 'Malayalam'
};

const ENGLISH_HINT_WORDS = [
  'incident', 'report', 'medical', 'help', 'fire', 'security', 'crowd', 'weather',
  'gate', 'zone', 'stadium', 'person', 'collapsed', 'needs', 'immediate',
  'attention', 'alert', 'unknown', 'assistance', 'near', 'inside', 'outside',
  'escalate', 'status', 'urgent', 'support', 'team', 'operator', 'safety'
];

/**
 * Sanitizes input text to protect against LLM prompt injections.
 * Clips to maximum 1000 characters.
 * @param {string} text - Raw input text
 * @returns {string} Sanitized text
 */
export function sanitizeForPrompt(text) {
  if (!text) return '';
  return text
    .replace(/```/g, "'''")
    .replace(/\[INST\]/g, '')
    .replace(/\[\/INST\]/g, '')
    .replace(/<\|system\|>/g, '')
    .trim()
    .substring(0, 1000);
}

function looksLikeEnglish(text) {
  const normalized = text.toLowerCase();
  return ENGLISH_HINT_WORDS.some((word) => normalized.includes(word));
}

function detectLanguage(text) {
  try {
    const sanitized = (text || '').trim();
    if (!sanitized) return 'en';

    const results = langdetect.detect(sanitized);
    if (!results || results.length === 0) return 'en';

    const [topResult, secondResult] = results;
    const topLang = topResult?.lang;
    const topProb = Number(topResult?.prob || 0);
    const secondProb = Number(secondResult?.prob || 0);
    const margin = topProb - secondProb;

    if (topLang === 'en') {
      return 'en';
    }

    if (sanitized.length <= 5 || topProb < 0.8 || margin < 0.15) {
      if (looksLikeEnglish(sanitized) || sanitized.length <= 5) {
        return 'en';
      }
    }

    if (SUPPORTED_LANGUAGES.hasOwnProperty(topLang)) {
      return topLang;
    }

    return 'en';
  } catch (error) {
    // Graceful fallback to English if detection fails on short or non-standard text
    return 'en';
  }
}

async function translateToEnglish(text, sourceLangCode, sourceLangName) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[INTAKE] GROQ_API_KEY not configured. Skipping translation, returning original text.");
    return text;
  }

  try {
    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a professional emergency services translator. Translate the following ${sourceLangName} stadium incident report to English.
CRITICAL RULES:
1. Preserve ALL specific details — locations, gate numbers, section numbers, names, patient counts, urgency indicators
2. Keep technical/operational terms intact
3. If numbers or locations are mentioned, include them exactly
4. Return ONLY the English translation
5. Do not add explanations or notes`
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const translated = response.choices[0]?.message?.content?.trim();
    return translated || text;
  } catch (error) {
    console.error(`[ERROR] [INTAKE] Translation from ${sourceLangName} failed:`, error.message);
    return text;
  }
}

async function matchStadium(stadiumName) {
  const stadium = await findStadium(stadiumName);
  if (stadium) {
    return {
      name: stadium.name,
      city: stadium.city,
      capacity: stadium.capacity,
      latitude: stadium.latitude,
      longitude: stadium.longitude
    };
  }
  
  return {
    name: stadiumName,
    city: 'Unknown',
    capacity: 0,
    latitude: 0,
    longitude: 0,
    matchError: 'Stadium not found in FIFA 2026 database'
  };
}

/**
 * Executes the Intake Agent workflow: sanitizes descriptions, detects languages,
 * translates to English if necessary, and matches stadium metadata.
 * @param {string} description - Raw incident description text
 * @param {string} stadiumName - Name of the stadium reported
 * @param {string} zoneLocation - Zone location within the stadium
 * @returns {Object} Intake results including translated text, stadium data, and reasoning trail.
 */
export async function runIntakeAgent(description, stadiumName, zoneLocation) {
  const startTime = Date.now();
  
  // 0. Sanitize input to protect against prompt injection
  const sanitizedDescription = sanitizeForPrompt(description);
  
  // 1. Language Detection
  const detectedLangCode = detectLanguage(sanitizedDescription);
  const detectedLangName = SUPPORTED_LANGUAGES[detectedLangCode] || 'English';
  
  // 2. Translation (if not English)
  let translatedText = sanitizedDescription;
  let wasTranslated = false;
  
  if (detectedLangCode !== 'en') {
    translatedText = await translateToEnglish(sanitizedDescription, detectedLangCode, detectedLangName);
    wasTranslated = true;
  }
  
  // 3. Stadium Matching
  const stadium = await matchStadium(stadiumName);
  
  // 4. Build reasoning entry
  const reasoningEntry = {
    agentName: 'Intake Agent',
    step: 1,
    thought: `[INTAKE] Received incident report. Detected language: ${detectedLangName} (${detectedLangCode}). ${
      wasTranslated 
        ? `Translated from ${detectedLangName} to English for processing.` 
        : 'Report is in English, no translation needed.'
    } Stadium matched: ${stadium.name} in ${stadium.city} (capacity: ${stadium.capacity}). Zone reported: ${zoneLocation}.`,
    action: wasTranslated 
      ? 'LANGUAGE_DETECTION + TRANSLATION + STADIUM_MATCH' 
      : 'LANGUAGE_DETECTION + STADIUM_MATCH',
    result: `[INTAKE] Ready for classification. Processing text: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? '...' : ''}"`,
    timestamp: new Date()
  };
  
  return {
    originalText: sanitizedDescription,
    translatedText: translatedText,
    detectedLanguage: detectedLangCode,
    detectedLanguageName: detectedLangName,
    wasTranslated: wasTranslated,
    stadium: {
      name: stadium.name,
      city: stadium.city,
      capacity: stadium.capacity,
      latitude: stadium.latitude,
      longitude: stadium.longitude
    },
    zoneLocation: zoneLocation,
    reasoningEntry: reasoningEntry,
    processingTimeMs: Date.now() - startTime
  };
}
