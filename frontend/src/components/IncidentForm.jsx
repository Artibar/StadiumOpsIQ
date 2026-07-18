import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, MapPin, Send, CheckCircle2, Loader2,
  HeartPulse, ShieldAlert, Users, Flame, CloudRain, Search as SearchIcon, HelpCircle,
  Hash, Landmark
} from 'lucide-react';
import { createIncident } from '../services/api.js';

const INCIDENT_TYPES = [
  { value: 'medical', label: 'Medical Emergency', icon: HeartPulse, color: 'var(--medical)' },
  { value: 'security', label: 'Security Threat', icon: ShieldAlert, color: 'var(--security)' },
  { value: 'crowd', label: 'Crowd Control', icon: Users, color: 'var(--crowd)' },
  { value: 'fire', label: 'Fire / Smoke', icon: Flame, color: 'var(--fire)' },
  { value: 'weather', label: 'Weather Hazard', icon: CloudRain, color: 'var(--weather)' },
  { value: 'lost-item', label: 'Lost Item', icon: SearchIcon, color: 'var(--lost-item)' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'var(--text-muted)' }
];

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical', color: 'var(--critical)' },
  { value: 'high', label: 'High', color: 'var(--high)' },
  { value: 'medium', label: 'Medium', color: 'var(--medium)' },
  { value: 'low', label: 'Low', color: 'var(--low)' }
];

// Fixed spacing scale — used everywhere instead of arbitrary Tailwind fractions
const SPACE = { xs: '6px', sm: '10px', md: '16px', lg: '24px', xl: '32px' };

const labelStyle = {
  display: 'block',
  fontSize: 'var(--caption-size)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-secondary)',
  marginBottom: SPACE.sm
};

const fieldWrapStyle = { marginBottom: SPACE.lg };

// Icon + input row: icon sits in the flex row itself, never absolutely
// positioned over the field, so it can never overlap the text regardless
// of input height, font-size, or line-height.
function IconInput({ icon: Icon, ...inputProps }) {
  return (
    <div
      className="soft-input"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACE.sm,
        padding: `0 ${SPACE.md}`,
        height: '46px'
      }}
    >
      <Icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input
        {...inputProps}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: 'var(--body-size)',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
}

// Normalizes a stadium entry into a stable { key, name, city } triple.
// The worldcup26.ir source returns { name_en, city_en, id, _id, ... } —
// this also tolerates plain strings or a couple of alternate field names
// so the <select> doesn't silently break if the upstream API shape shifts.
function normalizeStadium(s, idx) {
  if (typeof s === 'string') return { key: s || idx, name: s, city: '' };
  const name = s?.name_en || s?.name || s?.stadiumName || '';
  const city = s?.city_en || s?.city || '';
  const key = s?._id || s?.id || name || idx;
  return { key, name, city };
}

export default function IncidentForm({ stadiums, onIncidentCreated }) {
  const [incidentType, setIncidentType] = useState('');
  const [stadiumName, setStadiumName] = useState('');
  const [zoneLocation, setZoneLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [priorityCode, setPriorityCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const refCode = React.useRef(`2026-OP-${Math.floor(100 + Math.random() * 900)}`);

  const stadiumOptions = (stadiums || []).map(normalizeStadium).filter((s) => s.name);

  useEffect(() => {
    let timer = null;
    if (submitSuccess) {
      timer = setTimeout(() => setSubmitSuccess(null), 8000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [submitSuccess]);

  const resetForm = () => {
    setIncidentType('');
    setStadiumName('');
    setZoneLocation('');
    setDescription('');
    setSeverity('');
    setPriorityCode('');
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incidentType) { setSubmitError('Please select an incident type.'); return; }
    if (!stadiumName) { setSubmitError('Please select a stadium.'); return; }
    if (!zoneLocation.trim()) { setSubmitError('Please specify the location zone.'); return; }
    if (!description.trim()) { setSubmitError('Please provide an incident description.'); return; }
    if (!severity) { setSubmitError('Please select a severity level.'); return; }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    const result = await createIncident({
      type: incidentType,
      stadiumName,
      zoneLocation: zoneLocation.trim(),
      description: description.trim(),
      severity,
      priorityCode: priorityCode.trim() || undefined
    });

    if (result.success) {
      setSubmitSuccess(result.incident);
      setStadiumName('');
      setZoneLocation('');
      setDescription('');
      setSeverity('');
      setPriorityCode('');
      setIncidentType('');
      if (onIncidentCreated) onIncidentCreated(result.incident);
    } else {
      setSubmitError(result.error || 'An unexpected error occurred during dispatch.');
    }
    setIsSubmitting(false);
  };

  return (
    <section
      style={{
        padding: SPACE.xl,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      aria-labelledby="form-title"
    >
      <style>{`
        @keyframes bannerPop {
          from { opacity: 0; transform: scale(0.97) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes checkPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header: wraps to a stacked layout on narrow widths instead of colliding */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACE.md,
          borderBottom: '1px solid var(--border)',
          paddingBottom: SPACE.md,
          marginBottom: SPACE.lg
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.08)'
            }}
          >
            <AlertCircle size={16} style={{ color: 'var(--critical)' }} />
          </div>
          <h2
            id="form-title"
            style={{ margin: 0, fontSize: 'var(--section-title-size)', fontWeight: 700, lineHeight: 1.25 }}
          >
            Report Intake Dispatch
          </h2>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            paddingTop: '4px'
          }}
        >
          REF: {refCode.current}
        </span>
      </div>

      {submitError && (
        <div
          style={{
            marginBottom: SPACE.lg,
            padding: SPACE.md,
            borderRadius: '10px',
            border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--critical)',
            fontSize: 'var(--caption-size)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: SPACE.sm,
            animation: 'bannerPop 0.25s ease'
          }}
          aria-live="assertive"
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div
          style={{
            marginBottom: SPACE.lg,
            padding: SPACE.md,
            borderRadius: '12px',
            border: '1px solid var(--low)',
            background: 'rgba(34,197,94,0.08)',
            fontSize: 'var(--caption-size)',
            fontWeight: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACE.sm,
            animation: 'bannerPop 0.35s ease'
          }}
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, color: 'var(--low)' }}>
            <CheckCircle2 size={16} style={{ animation: 'checkPop 0.4s ease', flexShrink: 0 }} />
            <span>
              Dispatch confirmed: <strong style={{ textTransform: 'capitalize' }}>{submitSuccess.type}</strong> —{' '}
              <strong style={{ textTransform: 'uppercase' }}>{submitSuccess.severity}</strong>
            </span>
          </div>
          <Link
            to={`/incidents/${submitSuccess._id}`}
            style={{ color: 'var(--accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}
          >
            View Dispatch Details →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={fieldWrapStyle}>
          <label htmlFor="incident-type" style={labelStyle}>Incident Type</label>
          <select
            id="incident-type"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="soft-input"
            style={{ width: '100%', height: '46px', padding: `0 ${SPACE.md}`, fontSize: 'var(--body-size)' }}
            disabled={isSubmitting}
            required
          >
            <option value="">Select incident type...</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={fieldWrapStyle}>
          <label htmlFor="stadium-select" style={labelStyle}>Stadium</label>
          <select
            id="stadium-select"
            value={stadiumName}
            onChange={(e) => setStadiumName(e.target.value)}
            className="soft-input"
            style={{ width: '100%', height: '46px', padding: `0 ${SPACE.md}`, fontSize: 'var(--body-size)' }}
            disabled={isSubmitting || stadiumOptions.length === 0}
            required
          >
            <option value="">
              {stadiumOptions.length === 0 ? 'Loading stadiums...' : 'Select stadium...'}
            </option>
            {stadiumOptions.map((s) => (
              <option key={s.key} value={s.name}>
                {s.city ? `${s.name} — ${s.city}` : s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldWrapStyle}>
          <label htmlFor="zone-input" style={labelStyle}>Location Zone</label>
          <IconInput
            icon={MapPin}
            id="zone-input"
            type="text"
            value={zoneLocation}
            onChange={(e) => setZoneLocation(e.target.value)}
            placeholder="e.g. North Gate Section A"
            disabled={isSubmitting}
            required
          />
        </div>

        <div style={fieldWrapStyle}>
          <label htmlFor="incident-desc" style={labelStyle}>Incident Description</label>
          <textarea
            id="incident-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed situational summary..."
            className="soft-input"
            style={{
              width: '100%',
              resize: 'none',
              padding: SPACE.md,
              lineHeight: 1.6,
              fontSize: 'var(--body-size)',
              fontFamily: 'inherit'
            }}
            disabled={isSubmitting}
            required
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
            gap: SPACE.lg,
            marginBottom: SPACE.lg
          }}
        >
          <div>
            <label style={labelStyle}>Severity Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE.sm }}>
              {SEVERITY_LEVELS.map((lvl) => {
                const active = severity === lvl.value;
                return (
                  <button
                    type="button"
                    key={lvl.value}
                    onClick={() => setSeverity(lvl.value)}
                    disabled={isSubmitting}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '11px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${active ? lvl.color : 'var(--border)'}`,
                      background: active ? `${lvl.color}1f` : 'rgba(9,14,25,0.9)',
                      color: active ? lvl.color : 'var(--text-secondary)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="priority-code" style={labelStyle}>Priority Code</label>
            <IconInput
              icon={Hash}
              id="priority-code"
              type="text"
              value={priorityCode}
              onChange={(e) => setPriorityCode(e.target.value.toUpperCase())}
              placeholder="e.g. ALPHA-01"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: SPACE.sm, display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: '1 1 200px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: SPACE.xs,
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 'var(--body-size)',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'transform 150ms ease'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>DISPATCHING...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>EXECUTE DISPATCH</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="soft-button"
            style={{
              flex: '0 0 auto',
              minWidth: '90px',
              height: '46px',
              padding: `0 ${SPACE.lg}`,
              fontSize: 'var(--body-size)',
              fontWeight: 700
            }}
          >
            CLEAR
          </button>
        </div>
      </form>
    </section>
  );
}