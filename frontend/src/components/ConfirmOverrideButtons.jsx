import React, { useState } from 'react';
import { ShieldCheck, PenLine, X, AlertTriangle, Loader2, CheckCircle2, ShieldAlert, History } from 'lucide-react';

/**
 * Reusable human-in-the-loop control.
 *
 * Two modes, controlled by `allowConfirm`:
 *  - allowConfirm=true  -> "Confirm Recommendation" + "Override Decision" (used while
 *    the incident is pending-confirmation and an AI recommendation is staged).
 *  - allowConfirm=false -> override-only. Used so a supervisor can still reclassify /
 *    reopen an incident after it has already moved past pending-confirmation
 *    (resolved, escalated, etc). This is the "manual human review" entry point.
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

  return (
    <div
      className="relative bg-slate-900/60 backdrop-blur-xl border rounded-2xl p-6 shadow-xl space-y-4 overflow-hidden transition-all duration-300"
      style={{
        borderColor: showOverrideForm ? 'rgba(239, 68, 68, 0.4)' : 'rgb(30, 41, 59)',
        boxShadow: showOverrideForm
          ? '0 0 0 1px rgba(239, 68, 68, 0.15), 0 0 32px rgba(239, 68, 68, 0.12), 0 10px 30px rgba(0,0,0,0.3)'
          : '0 10px 30px rgba(0,0,0,0.25)'
      }}
    >
      <style>{`
        @keyframes authPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        @keyframes panelSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes errorShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
      `}</style>

      {showOverrideForm && (
        <div style={{ position: 'absolute', top: '-40%', right: '-15%', width: '220px', height: '220px', borderRadius: '50%', background: 'rgb(239, 68, 68)', opacity: 0.08, filter: 'blur(40px)', pointerEvents: 'none' }} />
      )}

      <div className="relative flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          {allowConfirm ? 'Incident Control Operations' : 'Human Review'}
        </h3>
        {allowConfirm && !showOverrideForm && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgb(251, 191, 36)', animation: 'authPulse 1.6s ease-in-out infinite' }} />
            Awaiting auth
          </span>
        )}
      </div>

      <p className="relative text-xs text-slate-400 leading-relaxed">
        {allowConfirm
          ? 'This incident requires manual authorization before dispatch instructions are finalised.'
          : 'A supervisor can reclassify or reopen this incident at any time, with a logged justification.'}
      </p>

      {error && (
        <div className="relative p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-2" style={{ animation: 'errorShake 0.4s ease' }}>
          <AlertTriangle size={13} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {allowConfirm && !showOverrideForm ? (
        <div className="relative flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleConfirmClick}
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-70 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            {loading ? (<><Loader2 size={15} className="animate-spin" /><span>Processing...</span></>) : (<><CheckCircle2 size={15} /><span>Confirm Recommendation</span></>)}
          </button>
          <button
            onClick={() => setShowOverrideForm(true)}
            disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700/80 active:scale-[0.99] disabled:opacity-70 text-red-400 hover:text-red-300 font-bold py-3 px-4 border border-slate-700 hover:border-red-500/40 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PenLine size={14} />
            <span>Override Decision</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleOverrideSubmit} className="relative space-y-4 pt-2 border-t border-slate-800/50" style={{ animation: 'panelSlide 0.25s ease' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={13} />
              Review Console
            </span>
            {allowConfirm && (
              <button type="button" onClick={() => setShowOverrideForm(false)} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                <X size={12} />
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all duration-200 text-xs"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Reason</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this decision is being changed"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all duration-200 text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] disabled:opacity-70 text-slate-100 font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 cursor-pointer"
          >
            {loading ? (<><Loader2 size={13} className="animate-spin" /><span>Submitting...</span></>) : (<><ShieldAlert size={13} /><span>{allowConfirm ? 'Apply Force Override' : 'Submit Review Decision'}</span></>)}
          </button>
        </form>
      )}

      {history.length > 0 && (
        <div className="relative border-t border-slate-800/60 pt-3 mt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <History size={11} />
            Review History ({history.length})
          </span>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {history.map((entry, idx) => (
              <div key={idx} className="text-xs bg-slate-950/50 border border-slate-800/60 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{entry.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}