import { fetchLiveWeather } from '../services/openMeteoService.js';
import { fetchLiveMatchStatus } from '../services/worldCupService.js';

function getWeatherDescription(code) {
  if (code === 0) return "Clear sky";
  if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy conditions";
  if (code === 51 || code === 53 || code === 55) return "Light drizzle";
  if (code === 61 || code === 63 || code === 65) return "Rain";
  if (code === 71 || code === 73 || code === 75) return "Snow";
  if (code === 80 || code === 81 || code === 82) return "Rain showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm with hail";
  return "Unknown conditions";
}

function calculateCombinedRisk(weatherRiskFlags, crowdRiskLevel, incidentSeverity) {
  const normSeverity = (incidentSeverity || '').toLowerCase();
  const normCrowd = (crowdRiskLevel || '').toLowerCase();
  const weatherFlagsCount = weatherRiskFlags ? weatherRiskFlags.length : 0;

  // Risk level priority (highest wins)
  if (normSeverity === 'critical') return 'critical';
  if (normCrowd === 'critical') return 'critical';
  if (weatherFlagsCount > 1 && normCrowd === 'high') return 'critical';
  if (normCrowd === 'high' || normSeverity === 'high') return 'high';
  if (weatherFlagsCount > 0 && normCrowd === 'medium') return 'high';
  if (normCrowd === 'medium' || normSeverity === 'medium') return 'medium';
  return 'low';
}

function buildContextSummary(weather, matchStatus, combinedRisk, weatherDescription) {
  const weatherLine = `Weather: ${weatherDescription} — ${weather.temperature}°C, wind ${weather.windspeed}km/h. ${
    weather.riskFlags && weather.riskFlags.length > 0 
      ? 'RISK FLAGS: ' + weather.riskFlags.join('; ') 
      : 'No weather risk flags'
  }`;

  const matchLine = `Match Status: ${
    matchStatus.isMatchToday 
      ? `${matchStatus.homeTeam} vs ${matchStatus.awayTeam} — Phase: ${matchStatus.phase} (Crowd Risk: ${matchStatus.crowdRiskLevel})` 
      : 'No match scheduled today — Standard crowd levels expected'
  }`;

  return `Stadium context at time of incident:
${weatherLine}
${matchLine}
Combined Risk Level: ${combinedRisk.toUpperCase()}`;
}

/**
 * Executes the Context Agent workflow: gathers live weather and match status data in parallel,
 * calculates operational risk indicators, and determines crowd surge risks.
 * @param {Object} intakeOutput - Intake output payload
 * @param {Object} classificationOutput - Classification output payload
 * @param {string} classificationOutput.severity - Classified incident severity
 * @param {string} classificationOutput.type - Classified incident type
 * @returns {Object} Live weather, match details, risk levels, and summary logs.
 */
export async function runContextAgent(intakeOutput, classificationOutput) {
  const startTime = Date.now();
  
  const { stadium, zoneLocation } = intakeOutput;
  const { severity, type: incidentType } = classificationOutput;

  let weatherData;
  let matchStatusData;

  // Execute both API calls in parallel with individual error handling to prevent pipeline crashes
  try {
    const weatherPromise = fetchLiveWeather(stadium.latitude, stadium.longitude)
      .catch(error => {
        console.error("[ERROR] [CONTEXT] Context Weather fetch failed:", error.message);
        return {
          temperature: 0,
          weatherCode: 0,
          windspeed: 0,
          precipitation: 0,
          riskFlags: ['WEATHER DATA UNAVAILABLE'],
          fetchedAt: new Date()
        };
      });

    const matchPromise = fetchLiveMatchStatus(stadium.name)
      .catch(error => {
        console.error("[ERROR] [CONTEXT] Context Match fetch failed:", error.message);
        return {
          isMatchToday: false,
          phase: 'unknown',
          minute: 0,
          homeTeam: 'N/A',
          awayTeam: 'N/A',
          score: 'N/A',
          crowdRiskLevel: 'medium'
        };
      });

    [weatherData, matchStatusData] = await Promise.all([weatherPromise, matchPromise]);
  } catch (globalError) {
    console.error("[ERROR] [CONTEXT] Unexpected Promise.all crash in runContextAgent:", globalError.message);
    weatherData = {
      temperature: 0,
      weatherCode: 0,
      windspeed: 0,
      precipitation: 0,
      riskFlags: ['WEATHER DATA UNAVAILABLE'],
      fetchedAt: new Date()
    };
    matchStatusData = {
      isMatchToday: false,
      phase: 'unknown',
      minute: 0,
      homeTeam: 'N/A',
      awayTeam: 'N/A',
      score: 'N/A',
      crowdRiskLevel: 'medium'
    };
  }

  // Calculate combined risk
  const combinedRisk = calculateCombinedRisk(
    weatherData.riskFlags,
    matchStatusData.crowdRiskLevel,
    severity
  );

  // Build weather description and operational summary
  const weatherDesc = getWeatherDescription(weatherData.weatherCode);
  const contextSummary = buildContextSummary(weatherData, matchStatusData, combinedRisk, weatherDesc);

  // Weather summary for Discord notification
  const weatherSummary = `${weatherDesc}, ${weatherData.temperature}°C, Wind: ${weatherData.windspeed}km/h, Precip: ${weatherData.precipitation}mm ${
    weatherData.riskFlags && weatherData.riskFlags.length > 0 
      ? '⚠️ ' + weatherData.riskFlags.join(' | ') 
      : '✅ No weather risks'
  }`;

  // Recommends crowd incident escalation during halftime or post-match exit surges
  const shouldEscalateDueToCrowd = 
    (matchStatusData.phase === 'halftime' || matchStatusData.phase === 'post-match') &&
    incidentType === 'crowd';

  // Build reasoning trail entry
  const reasoningEntry = {
    agentName: 'Context Agent',
    step: 3,
    thought: `[CONTEXT] Fetched live context for ${stadium.name} using real APIs. WEATHER (Open-Meteo API): ${weatherDesc} at ${weatherData.temperature}°C, wind ${weatherData.windspeed}km/h. ${
      weatherData.riskFlags && weatherData.riskFlags.length > 0 
        ? 'Weather risk flags detected: ' + weatherData.riskFlags.join(', ') 
        : 'No weather risk flags.'
    } MATCH STATUS (worldcup26.ir API): ${
      matchStatusData.isMatchToday 
        ? `Match in progress — ${matchStatusData.homeTeam} vs ${matchStatusData.awayTeam}, Phase: ${matchStatusData.phase}, Crowd risk: ${matchStatusData.crowdRiskLevel}` 
        : 'No match today, standard operations.'
    } COMBINED RISK: ${combinedRisk.toUpperCase()}.${
      shouldEscalateDueToCrowd 
        ? ' NOTE: Crowd incident during high-risk match phase — recommending severity escalation to Decision Agent.' 
        : ''
    }`,
    action: 'PARALLEL_API_CALLS — Open-Meteo Weather + worldcup26.ir Games',
    result: `Combined risk: ${combinedRisk} | Weather: ${weatherData.temperature}°C ${weatherDesc} | Match phase: ${matchStatusData.phase} | Crowd risk: ${matchStatusData.crowdRiskLevel}`,
    timestamp: new Date()
  };

  return {
    weather: {
      temperature: weatherData.temperature,
      weatherCode: weatherData.weatherCode,
      weatherDescription: weatherDesc,
      windspeed: weatherData.windspeed,
      precipitation: weatherData.precipitation,
      riskFlags: weatherData.riskFlags,
      fetchedAt: weatherData.fetchedAt
    },
    matchStatus: {
      isMatchToday: matchStatusData.isMatchToday,
      phase: matchStatusData.phase,
      minute: matchStatusData.minute,
      homeTeam: matchStatusData.homeTeam,
      awayTeam: matchStatusData.awayTeam,
      score: matchStatusData.score,
      crowdRiskLevel: matchStatusData.crowdRiskLevel
    },
    combinedRisk: combinedRisk,
    contextSummary: contextSummary,
    weatherSummary: weatherSummary,
    shouldEscalateDueToCrowd: shouldEscalateDueToCrowd,
    reasoningEntry: reasoningEntry,
    processingTimeMs: Date.now() - startTime
  };
}
