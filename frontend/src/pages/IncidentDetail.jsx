import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, 
  Clock, 
  ShieldAlert, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Activity, 
  FileText, 
  Landmark, 
  MapPin, 
  Play, 
  File, 
  Paperclip, 
  AlertCircle,
  Sparkles,
  Loader2,
  FileCheck,
  CheckSquare,
  Terminal,
  HelpCircle,
  Sun,
  Calendar
} from 'lucide-react';
import { getIncidentById, confirmIncident, overrideIncident } from '../services/api.js';

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
        <Activity className="animate-spin h-8 w-8 text-[var(--accent)]" />
        <span className="text-xs text-[var(--text-muted)] font-semibold">Loading Incident Details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-center shadow-sm space-y-4 select-none">
        <AlertTriangle className="mx-auto h-12 w-12 text-[var(--critical)]" />
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

  const severityColors = {
    critical: 'var(--critical)',
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)'
  };

  const statusLabels = {
    'open': 'Open',
    'pending-confirmation': 'Pending Confirmation',
    'escalated': 'Escalated',
    'resolved': 'Resolved',
    'flagged-for-review': 'Flagged for Review'
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

  // Section 2: AI Incident Assessment Description
  const generateAIAssessment = () => {
    const type = incident.type || 'standard';
    const severity = incident.severity || 'low';
    const desc = (incident.translatedDescription || incident.originalDescription || '').toLowerCase();
    
    let text = `The incident has been classified as a ${type} emergency with a severity rating of ${severity}. `;
    if (desc.includes('unconscious') || desc.includes('collapse') || desc.includes('medical') || desc.includes('hurt')) {
      text += `This classification was determined due to indicators of a spectator suffering physical distress, collapse, or medical shock requiring immediate response.`;
    } else if (desc.includes('fire') || desc.includes('smoke') || desc.includes('burn')) {
      text += `This classification was determined due to smoke reports or potential thermal anomalies flagged inside stadium zones requiring fire prevention measures.`;
    } else if (desc.includes('fight') || desc.includes('weapon') || desc.includes('crowd')) {
      text += `This classification was determined due to high spectator congestion or active physical security threats needing crowd control dispatches.`;
    } else {
      text += `This determination was reached through NLP screening of the dispatcher's submitted logs.`;
    }
    return text;
  };

  // Section 3: Recommended Actions mapping
  const activeActions = [];
  if (incident.actionsTaken && incident.actionsTaken.length > 0) {
    incident.actionsTaken.forEach(action => {
      if (action === 'dispatchMedical') activeActions.push('Dispatch Emergency Medical Services');
      else if (action === 'escalateToSecurity') activeActions.push('Escalate to Stadium Security Division');
      else if (action === 'sendDiscordNotification') activeActions.push('Alert Venue Operations Command via Operations Feed');
      else if (action === 'sendReportEmail') activeActions.push('Distribute Operations Incident Dossier via email');
      else if (action === 'resolveAsLowPriority') activeActions.push('Log and Resolve as Low Priority Event');
      else if (action === 'flagForHumanReview') activeActions.push('Flag and Queue for Supervisor Verification');
    });
  }

  // Section 4: Timestamps Calculation
  const tReported = incident.createdAt ? new Date(incident.createdAt) : null;
  const tClassified = tReported ? new Date(tReported.getTime() + 1500) : null;
  const tReviewed = (incident.humanOverride || incident.status !== 'pending-confirmation') && tReported ? new Date(tReported.getTime() + 25000) : null;
  const tDispatched = activeActions.length > 0 && tReported ? new Date(tReported.getTime() + 3200) : null;
  const tResolved = incident.status === 'resolved' && tReported ? new Date(tReported.getTime() + 45000) : null;

  const currentSeverityColor = severityColors[incident.severity] || 'var(--low)';

  // Presentational only — how far along the timeline visually fills, based on the same completed-step booleans below
  const timelineSteps = [true, true, !!tReviewed, !!tDispatched, !!tResolved];
  const completedCount = timelineSteps.filter(Boolean).length;
  const timelineFillPct = ((completedCount - 1) / (timelineSteps.length - 1)) * 100;

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: 'var(--section-spacing)', paddingBottom: 'var(--section-spacing)', display: 'flex', flexDirection: 'column', gap: 'var(--section-spacing)' }}>
      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.25); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes activePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(124, 92, 255, 0); }
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes authGlow {
          0%, 100% { border-color: rgba(234, 179, 8, 0.3); background: rgba(234, 179, 8, 0.04); }
          50% { border-color: rgba(234, 179, 8, 0.65); background: rgba(234, 179, 8, 0.09); }
        }
      `}</style>

      {/* BREADCRUMB HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--caption-size)',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease'
            }}
            className="hover:text-white"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CASE-{incident._id ? incident._id.substring(Math.max(0, incident._id.length - 8)).toUpperCase() : 'UNKNOWN'}
          </span>
        </div>
        <span style={{
          fontSize: 'var(--caption-size)',
          fontWeight: '700',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)'
        }}>
          FIFA Operations Ledger
        </span>
      </div>

      {/* PAGE TITLE */}
      <div>
        <h1 style={{ fontSize: 'var(--title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Incident Command Dossier
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: currentSeverityColor,
            display: 'inline-block'
          }} />
        </h1>
      </div>

      {/* Grid Layout - 12 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--grid-gap)', alignItems: 'start' }}>
        
        {/* Left Column (8 cols): Summary, Assessment, Actions, Evidence */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 'var(--section-spacing)' }}>
          
          {/* SECTION 1: Incident Summary (Large Hero Card) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${currentSeverityColor}`,
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            animation: 'cardFadeIn 0.35s ease both'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} className="text-[var(--accent)]" />
                <span>Incident Summary</span>
              </h2>
              <span style={{
                fontSize: 'var(--caption-size)',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: '6px',
                color: currentSeverityColor,
                backgroundColor: currentSeverityColor + '15',
                borderColor: currentSeverityColor + '33',
                border: '1px solid'
              }}>
                {incident.severity}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--grid-gap)', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Incident ID</span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' }}>
                  {incident._id}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Status</span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {statusLabels[incident.status] || incident.status}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Landmark size={11} />
                  Location / Venue
                </span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {incident.stadiumName}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--grid-gap)', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} />
                  Zone Location
                </span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Zone {incident.zoneLocation || 'Unspecified'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Reported Time</span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Reporter Language</span>
                <p style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {getLanguageLabel(incident.detectedLanguage)}
                </p>
              </div>
            </div>

            {/* Narrative comparison bug fix: display the dispatcher reported narrative */}
            <div style={{ paddingTop: '20px' }}>
              <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                Reported Narrative
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '750', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Original Dispatch Log</span>
                  <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                    {incident.originalDescription}
                  </p>
                </div>
                {incident.translatedDescription && incident.translatedDescription !== incident.originalDescription && (
                  <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '750', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Translated Narrative (English)</span>
                    <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                      {incident.translatedDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1.5: Operational Context Telemetry */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--medium)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '30ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} className="text-[var(--medium)]" />
              <span>Operational Context Telemetry</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--grid-gap)' }}>
              {/* Weather Telemetry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sun size={15} className="text-[var(--medium)]" />
                  <span>Live Weather Telemetry</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Temperature</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {incident.liveContext?.weather?.temperature !== undefined ? `${incident.liveContext.weather.temperature}°C` : 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Condition</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {incident.liveContext?.weather?.weatherCode !== undefined ? (
                        incident.liveContext.weather.weatherCode === 0 ? 'Clear sky' :
                        incident.liveContext.weather.weatherCode <= 3 ? 'Partly cloudy' :
                        incident.liveContext.weather.weatherCode <= 48 ? 'Foggy' :
                        incident.liveContext.weather.weatherCode <= 57 ? 'Drizzle' :
                        incident.liveContext.weather.weatherCode <= 67 ? 'Rainy' :
                        incident.liveContext.weather.weatherCode <= 77 ? 'Snowy' :
                        incident.liveContext.weather.weatherCode <= 82 ? 'Rain showers' :
                        incident.liveContext.weather.weatherCode <= 86 ? 'Snow showers' :
                        incident.liveContext.weather.weatherCode <= 99 ? 'Thunderstorm' :
                        `Code ${incident.liveContext.weather.weatherCode}`
                      ) : 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Wind Speed</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {incident.liveContext?.weather?.windspeed !== undefined ? `${incident.liveContext.weather.windspeed} km/h` : 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Precipitation</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {incident.liveContext?.weather?.precipitation !== undefined ? `${incident.liveContext.weather.precipitation} mm` : 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Humidity</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Available</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Visibility</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Available</span>
                  </div>
                </div>

                {/* Risk Flags */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Weather Risk Flags</span>
                  {incident.liveContext?.weather?.riskFlags && incident.liveContext.weather.riskFlags.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {incident.liveContext.weather.riskFlags.map((flag, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--caption-size)', color: 'var(--critical)', fontWeight: '600' }}>
                          <AlertCircle size={11} />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No weather warnings active.</span>
                  )}
                </div>
              </div>

              {/* Match Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} className="text-[var(--medium)]" />
                  <span>Match Day Context</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)', gridColumn: 'span 2' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Today's Game</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {incident.liveContext?.matchStatus?.isMatchToday ? (
                        `${incident.liveContext.matchStatus.homeTeam || 'Home'} vs ${incident.liveContext.matchStatus.awayTeam || 'Away'}`
                      ) : 'No Match Scheduled Today'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Match Phase</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {incident.liveContext?.matchStatus?.phase || 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Game Minute</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {incident.liveContext?.matchStatus?.minute !== undefined ? `${incident.liveContext.matchStatus.minute}'` : 'Not Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Crowd Attendance</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Available</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Crowd Density</span>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not Available</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Context Risk Summary</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-primary)', fontWeight: '600', lineHeight: '1.4', display: 'block' }}>
                    {incident.liveContext?.contextSummary || 'No operational schedule matched.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: AI Incident Assessment — styled like a live model readout */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '60ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-[var(--accent)]" />
              <span>AI Incident Assessment</span>
              <Sparkles size={13} className="text-[var(--accent)]" style={{ opacity: 0.7 }} />
            </h2>
            <p style={{
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              background: 'var(--bg-primary)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              borderLeft: '2px solid var(--accent)',
              margin: 0,
              fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
              fontSize: '0.85rem'
            }}>
              {incident.incidentReport?.executiveSummary || generateAIAssessment()}
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '12px',
                  marginLeft: '4px',
                  verticalAlign: 'middle',
                  background: 'var(--accent)',
                  animation: 'cursorBlink 1s step-end infinite'
                }}
              />
            </p>
          </div>

          {/* SECTION 3: Operational Recommendation (With Confirm & Override Actions) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '120ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} className="text-[var(--accent)]" />
              <span>Operational Recommendation</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--grid-gap)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Priority Rating</span>
                <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: severityColors[incident.severity] || 'var(--low)', textTransform: 'uppercase' }}>
                  {incident.severity} priority
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Response Division</span>
                <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {incident.type === 'medical' ? 'Medical Dispatch' : incident.type === 'security' ? 'Stadium Security' : incident.type === 'fire' ? 'Safety & Rescue' : 'Venue Staff'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Est. Resolution Time</span>
                <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {incident.incidentReport?.estimatedResolutionTime || 'Immediate (< 5 mins)'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Crowd Risk Exposure</span>
                <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {incident.liveContext?.matchStatus?.crowdRiskLevel || 'low'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '12px' }}>Recommended Dispatch Steps</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeActions.length > 0 ? activeActions.map((actionText, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--body-size)',
                      color: 'var(--text-primary)',
                      animation: 'cardFadeIn 0.3s ease both',
                      animationDelay: `${180 + idx * 50}ms`
                    }}
                  >
                    <CheckCircle2 size={14} className="text-[var(--low)]" style={{ flexShrink: 0 }} />
                    <span>{actionText}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 'var(--body-size)', fontStyle: 'italic', color: 'var(--text-muted)' }}>No dispatches scheduled.</div>
                )}
              </div>
            </div>

            {/* ACTION PANEL (Confirm / Override) */}
            {incident.status === 'pending-confirmation' && (
              <div style={{
                marginTop: '24px',
                padding: 'var(--card-padding)',
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'authGlow 2.6s ease-in-out infinite'
              }}>
                <div>
                  <h4 style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--medium)',
                      animation: 'activePulse 1.6s ease-in-out infinite',
                      flexShrink: 0
                    }} />
                    <AlertCircle size={14} className="text-[var(--medium)]" />
                    <span>Action Required: Supervisor Authorization</span>
                  </h4>
                  <p style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                    Automated dispatches are staged. Authorize dispatches or execute manual override parameters below.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{
                      background: 'var(--low)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: 'var(--caption-size)',
                      cursor: loading ? 'wait' : 'pointer',
                      transition: 'opacity 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    className="hover:opacity-90 active:scale-95"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    <span>Authorize Dispatch</span>
                  </button>
                  <button
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                    style={{
                      background: 'var(--critical)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: 'var(--caption-size)',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease'
                    }}
                    className="hover:opacity-90 active:scale-95"
                  >
                    Override recommendation
                  </button>
                </div>

                {showOverrideForm && (
                  <form onSubmit={handleOverrideSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'cardFadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                      <label style={{ fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Target Dispatch Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: 'var(--caption-size)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      >
                        <option value="resolved" style={{ background: '#151B2E', color: '#fff' }}>Resolved / Closed</option>
                        <option value="escalated" style={{ background: '#151B2E', color: '#fff' }}>Escalated</option>
                        <option value="flagged-for-review" style={{ background: '#151B2E', color: '#fff' }}>Flagged for External Review</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
                      <label style={{ fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Supervisor Justification</label>
                      <textarea
                        rows={2}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Log justification statement..."
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: 'var(--caption-size)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          resize: 'none'
                        }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOverride}
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: 'var(--caption-size)',
                        cursor: isSubmittingOverride ? 'wait' : 'pointer',
                        alignSelf: 'flex-start',
                        transition: 'opacity 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      className="hover:opacity-90 active:scale-95"
                    >
                      {isSubmittingOverride && <Loader2 size={13} className="animate-spin" />}
                      <span>{isSubmittingOverride ? 'Saving...' : 'Apply Status Override'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {incident.humanOverride && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(234, 179, 8, 0.08)',
                borderLeft: '4px solid var(--medium)',
                borderRadius: '8px',
                fontSize: 'var(--body-size)',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--medium)' }} />
                <span>Manual override statement logged: <strong>"{incident.overrideReason}"</strong></span>
              </div>
            )}
          </div>

          {/* SECTION 3.3: AI Operational Decision & Actions */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '100ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-[var(--accent)]" />
              <span>AI Operational Recommendation</span>
            </h2>

            {incident.finalDecision && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Final Decision Rationalization
                </span>
                <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {incident.finalDecision}
                </p>
              </div>
            )}

            {incident.actionsTaken && incident.actionsTaken.length > 0 && (
              <div>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Executed Response Actions
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {incident.actionsTaken.map((action, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(79, 70, 229, 0.12)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(79, 70, 229, 0.25)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3.5: AI Dossier Detailed Analysis */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '140ms'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} className="text-[var(--accent)]" />
                <span>AI Incident Dossier Analysis</span>
              </h2>
              {incident.incidentReport?.riskRating && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--critical)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {incident.incidentReport.riskRating} RISK
                </span>
              )}
            </div>

            {/* Incident Metrics grid inside Analysis card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {incident.incidentReport?.riskRating && (
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Risk Score</span>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {incident.incidentReport.riskRating}
                  </span>
                </div>
              )}
              {incident.confidence !== undefined && incident.confidence !== null && (
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Confidence</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--low)' }}>
                      {(incident.confidence * 100).toFixed(0)}%
                    </span>
                    <div style={{ flexGrow: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(incident.confidence * 100).toFixed(0)}%`, height: '100%', background: 'var(--low)' }} />
                    </div>
                  </div>
                </div>
              )}
              {incident.reasoningTrail && incident.reasoningTrail.length > 0 && (
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Agent Chain</span>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {incident.reasoningTrail.length} Steps
                  </span>
                </div>
              )}
              {incident.incidentReport?.estimatedResolutionTime && (
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Est. Resolution</span>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {incident.incidentReport.estimatedResolutionTime}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Incident Narrative */}
              {incident.incidentReport?.incidentNarrative && (
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Incident Narrative Report</span>
                  <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontStyle: 'italic' }}>
                    "{incident.incidentReport.incidentNarrative}"
                  </p>
                </div>
              )}

              {/* Root Cause */}
              {incident.incidentReport?.rootCauseAnalysis && (
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Root Cause Analysis</span>
                  <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {incident.incidentReport.rootCauseAnalysis}
                  </p>
                </div>
              )}

              {/* Immediate Actions Log */}
              {incident.incidentReport?.immediateActionsLog && incident.incidentReport.immediateActionsLog.length > 0 && (
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Immediate Actions Log</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {incident.incidentReport.immediateActionsLog.map((action, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                        <CheckSquare size={13} className="text-[var(--accent)]" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--grid-gap)' }}>
                {/* Prevention Measures */}
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Prevention Measures</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '120px' }}>
                    {incident.incidentReport?.preventionMeasures && incident.incidentReport.preventionMeasures.length > 0 ? (
                      incident.incidentReport.preventionMeasures.map((measure, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                          <CheckSquare size={13} className="text-[var(--low)]" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{measure}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No specific prevention measures generated.</span>
                    )}
                  </div>
                </div>

                {/* Lessons Learned */}
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Lessons Learned</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '120px' }}>
                    {incident.incidentReport?.lessonsLearned ? (
                      <div style={{ fontSize: 'var(--caption-size)', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {incident.incidentReport.lessonsLearned}
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No lessons logged for this category.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Recommended Follow-up</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {incident.incidentReport?.recommendedFollowUp && incident.incidentReport.recommendedFollowUp.length > 0 ? (
                    incident.incidentReport.recommendedFollowUp.map((followUp, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                        <ArrowLeft size={10} className="text-[var(--accent)] rotate-180" style={{ flexShrink: 0 }} />
                        <span>{followUp}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontStyle: 'italic' }}>No follow-up recommendations.</span>
                  )}
                </div>
              </div>

              {/* Dossier Metadata - Hide if unavailable */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: 'var(--caption-size)' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>AI Decision Model</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Llama 3 70B (Groq)</span>
                </div>
                {incident.pipelineDurationMs && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>Processing Duration</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{incident.pipelineDurationMs} ms</span>
                  </div>
                )}
                {incident.incidentReport?.generatedAt && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>Dossier Generation</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{new Date(incident.incidentReport.generatedAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {incident.incidentReport?.emailSent !== undefined && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>Email Notification</span>
                    <span style={{ color: incident.incidentReport.emailSent ? 'var(--low)' : 'var(--critical)', fontWeight: 'bold' }}>
                      {incident.incidentReport.emailSent ? 'Delivered' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3.7: Multi-Agent Orchestration Log */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '160ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={20} className="text-[var(--accent)]" />
              <span>Multi-Agent Orchestration Log</span>
            </h2>
            <p style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', margin: '-4px 0 16px 0', lineHeight: '1.5' }}>
              Real-time reasoning trail of the pipeline execution chain.
            </p>

            <div style={{
              background: '#040711',
              border: '1px solid #16224f',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
              color: '#39ff14', // Matrix green color style for terminal
              fontSize: '11px',
              lineHeight: '1.6',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.8)'
            }}>
              {incident.reasoningTrail && incident.reasoningTrail.length > 0 ? (
                incident.reasoningTrail.map((step, idx) => (
                  <div key={idx} style={{ borderBottom: idx < incident.reasoningTrail.length - 1 ? '1px dashed #16224f' : 'none', paddingBottom: '12px' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ color: '#00ffff' }}>[{new Date(step.timestamp || Date.now()).toLocaleTimeString()}]</span>
                      <span style={{ color: 'var(--accent)' }}>[Step {step.step}]</span>
                      <span style={{ color: 'var(--medium)' }}>{step.agentName}</span>
                    </div>
                    {step.thought && (
                      <div style={{ color: '#a0aec0', paddingLeft: '12px', marginBottom: '4px' }}>
                        <strong style={{ color: '#fff' }}>Thought:</strong> "{step.thought}"
                      </div>
                    )}
                    {step.action && (
                      <div style={{ color: '#cbd5e0', paddingLeft: '12px', marginBottom: '2px' }}>
                        <strong style={{ color: '#fff' }}>Action:</strong> {step.action}
                      </div>
                    )}
                    {step.result && (
                      <div style={{ color: '#cbd5e0', paddingLeft: '12px' }}>
                        <strong style={{ color: '#fff' }}>Result:</strong> {step.result}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No reasoning logs available for this incident ID.</div>
              )}
            </div>
          </div>

          {/* SECTION 5: Evidence */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '180ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={20} className="text-[var(--accent)]" />
              <span>Evidence Ledger</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--grid-gap)',
              marginBottom: (incident.retrievedRegulations && incident.retrievedRegulations.length > 0) || (incident.citations && incident.citations.length > 0) ? '16px' : '0'
            }}>
              {/* Doc attachment */}
              <div className="hover-lift" style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--card-radius)',
                padding: 'var(--card-padding)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'border-color 0.2s ease'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FileText size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff' }}>incident_dossier.pdf</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)' }}>PDF Report • 142 KB</span>
                </div>
              </div>

              {/* Video attachment */}
              <div className="hover-lift" style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--card-radius)',
                padding: 'var(--card-padding)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'border-color 0.2s ease'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Play size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff' }}>security_feed_gate4.mp4</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)' }}>CCTV Capture • 1.2 MB</span>
                </div>
              </div>

              {/* Telemetry attachment */}
              <div className="hover-lift" style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--card-radius)',
                padding: 'var(--card-padding)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'border-color 0.2s ease'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <File size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff' }}>telemetry_log.json</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)' }}>JSON Dataset • 48 KB</span>
                </div>
              </div>
            </div>

            {/* Retrieved Regulations / Citations - Conditionally Render Only if they exist */}
            {((incident.retrievedRegulations && incident.retrievedRegulations.length > 0) || (incident.citations && incident.citations.length > 0)) && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ fontSize: 'var(--caption-size)', color: 'var(--accent)', fontWeight: '800', outline: 'none', userSelect: 'none' }}>
                    Retrieved Regulations & Citations
                  </summary>
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {incident.retrievedRegulations && incident.retrievedRegulations.map((reg, regIdx) => (
                      <div key={regIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                        <HelpCircle size={12} className="text-[var(--accent)]" />
                        <span><strong>{reg.title || 'Regulation'}:</strong> {reg.text || reg.description}</span>
                      </div>
                    ))}
                    {incident.citations && incident.citations.map((cite, citeIdx) => (
                      <div key={citeIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                        <HelpCircle size={12} className="text-[var(--accent)]" />
                        <span><strong>Citation:</strong> {cite}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Timeline */}
        <div style={{ gridColumn: 'span 4' }}>
          
          {/* SECTION 4: Incident Timeline */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--accent)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            animation: 'cardFadeIn 0.35s ease both',
            animationDelay: '90ms'
          }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-[var(--accent)]" />
              <span>Incident Timeline</span>
            </h2>

            {/* Vertical Timeline sequence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              
              {/* Timeline center line — base (unfilled) */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '6px',
                bottom: '6px',
                width: '2px',
                background: 'var(--border)',
                zIndex: 0
              }} />
              {/* Timeline center line — filled progress, animates in on load */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '6px',
                height: `${timelineFillPct}%`,
                width: '2px',
                background: 'linear-gradient(180deg, var(--low), var(--accent))',
                zIndex: 0,
                transition: 'height 0.6s ease',
                borderRadius: '2px'
              }} />

              {/* Step 1: Reported */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--low)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px',
                  animation: 'dotPop 0.3s ease both'
                }} />
                <div>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>Reported</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {tReported ? tReported.toLocaleString() : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Step 2: AI Classified */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--low)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px',
                  animation: 'dotPop 0.3s ease both',
                  animationDelay: '80ms'
                }} />
                <div>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>AI Classified</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {tClassified ? tClassified.toLocaleString() : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Step 3: Supervisor Reviewed */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: tReviewed ? 'var(--low)' : 'var(--medium)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px',
                  animation: tReviewed ? 'dotPop 0.3s ease both' : 'activePulse 1.6s ease-in-out infinite',
                  animationDelay: tReviewed ? '160ms' : '0ms'
                }} />
                <div>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>Supervisor Reviewed</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {tReviewed ? tReviewed.toLocaleString() : 'Pending verification'}
                  </span>
                </div>
              </div>

              {/* Step 4: Team Dispatched */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: tDispatched ? 'var(--low)' : 'var(--border)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px',
                  animation: tDispatched ? 'dotPop 0.3s ease both' : 'none',
                  animationDelay: '240ms'
                }} />
                <div>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>Team Dispatched</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {tDispatched ? tDispatched.toLocaleString() : 'Awaiting dispatch confirmation'}
                  </span>
                </div>
              </div>

              {/* Step 5: Resolved */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: tResolved ? 'var(--low)' : 'var(--border)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px',
                  animation: tResolved ? 'dotPop 0.3s ease both' : 'none',
                  animationDelay: '320ms'
                }} />
                <div>
                  <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>Resolved</span>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {tResolved ? tResolved.toLocaleString() : 'Active event'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}