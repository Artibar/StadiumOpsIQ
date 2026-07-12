import fetch from 'node-fetch';

const STADIUM_COORDINATES = {
  "1": { latitude: 19.3029, longitude: -99.1505 }, // Estadio Azteca
  "2": { latitude: 20.6817, longitude: -103.4627 }, // Estadio Akron
  "3": { latitude: 25.6866, longitude: -100.2452 }, // Estadio BBVA
  "4": { latitude: 32.7473, longitude: -97.0945 }, // AT&T Stadium
  "5": { latitude: 29.6847, longitude: -95.4107 }, // NRG Stadium
  "6": { latitude: 39.0489, longitude: -94.4839 }, // GEHA Field at Arrowhead Stadium
  "7": { latitude: 33.7576, longitude: -84.4010 }, // Mercedes-Benz Stadium
  "8": { latitude: 25.9580, longitude: -80.2389 }, // Hard Rock Stadium
  "9": { latitude: 42.0909, longitude: -71.2643 }, // Gillette Stadium
  "10": { latitude: 39.9008, longitude: -75.1675 }, // Lincoln Financial Field
  "11": { latitude: 40.8128, longitude: -74.0742 }, // MetLife Stadium
  "12": { latitude: 43.6328, longitude: -79.4186 }, // BMO Field
  "13": { latitude: 49.2768, longitude: -123.1120 }, // BC Place
  "14": { latitude: 47.5952, longitude: -122.3316 }, // Lumen Field
  "15": { latitude: 37.4033, longitude: -121.9694 }, // Levi's Stadium
  "16": { latitude: 33.9535, longitude: -118.3390 } // SoFi Stadium
};

let cachedStadiums = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function fetchStadiums() {
  const now = Date.now();
  if (cachedStadiums && (now - cacheTime < CACHE_DURATION)) {
    return cachedStadiums;
  }

  try {
    const url = 'https://worldcup26.ir/get/stadiums';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Stadiums API returned status ${response.status}`);
    }
    const data = await response.json();
    
    // The API returns { stadiums: [...] }
    const rawStadiums = data.stadiums || [];
    
    // Map API fields to standardized keys, injecting coordinates
    const formattedStadiums = rawStadiums.map(s => {
      const coords = STADIUM_COORDINATES[s.id] || { latitude: 0, longitude: 0 };
      return {
        id: s.id,
        name: s.name_en, // Standard property name
        fifaName: s.fifa_name,
        city: s.city_en,
        capacity: s.capacity,
        latitude: coords.latitude,
        longitude: coords.longitude
      };
    });

    cachedStadiums = formattedStadiums;
    cacheTime = now;
    return formattedStadiums;
  } catch (error) {
    console.error("fetchStadiums failed:", error.message);
    if (cachedStadiums) return cachedStadiums;
    return [];
  }
}

export async function findStadium(stadiumName) {
  if (!stadiumName) return null;
  const stadiums = await fetchStadiums();
  const searchName = stadiumName.toLowerCase().trim();
  
  return stadiums.find(s => 
    s.name.toLowerCase().includes(searchName) || 
    s.fifaName.toLowerCase().includes(searchName) ||
    searchName.includes(s.name.toLowerCase())
  ) || null;
}

export async function fetchLiveMatchStatus(stadiumName) {
  try {
    const stadium = await findStadium(stadiumName);
    if (!stadium) {
      return {
        isMatchToday: false,
        phase: "inactive",
        minute: 0,
        homeTeam: "N/A",
        awayTeam: "N/A",
        score: "N/A",
        crowdRiskLevel: "low",
        reason: "Stadium match not found in database"
      };
    }

    const url = 'https://worldcup26.ir/get/games';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Games API returned status ${response.status}`);
    }
    const data = await response.json();
    const games = data.games || [];
    
    // Filter games matching stadium.id
    const stadiumGames = games.filter(game => String(game.stadium_id) === String(stadium.id));

    if (stadiumGames.length === 0) {
      return {
        isMatchToday: false,
        phase: "inactive",
        minute: 0,
        homeTeam: "N/A",
        awayTeam: "N/A",
        score: "N/A",
        crowdRiskLevel: "low"
      };
    }

    // Check if there is a match today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // For local testing convenience or if there's no match scheduled for today,
    // let's grab the first game in the filtered list as a fallback context,
    // but follow the rule: "find game scheduled for today; if none -> inactive".
    // Wait, the games in the API are dated in local_date as "MM/DD/YYYY HH:MM" or "DD/MM/YYYY HH:MM". Let's check format: "06/11/2026 13:00".
    // This is "MM/DD/YYYY HH:MM" (November 6th) or "DD/MM/YYYY HH:MM" (June 11th).
    // Let's parse game dates robustly.
    const parseGameDate = (dateStr) => {
      if (!dateStr) return null;
      // Format: DD/MM/YYYY HH:MM or MM/DD/YYYY HH:MM
      // Let's assume standard date parser can handle or split it.
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('/');
      if (dateParts.length === 3) {
        // Build YYYY-MM-DD
        const year = dateParts[2];
        const month = dateParts[1].padStart(2, '0');
        const day = dateParts[0].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    const todayGame = stadiumGames.find(game => {
      const parsedDate = parseGameDate(game.local_date);
      return parsedDate === todayStr;
    });

    if (!todayGame) {
      return {
        isMatchToday: false,
        phase: "inactive",
        minute: 0,
        homeTeam: "N/A",
        awayTeam: "N/A",
        score: "N/A",
        crowdRiskLevel: "low"
      };
    }

    // Parse status and parameters
    const status = (todayGame.time_elapsed || "").toLowerCase(); // "finished", "live", "upcoming", or from game.finished
    const isFinished = todayGame.finished === "TRUE" || status === "finished";
    
    let phase = "inactive";
    let crowdRiskLevel = "low";
    const minute = status === "finished" ? 90 : (status === "upcoming" ? 0 : 45); // estimate minute if not given
    const homeTeam = todayGame.home_team_name_en || "Home";
    const awayTeam = todayGame.away_team_name_en || "Away";
    const score = `${todayGame.home_score || 0}-${todayGame.away_score || 0}`;

    if (status === "upcoming") {
      phase = "pre-match";
      crowdRiskLevel = "medium";
    } else if (status === "live") {
      // Determine halftime or half
      if (minute < 45) {
        phase = "first-half";
        crowdRiskLevel = "high";
      } else if (minute >= 45 && minute < 50) {
        phase = "halftime";
        crowdRiskLevel = "critical";
      } else {
        phase = "second-half";
        crowdRiskLevel = "high";
      }
    } else if (isFinished) {
      phase = "post-match";
      crowdRiskLevel = "critical";
    }

    return {
      isMatchToday: true,
      phase,
      minute,
      homeTeam,
      awayTeam,
      score,
      crowdRiskLevel
    };
  } catch (error) {
    console.error("fetchLiveMatchStatus failed:", error.message);
    return {
      isMatchToday: false,
      phase: "inactive",
      minute: 0,
      homeTeam: "N/A",
      awayTeam: "N/A",
      score: "N/A",
      crowdRiskLevel: "low",
      error: error.message
    };
  }
}
