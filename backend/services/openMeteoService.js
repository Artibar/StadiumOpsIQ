import fetch from 'node-fetch';

const weatherCache = new Map();
const WEATHER_CACHE_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchLiveWeather(lat, lng) {
  const key = `${lat},${lng}`;
  const cached = weatherCache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp < WEATHER_CACHE_MS)) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,precipitation`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API returned status ${response.status}`);
    }
    const data = await response.json();
    
    const current = data.current || {};
    const temperature = current.temperature_2m;
    const weatherCode = current.weathercode;
    const windspeed = current.windspeed_10m;
    const precipitation = current.precipitation;

    const riskFlags = [];
    if (temperature > 35) {
      riskFlags.push(`HEAT STRESS RISK: temperature ${temperature}°C exceeds safe threshold`);
    }
    if (precipitation > 0) {
      riskFlags.push(`WET SURFACE RISK: precipitation detected, slip hazard near exits`);
    }
    if (windspeed > 40) {
      riskFlags.push(`HIGH WIND RISK: windspeed ${windspeed}km/h, structural risk`);
    }
    if (weatherCode >= 61 && weatherCode <= 99) {
      riskFlags.push(`STORM RISK: severe weather code ${weatherCode}, evacuation risk elevated`);
    }

    const weatherResult = {
      temperature,
      weatherCode,
      windspeed,
      precipitation,
      riskFlags,
      fetchedAt: new Date()
    };

    // Store in cache
    weatherCache.set(key, {
      data: weatherResult,
      timestamp: now
    });

    return weatherResult;
  } catch (error) {
    console.error("[ERROR] fetchLiveWeather failed:", error.message);
    if (cached) {
      return cached.data; // fallback to expired cache on error
    }
    return { error: "Weather fetch failed", riskFlags: [] };
  }
}
