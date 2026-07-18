import React from 'react';
import {
  Sun, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, HelpCircle,
  Wind, Droplets, CalendarX, Sparkles, Clock, ShieldAlert, TrendingUp
} from 'lucide-react';

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

// Maps risk level strings to the app's shared severity CSS variables so this
// panel's badges line up exactly with the severity badge in Incident Summary.
const RISK_VAR = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)'
};

export default function LiveContextPanel({ liveContext }) {
  if (!liveContext) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--body-size)' }}>
        No context snapshot available for this incident yet.
      </div>
    );
  }

  const { weather = {}, matchStatus = {}, combinedRiskLevel = 'low', contextSummary = '', fetchedAt } = liveContext;
  const { temperature, weatherCode, windspeed, precipitation, riskFlags = [] } = weather;
  const { isMatchToday = false, phase = 'inactive', minute = 0, homeTeam = 'N/A', awayTeam = 'N/A', score = 'N/A', crowdRiskLevel = 'low' } = matchStatus;

  const riskKey = (combinedRiskLevel || 'low').toLowerCase();
  const riskColor = RISK_VAR[riskKey] || RISK_VAR.low;
  const crowdKey = (crowdRiskLevel || 'low').toLowerCase();
  const crowdColor = RISK_VAR[crowdKey] || RISK_VAR.low;
  const WeatherIcon = getWeatherIcon(weatherCode);
  const isLivePhase = phase !== 'inactive' && phase !== 'pre-match' && phase !== 'post-match';
  const isElevatedRisk = riskKey === 'critical' || riskKey === 'high';

  const subPanelStyle = {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  };

  const subHeadingStyle = {
    fontSize: 'var(--caption-size)',
    fontWeight: '800',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '10px',
    margin: 0
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `4px solid ${riskColor}`,
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflow: 'hidden',
        animation: isElevatedRisk ? 'borderPulse 2.4s ease-in-out infinite' : 'none'
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cursorBlink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes tempCount { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes borderPulse { 0%, 100% { border-top-color: ${riskColor}; } 50% { border-top-color: ${riskColor}88; } }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ color: riskColor }} />
            <span>Live Context Snapshot</span>
          </h2>
          {fetchedAt && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <Clock size={10} />
              Fetched at {new Date(fetchedAt).toLocaleString()}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: '6px', color: riskColor,
          backgroundColor: riskColor + '15', border: `1px solid ${riskColor}33`,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
            <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: riskColor, opacity: 0.6 }} />
            <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '50%', background: riskColor }} />
          </span>
          Risk: {combinedRiskLevel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
        {/* Weather Sub-panel */}
        <div style={subPanelStyle}>
          <h3 style={subHeadingStyle}>
            <CloudSun size={13} style={{ color: 'var(--accent)' }} />
            Microclimate Weather
          </h3>
          {temperature !== undefined && temperature !== null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'tempCount 0.35s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WeatherIcon size={26} style={{ color: 'var(--accent)' }} />
                  {temperature}°C
                </span>
                <span style={{ fontSize: 'var(--caption-size)', background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  {getWeatherCondition(weatherCode)}
                </span>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: 'var(--caption-size)' }}>
                  <Wind size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Wind:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{windspeed ?? '—'} km/h</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: 'var(--caption-size)' }}>
                  <Droplets size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Rain:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{precipitation ?? '—'} mm</strong>
                </div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>Weather telemetry unavailable for this location.</span>
          )}

          {riskFlags.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--critical)', textTransform: 'uppercase' }}>Risk Alerts</span>
              {riskFlags.map((flag, i) => (
                <div key={i} style={{ fontSize: 'var(--caption-size)', background: 'var(--critical)15', border: '1px solid var(--critical)33', color: 'var(--critical)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeUp 0.3s ease both', animationDelay: `${i * 60}ms` }}>
                  <ShieldAlert size={11} style={{ flexShrink: 0 }} />
                  {flag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Match Sub-panel */}
        <div style={subPanelStyle}>
          <h3 style={subHeadingStyle}>
            <span style={{ color: 'var(--accent)' }}>⚽</span>
            FIFA Live Match Phase
          </h3>

          {isMatchToday ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: 'var(--caption-size)', background: 'var(--accent)15', color: 'var(--accent)', border: '1px solid var(--accent)33', padding: '3px 10px', borderRadius: '999px', fontWeight: '700', textTransform: 'uppercase' }}>
                  {phase}
                </span>
                {isLivePhase && (
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--critical)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
                      <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--critical)', opacity: 0.7 }} />
                      <span style={{ position: 'relative', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--critical)' }} />
                    </span>
                    Live • {minute}'
                  </span>
                )}
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Current Score</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ fontSize: 'var(--caption-size)', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam}</span>
                  <span style={{ background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: '8px', color: 'var(--medium)', fontSize: '1rem', border: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: '800' }}>{score}</span>
                  <span style={{ fontSize: 'var(--caption-size)', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayTeam}</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={11} style={{ color: crowdColor }} />
                Crowd Surge Risk: <strong style={{ color: crowdColor, textTransform: 'uppercase' }}>{crowdRiskLevel}</strong>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--caption-size)', padding: '14px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <CalendarX size={18} style={{ color: 'var(--text-muted)' }} />
              No match scheduled for this stadium today.
              <span style={{ fontSize: '10px' }}>Crowd density is standard</span>
            </div>
          )}
        </div>
      </div>

      {contextSummary && (
        <div style={{ position: 'relative', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: `2px solid ${riskColor}`, borderRadius: '10px', padding: '14px 16px', fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace", fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.6', animation: 'fadeUp 0.4s ease' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontFamily: 'inherit' }}>
            <Sparkles size={11} style={{ color: riskColor }} />
            AI Context Summary
          </span>
          {contextSummary}
          <span style={{ display: 'inline-block', width: '6px', height: '12px', marginLeft: '4px', verticalAlign: 'middle', background: riskColor, animation: 'cursorBlink 1s step-end infinite' }} />
        </div>
      )}
    </div>
  );
}