import fetch from 'node-fetch';

export async function sendDiscordAlert(payload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL not configured. Skipping alert.");
    return { success: false, reason: "No webhook configured" };
  }

  const {
    incidentId,
    type,
    severity,
    stadium,
    zone,
    matchPhase,
    weatherSummary,
    recommendedAction,
    reasoningSummary,
    confidence
  } = payload;

  // Map severity to Discord embed colors
  let color = 5763719; // Default low (green)
  const severityLower = (severity || "").toLowerCase();
  if (severityLower === 'critical') {
    color = 15158332;
  } else if (severityLower === 'high') {
    color = 15844367;
  } else if (severityLower === 'medium') {
    color = 16776960;
  } else if (severityLower === 'low') {
    color = 5763719;
  }

  const confidencePercentage = confidence ? (confidence * 100).toFixed(0) : "N/A";

  const embed = {
    embeds: [{
      title: "🚨 StadiumOps IQ — Incident Alert",
      color: color,
      fields: [
        { name: "Type", value: String(type || "other"), inline: true },
        { name: "Severity", value: String(severity || "low"), inline: true },
        { name: "Stadium", value: String(stadium || "Unknown"), inline: true },
        { name: "Zone", value: String(zone || "Unknown"), inline: true },
        { name: "Match Phase", value: String(matchPhase || "inactive"), inline: true },
        { name: "Confidence", value: `${confidencePercentage}%`, inline: true },
        { name: "Live Weather", value: String(weatherSummary || "No weather context") },
        { name: "Recommended Action", value: String(recommendedAction || "No action recommended") },
        { name: "AI Reasoning Summary", value: String(reasoningSummary || "No reasoning summary") },
        { name: "Incident ID", value: String(incidentId || "N/A") }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "StadiumOps IQ | FIFA World Cup 2026 Operations" }
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(embed)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord returned ${response.status}: ${errorText}`);
    }

    console.log(`Discord alert dispatched successfully for incident: ${incidentId}`);
    return { success: true };
  } catch (error) {
    console.error("sendDiscordAlert failed:", error.message);
    return { success: false, error: error.message };
  }
}
