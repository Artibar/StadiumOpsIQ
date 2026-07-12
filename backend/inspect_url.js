import fetch from 'node-fetch';

async function test() {
  console.log("Fetching worldcup26.ir/get/stadiums...");
  try {
    const res = await fetch('https://worldcup26.ir/get/stadiums');
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    const json = JSON.parse(text);
    console.log("Keys in JSON:", Object.keys(json));
    if (json.stadiums && json.stadiums.length > 0) {
      console.log("First Stadium object:", JSON.stringify(json.stadiums[0], null, 2));
    } else {
      console.log("No stadiums array or empty");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
