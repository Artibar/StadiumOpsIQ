import React from 'react';

// Translates Open-Meteo weather codes into human-readable conditions
function getWeatherCondition(code) {
  if (code === undefined || code === null) return 'Unknown';
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Mainly Clear / Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code >= 71 && code <= 75) return 'Snowing';
  if (code === 77) return 'Snow grains';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return `Weather Code ${code}`;
}

export default function LiveContextPanel({ liveContext }) {
  if (!liveContext) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-sm">
        No context snapshot available.
      </div>
    );
  }

  const { weather = {}, matchStatus = {}, combinedRiskLevel = 'low', contextSummary = '', fetchedAt } = liveContext;
  const { temperature, weatherCode, windspeed, precipitation, riskFlags = [] } = weather;
  const { isMatchToday = false, phase = 'inactive', minute = 0, homeTeam = 'N/A', awayTeam = 'N/A', score = 'N/A', crowdRiskLevel = 'low' } = matchStatus;

  // Colors based on combined risk
  const riskStyles = {
    critical: 'bg-red-500/20 border-red-500/40 text-red-400',
    high: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
  };

  const riskClass = riskStyles[combinedRiskLevel.toLowerCase()] || riskStyles.low;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
      <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Live Context Snapshot</h3>
          {fetchedAt && (
            <span className="text-[10px] text-slate-500">
              Fetched at: {new Date(fetchedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${riskClass}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              combinedRiskLevel.toLowerCase() === 'critical' ? 'bg-red-400' :
              combinedRiskLevel.toLowerCase() === 'high' ? 'bg-amber-400' :
              combinedRiskLevel.toLowerCase() === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              combinedRiskLevel.toLowerCase() === 'critical' ? 'bg-red-500' :
              combinedRiskLevel.toLowerCase() === 'high' ? 'bg-amber-500' :
              combinedRiskLevel.toLowerCase() === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}></span>
          </span>
          Risk: {combinedRiskLevel}
        </div>
      </div>

      {/* Row: Weather details & Game status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Sub-panel */}
        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
            🌤️ Microclimate Weather
          </h4>
          {temperature !== undefined && temperature !== null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-slate-100">{temperature}°C</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700/50">
                  {getWeatherCondition(weatherCode)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                <div>Windspeed: <strong className="text-slate-200">{windspeed} km/h</strong></div>
                <div>Rainfall: <strong className="text-slate-200">{precipitation} mm</strong></div>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500 block">Weather details unavailable</span>
          )}

          {/* Weather Risk Flags */}
          {riskFlags.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400 block">Risk Alerts:</span>
              {riskFlags.map((flag, i) => (
                <div key={i} className="text-xs bg-red-950/20 border border-red-900/30 text-red-300 px-2 py-1 rounded">
                  ⚠️ {flag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Phase Sub-panel */}
        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
            ⚽ FIFA Live Match Phase
          </h4>

          {isMatchToday ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {phase}
                </span>
                {phase !== 'inactive' && phase !== 'pre-match' && phase !== 'post-match' && (
                  <span className="text-xs text-red-500 font-bold animate-pulse">
                    Live • {minute}'
                  </span>
                )}
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">Current Score</div>
                <div className="text-sm font-bold text-slate-100 flex items-center justify-center gap-2">
                  <span>{homeTeam}</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-amber-400 text-xs border border-slate-800">{score}</span>
                  <span>{awayTeam}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Crowd Surge Risk: <strong className={`uppercase ${
                  crowdRiskLevel.toLowerCase() === 'critical' ? 'text-red-400' :
                  crowdRiskLevel.toLowerCase() === 'high' ? 'text-amber-400' :
                  crowdRiskLevel.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>{crowdRiskLevel}</strong>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-4 text-center">
              📅 No match scheduled for this stadium today.
              <span className="block mt-1 text-[10px] text-slate-600">Crowd density is standard</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Box */}
      {contextSummary && (
        <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 text-slate-300 text-xs leading-relaxed">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">AI Context Summary</span>
          {contextSummary}
        </div>
      )}
    </div>
  );
}
