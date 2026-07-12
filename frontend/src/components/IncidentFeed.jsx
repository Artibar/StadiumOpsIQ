import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function formatTimeAgo(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export default function IncidentFeed({ incidents, onRefresh, lastUpdated }) {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // Counter to show "Updated X seconds ago"
  useEffect(() => {
    setSecondsSinceUpdate(0);
    const timer = setInterval(() => {
      setSecondsSinceUpdate((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Client-side filtering logic
  const filteredIncidents = (incidents || []).filter((inc) => {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    return true;
  });

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
    'flagged-for-review': 'Flagged'
  };

  return (
    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4 select-none" aria-labelledby="feed-title">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex flex-col">
          <span id="feed-title" className="text-sm font-bold text-[var(--text-primary)]">
            Live Incident Feed
          </span>
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5" aria-live="polite">
            Updated {secondsSinceUpdate}s ago
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 px-2 text-xs rounded border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <span aria-hidden="true">🔄</span> Refresh
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filter by Incident Type"
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded p-1.5 text-xs focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Types</option>
          <option value="medical">Medical</option>
          <option value="security">Security</option>
          <option value="crowd">Crowd</option>
          <option value="fire">Fire</option>
          <option value="weather">Weather</option>
          <option value="lost-item">Lost Item</option>
          <option value="other">Other</option>
        </select>

        {/* Severity Filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          aria-label="Filter by Incident Severity"
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded p-1.5 text-xs focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by Incident Status"
          className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded p-1.5 text-xs focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="pending-confirmation">Pending</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="flagged-for-review">Flagged</option>
        </select>
      </div>

      {/* Incidents feed container */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" aria-live="polite">
        {filteredIncidents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--text-muted)]">
            <span className="text-4xl mb-3" aria-hidden="true">🏟️</span>
            <h3 className="text-sm font-bold text-[var(--text-secondary)]">
              No incidents reported yet
            </h3>
            <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">
              Use the form on the left to report your first incident. Supports 17 languages.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const sideColor = severityColors[inc.severity] || 'var(--low)';
            const descPreview =
              inc.translatedDescription || inc.originalDescription || '';
            const descDisplay =
              descPreview.length > 80
                ? `${descPreview.substring(0, 80)}...`
                : descPreview;

            // Extract context variables if they exist
            const temp = inc.liveContext?.weather?.temperature;
            const phase = inc.liveContext?.matchStatus?.phase;

            return (
              <div
                key={inc._id}
                onClick={() => navigate(`/incidents/${inc._id}`)}
                className="bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] rounded-lg p-4 cursor-pointer transition flex flex-col gap-2.5 shadow-sm"
                style={{ borderLeft: `4px solid ${sideColor}` }}
              >
                {/* ROW 1: Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white leading-none"
                      style={{ backgroundColor: sideColor }}
                    >
                      {inc.severity}
                    </span>
                    <span
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white leading-none"
                      style={{ backgroundColor: `var(--${inc.type})` }}
                    >
                      {inc.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                    {statusLabels[inc.status] || inc.status}
                  </span>
                </div>

                {/* ROW 2: Location */}
                <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1">
                  <span>🏟️ {inc.stadiumName}</span>
                  <span className="text-[var(--text-muted)] font-normal">|</span>
                  <span className="text-[var(--text-secondary)]">📍 {inc.zoneLocation}</span>
                </div>

                {/* ROW 3: Description */}
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                  "{descDisplay}"
                </div>

                {/* ROW 4: Footer indicators */}
                <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-2.5 mt-0.5 text-[11px] text-[var(--text-muted)] font-semibold">
                  <div className="flex items-center gap-3">
                    <span>⏱️ {formatTimeAgo(inc.createdAt)}</span>
                    {temp !== undefined && temp !== null && (
                      <span>🌡️ {temp}°C</span>
                    )}
                    {phase && phase !== 'inactive' && (
                      <span className="uppercase">⚽ {phase}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/incidents/${inc._id}`);
                    }}
                    className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold leading-none p-0 flex items-center"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
