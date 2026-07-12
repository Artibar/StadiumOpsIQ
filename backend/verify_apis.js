import { fetchLiveWeather } from './services/openMeteoService.js';
import { fetchStadiums, fetchLiveMatchStatus } from './services/worldCupService.js';

async function runTests() {
  console.log("=========================================");
  console.log("STARTING LIVE DATA SERVICE API TESTS");
  console.log("=========================================");

  // TEST 1: Weather API
  console.log("\n--- TEST 1: fetchLiveWeather(40.8128, -74.0742) (MetLife Stadium) ---");
  try {
    const weatherResult = await fetchLiveWeather(40.8128, -74.0742);
    console.log("Weather Result:", JSON.stringify(weatherResult, null, 2));
  } catch (err) {
    console.error("Test 1 Failed:", err.message);
  }

  // TEST 2: Stadiums API
  console.log("\n--- TEST 2: fetchStadiums() (First 5 results) ---");
  try {
    const stadiumsResult = await fetchStadiums();
    console.log(`Total Stadiums Fetched: ${stadiumsResult.length}`);
    console.log("First 5 Stadiums:", JSON.stringify(stadiumsResult.slice(0, 5), null, 2));
  } catch (err) {
    console.error("Test 2 Failed:", err.message);
  }

  // TEST 3: Match Status API
  console.log("\n--- TEST 3: fetchLiveMatchStatus(\"MetLife Stadium\") ---");
  try {
    const matchStatusResult = await fetchLiveMatchStatus("MetLife Stadium");
    console.log("Match Status Result:", JSON.stringify(matchStatusResult, null, 2));
  } catch (err) {
    console.error("Test 3 Failed:", err.message);
  }

  console.log("\n=========================================");
  console.log("API TESTS COMPLETED");
  console.log("=========================================");
}

runTests();
