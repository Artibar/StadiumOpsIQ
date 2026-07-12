import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncidentById, confirmIncident, overrideIncident } from '../services/api.js';

function getWeatherCondition(code) {
  if (code === undefined || code === null) return 'Unknown';
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return `Weather Code ${code}`;
}

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Human Override Form State
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Collapsible Report Sections State
  const [collapsedSections, setCollapsedSections] = useState({
    narrative: true,
    rootCause: true,
    actionsLog: false, // expanded by default
    followUp: false,   // expanded by default
    prevention: true,
    lessons: true
  });

  const loadIncident = async () => {
    try {
      const result = await getIncidentById(id);
      if (result && !result.error) {
        setIncident(result);
        setError('');
      } else {
        setError(result?.error || 'Failed to retrieve incident details.');
      }
    } catch (err) {
      console.error("Failed to load incident:", err);
      setError('Failed to retrieve incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm("Are you sure you want to confirm and execute this action?")) return;
    setLoading(true);
    const result = await confirmIncident(id);
    if (result && !result.error) {
      await loadIncident();
    } else {
      alert(`Confirm failed: ${result?.error || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert("Please provide an override reason.");
      return;
    }
    setIsSubmittingOverride(true);
    const result = await overrideIncident(id, {
      newStatus,
      overrideReason: overrideReason.trim()
    });
    setIsSubmittingOverride(false);
    if (result && !result.error) {
      setShowOverrideForm(false);
      setOverrideReason('');
      await loadIncident();
    } else {
      alert(`Override failed: ${result?.error || 'Unknown error'}`);
    }
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 select-none">
        <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-[var(--text-muted)] font-semibold">Loading Incident Details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-center shadow-sm space-y-4 select-none">
        <span className="text-4xl">⚠️</span>
        <h3 className="text-base font-bold text-[var(--text-primary)]">Incident Not Found</h3>
        <p className="text-xs text-[var(--text-secondary)]">{error || 'The requested incident could not be found.'}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-[var(--border)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] rounded-lg border border-[var(--border)] transition cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Formatting helpers
  const severityColors = {
    critical: 'var(--critical)',
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)'
  };
  const typeColors = {
    medical: 'var(--medical)',
    security: 'var(--security)',
    crowd: 'var(--crowd)',
    fire: 'var(--fire)',
    weather: 'var(--weather)',
    'lost-item': 'var(--lost-item)',
    other: 'var(--text-muted)'
  };
  const statusLabels = {
    'open': 'Open',
    'pending-confirmation': 'Pending Confirmation',
    'escalated': 'Escalated',
    'resolved': 'Resolved',
    'flagged-for-review': 'Flagged'
  };

  const confidence = incident.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);
  let confidenceLevel = 'LOW CONFIDENCE';
  let confidenceColor = 'var(--critical)';
  if (confidence >= 0.8) {
    confidenceLevel = 'HIGH CONFIDENCE';
    confidenceColor = 'var(--low)';
  } else if (confidence >= 0.6) {
    confidenceLevel = 'MEDIUM CONFIDENCE';
    confidenceColor = 'var(--medium)';
  }

  const weather = incident.liveContext?.weather || {};
  const matchStatus = incident.liveContext?.matchStatus || {};
  const combinedRisk = incident.liveContext?.combinedRiskLevel || 'low';
  const riskColor = severityColors[combinedRisk.toLowerCase()] || 'var(--low)';

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 select-none">
      {/* BREADCRUMB */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <Link
          to="/"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition font-semibold flex items-center gap-1.5"
        >
          <span>←</span> Back to Dashboard
        </Link>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          ID: {incident._id}
        </span>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-xs font-mono text-[var(--text-muted)] tracking-wider">
              #{incident._id.slice(-8).toUpperCase()}
            </span>
            <span
              className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: severityColors[incident.severity] || 'var(--low)' }}
            >
              {incident.severity}
            </span>
            <span
              className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: typeColors[incident.type] || 'var(--text-muted)' }}
            >
              {incident.type}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]">
              {statusLabels[incident.status] || incident.status}
            </span>
          </div>

          {/* Confidence Dial/Progress */}
          <div className="flex items-center gap-3 bg-[var(--bg-primary)] p-2 px-3 rounded-lg border border-[var(--border)] min-w-[240px]">
            <div className="flex-grow">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wide uppercase mb-1">
                <span className="text-[var(--text-secondary)]">AI Confidence</span>
                <span style={{ color: confidenceColor }}>{confidencePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${confidencePercent}%`, backgroundColor: confidenceColor }}
                />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] select-none">
              {confidenceLevel}
            </div>
          </div>
        </div>

        {/* Location coordinates summary columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-xs border-t border-[var(--border)]/40">
          <div>
            <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">Stadium</label>
            <span className="text-[var(--text-primary)] font-semibold">{incident.stadiumName}</span>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">City</label>
            <span className="text-[var(--text-secondary)] font-semibold">{incident.stadiumCity || 'N/A'}</span>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">Zone / Location</label>
            <span className="text-[var(--text-primary)] font-semibold">📍 {incident.zoneLocation}</span>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wider block">Reported At</label>
            <span className="text-[var(--text-secondary)] font-semibold">
              {new Date(incident.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ORIGINAL REPORT SECTION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
          Original Report Intake
        </h3>
        {incident.detectedLanguage !== 'en' && incident.translatedDescription ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm italic text-[var(--text-muted)] leading-relaxed">
                "{incident.originalDescription}"
              </p>
              <span className="text-[10px] font-semibold text-[var(--accent)] mt-1.5 block">
                🌐 Language Detected: {incident.detectedLanguage.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-center text-[var(--accent)] leading-none my-1 font-bold">↓</div>
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
                "{incident.translatedDescription}"
              </p>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] mt-1 block">
                Translated to English by AI Pipeline
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-primary)] p-3 rounded border border-[var(--border)]">
            "{incident.originalDescription}"
          </p>
        )}
      </div>

      {/* LIVE CONTEXT PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
            🌤️ Live Weather Context
          </h3>
          {weather.temperature !== undefined ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">{weather.temperature}°C</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {weather.weatherDescription || getWeatherCondition(weather.weatherCode)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
                <div>Windspeed: <strong className="text-[var(--text-primary)]">{weather.windspeed} km/h</strong></div>
                <div>Precipitation: <strong className="text-[var(--text-primary)]">{weather.precipitation} mm</strong></div>
              </div>

              {weather.riskFlags && weather.riskFlags.length > 0 ? (
                <div className="mt-2.5 p-2 bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] rounded text-xs font-semibold">
                  <span className="block mb-1 text-[10px] uppercase font-bold text-[var(--critical)]">⚠️ Climate Risk Flags</span>
                  {weather.riskFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-center gap-1 mt-0.5">
                      <span>•</span> {flag}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-[var(--low)] font-semibold mt-1">
                  ✅ No weather risk flags active
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[var(--text-muted)] italic py-2">
              Weather context skipped for this incident.
            </div>
          )}
        </div>

        {/* Match Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
            ⚽ Live Match Status
          </h3>
          {matchStatus.isMatchToday ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20 leading-none">
                  {matchStatus.phase}
                </span>
                {matchStatus.phase !== 'inactive' && matchStatus.phase !== 'pre-match' && matchStatus.phase !== 'post-match' && (
                  <span className="text-xs text-[var(--critical)] font-bold animate-pulse">
                    LIVE • {matchStatus.minute}'
                  </span>
                )}
              </div>

              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-center flex items-center justify-center gap-3">
                <span className="text-xs font-bold text-[var(--text-primary)]">{matchStatus.homeTeam}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-primary)]">
                  {matchStatus.score}
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{matchStatus.awayTeam}</span>
              </div>

              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <span>Crowd Risk:</span>
                <span
                  className="font-bold uppercase"
                  style={{
                    color:
                      matchStatus.crowdRiskLevel === 'critical' ? 'var(--critical)' :
                      matchStatus.crowdRiskLevel === 'high' ? 'var(--high)' :
                      matchStatus.crowdRiskLevel === 'medium' ? 'var(--medium)' : 'var(--low)'
                  }}
                >
                  {matchStatus.crowdRiskLevel}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="text-xs text-[var(--text-muted)] italic">
                No match scheduled at {incident.stadiumName} today.
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Standard spectator density levels expected.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMBINED RISK ACCENT BAR */}
      <div
        className="rounded-lg p-3 text-center text-xs font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: riskColor }}
      >
        Combined Incident Risk Rating: {combinedRisk}
      </div>

      {/* ACTIONS TAKEN SECTION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
          ⚡ Actions Triggered
        </h3>
        <div className="flex flex-wrap gap-2 pt-1">
          {incident.actionsTaken && incident.actionsTaken.length > 0 ? (
            incident.actionsTaken.map((action, idx) => {
              let label = action;
              let icon = '⚡';
              let badgeColor = 'var(--accent)';
              
              if (action === 'dispatchMedical') {
                label = 'Medical Dispatched';
                icon = '🚑';
                badgeColor = 'var(--medical)';
              } else if (action === 'escalateToSecurity') {
                label = 'Security Escalated';
                icon = '🚔';
                badgeColor = 'var(--security)';
              } else if (action === 'resolveAsLowPriority') {
                label = 'Auto Resolved';
                icon = '✅';
                badgeColor = 'var(--low)';
              } else if (action === 'flagForHumanReview') {
                label = 'Human Review flagged';
                icon = '🚩';
                badgeColor = 'var(--high)';
              } else if (action === 'sendDiscordNotification') {
                label = 'Discord Alerted';
                icon = '📢';
                badgeColor = 'var(--accent)';
              } else if (action === 'sendReportEmail') {
                label = 'Report Emailed';
                icon = '📧';
                badgeColor = 'var(--accent)';
              } else if (action === 'SYSTEM_ERROR') {
                label = 'Rate Limit Fallback Bypass';
                icon = '⚠️';
                badgeColor = 'var(--critical)';
              }

              return (
                <span
                  key={idx}
                  className="text-xs font-semibold px-3 py-1 rounded-full text-white flex items-center gap-1.5"
                  style={{ backgroundColor: badgeColor }}
                >
                  <span>{icon}</span> {label}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-[var(--text-muted)] italic">No actions recorded</span>
          )}
        </div>
      </div>

      {/* HUMAN CONFIRMATION PANEL */}
      {incident.status === 'pending-confirmation' && (
        <div className="bg-[var(--bg-card)] border-l-4 border-[var(--medium)] border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>⚠️</span> Action Pending Confirmation
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              The AI Pipeline has proposed an escalation pathway. Review the reasoning timeline below to authorize or bypass.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-[var(--low)] hover:bg-[var(--low)]/90 text-white font-bold text-xs rounded-lg cursor-pointer transition active:scale-[0.98]"
            >
              ✅ Confirm & Execute
            </button>
            <button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="px-4 py-2 bg-[var(--critical)] hover:bg-[var(--critical)]/90 text-white font-bold text-xs rounded-lg cursor-pointer transition active:scale-[0.98]"
            >
              ❌ Override AI Decision
            </button>
          </div>

          {showOverrideForm && (
            <form onSubmit={handleOverrideSubmit} className="mt-4 border-t border-[var(--border)]/40 pt-4 space-y-3 max-w-lg">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Override Status Target *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="resolved">Mark Resolved</option>
                  <option value="escalated">Mark Escalated</option>
                  <option value="flagged-for-review">Mark Flagged for Review</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Override Rationale *
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide supervisor justification notes explaining this manual override..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOverride}
                className="px-3.5 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-lg hover:bg-[var(--accent)]/90 transition cursor-pointer"
              >
                {isSubmittingOverride ? 'Saving...' : 'Submit Override'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* HUMAN OVERRIDE HIGHLIGHT NOTE */}
      {incident.humanOverride && (
        <div className="bg-[var(--medium)]/10 border-l-4 border-[var(--medium)] border-[var(--border)] rounded-lg p-4 flex gap-3">
          <span className="text-lg">👤</span>
          <div>
            <h4 className="text-xs font-bold text-[var(--medium)] uppercase tracking-wider">Human Override Applied</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">
              Autonomous pipeline logic has been overridden by a supervisor. Check the reasoning steps below for operational justifications.
            </p>
          </div>
        </div>
      )}

      {/* REASONING TRAIL SECTION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2 flex items-center justify-between">
            <span>🧠 AI Reasoning Trail</span>
            <span className="text-[10px] text-[var(--low)] font-semibold px-2 py-0.5 bg-[var(--low)]/10 border border-[var(--low)]/20 rounded-full leading-none">
              Sequence complete ({incident.reasoningTrail?.length || 0} steps)
            </span>
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
            Complete decision trail showing chronological actions executed across 5 separate specialized GenAI agents.
          </p>
        </div>

        <div className="pt-2 pl-2 space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--border)]">
          {incident.reasoningTrail && incident.reasoningTrail.length > 0 ? (
            incident.reasoningTrail.map((step, idx) => {
              let agentColor = '#6b7280'; // Human / fallback gray
              if (step.agentName.includes('Intake')) agentColor = '#3b82f6';
              else if (step.agentName.includes('Classification')) agentColor = '#8b5cf6';
              else if (step.agentName.includes('Context')) agentColor = '#14b8a6';
              else if (step.agentName.includes('Decision')) agentColor = '#f97316';
              else if (step.agentName.includes('Report')) agentColor = '#6366f1';

              return (
                <div key={idx} className="flex gap-4 relative">
                  {/* Timeline circle dot */}
                  <div
                    className="w-[20px] h-[20px] rounded-full border-4 border-[var(--bg-card)] flex-shrink-0 z-10"
                    style={{ backgroundColor: agentColor }}
                  />

                  {/* Card content */}
                  <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)]/40 pb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-extrabold text-white leading-none"
                        style={{ backgroundColor: agentColor }}
                      >
                        {step.agentName}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {step.action && (
                      <div className="font-bold text-[10px] uppercase text-[var(--text-primary)] tracking-wide">
                        ACTION: <span className="text-[var(--accent)]">{step.action}</span>
                      </div>
                    )}

                    <div className="text-[var(--text-secondary)] leading-relaxed">
                      {step.thought}
                    </div>

                    {step.result && (
                      <div className="text-[11px] italic text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/30">
                        Result: {step.result}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-[var(--text-muted)] italic py-2">No timeline steps recorded.</div>
          )}
        </div>
      </div>

      {/* INCIDENT REPORT SECTION */}
      {incident.incidentReport && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
              📋 AI Generated Incident Report
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              Drafted by Report Agent (Agent 5) for stadium operations logs. Risk rating: <strong style={{ color: riskColor }}>{incident.incidentReport.riskRating || incident.incidentReport.riskRating}</strong>.
            </p>
          </div>

          {/* Executive Summary Box */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4 text-xs leading-relaxed space-y-1">
            <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-wider block">Executive Summary</span>
            <p className="text-[var(--text-primary)] font-medium">
              {incident.incidentReport.executiveSummary}
            </p>
          </div>

          <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <span>Estimated Resolution Time:</span>
            <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 bg-[var(--border)] border border-[var(--border)] rounded">
              {incident.incidentReport.estimatedResolutionTime}
            </span>
          </div>

          {/* Collapsible Sections Container */}
          <div className="space-y-2.5 pt-2">
            {/* 1. Incident Narrative */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('narrative')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>📖 Incident Narrative</span>
                <span>{collapsedSections.narrative ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.narrative && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {incident.incidentReport.incidentNarrative}
                </div>
              )}
            </div>

            {/* 2. Root Cause Analysis */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('rootCause')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>🔍 Root Cause Analysis</span>
                <span>{collapsedSections.rootCause ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.rootCause && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 text-[var(--text-secondary)] leading-relaxed">
                  {incident.incidentReport.rootCauseAnalysis}
                </div>
              )}
            </div>

            {/* 3. Immediate Actions Log */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('actionsLog')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>⚡ Immediate Actions Log</span>
                <span>{collapsedSections.actionsLog ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.actionsLog && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 text-[var(--text-secondary)] space-y-1.5">
                  {(incident.incidentReport.immediateActionsLog || []).map((action, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[var(--accent)] font-bold">→</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Recommended Follow-Up */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('followUp')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>📋 Recommended Follow-Up Actions</span>
                <span>{collapsedSections.followUp ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.followUp && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 space-y-2">
                  {(incident.incidentReport.recommendedFollowUp || []).map((follow, idx) => (
                    <div
                      key={idx}
                      className="p-2 px-3 border-l-2 border-[var(--accent)] bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-r"
                    >
                      {follow}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Prevention Measures */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('prevention')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>🛡️ Prevention Measures</span>
                <span>{collapsedSections.prevention ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.prevention && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 space-y-2">
                  {(incident.incidentReport.preventionMeasures || []).map((prev, idx) => (
                    <div
                      key={idx}
                      className="p-2 px-3 border-l-2 border-[var(--accent)] bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded-r"
                    >
                      {prev}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Lessons Learned */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => toggleSection('lessons')}
                className="w-full bg-[var(--bg-primary)] p-3 flex items-center justify-between text-left font-bold text-[var(--text-secondary)] cursor-pointer hover:text-white transition focus:outline-none"
              >
                <span>💡 Lessons Learned</span>
                <span>{collapsedSections.lessons ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.lessons && (
                <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)]/40 text-[var(--text-secondary)] leading-relaxed">
                  {incident.incidentReport.lessonsLearned}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
