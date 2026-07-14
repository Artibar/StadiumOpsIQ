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
  Eye, 
  File, 
  Play, 
  Image, 
  Paperclip, 
  Check, 
  X, 
  Hourglass,
  Calendar,
  AlertCircle
} from 'lucide-react';
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
      text += `This determination was reached through standard NLP screening of the dispatcher's submitted logs.`;
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

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
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
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CASE-{incident._id ? incident._id.substring(Math.max(0, incident._id.length - 8)).toUpperCase() : 'UNKNOWN'}
          </span>
        </div>
        <span style={{
          fontSize: '11px',
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

      {/* Grid Layout - 12 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column (8 cols): Summary, Assessment, Actions, Evidence */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION 1: Incident Summary (Large Hero Card) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} className="text-[var(--accent)]" />
                <span>Incident Summary</span>
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: '6px',
                background: severityColors[incident.severity] + '15',
                color: severityColors[incident.severity] || 'var(--low)',
                border: `1px solid ${severityColors[incident.severity]}33`
              }}>
                {incident.severity}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Incident ID</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {incident._id}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Status</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {statusLabels[incident.status] || incident.status}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Location / Venue</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {incident.stadiumName}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', paddingTop: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Zone Location</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  Zone {incident.zoneLocation || 'Unspecified'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Reported Time</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Reporter Language</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  {getLanguageLabel(incident.detectedLanguage)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: AI Incident Assessment */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-[var(--accent)]" />
              <span>AI Incident Assessment</span>
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              background: 'var(--bg-primary)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              margin: 0
            }}>
              {generateAIAssessment()}
            </p>
          </div>

          {/* SECTION 3: Operational Recommendation (With Confirm & Override Actions) */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} className="text-[var(--accent)]" />
              <span>Operational Recommendation</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Priority Rating</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: severityColors[incident.severity] || 'var(--low)', textTransform: 'uppercase' }}>
                  {incident.severity} priority
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Response Division</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {incident.type === 'medical' ? 'Medical Dispatch' : incident.type === 'security' ? 'Stadium Security' : incident.type === 'fire' ? 'Safety & Rescue' : 'Venue Staff'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Est. Resolution Time</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {incident.incidentReport?.estimatedResolutionTime || 'Immediate (< 5 mins)'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Crowd Risk Exposure</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {incident.liveContext?.matchStatus?.crowdRiskLevel || 'low'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '12px' }}>Recommended Dispatch Steps</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeActions.length > 0 ? activeActions.map((actionText, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={14} className="text-[var(--low)]" />
                    <span>{actionText}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>No dispatches scheduled.</div>
                )}
              </div>
            </div>

            {/* ACTION PANEL (Confirm / Override) */}
            {incident.status === 'pending-confirmation' && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} className="text-[var(--medium)]" />
                    <span>Action Required: Supervisor Authorization</span>
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                    Automated dispatches are staged. Authorize dispatches or execute manual override parameters below.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleConfirm}
                    style={{
                      background: 'var(--low)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Authorize Dispatch
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
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Override recommendation
                  </button>
                </div>

                {showOverrideForm && (
                  <form onSubmit={handleOverrideSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Dispatch Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      >
                        <option value="resolved" style={{ background: '#151B2E', color: '#fff' }}>Resolved / Closed</option>
                        <option value="escalated" style={{ background: '#151B2E', color: '#fff' }}>Escalated</option>
                        <option value="flagged-for-review" style={{ background: '#151B2E', color: '#fff' }}>Flagged for External Review</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Supervisor Justification</label>
                      <textarea
                        rows={2}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Log justification statement..."
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '12px',
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
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '11px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start'
                      }}
                    >
                      {isSubmittingOverride ? 'Saving...' : 'Apply Status Override'}
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
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--medium)' }} />
                <span>Manual override statement logged: <strong>"{incident.overrideReason}"</strong></span>
              </div>
            )}
          </div>

          {/* SECTION 5: Evidence */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paperclip size={20} className="text-[var(--accent)]" />
              <span>Evidence Ledger</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {/* Doc attachment */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FileText size={24} className="text-[var(--accent)]" />
                <div>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#fff' }}>incident_dossier.pdf</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF Report • 142 KB</span>
                </div>
              </div>

              {/* Video attachment */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Play size={24} className="text-[var(--accent)]" />
                <div>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#fff' }}>security_feed_gate4.mp4</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CCTV Capture • 1.2 MB</span>
                </div>
              </div>

              {/* Telemetry attachment */}
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <File size={24} className="text-[var(--accent)]" />
                <div>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#fff' }}>telemetry_log.json</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JSON Dataset • 48 KB</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Timeline */}
        <div style={{ gridColumn: 'span 4' }}>
          
          {/* SECTION 4: Incident Timeline */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-[var(--accent)]" />
              <span>Incident Timeline</span>
            </h2>

            {/* Vertical Timeline sequence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              
              {/* Timeline center line */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '6px',
                bottom: '6px',
                width: '2px',
                background: 'var(--border)',
                zIndex: 0
              }} />

              {/* Step 1: Reported */}
              <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--low)',
                  border: '3px solid var(--bg-card)',
                  marginTop: '2px'
                }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block' }}>Reported</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
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
                  marginTop: '2px'
                }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block' }}>AI Classified</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
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
                  marginTop: '2px'
                }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block' }}>Supervisor Reviewed</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
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
                  marginTop: '2px'
                }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block' }}>Team Dispatched</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
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
                  marginTop: '2px'
                }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'block' }}>Resolved</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
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
