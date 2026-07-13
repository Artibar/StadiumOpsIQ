import fetch from 'node-fetch';

async function submitTest() {
  console.log("Submitting test incident to local backend...");
  try {
    const response = await fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: "Person collapsed near Gate 4, unconscious, needs immediate medical attention",
        stadiumName: "MetLife Stadium",
        zoneLocation: "Gate 4"
      })
    });

    const data = await response.json();
    console.log("\n================ BACKEND RESPONSE ================");
    console.log(JSON.stringify(data, null, 2));
    console.log("==================================================\n");
  } catch (error) {
    console.error("Submission failed:", error.message);
  }
}

submitTest();
