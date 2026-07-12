import React, { useState } from 'react';

export default function ConfirmOverrideButtons({ incidentId, onConfirm, onOverride }) {
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [newStatus, setNewStatus] = useState('resolved');
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
      setError(err.response?.data?.error || 'Failed to confirm incident.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('Please provide a reason for the override.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onOverride(newStatus, overrideReason.trim());
      setShowOverrideForm(false);
      setOverrideReason('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to apply override.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
        <span>🛡️</span> Incident Control Operations
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        This incident has been flagged as high/critical severity and requires manual authorization before dispatch instructions are finalised.
      </p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs">
          {error}
        </div>
      )}

      {!showOverrideForm ? (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleConfirmClick}
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <span>✅</span> Confirm Recommendation
              </>
            )}
          </button>
          <button
            onClick={() => setShowOverrideForm(true)}
            disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700/80 active:scale-[0.99] text-red-400 hover:text-red-300 font-bold py-3 px-4 border border-slate-700 hover:border-slate-650 rounded-xl text-sm transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✍️</span> Override Decision
          </button>
        </div>
      ) : (
        <form onSubmit={handleOverrideSubmit} className="space-y-4 pt-2 border-t border-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Override Console</span>
            <button
              type="button"
              onClick={() => setShowOverrideForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                New Action Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-red-500 transition duration-200 text-xs"
              >
                <option value="resolved">Resolved (Close case)</option>
                <option value="escalated">Escalated (Manual Dispatch)</option>
                <option value="flagged-for-review">Flagged for review</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Override Reason
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why decision is being changed"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition duration-200 text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-slate-100 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-red-650/15 cursor-pointer"
          >
            {loading ? 'Submitting Override...' : 'Apply Force Override'}
          </button>
        </form>
      )}
    </div>
  );
}
