import React from 'react';
import {
  Sun, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, HelpCircle,
  Wind, Droplets, CalendarX, Sparkles, Clock, ShieldAlert, TrendingUp
} from 'lucide-react';

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

// Presentational only — maps the same weather code to an icon, doesn't touch the label logic above
function getWeatherIcon(code) {
  if (code === undefined || code === null) return HelpCircle;
  if (code === 0) return Sun;
  if (code >= 1 && code <= 3) return CloudSun;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 55) return CloudDrizzle;
  if (code >= 61 && code <= 65) return CloudRain;
  if (code >= 71 && code <= 86) return CloudSnow;
  if (code >= 95 && code <= 99) return CloudLightning;
  return HelpCircle;
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

  const riskGlow = {
    critical: 'rgb(248, 113, 113)',
    high: 'rgb(251, 191, 36)',
    medium: 'rgb(250, 204, 21)',
    low: 'rgb(52, 211, 153)'
  };

  const riskKey = combinedRiskLevel.toLowerCase();
  const riskClass = riskStyles[riskKey] || riskStyles.low;
  const riskColor = riskGlow[riskKey] || riskGlow.low;
  const WeatherIcon = getWeatherIcon(weatherCode);
  const isLivePhase = phase !== 'inactive' && phase !== 'pre-match' && phase !== 'post-match';
  const isElevatedRisk = riskKey === 'critical' || riskKey === 'high';

  return (
    <div
      className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden"
      style={{
        boxShadow: `0 0 40px ${riskColor}14, 0 10px 30px rgba(0,0,0,0.3)`,
        animation: isElevatedRisk ? 'borderPulse 2.4s ease-in-out infinite' : 'none'
      }}
    >
      <style>{`
        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes tempCount {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(51, 65, 85, 1); }
          50% { border-color: ${riskColor}55; }
        }
      `}</style>

      <div
        className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${riskColor}14`, animation: 'floatGlow 8s ease-in-out infinite' }}
      />
      <div
        className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${riskColor}0d`, animation: 'floatGlow 10s ease-in-out infinite reverse' }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: riskColor }} />
            Live Context Snapshot
          </h3>
          {fetchedAt && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              Fetched at: {new Date(fetchedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${riskClass}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: riskColor }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: riskColor }} />
          </span>
          Risk: {combinedRiskLevel}
        </div>
      </div>

      {/* Row: Weather details & Game status */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Sub-panel */}
        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-slate-700">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <CloudSun size={13} className="text-sky-400" />
            Microclimate Weather
          </h4>
          {temperature !== undefined && temperature !== null ? (
            <div className="space-y-2" style={{ animation: 'tempCount 0.35s ease' }}>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
                  <WeatherIcon size={26} className="text-sky-400" />
                  {temperature}°C
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700/50">
                  {getWeatherCondition(weatherCode)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5 bg-slate-900/40 rounded-lg px-2 py-1.5 border border-slate-800/60">
                  <Wind size={12} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-400">Wind:</span>
                  <strong className="text-slate-200">{windspeed} km/h</strong>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/40 rounded-lg px-2 py-1.5 border border-slate-800/60">
                  <Droplets size={12} className="text-blue-400 flex-shrink-0" />
                  <span className="text-slate-400">Rain:</span>
                  <strong className="text-slate-200">{precipitation} mm</strong>
                </div>
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
                <div
                  key={i}
                  className="text-xs bg-red-950/20 border border-red-900/30 text-red-300 px-2 py-1 rounded flex items-center gap-1.5"
                  style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${i * 60}ms` }}
                >
                  <ShieldAlert size={11} className="flex-shrink-0" />
                  {flag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Phase Sub-panel */}
        <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-slate-700">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <span className="text-teal-400">⚽</span>
            FIFA Live Match Phase
          </h4>

          {isMatchToday ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {phase}
                </span>
                {isLivePhase && (
                  <span className="text-xs text-red-500 font-bold flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    Live • {minute}'
                  </span>
                )}
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Current Score</div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs font-semibold text-slate-300 truncate max-w-[80px]">{homeTeam}</span>
                  <span className="bg-slate-950 px-3 py-1 rounded-lg text-amber-400 text-base border border-slate-800 font-mono font-bold tracking-wider">{score}</span>
                  <span className="text-xs font-semibold text-slate-300 truncate max-w-[80px]">{awayTeam}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={11} className={
                  crowdRiskLevel.toLowerCase() === 'critical' ? 'text-red-400' :
                  crowdRiskLevel.toLowerCase() === 'high' ? 'text-amber-400' :
                  crowdRiskLevel.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                } />
                Crowd Surge Risk: <strong className={`uppercase ${
                  crowdRiskLevel.toLowerCase() === 'critical' ? 'text-red-400' :
                  crowdRiskLevel.toLowerCase() === 'high' ? 'text-amber-400' :
                  crowdRiskLevel.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>{crowdRiskLevel}</strong>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs py-4 text-center flex flex-col items-center gap-1.5">
              <CalendarX size={18} className="text-slate-600" />
              No match scheduled for this stadium today.
              <span className="block mt-0.5 text-[10px] text-slate-600">Crowd density is standard</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Box — styled like a live model readout */}
      {contextSummary && (
        <div
          className="relative bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-slate-300 text-xs leading-relaxed font-mono overflow-hidden"
          style={{ animation: 'fadeUp 0.4s ease' }}
        >
          <div
            className="absolute top-0 left-0 h-full w-[2px]"
            style={{ background: `linear-gradient(180deg, ${riskColor}, transparent)` }}
          />
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider mb-1.5 font-sans">
            <Sparkles size={11} style={{ color: riskColor }} />
            AI Context Summary
          </span>
          <span>{contextSummary}</span>
          <span
            className="inline-block w-[6px] h-[12px] ml-1 align-middle"
            style={{ background: riskColor, animation: 'cursorBlink 1s step-end infinite' }}
          />
        </div>
      )}
    </div>
  );
}