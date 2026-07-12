import fetch from 'node-fetch';

async function test() {
  console.log("Fetching worldcup26.ir/get/games...");
  try {
    const res = await fetch('https://worldcup26.ir/get/games');
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Keys in games response:", Object.keys(json));
    const games = Array.isArray(json) ? json : (json.games || json.data || []);
    console.log(`Total games: ${games.length}`);
    if (games.length > 0) {
      console.log("First Game object:", JSON.stringify(games[0], null, 2));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
