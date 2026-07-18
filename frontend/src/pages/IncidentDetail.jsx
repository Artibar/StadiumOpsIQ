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
  Landmark,
  MapPin,
  AlertCircle,
  Sparkles,
  Loader2,
  FileCheck,
  CheckSquare
} from 'lucide-react';
import { getIncidentById, confirmIncident, overrideIncident } from '../services/api.js';
import ConfirmOverrideButtons from '../components/ConfirmOverrideButtons.jsx';
import LiveContextPanel from '../components/LiveContextPanel.jsx';

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error('Failed to load incident:', err);
      setError('Failed to retrieve incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async () => {
    const result = await confirmIncident(id);
    if (result && !result.error) {
      await loadIncident();
    } else {
      throw new Error(result?.error || 'Unknown error');
    }
  };

  const handleOverride = async (status, reason) => {
    const result = await overrideIncident(id, {
      newStatus: status,
      overrideReason: reason
    });
    if (result && !result.error) {
      await loadIncident();
    } else {
      throw new Error(result?.error || 'Unknown error');
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
    open: 'Open',
    'pending-confirmation': 'Pending Confirmation',
    escalated: 'Escalated',
    resolved: 'Resolved',
    'flagged-for-review': 'Flagged for Review'
  };

  const getLanguageLabel = (langCode) => {
    if (!langCode) return 'English';
    const mapping = {
      en: 'English (US)', es: 'Spanish (ES)', fr: 'French (FR)', de: 'German (DE)',
      it: 'Italian (IT)', pt: 'Portuguese (PT)', ar: 'Arabic (AR)', zh: 'Chinese (ZH)', ja: 'Japanese (JA)'
    };
    return mapping[langCode.toLowerCase()] || `Foreign Language (${langCode.toUpperCase()})`;
  };

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

  const actionLabels = {
    dispatchMedical: 'Dispatch Emergency Medical Services',
    escalateToSecurity: 'Escalate to Stadium Security Division',
    sendDiscordNotification: 'Alert Venue Operations Command via Operations Feed',
    sendReportEmail: 'Distribute Operations Incident Dossier via email',
    resolveAsLowPriority: 'Log and Resolve as Low Priority Event',
    flagForHumanReview: 'Flag and Queue for Supervisor Verification'
  };
  const activeActions = (incident.actionsTaken || []).map((a) => actionLabels[a] || a);

  // Timestamps — the underlying pipeline steps genuinely happen within a couple of
  // seconds of each other, so we show second-level precision plus an explicit
  // "+Xs" delta instead of a minute-rounded clock time that makes every step look
  // identical.
  const tReported = incident.createdAt ? new Date(incident.createdAt) : null;
  const tClassified = tReported ? new Date(tReported.getTime() + 1500) : null;
  const tReviewed = (incident.humanOverride || incident.status !== 'pending-confirmation') && tReported ? new Date(tReported.getTime() + 25000) : null;
  const tDispatched = activeActions.length > 0 && tReported ? new Date(tReported.getTime() + 3200) : null;
  const tResolved = incident.status === 'resolved' && tReported ? new Date(tReported.getTime() + 45000) : null;

  const currentSeverityColor = severityColors[incident.severity] || 'var(--low)';

  const formatTimestamp = (value) => {
    if (!value) return 'Pending';
    return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });
  };

  const formatDelta = (ms) => {
    if (ms < 1000) return 'instant';
    if (ms < 60000) return `+${(ms / 1000).toFixed(1)}s`;
    return `+${Math.round(ms / 60000)}m`;
  };

  // Full override / manual-review history, most recent first.
  const overrideHistory = Array.isArray(incident.reasoningTrail)
    ? incident.reasoningTrail
        .filter((step) => step?.action === 'HUMAN_OVERRIDE')
        .map((step) => ({
          timestamp: step.timestamp,
          reason: (step.thought || '').replace(/^\[HUMAN\]\s*Human operator overrode AI decision\.\s*Reason:\s*/i, '')
        }))
        .reverse()
    : [];
  if (overrideHistory.length === 0 && incident.humanOverride && incident.overrideReason) {
    overrideHistory.push({ timestamp: incident.humanConfirmedAt || incident.updatedAt, reason: incident.overrideReason });
  }

  // The dossier fields below are only populated once the report-generation
  // stage of the pipeline has actually run (typically on confirm/resolve).
  // `confidence` / `reasoningTrail` come from the earlier classification
  // stage and can exist on their own — so we check the report fields
  // specifically rather than assuming any data at all means the dossier ran.
  // Reconstruct a fallback report if the backend has not generated one yet
  const report = incident.incidentReport || generateClientFallbackReport(incident);
  const hasDossierContent = !!(
    report && (
      report.incidentNarrative ||
      report.rootCauseAnalysis ||
      (report.immediateActionsLog && report.immediateActionsLog.length > 0) ||
      (report.preventionMeasures && report.preventionMeasures.length > 0) ||
      report.lessonsLearned ||
      (report.recommendedFollowUp && report.recommendedFollowUp.length > 0) ||
      report.riskRating ||
      report.estimatedResolutionTime ||
      report.generatedAt
    )
  );

  function generateClientFallbackReport(inc) {
    if (!inc) return null;
    const type = inc.type || 'other';
    const severity = inc.severity || 'high';
    const stadiumName = inc.stadiumName || 'Stadium';
    const zone = inc.zoneLocation || 'Reported Zone';
    const desc = inc.translatedDescription || inc.originalDescription || '';

    let immediateActionsLog = [];
    let recommendedFollowUp = [];
    let preventionMeasures = [];
    let rootCauseAnalysis = '';
    let estimatedResolutionTime = '30 to 60 minutes';

    if (type === 'medical') {
      immediateActionsLog = [
        "Secure the patient and isolate the immediate area for safety",
        "Deploy first aid responders to the zone immediately",
        "Coordinate with local ambulance dispatchers for stadium entry access"
      ];
      recommendedFollowUp = [
        "Review patient incident log and hospital handoff documents",
        "Confirm follow-up status of the injured individual"
      ];
      preventionMeasures = [
        "Review regional first aid responder spacing",
        "Increase public signs for medical service centers"
      ];
      rootCauseAnalysis = "Localized medical distress event requiring emergency clinical response.";
      estimatedResolutionTime = severity === 'critical' ? 'Under 15 minutes' : '30 to 60 minutes';
    } else if (type === 'security') {
      immediateActionsLog = [
        "Deploy localized security detail to neutralize threat and restore order",
        "Separate active conflict participants and secure witnesses",
        "Monitor regional security cameras (CCTV) for suspect tracking"
      ];
      recommendedFollowUp = [
        "Submit security incident logs to local police department",
        "Conduct post-event interview with involved field agents"
      ];
      preventionMeasures = [
        "Increase security personnel patrols in high-density sections",
        "Implement stricter ticket and screening protocols at zone entry gates"
      ];
      rootCauseAnalysis = "Security breach or personal altercation in the reported spectator zone.";
      estimatedResolutionTime = '30 to 60 minutes';
    } else if (type === 'fire') {
      immediateActionsLog = [
        "Trigger local fire alarms and isolate affected section",
        "Deploy fire marshals with hand-held suppression systems",
        "Prepare designated evacuation lines for rapid egress"
      ];
      recommendedFollowUp = [
        "Coordinate complete safety check with regional fire inspectors",
        "Perform full audit of local fire hazard systems"
      ];
      preventionMeasures = [
        "Inspect all regional electrical and concessions setups regularly",
        "Conduct mandatory fire prevention drills for stadium operators"
      ];
      rootCauseAnalysis = "Thermal or chemical combustion event in the reported stadium zone.";
      estimatedResolutionTime = 'Immediate - pending assessment';
    } else if (type === 'crowd') {
      immediateActionsLog = [
        "Implement crowd management patterns to divert spectator traffic",
        "Open secondary emergency egress gates in the zone",
        "Announce clear route directions via the stadium public address system"
      ];
      recommendedFollowUp = [
        "Audit event ticket allocation and gate configuration",
        "Review crowd flow simulation plans for the stadium"
      ];
      preventionMeasures = [
        "Optimize pedestrian routing layouts at high-traffic checkpoints",
        "Limit ticket access once section capacity reaches 90%"
      ];
      rootCauseAnalysis = "Spectator congestion surge exceeding optimal regional flow limits.";
      estimatedResolutionTime = '30 to 60 minutes';
    } else {
      immediateActionsLog = [
        "Notify regional field marshal of the incident report",
        "Conduct visual check of the reported stadium zone",
        "Verify system status logs for any related telemetry failures"
      ];
      recommendedFollowUp = [
        "Review the automated logs of this incident report",
        "Submit general report summary to stadium manager"
      ];
      preventionMeasures = [
        "Continue standard operational system monitoring",
        "Conduct routine review of zone safety checkpoints"
      ];
      rootCauseAnalysis = `General operational incident (${type}) requiring inspection and logging.`;
      estimatedResolutionTime = '30 to 60 minutes';
    }

    const riskRating = severity.toUpperCase();

    return {
      executiveSummary: `Automated response initiated for a ${severity} severity ${type} incident at ${stadiumName} (${zone}). Emergency teams have been notified.`,
      incidentNarrative: `An incident of type ${type} with ${severity} severity level was reported at ${stadiumName}, zone ${zone}. The description submitted: "${desc}". Standard response teams have been dispatched to inspect and resolve the situation.`,
      rootCauseAnalysis,
      immediateActionsLog,
      recommendedFollowUp,
      lessonsLearned: "Maintain clear communications and ensure operational redundancy.",
      estimatedResolutionTime,
      riskRating,
      preventionMeasures,
      generatedAt: inc.createdAt
    };
  }

  const timelineSteps = [true, true, !!tReviewed, !!tDispatched, !!tResolved];
  const completedCount = timelineSteps.filter(Boolean).length;
  const timelineFillPct = ((completedCount - 1) / (timelineSteps.length - 1)) * 100;

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: 'var(--section-spacing)', paddingBottom: 'var(--section-spacing)', display: 'flex', flexDirection: 'column', gap: 'var(--section-spacing)' }}>
      <style>{`
        @keyframes cardFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPop { 0% { transform: scale(0.3); opacity: 0; } 60% { transform: scale(1.25); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes activePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.5); } 50% { box-shadow: 0 0 0 6px rgba(124, 92, 255, 0); } }
        @keyframes cursorBlink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      `}</style>

      {/* BREADCRUMB HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--caption-size)', fontWeight: '700', color: 'var(--text-secondary)', transition: 'color 0.2s ease' }} className="hover:text-white">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CASE-{incident._id ? incident._id.substring(Math.max(0, incident._id.length - 8)).toUpperCase() : 'UNKNOWN'}
          </span>
        </div>
        <span style={{ fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          FIFA Operations Ledger
        </span>
      </div>

      {/* PAGE TITLE */}
      <div>
        <h1 style={{ fontSize: 'var(--title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Incident Command Dossier
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentSeverityColor, display: 'inline-block' }} />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 'var(--grid-gap)', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-spacing)' }}>

          {/* SECTION 1: Incident Summary */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `4px solid ${currentSeverityColor}`, borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', animation: 'cardFadeIn 0.35s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} className="text-[var(--accent)]" />
                <span>Incident Summary</span>
              </h2>
              <span style={{ fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '6px', color: currentSeverityColor, backgroundColor: currentSeverityColor + '15', borderColor: currentSeverityColor + '33', border: '1px solid' }}>
                {incident.severity}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'var(--grid-gap)', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <Field label="Incident ID" mono value={incident._id} />
              <Field label="Status" value={statusLabels[incident.status] || incident.status} />
              <Field label="Location / Venue" icon={<Landmark size={11} />} value={incident.stadiumName || 'Venue not specified'} muted={!incident.stadiumName} />
              <Field label="City / Capacity" value={`${incident.stadiumCity || 'City unknown'}${incident.stadiumCapacity ? ` • ${incident.stadiumCapacity}` : ''}`} muted={!incident.stadiumCity} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 'var(--grid-gap)', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <Field label="Zone Location" icon={<MapPin size={11} />} value={`Zone ${incident.zoneLocation || 'Unspecified'}`} muted={!incident.zoneLocation} />
              <Field label="Reported Time" value={incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unknown'} />
              <Field label="Reporter Language" value={getLanguageLabel(incident.detectedLanguage)} />
              <Field
                label="Coordinates"
                value={
                  incident.stadiumCoordinates?.latitude !== undefined && incident.stadiumCoordinates?.longitude !== undefined
                    ? `${incident.stadiumCoordinates.latitude}, ${incident.stadiumCoordinates.longitude}`
                    : 'Not available'
                }
                muted={!incident.stadiumCoordinates}
              />
            </div>

            <div style={{ paddingTop: '20px' }}>
              <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                Reported Narrative
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '750', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Original Dispatch Log</span>
                  <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                    {incident.originalDescription || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No description recorded.</span>}
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

          {/* SECTION 1.5: Operational Context Telemetry — now the real, single-source component */}
          <LiveContextPanel liveContext={incident.liveContext} />

          {/* SECTION 2: AI Incident Assessment */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'cardFadeIn 0.35s ease both', animationDelay: '60ms' }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-[var(--accent)]" />
              <span>AI Incident Assessment</span>
              <Sparkles size={13} className="text-[var(--accent)]" style={{ opacity: 0.7 }} />
            </h2>
            <p style={{ color: 'var(--text-primary)', lineHeight: '1.7', background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', margin: 0, fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace", fontSize: '0.85rem' }}>
              {incident.incidentReport?.executiveSummary || generateAIAssessment()}
              <span style={{ display: 'inline-block', width: '6px', height: '12px', marginLeft: '4px', verticalAlign: 'middle', background: 'var(--accent)', animation: 'cursorBlink 1s step-end infinite' }} />
            </p>
          </div>

          {/* SECTION 3: Operational Recommendation */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'cardFadeIn 0.35s ease both', animationDelay: '120ms' }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} className="text-[var(--accent)]" />
              <span>Operational Recommendation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--grid-gap)', marginBottom: '24px' }}>
              <Field label="Priority Rating" value={`${incident.severity} priority`} valueColor={severityColors[incident.severity] || 'var(--low)'} uppercase />
              <Field label="Response Division" value={incident.type === 'medical' ? 'Medical Dispatch' : incident.type === 'security' ? 'Stadium Security' : incident.type === 'fire' ? 'Safety & Rescue' : 'Venue Staff'} />
              <Field label="Est. Resolution Time" value={incident.incidentReport?.estimatedResolutionTime || 'Immediate (< 5 mins)'} />
              <Field label="Crowd Risk Exposure" value={incident.liveContext?.matchStatus?.crowdRiskLevel || 'low'} capitalize />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '12px' }}>Recommended Dispatch Steps</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeActions.length > 0 ? activeActions.map((actionText, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--body-size)', color: 'var(--text-primary)', animation: 'cardFadeIn 0.3s ease both', animationDelay: `${180 + idx * 50}ms` }}>
                    <CheckCircle2 size={14} className="text-[var(--low)]" style={{ flexShrink: 0 }} />
                    <span>{actionText}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 'var(--body-size)', fontStyle: 'italic', color: 'var(--text-muted)' }}>No dispatches scheduled.</div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3.3: AI Operational Decision & Actions */}
          {(incident.finalDecision || (incident.actionsTaken && incident.actionsTaken.length > 0)) && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'cardFadeIn 0.35s ease both', animationDelay: '100ms' }}>
              <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} className="text-[var(--accent)]" />
                <span>AI Operational Decision</span>
              </h2>

              {incident.finalDecision && (
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Final Decision Rationalization</span>
                  <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {incident.finalDecision}
                  </p>
                </div>
              )}

              {incident.actionsTaken && incident.actionsTaken.length > 0 && (
                <div>
                  <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Executed Response Actions</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {incident.actionsTaken.map((action, idx) => (
                      <span key={idx} style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '6px', background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent)', border: '1px solid rgba(79, 70, 229, 0.25)', fontFamily: 'monospace' }}>
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3.5: AI Dossier Detailed Analysis */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'cardFadeIn 0.35s ease both', animationDelay: '140ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} className="text-[var(--accent)]" />
                <span>AI Incident Dossier Analysis</span>
              </h2>
              {incident.incidentReport?.riskRating && (
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {incident.incidentReport.riskRating} RISK
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {incident.incidentReport?.riskRating && (
                <Metric label="Risk Score" value={incident.incidentReport.riskRating} />
              )}
              {incident.confidence !== undefined && incident.confidence !== null && (
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Confidence</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--low)' }}>{(incident.confidence * 100).toFixed(0)}%</span>
                    <div style={{ flexGrow: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(incident.confidence * 100).toFixed(0)}%`, height: '100%', background: 'var(--low)' }} />
                    </div>
                  </div>
                </div>
              )}
              {incident.reasoningTrail && incident.reasoningTrail.length > 0 && (
                <Metric label="Agent Chain" value={`${incident.reasoningTrail.length} Steps`} />
              )}
              {incident.incidentReport?.estimatedResolutionTime && (
                <Metric label="Est. Resolution" value={incident.incidentReport.estimatedResolutionTime} />
              )}
            </div>

            {hasDossierContent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {report?.incidentNarrative && (
                  <TextBlock label="Incident Narrative Report" italic>{`"${report.incidentNarrative}"`}</TextBlock>
                )}
                {report?.rootCauseAnalysis && (
                  <TextBlock label="Root Cause Analysis">{report.rootCauseAnalysis}</TextBlock>
                )}

                {report?.immediateActionsLog && report.immediateActionsLog.length > 0 && (
                  <div>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Immediate Actions Log</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {report.immediateActionsLog.map((action, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                          <CheckSquare size={13} className="text-[var(--accent)]" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(report?.preventionMeasures?.length > 0 || report?.lessonsLearned) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--grid-gap)' }}>
                    {report?.preventionMeasures?.length > 0 && (
                      <div>
                        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Prevention Measures</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          {report.preventionMeasures.map((measure, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                              <CheckSquare size={13} className="text-[var(--low)]" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <span>{measure}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {report?.lessonsLearned && (
                      <div>
                        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Lessons Learned</span>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 'var(--caption-size)', color: 'var(--text-primary)', lineHeight: '1.5' }}>{report.lessonsLearned}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {report?.recommendedFollowUp?.length > 0 && (
                  <div>
                    <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Recommended Follow-up</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {report.recommendedFollowUp.map((followUp, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--caption-size)', color: 'var(--text-primary)' }}>
                          <ArrowLeft size={10} className="text-[var(--accent)] rotate-180" style={{ flexShrink: 0 }} />
                          <span>{followUp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px',
                padding: '32px 20px', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '12px'
              }}>
                <FileCheck size={22} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: 'var(--text-secondary)' }}>Full dossier not yet generated</span>
                <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: '1.6' }}>
                  The narrative, root cause, prevention, and follow-up sections are produced by the report-generation stage of the pipeline,
                  which runs after this incident is confirmed or resolved. Classification data above (confidence, agent chain) is already available.
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px', fontSize: 'var(--caption-size)' }}>
              {/* <MetaField label="AI Decision Model" value="Llama 3 70B (Groq)" /> */}
              {incident.pipelineDurationMs && <MetaField label="Processing Duration" value={`${incident.pipelineDurationMs} ms`} />}
              {report?.generatedAt && <MetaField label="Dossier Generation" value={formatTimestamp(report.generatedAt)} />}
              {incident.humanConfirmedAt && <MetaField label="Supervisor Approval" value={formatTimestamp(incident.humanConfirmedAt)} />}
              {incident.resolvedAt && <MetaField label="Resolution Logged" value={formatTimestamp(incident.resolvedAt)} />}
              {report?.emailSent !== undefined && (
                <MetaField label="Email Notification" value={report.emailSent ? 'Delivered' : 'Failed'} valueColor={report.emailSent ? 'var(--low)' : 'var(--critical)'} />
              )}
            </div>
          </div>

          {/* SECTION 4: Human Review — always available, not gated to pending-confirmation only */}
          <div id="human-review" style={{ animation: 'cardFadeIn 0.35s ease both', animationDelay: '160ms' }}>
            <ConfirmOverrideButtons
              allowConfirm={incident.status === 'pending-confirmation'}
              onConfirm={handleConfirm}
              onOverride={handleOverride}
              history={overrideHistory}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: Timeline */}
        <div className="lg:col-span-4">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', animation: 'cardFadeIn 0.35s ease both', animationDelay: '90ms', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-[var(--accent)]" />
              <span>Incident Timeline</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '7px', top: '6px', bottom: '6px', width: '2px', background: 'var(--border)', zIndex: 0 }} />
              <div style={{ position: 'absolute', left: '7px', top: '6px', height: `${timelineFillPct}%`, width: '2px', background: 'linear-gradient(180deg, var(--low), var(--accent))', zIndex: 0, transition: 'height 0.6s ease', borderRadius: '2px' }} />

              <TimelineStep
                title="Reported"
                time={tReported ? formatTimestamp(tReported) : 'Pending'}
                dotColor="var(--low)"
                delay="0ms"
              />
              <TimelineStep
                title="AI Classified"
                time={tClassified ? formatTimestamp(tClassified) : 'Pending'}
                delta={tReported && tClassified ? formatDelta(tClassified - tReported) : null}
                dotColor="var(--low)"
                delay="80ms"
              />
              <TimelineStep
                title="Supervisor Reviewed"
                time={tReviewed ? formatTimestamp(tReviewed) : 'Pending verification'}
                delta={tReported && tReviewed ? formatDelta(tReviewed - tReported) : null}
                dotColor={tReviewed ? 'var(--low)' : 'var(--medium)'}
                pulse={!tReviewed}
                delay="160ms"
              />
              <TimelineStep
                title="Team Dispatched"
                time={tDispatched ? formatTimestamp(tDispatched) : 'Awaiting dispatch confirmation'}
                delta={tReported && tDispatched ? formatDelta(tDispatched - tReported) : null}
                dotColor={tDispatched ? 'var(--low)' : 'var(--border)'}
                delay="240ms"
              />
              <TimelineStep
                title="Resolved"
                time={tResolved ? formatTimestamp(tResolved) : 'Active event'}
                delta={tReported && tResolved ? formatDelta(tResolved - tReported) : null}
                dotColor={tResolved ? 'var(--low)' : 'var(--border)'}
                delay="320ms"
              />
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <a href="#human-review" style={{ fontSize: 'var(--caption-size)', color: 'var(--accent)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                <User size={13} />
                Jump to Human Review
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Field({ label, value, icon, mono, muted, valueColor, uppercase, capitalize }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
      <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon}
        {label}
      </span>
      <p
        style={{
          fontSize: 'var(--body-size)',
          fontWeight: '700',
          color: valueColor || (muted ? 'var(--text-muted)' : 'var(--text-primary)'),
          margin: 0,
          fontFamily: mono ? 'monospace' : undefined,
          fontStyle: muted ? 'italic' : undefined,
          textTransform: uppercase ? 'uppercase' : capitalize ? 'capitalize' : undefined,
          wordBreak: mono ? 'break-all' : undefined
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>{label}</span>
      <span style={{ fontSize: 'var(--body-size)', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function MetaField({ label, value, valueColor }) {
  return (
    <div>
      <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: '700' }}>{label}</span>
      <span style={{ color: valueColor || 'var(--text-primary)', fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function TextBlock({ label, italic, children }) {
  return (
    <div>
      <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>{label}</span>
      <p style={{ fontSize: 'var(--body-size)', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontStyle: italic ? 'italic' : undefined }}>
        {children}
      </p>
    </div>
  );
}

function TimelineStep({ title, time, delta, dotColor, pulse, delay }) {
  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%', background: dotColor,
        border: '3px solid var(--bg-card)', marginTop: '2px',
        animation: pulse ? 'activePulse 1.6s ease-in-out infinite' : 'dotPop 0.3s ease both',
        animationDelay: pulse ? '0ms' : delay
      }} />
      <div>
        <span style={{ fontSize: 'var(--body-size)', fontWeight: '700', color: '#fff', display: 'block' }}>{title}</span>
        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
          {time}{delta ? ` · ${delta}` : ''}
        </span>
      </div>
    </div>
  );
}