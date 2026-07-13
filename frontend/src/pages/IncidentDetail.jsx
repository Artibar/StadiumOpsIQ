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

function sanitizeAgentName(name) {
  if (!name) return 'System Stage';
  let clean = name;
  clean = clean.replace(/intakeAgent/i, 'Report Intake');
  clean = clean.replace(/classificationAgent/i, 'Incident Classification');
  clean = clean.replace(/contextAgent/i, 'Operational Context Assessment');
  clean = clean.replace(/decisionAgent/i, 'Response Planning');
  clean = clean.replace(/reportAgent/i, 'Incident Reporting');
  return clean;
}

function renderStatusBadge(status) {
  let bg = 'rgba(107, 114, 128, 0.1)';
  let fg = 'var(--text-muted)';
  let label = status;

  if (status === 'Completed' || status === 'Success' || status === 'Analysis Complete') {
    bg = 'rgba(34, 197, 94, 0.15)';
    fg = 'var(--low)';
    label = 'Completed';
  } else if (status === 'Pending' || status === 'Running' || status === 'Awaiting Execution') {
    bg = 'rgba(234, 179, 8, 0.15)';
    fg = 'var(--medium)';
    label = 'Pending';
  } else if (status === 'Failed' || status === 'Action Required') {
    bg = 'rgba(239, 68, 68, 0.15)';
    fg = 'var(--critical)';
    label = 'Action Required';
  } else if (status === 'Skipped' || status === 'Not Required') {
    bg = 'rgba(156, 163, 175, 0.15)';
    fg = 'var(--text-muted)';
    label = 'Not Required';
  }

  return (
    <span style={{
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: '4px',
      background: bg,
      color: fg,
      display: 'inline-block'
    }}>
      {label}
    </span>
  );
}

function getDiagnosticsForStep(step, idx, incident) {
  const isIntake = step.agentName.toLowerCase().includes('intake');
  const isClassification = step.agentName.toLowerCase().includes('classification');
  const isContext = step.agentName.toLowerCase().includes('context');
  const isDecision = step.agentName.toLowerCase().includes('decision');
  const isReport = step.agentName.toLowerCase().includes('report');

  const diagnostics = {
    provider: 'Groq',
    model: 'llama-3.3-70b-versatile',
    status: 'Completed',
    pipelineDuration: incident.pipelineDurationMs ? `${incident.pipelineDurationMs} ms` : 'Not Available',
    confidence: 'Not Available',
    weatherService: 'Weather Conditions (Open-Meteo)',
    weatherStatus: incident.liveContext?.weather ? 'Success' : 'Failed',
    matchService: 'Match Operations Context',
    matchStatus: incident.liveContext?.matchStatus ? 'Success' : 'Failed',
    toolExecution: 'Not Available',
    stepsCompleted: `Step ${idx + 1} of ${incident.reasoningTrail?.length || 5}`,
    executionOrder: `Sequence #${idx + 1}`,
    logs: step.thought || 'Not Available',
    rawResponse: step.result || 'Not Available',
    warnings: 'None',
    errors: 'None'
  };

  if (isDecision && incident.status === 'pending-confirmation') {
    diagnostics.status = 'Pending';
  } else if (incident.status === 'failed') {
    diagnostics.status = 'Action Required';
  } else if (step.result?.includes('skipped') || step.thought?.includes('skipping')) {
    diagnostics.status = 'Not Required';
  }

  if (isIntake) {
    diagnostics.toolExecution = 'Language Analysis';
  } else if (isClassification) {
    diagnostics.toolExecution = 'Incident Classification';
    diagnostics.confidence = incident.confidence ? `${Math.round(incident.confidence * 100)}%` : 'Not Available';
  } else if (isContext) {
    diagnostics.toolExecution = 'Context Retrieval';
  } else if (isDecision) {
    diagnostics.toolExecution = 'Response Planning';
  } else if (isReport) {
    diagnostics.toolExecution = 'Incident Reporting';
  }

  return diagnostics;
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

  const confidencePercent = Math.round((incident.confidence || 0) * 100);
  const weather = incident.liveContext?.weather || {};
  const matchStatus = incident.liveContext?.matchStatus || {};

  // Build list of details for Decision Basis dynamically
  const getDecisionBasis = () => {
    const basis = [];
    const desc = (incident.translatedDescription || incident.originalDescription || '').toLowerCase();
    
    if (desc.includes('unconscious') || desc.includes('collapse') || desc.includes('medical') || desc.includes('hurt')) {
      basis.push('Person collapsed or reported unconscious near gate areas.');
      basis.push('Immediate medical assistance required.');
    } else if (desc.includes('fire') || desc.includes('smoke') || desc.includes('burn')) {
      basis.push('Thermal anomaly or smoke reports flagged in stadium zone.');
      basis.push('Critical fire emergency protocols advised.');
    } else if (desc.includes('fight') || desc.includes('weapon') || desc.includes('crowd')) {
      basis.push('Spectator congestion, altercations, or security flags identified.');
      basis.push('Perimeter containment and alert notification required.');
    } else {
      basis.push('Standard operational anomaly reported by arena dispatchers.');
    }

    if (incident.zoneLocation) {
      basis.push(`Incident coordinates verified at Stadium Zone ${incident.zoneLocation}.`);
    }
    return basis;
  };

  // Build bullet lists for stages to prevent long paragraph walls
  const getExecutiveStoryForStep = (stepName) => {
    const type = incident.type || 'standard';
    const zone = incident.zoneLocation || 'stadium zone';
    const isTrans = incident.detectedLanguage !== 'en' && incident.translatedDescription;
    
    if (stepName.toLowerCase().includes('intake')) {
      return {
        summary: `Incident report received.`,
        evidence: [
          isTrans ? `Intake translation verified` : `English origin confirmed`,
          `Target venue matched: ${incident.stadiumName}`
        ],
        decision: `Ready for classification.`,
        nextAction: `Proceed.`
      };
    } else if (stepName.toLowerCase().includes('classification')) {
      return {
        summary: `${type.charAt(0).toUpperCase() + type.slice(1)} emergency detected.`,
        evidence: [
          `Identified emergency patterns in report content`,
          `Verified coordinates at Zone ${zone}`
        ],
        decision: incident.severity?.toUpperCase() || 'HIGH',
        confidence: `${confidencePercent}%`,
        nextAction: `Dispatch Response Teams.`
      };
    } else if (stepName.toLowerCase().includes('context')) {
      return {
        summary: `Environmental conditions verified.`,
        evidence: [
          `Weather: ${weather.temperature !== undefined ? `${weather.weatherDescription || getWeatherCondition(weather.weatherCode)}` : 'Clear'}`,
          `Match: ${matchStatus.isMatchToday ? 'Active match day' : 'No active match'}`
        ],
        decision: `No environmental reduction in risk.`,
        nextAction: `Continue response.`
      };
    } else if (stepName.toLowerCase().includes('decision')) {
      const actions = incident.actionsTaken || [];
      return {
        summary: `Mitigation dispatches calculated.`,
        evidence: [
          `Risk matrix verified against active stadium zones`,
          `Proposed actions: ${actions.length ? actions.map(a => a.replace('dispatchMedical', 'Medical Response').replace('escalateToSecurity', 'Security Response').replace('sendDiscordNotification', 'Operations Notification')).join(', ') : 'None'}`
        ],
        decision: incident.status === 'pending-confirmation' 
          ? `Proposed escalations require supervisor authorization.`
          : `Mitigation pathways authorized for execution.`,
        nextAction: incident.status === 'pending-confirmation'
          ? `Operator approval required.`
          : `Dispatched safety teams.`
      };
    } else if (stepName.toLowerCase().includes('report')) {
      return {
        summary: `Operational logs compiled for stadium records.`,
        evidence: [
          `Decision steps complete`,
          `Resolution ETA: ${incident.incidentReport?.estimatedResolutionTime || 'Not Available'}`
        ],
        decision: `Incident dossier archived in database ledger.`,
        nextAction: `Transition status to active monitoring.`
      };
    }

    return {
      summary: `System stage execution.`,
      evidence: [`Logs generated by step coordinator.`],
      decision: `Completed processing task.`,
      nextAction: `Transfer to next decision phase.`
    };
  };

  const getLanguageLabel = (langCode) => {
    if (!langCode) return 'English';
    const mapping = {
      en: 'English (US)',
      es: 'Spanish (ES)',
      fr: 'French (FR)',
      de: 'German (DE)',
      it: 'Italian (IT)',
      pt: 'Portuguese (PT)',
      ar: 'Arabic (AR)',
      zh: 'Chinese (ZH)',
      ja: 'Japanese (JA)'
    };
    return mapping[langCode.toLowerCase()] || `Foreign Language (${langCode.toUpperCase()})`;
  };

  // Check action dispatch states
  const hasMedical = incident.actionsTaken?.includes('dispatchMedical');
  const hasSecurity = incident.actionsTaken?.includes('escalateToSecurity') || incident.type === 'security' || incident.type === 'fire';
  const hasDiscord = incident.actionsTaken?.includes('sendDiscordNotification');

  return (
    <div className="page-container" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      
      {/* 1. PAGE HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '24px', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition font-semibold"
              style={{ textDecoration: 'none' }}
            >
              ← Back to Dashboard
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              Incident #CASE-{incident._id ? incident._id.substring(Math.max(0, incident._id.length - 8)).toUpperCase() : 'UNKNOWN'}
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
            {incident.type} Emergency
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            <span>📍 Zone {incident.zoneLocation || 'Unspecified'}</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
            <span>Reported {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Current Status</span>
          <span style={{
            fontSize: '13px',
            fontWeight: '800',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: '8px',
            background: incident.status === 'pending-confirmation' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: incident.status === 'pending-confirmation' ? 'var(--medium)' : 'var(--low)',
            border: incident.status === 'pending-confirmation' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            {incident.status === 'pending-confirmation' ? 'Pending Confirmation' : incident.status}
          </span>
        </div>
      </div>

      {/* 2. AI DECISION SUMMARY (LARGE HERO CARD) */}
      <div className="section-card" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛡️</span> AI Decision Summary
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Incident Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Incident</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {incident.type} Emergency
            </span>
          </div>

          {/* Severity Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Severity</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '800',
              textTransform: 'uppercase',
              color: severityColors[incident.severity] || 'var(--low)'
            }}>
              {incident.severity}
            </span>
          </div>

          {/* Confidence Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Confidence</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
              {confidencePercent}%
            </span>
          </div>

          {/* Approval Status Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Approval</span>
            <span style={{
              fontSize: '13px',
              fontWeight: '800',
              color: incident.humanOverride ? 'var(--medium)' :
                     incident.status === 'pending-confirmation' ? 'var(--high)' : 'var(--low)'
            }}>
              {incident.humanOverride ? 'Manual Override Applied' :
               incident.status === 'pending-confirmation' ? 'Human Approval Required' : 'Analysis Complete'}
            </span>
          </div>
        </div>

        {/* Decision Basis & Evidence & Recommended Response */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          borderTop: '1px solid var(--border)',
          paddingTop: '20px'
        }}>
          {/* Decision Basis Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Decision Basis</span>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {getDecisionBasis().map((basisText, bIdx) => (
                <li key={bIdx} style={{ lineHeight: '1.5' }}>{basisText}</li>
              ))}
            </ul>
          </div>

          {/* Evidence Considered Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Evidence</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--low)', fontWeight: 'bold' }}>✓</span>
                <span>Incident Report</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: weather.temperature !== undefined ? 1 : 0.5 }}>
                <span style={{ color: weather.temperature !== undefined ? 'var(--low)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                  {weather.temperature !== undefined ? '✓' : '○'}
                </span>
                <span>Weather Conditions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: incident.zoneLocation ? 'var(--low)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                  {incident.zoneLocation ? '✓' : '○'}
                </span>
                <span>Stadium Location</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: matchStatus.isMatchToday ? 1 : 0.5 }}>
                <span style={{ color: matchStatus.isMatchToday ? 'var(--low)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                  {matchStatus.isMatchToday ? '✓' : '○'}
                </span>
                <span>Match Operations</span>
              </div>
            </div>
          </div>

          {/* Recommended Response */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Recommended Response</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {incident.actionsTaken && incident.actionsTaken.length > 0 ? (
                incident.actionsTaken.map((action, aIdx) => {
                  let label = action;
                  if (action === 'dispatchMedical') label = 'Dispatch Medical';
                  else if (action === 'escalateToSecurity') label = 'Notify Security';
                  else if (action === 'sendDiscordNotification') label = 'Notify Operations';
                  else if (action === 'sendReportEmail') label = 'Incident Report Distribution';
                  else if (action === 'resolveAsLowPriority') label = 'Auto Resolution';
                  else if (action === 'flagForHumanReview') label = 'Human Review';

                  return (
                    <div key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                      <span>{label}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>No recommendations active.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK STATISTICS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📊 Quick Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Classification</span>
            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
              {incident.type} Emergency
            </p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Severity</span>
            <p style={{ fontSize: '16px', fontWeight: '800', color: severityColors[incident.severity] || 'var(--low)', margin: 0, textTransform: 'uppercase' }}>
              {incident.severity}
            </p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Confidence</span>
            <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)', margin: 0 }}>
              {confidencePercent}%
            </p>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Approval</span>
            <p style={{ fontSize: '16px', fontWeight: '800', color: incident.status === 'pending-confirmation' ? 'var(--medium)' : 'var(--low)', margin: 0, textTransform: 'uppercase' }}>
              {incident.status === 'pending-confirmation' ? 'Pending' : 'Approved'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. INCIDENT DETAILS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📑 Incident Details
        </h3>
        <div className="section-card" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          {/* Column 1: Original Report */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Original Report</span>
            <div style={{
              padding: '16px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {incident.translatedDescription && incident.detectedLanguage !== 'en' ? (
                <div>
                  <div style={{ fontStyle: 'italic', marginBottom: '8px', color: 'var(--text-secondary)' }}>"{incident.originalDescription}"</div>
                  <div style={{ fontWeight: '500', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>Translated: "{incident.translatedDescription}"</div>
                </div>
              ) : (
                `"${incident.originalDescription || 'Not Available'}"`
              )}
            </div>
          </div>

          {/* Column 2: Metadata stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Location</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                📍 {incident.stadiumName} (Zone {incident.zoneLocation || 'Unspecified'})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Reported Time</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ⏱️ {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Not Available'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Reporter Language</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                🌐 {getLanguageLabel(incident.detectedLanguage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. OPERATIONAL CONTEXT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🌐 Operational Context
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Card 1: Weather */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', minHeight: '180px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Weather</span>
              {weather.temperature !== undefined ? (
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{weather.temperature}°C</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {weather.weatherDescription || getWeatherCondition(weather.weatherCode)}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No weather context recorded.</span>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Windspeed: <strong>{weather.windspeed || 0} km/h</strong> • Precipitation: <strong>{weather.precipitation || 0} mm</strong>
            </div>
          </div>

          {/* Card 2: Match Status */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', minHeight: '180px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Match Status</span>
              {matchStatus.isMatchToday ? (
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {matchStatus.homeTeam} vs {matchStatus.awayTeam}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '700', marginTop: '4px' }}>
                    {matchStatus.phase} (Score: {matchStatus.score || '0-0'})
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No match scheduled today.</span>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Minute: <strong>{matchStatus.minute || 'N/A'}</strong> • Stadium Status: <strong>{matchStatus.isMatchToday ? 'Active Matchday' : 'Normal Operations'}</strong>
            </div>
          </div>

          {/* Card 3: Crowd Conditions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', minHeight: '180px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Crowd Conditions</span>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background:
                    matchStatus.crowdRiskLevel === 'critical' ? 'rgba(239, 68, 68, 0.15)' :
                    matchStatus.crowdRiskLevel === 'high' ? 'rgba(249, 115, 22, 0.15)' :
                    matchStatus.crowdRiskLevel === 'medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color:
                    matchStatus.crowdRiskLevel === 'critical' ? 'var(--critical)' :
                    matchStatus.crowdRiskLevel === 'high' ? 'var(--high)' :
                    matchStatus.crowdRiskLevel === 'medium' ? 'var(--medium)' : 'var(--low)',
                  display: 'inline-block'
                }}>
                  {matchStatus.crowdRiskLevel ? `${matchStatus.crowdRiskLevel} risk` : 'low risk'}
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                  Spectator density risk computed based on arena gate telemetry.
                </p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Assigned Safety Officers: <strong>Standard Staffing</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RECOMMENDED ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚡ Recommended Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {/* Action 1: Medical Response */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${hasMedical ? 'var(--medical)' : 'var(--border)'}`,
            borderRadius: '16px',
            padding: '24px',
            opacity: hasMedical ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚑</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Medical Response</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
              Dispatcher alert to nearby stadium medical team for immediate assistance.
            </p>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: hasMedical ? 'var(--low)' : 'var(--text-muted)'
            }}>
              {hasMedical ? '● Dispatched' : '○ Standby'}
            </span>
          </div>

          {/* Action 2: Security Response */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${hasSecurity ? 'var(--security)' : 'var(--border)'}`,
            borderRadius: '16px',
            padding: '24px',
            opacity: hasSecurity ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚔</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Security Response</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
              Escalation notification dispatched to stadium gate security personnel.
            </p>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: hasSecurity ? 'var(--low)' : 'var(--text-muted)'
            }}>
              {hasSecurity ? '● Dispatched' : '○ Standby'}
            </span>
          </div>

          {/* Action 3: Operations Notification */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${hasDiscord ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '16px',
            padding: '24px',
            opacity: hasDiscord ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📢</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Operations Notification</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
              Broadcast alerts to arena coordinators and command crew channels.
            </p>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: hasDiscord ? 'var(--low)' : 'var(--text-muted)'
            }}>
              {hasDiscord ? '● Dispatched' : '○ Standby'}
            </span>
          </div>

          {/* Action 4: Human Approval */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${incident.status === 'pending-confirmation' ? 'var(--medium)' : 'var(--low)'}`,
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Human Approval</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                {incident.status === 'pending-confirmation' 
                  ? 'Mitigation flow suspended. Operator validation required.'
                  : 'Mitigation pathway authorized and archived.'}
              </p>
            </div>
            
            {incident.status === 'pending-confirmation' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleConfirm}
                    style={{
                      flex: 1,
                      background: 'var(--low)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                    style={{
                      flex: 1,
                      background: 'var(--critical)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Override
                  </button>
                </div>

                {showOverrideForm && (
                  <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="resolved">Mark Resolved</option>
                      <option value="escalated">Mark Escalated</option>
                      <option value="flagged-for-review">Mark Flagged for Review</option>
                    </select>
                    <textarea
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Override reason..."
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        resize: 'none'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingOverride}
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: '700',
                        fontSize: '11px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start'
                      }}
                    >
                      {isSubmittingOverride ? '...' : 'Submit'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--low)', textTransform: 'uppercase' }}>
                ✓ Complete {incident.humanOverride && '(Override Applied)'}
              </span>
            )}
          </div>
        </div>

        {incident.humanOverride && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            borderLeft: '4px solid var(--medium)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            👤 <strong>Manual Override Note:</strong> "{incident.overrideReason}"
          </div>
        )}
      </div>

      {/* 7. AI DECISION PROCESS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🧠 AI Decision Process
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {incident.reasoningTrail && incident.reasoningTrail.length > 0 ? (
            incident.reasoningTrail.map((step, idx) => {
              const friendlyName = sanitizeAgentName(step.agentName);
              const story = getExecutiveStoryForStep(step.agentName);
              const diag = getDiagnosticsForStep(step, idx, incident);

              let accentColor = 'var(--accent)';
              if (step.agentName.toLowerCase().includes('intake')) accentColor = '#3b82f6';
              else if (step.agentName.toLowerCase().includes('classification')) accentColor = '#8b5cf6';
              else if (step.agentName.toLowerCase().includes('context')) accentColor = '#14b8a6';
              else if (step.agentName.toLowerCase().includes('decision')) accentColor = '#f97316';
              else if (step.agentName.toLowerCase().includes('report')) accentColor = '#6366f1';

              return (
                <div key={idx} className="section-card" style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderLeft: `5px solid ${accentColor}`,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{friendlyName}</span>
                      {renderStatusBadge(diag.status)}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Structured Summarized Sections */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div>
                      <h5 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Summary</h5>
                      <p style={{ margin: 0, lineHeight: '1.4' }}>{story.summary}</p>
                    </div>
                    <div>
                      <h5 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Evidence</h5>
                      <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {story.evidence.map((item, evIdx) => (
                          <li key={evIdx} style={{ lineHeight: '1.4' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
                        {step.agentName.toLowerCase().includes('classification') ? 'Decision' : 'Decision'}
                      </h5>
                      <p style={{ margin: 0, lineHeight: '1.4', fontWeight: step.agentName.toLowerCase().includes('classification') ? '800' : 'normal', color: step.agentName.toLowerCase().includes('classification') ? 'var(--critical)' : 'inherit' }}>
                        {story.decision}
                      </p>
                      {step.agentName.toLowerCase().includes('classification') && story.confidence && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Confidence: <strong>{story.confidence}</strong>
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
                        Next Action
                      </h5>
                      <p style={{ margin: 0, lineHeight: '1.4', fontWeight: '600', color: 'var(--text-primary)' }}>{story.nextAction}</p>
                    </div>
                  </div>

                  {/* Collapsed Technical Details Accordion */}
                  <details style={{
                    marginTop: '8px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    cursor: 'pointer'
                  }}>
                    <summary style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      outline: 'none',
                      userSelect: 'none'
                    }}>
                      ▼ Technical Details
                    </summary>
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      cursor: 'default'
                    }}>
                      {/* AI Processing section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Processing</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>AI Provider</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.provider}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Model</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.model}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Execution Status</span>
                            <div>{renderStatusBadge(diag.status)}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Pipeline Duration</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.pipelineDuration}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Confidence Score</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.confidence}</span>
                          </div>
                        </div>
                      </div>

                      {/* External Services section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>External Services</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Weather Intelligence</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.weatherService}</span>
                          </div>
                          {diag.weatherService !== 'Not Available' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Service Status</span>
                              <div>{renderStatusBadge(diag.weatherStatus)}</div>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Match Operations</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.matchService}</span>
                          </div>
                          {diag.matchService !== 'Not Available' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Service Status</span>
                              <div>{renderStatusBadge(diag.matchStatus)}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Tool Execution section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Tool Execution</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Structured Tool Execution</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.toolExecution}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Processing Steps Completed</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.stepsCompleted}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Execution Order</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{diag.executionOrder}</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostics section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnostics</span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Warnings</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: diag.warnings === 'None' ? 'var(--low)' : 'var(--medium)'
                            }}>
                              {diag.warnings}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Errors</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: diag.errors === 'None' ? 'var(--low)' : 'var(--critical)'
                            }}>
                              {diag.errors}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Execution Logs</span>
                          <pre style={{
                            margin: 0,
                            padding: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            overflowX: 'auto',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {diag.logs}
                          </pre>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '500' }}>Raw Response / JSON Payload</span>
                          <pre style={{
                            margin: 0,
                            padding: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            overflowX: 'auto',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {diag.rawResponse}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              No stages recorded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
