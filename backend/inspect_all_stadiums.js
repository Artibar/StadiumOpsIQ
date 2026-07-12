import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://worldcup26.ir/get/stadiums');
    const json = await res.json();
    const stadiums = json.stadiums || [];
    console.log("Stadium list from API:");
    stadiums.forEach(s => {
      console.log(`ID: ${s.id} | English: "${s.name_en}" | FIFA: "${s.fifa_name}" | City: "${s.city_en}"`);
    });
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
