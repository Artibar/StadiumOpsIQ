import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Landmark, MapPin, Send, CheckCircle2, Loader2,
  HeartPulse, ShieldAlert, Users, Flame, CloudRain, Search as SearchIcon, HelpCircle,
  Hash
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

export default function IncidentForm({ stadiums, onIncidentCreated }) {
  const [incidentType, setIncidentType] = useState('');
  const [zoneLocation, setZoneLocation] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [priorityCode, setPriorityCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const refCode = React.useRef(`2026-OP-${Math.floor(100 + Math.random() * 900)}`);

  useEffect(() => {
    let timer = null;
    if (submitSuccess) {
      timer = setTimeout(() => setSubmitSuccess(null), 8000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [submitSuccess]);

  const resetForm = () => {
    setIncidentType('');
    setZoneLocation('');
    setDescription('');
    setSeverity('');
    setPriorityCode('');
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incidentType) {
      setSubmitError('Please select an incident type.');
      return;
    }
    if (!zoneLocation.trim()) {
      setSubmitError('Please specify the location zone.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please provide an incident description.');
      return;
    }
    if (!severity) {
      setSubmitError('Please select a severity level.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    const result = await createIncident({
      type: incidentType,
      zoneLocation: zoneLocation.trim(),
      description: description.trim(),
      severity,
      priorityCode: priorityCode.trim() || undefined
    });

    if (result.success) {
      setSubmitSuccess(result.incident);
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
    <section className="flex h-full flex-col justify-between" style={{ minHeight: '420px' }} aria-labelledby="form-title">
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

      <div>
        <div className="mb-6 flex items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
            >
              <AlertCircle size={15} className="text-[var(--critical)]" />
            </div>
            <h2 id="form-title" className="m-0" style={{ fontSize: 'var(--section-title-size)', fontWeight: 700 }}>
              Report Intake Dispatch
            </h2>
          </div>
          <span className="font-bold" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            REF: {refCode.current}
          </span>
        </div>

        {submitError && (
          <div
            className="mb-5 p-3.5 rounded-lg border font-semibold flex items-center gap-2"
            style={{
              fontSize: 'var(--caption-size)',
              animation: 'bannerPop 0.25s ease',
              borderColor: 'rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--critical)'
            }}
            aria-live="assertive"
          >
            <AlertCircle size={14} />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div
            className="mb-5 p-4 rounded-xl border font-semibold flex flex-col gap-2.5"
            style={{
              fontSize: 'var(--caption-size)',
              borderColor: 'var(--low)',
              background: 'rgba(34,197,94,0.08)',
              animation: 'bannerPop 0.35s ease'
            }}
            aria-live="polite"
          >
            <div className="flex items-center gap-1.5" style={{ color: 'var(--low)' }}>
              <CheckCircle2 size={15} style={{ animation: 'checkPop 0.4s ease' }} />
              <span>
                Dispatch confirmed: <strong className="capitalize">{submitSuccess.type}</strong> —{' '}
                <strong className="uppercase">{submitSuccess.severity}</strong>
              </span>
            </div>
            <Link
              to={`/incidents/${submitSuccess._id}`}
              className="hover:underline inline-flex items-center gap-1 font-bold w-fit"
              style={{ color: 'var(--accent)' }}
            >
              View Dispatch Details →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Incident Type */}
          <div>
            <label htmlFor="incident-type" className="soft-label mb-2.5 block">
              Incident Type
            </label>
            <select
              id="incident-type"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="soft-input w-full p-3"
              style={{ fontSize: 'var(--body-size)' }}
              disabled={isSubmitting}
              required
            >
              <option value="">Select incident type...</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Location Zone */}
          <div>
            <label htmlFor="zone-input" className="soft-label mb-2.5 block">
              Location Zone
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                id="zone-input"
                type="text"
                value={zoneLocation}
                onChange={(e) => setZoneLocation(e.target.value)}
                placeholder="e.g. North Gate Section A"
                className="soft-input w-full p-3 pl-9"
                style={{ fontSize: 'var(--body-size)' }}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <label htmlFor="incident-desc" className="soft-label mb-2.5 block">
              Incident Description
            </label>
            <textarea
              id="incident-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed situational summary..."
              className="soft-input w-full resize-none p-4 leading-relaxed"
              style={{ fontSize: 'var(--body-size)' }}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Severity + Priority Code */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="soft-label mb-2.5 block">Severity Level</label>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_LEVELS.map((lvl) => {
                  const active = severity === lvl.value;
                  return (
                    <button
                      type="button"
                      key={lvl.value}
                      onClick={() => setSeverity(lvl.value)}
                      disabled={isSubmitting}
                      className="font-bold uppercase transition-all duration-150"
                      style={{
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${active ? lvl.color : 'var(--border)'}`,
                        background: active ? `${lvl.color}1f` : 'rgba(9,14,25,0.9)',
                        color: active ? lvl.color : 'var(--text-secondary)'
                      }}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="priority-code" className="soft-label mb-2.5 block">
                Priority Code
              </label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="priority-code"
                  type="text"
                  value={priorityCode}
                  onChange={(e) => setPriorityCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ALPHA-01"
                  className="soft-input w-full p-3 pl-9"
                  style={{ fontSize: 'var(--body-size)' }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-all duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              style={{
                fontSize: 'var(--body-size)',
                background: 'var(--accent)',
                color: '#fff',
                letterSpacing: '0.02em'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>DISPATCHING...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>EXECUTE DISPATCH</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className="soft-button h-[46px] px-5 font-bold"
              style={{ fontSize: 'var(--body-size)' }}
            >
              CLEAR
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}