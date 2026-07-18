import React, { useState } from 'react';
import { ShieldCheck, PenLine, X, AlertTriangle, Loader2, CheckCircle2, ShieldAlert, History } from 'lucide-react';

/**
 * Reusable human-in-the-loop control. Themed with the app's CSS custom
 * properties (var(--bg-card), var(--border), var(--critical) etc.) so it
 * matches every other card on the Incident Command Dossier page.
 *
 * Two modes, controlled by `allowConfirm`:
 *  - allowConfirm=true  -> "Confirm Recommendation" + "Override Decision"
 *    (incident is pending-confirmation, an AI recommendation is staged).
 *  - allowConfirm=false -> override-only. Lets a supervisor reclassify or
 *    reopen an incident after it has already moved past pending-confirmation.
 *    This is the always-on "manual human review" entry point.
 */
export default function ConfirmOverrideButtons({
  onConfirm,
  onOverride,
  allowConfirm = true,
  statusOptions = [
    { value: 'resolved', label: 'Resolved (Close case)' },
    { value: 'escalated', label: 'Escalated (Manual Dispatch)' },
    { value: 'flagged-for-review', label: 'Flagged for review' }
  ],
  history = []
}) {
  const [showOverrideForm, setShowOverrideForm] = useState(!allowConfirm);
  const [newStatus, setNewStatus] = useState(statusOptions[0]?.value || 'resolved');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmClick = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to confirm incident.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('Please provide a reason for the review decision.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onOverride(newStatus, overrideReason.trim());
      if (allowConfirm) setShowOverrideForm(false);
      setOverrideReason('');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to apply override.');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = showOverrideForm ? 'var(--critical)' : 'var(--medium)';
  const inputStyle = {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: 'var(--caption-size)',
    outline: 'none'
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderTop: `4px solid ${accentColor}`,
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes authPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes panelSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes errorShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: 'var(--section-title-size)', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--low)' }} />
          <span>{allowConfirm ? 'Incident Control Operations' : 'Human Review'}</span>
        </h2>
        {allowConfirm && !showOverrideForm && (
          <span style={{
            fontSize: 'var(--caption-size)', fontWeight: '700', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '6px', color: 'var(--medium)',
            backgroundColor: 'var(--medium)15', border: '1px solid var(--medium)33',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--medium)', animation: 'authPulse 1.6s ease-in-out infinite' }} />
            Awaiting auth
          </span>
        )}
      </div>

      <p style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
        {allowConfirm
          ? 'This incident requires manual authorization before dispatch instructions are finalised.'
          : 'A supervisor can reclassify or reopen this incident at any time, with a logged justification.'}
      </p>

      {error && (
        <div style={{
          padding: '12px 16px', background: 'var(--critical)15', border: '1px solid var(--critical)33',
          color: 'var(--critical)', borderRadius: '8px', fontSize: 'var(--caption-size)',
          display: 'flex', alignItems: 'center', gap: '8px', animation: 'errorShake 0.4s ease'
        }}>
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {allowConfirm && !showOverrideForm ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={handleConfirmClick}
            disabled={loading}
            style={{
              flex: '1 1 200px', background: 'var(--low)', color: '#04140c', border: 'none',
              padding: '11px 16px', borderRadius: '8px', fontWeight: '700', fontSize: 'var(--body-size)',
              cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s ease'
            }}
            className="hover:opacity-90 active:scale-[0.99]"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>{loading ? 'Processing...' : 'Confirm Recommendation'}</span>
          </button>
          <button
            onClick={() => setShowOverrideForm(true)}
            disabled={loading}
            style={{
              flex: '1 1 200px', background: 'var(--bg-primary)', color: 'var(--critical)',
              border: '1px solid var(--border)', padding: '11px 16px', borderRadius: '8px',
              fontWeight: '700', fontSize: 'var(--body-size)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease'
            }}
            className="hover:opacity-90 active:scale-[0.99]"
          >
            <PenLine size={14} />
            <span>Override Decision</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', animation: 'panelSlide 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--caption-size)', fontWeight: '700', color: 'var(--critical)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={13} />
              Review Console
            </span>
            {allowConfirm && (
              <button
                type="button"
                onClick={() => setShowOverrideForm(false)}
                style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                className="hover:text-white"
              >
                <X size={12} />
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>New Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={inputStyle}>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-card)', color: '#fff' }}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
              <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Reason</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this decision is being changed"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'var(--critical)', color: '#fff', border: 'none',
              padding: '10px 16px', borderRadius: '8px', fontWeight: '700', fontSize: 'var(--caption-size)',
              cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s ease'
            }}
            className="hover:opacity-90 active:scale-[0.99]"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={13} />}
            <span>{loading ? 'Submitting...' : allowConfirm ? 'Apply Force Override' : 'Submit Review Decision'}</span>
          </button>
        </form>
      )}

      {history.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <History size={11} />
            Review History ({history.length})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
            {history.map((entry, idx) => (
              <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'}
                </div>
                <p style={{ fontSize: 'var(--caption-size)', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>{entry.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}