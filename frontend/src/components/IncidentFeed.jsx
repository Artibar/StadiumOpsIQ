import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Clock, Thermometer, ShieldAlert, ArrowRight, Inbox, Eye } from 'lucide-react';

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
    'pending-confirmation': 'Pending',
    'escalated': 'Escalated',
    'resolved': 'Resolved',
    'flagged-for-review': 'Flagged'
  };

  return (
    <section className="space-y-4 select-none flex flex-col justify-between h-full" style={{ minHeight: '420px' }} aria-labelledby="feed-title">
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5 mb-4">
          <div className="flex flex-col">
            <span id="feed-title" className="font-bold text-white text-[15px]">
              Live Incident Feed
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5" aria-live="polite">
              Updated {secondsSinceUpdate}s ago
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white transition cursor-pointer flex items-center gap-1.5 font-bold"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-3 gap-3.5 mb-4">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by Incident Type"
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg p-2 text-xs focus:outline-none focus:border-[var(--accent)] font-semibold cursor-pointer"
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
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg p-2 text-xs focus:outline-none focus:border-[var(--accent)] font-semibold cursor-pointer"
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
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg p-2 text-xs focus:outline-none focus:border-[var(--accent)] font-semibold cursor-pointer"
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
        <div className="space-y-4 pr-1 overflow-y-auto" style={{ maxHeight: '380px' }} aria-live="polite">
          {filteredIncidents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--text-muted)]">
              <Inbox size={32} className="mb-2.5 text-[var(--text-muted)]" />
              <h3 className="text-sm font-bold text-[var(--text-secondary)]">
                No active incidents matched
              </h3>
              <p className="text-xs max-w-xs mx-auto mt-1.5 leading-relaxed font-medium">
                Incidents matching selected criteria will display here. Multi-lingual support active.
              </p>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const sideColor = severityColors[inc.severity] || 'var(--low)';
              const descPreview = inc.translatedDescription || inc.originalDescription || '';
              const descDisplay =
                descPreview.length > 80
                  ? `${descPreview.substring(0, 80)}...`
                  : descPreview;

              const temp = inc.liveContext?.weather?.temperature;
              const phase = inc.liveContext?.matchStatus?.phase;

              return (
                <div
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className="hover-lift bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 cursor-pointer flex flex-col gap-3 shadow-sm transition duration-150"
                  style={{ borderLeft: `4px solid ${sideColor}` }}
                >
                  {/* ROW 1: Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded text-white leading-none tracking-wider"
                        style={{ backgroundColor: sideColor }}
                      >
                        {inc.severity}
                      </span>
                      <span
                        className="text-[9px] font-black uppercase px-2 py-0.5 rounded text-white leading-none tracking-wider"
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
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--text-muted)]" />
                    <span>{inc.stadiumName}</span>
                    <span className="text-[var(--text-muted)] font-normal">|</span>
                    <span className="text-[var(--text-secondary)]">Zone {inc.zoneLocation}</span>
                  </div>

                  {/* ROW 3: Description */}
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium italic">
                    "{descDisplay}"
                  </div>

                  {/* ROW 4: Footer indicators */}
                  <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-3 mt-1 text-[11px] text-[var(--text-muted)] font-semibold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>{formatTimeAgo(inc.createdAt)}</span>
                      </span>
                      {temp !== undefined && temp !== null && (
                        <span className="flex items-center gap-0.5">
                          <Thermometer size={11} />
                          <span>{temp}°C</span>
                        </span>
                      )}
                      {phase && phase !== 'inactive' && (
                        <span className="uppercase flex items-center gap-1">
                          <ShieldAlert size={11} />
                          <span>{phase}</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${inc._id}`);
                      }}
                      className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold leading-none p-0 flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
