import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, MapPin, Clock, Thermometer, ShieldAlert, ArrowRight, Inbox, Radio } from 'lucide-react';

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
    <section className="select-none flex flex-col justify-between h-full" style={{ minHeight: '420px' }} aria-labelledby="feed-title">
      <style>{`
        @keyframes feedCardIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5" style={{ marginBottom: '16px' }}>
          <div className="flex flex-col">
            <span id="feed-title" className="font-semibold text-white flex items-center gap-2" style={{ fontSize: 'var(--section-title-size)' }}>
              <Radio size={15} style={{ color: 'var(--low)' }} />
              Live Incident Feed
            </span>
            <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5" style={{ fontSize: 'var(--caption-size)' }} aria-live="polite">
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--low)',
                animation: 'livePulse 1.8s ease-in-out infinite',
                flexShrink: 0
              }} />
              Updated {secondsSinceUpdate}s ago
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5 font-bold hover:border-[var(--accent)] active:scale-95"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-3" style={{ gap: 'var(--field-gap)', marginBottom: '16px' }}>
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by Incident Type"
            className="bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--text-secondary)] rounded-lg p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-semibold cursor-pointer transition-colors"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Types</option>
            <option value="medical" style={{ background: '#151B2E', color: '#fff' }}>Medical</option>
            <option value="security" style={{ background: '#151B2E', color: '#fff' }}>Security</option>
            <option value="crowd" style={{ background: '#151B2E', color: '#fff' }}>Crowd</option>
            <option value="fire" style={{ background: '#151B2E', color: '#fff' }}>Fire</option>
            <option value="weather" style={{ background: '#151B2E', color: '#fff' }}>Weather</option>
            <option value="lost-item" style={{ background: '#151B2E', color: '#fff' }}>Lost Item</option>
            <option value="other" style={{ background: '#151B2E', color: '#fff' }}>Other</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            aria-label="Filter by Incident Severity"
            className="bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--text-secondary)] rounded-lg p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-semibold cursor-pointer transition-colors"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Severities</option>
            <option value="critical" style={{ background: '#151B2E', color: '#fff' }}>Critical</option>
            <option value="high" style={{ background: '#151B2E', color: '#fff' }}>High</option>
            <option value="medium" style={{ background: '#151B2E', color: '#fff' }}>Medium</option>
            <option value="low" style={{ background: '#151B2E', color: '#fff' }}>Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by Incident Status"
            className="bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--text-secondary)] rounded-lg p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-semibold cursor-pointer transition-colors"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Statuses</option>
            <option value="open" style={{ background: '#151B2E', color: '#fff' }}>Open</option>
            <option value="pending-confirmation" style={{ background: '#151B2E', color: '#fff' }}>Pending</option>
            <option value="escalated" style={{ background: '#151B2E', color: '#fff' }}>Escalated</option>
            <option value="resolved" style={{ background: '#151B2E', color: '#fff' }}>Resolved</option>
            <option value="flagged-for-review" style={{ background: '#151B2E', color: '#fff' }}>Flagged</option>
          </select>
        </div>

        {/* Incidents feed container */}
        <div className="space-y-3 pr-1 overflow-y-auto" style={{ maxHeight: '380px' }} aria-live="polite">
          {filteredIncidents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--text-muted)]">
              <Inbox size={32} className="mb-2.5 text-[var(--text-muted)]" />
              <h3 className="font-bold text-[var(--text-secondary)]" style={{ fontSize: 'var(--body-size)' }}>
                No active incidents matched
              </h3>
              <p className="max-w-xs mx-auto mt-1.5 leading-relaxed font-medium text-[var(--text-muted)]" style={{ fontSize: 'var(--caption-size)' }}>
                Incidents matching selected criteria will display here. Multi-lingual support active.
              </p>
            </div>
          ) : (
            filteredIncidents.map((inc, idx) => {
              const sideColor = severityColors[inc.severity] || 'var(--low)';
              const descPreview = inc.translatedDescription || inc.originalDescription || '';
              const descDisplay =
                descPreview.length > 80
                  ? `${descPreview.substring(0, 80)}...`
                  : descPreview;

              const temp = inc.liveContext?.weather?.temperature;
              const phase = inc.liveContext?.matchStatus?.phase;

              const statusColors = {
                open: 'var(--accent)',
                'pending-confirmation': 'var(--medium)',
                escalated: 'var(--critical)',
                resolved: 'var(--low)',
                'flagged-for-review': 'var(--high)'
              };
              const statusColor = statusColors[inc.status] || 'var(--accent)';

              const isUrgent = inc.severity === 'critical' || inc.status === 'escalated';

              return (
                <div
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className="hover-lift bg-[var(--bg-primary)] border cursor-pointer flex flex-col gap-3 transition-all duration-200 relative overflow-hidden"
                  style={{
                    borderLeft: `4px solid ${sideColor}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: 'var(--card-radius)',
                    padding: 'var(--card-padding)',
                    boxShadow: isUrgent
                      ? `0 0 0 1px ${sideColor}30, 0 2px 8px rgba(0,0,0,0.35)`
                      : '0 2px 6px rgba(0,0,0,0.2)',
                    animation: `feedCardIn 0.35s ease both`,
                    animationDelay: `${Math.min(idx, 8) * 45}ms`
                  }}
                >
                  {/* ROW 1: Badges */}
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase px-2.5 py-1 rounded border leading-none tracking-wider flex items-center gap-1"
                        style={{ 
                          color: sideColor,
                          backgroundColor: sideColor + '15',
                          borderColor: sideColor + '33'
                        }}
                      >
                        {inc.severity === 'critical' && (
                          <span style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: sideColor,
                            animation: 'livePulse 1.4s ease-in-out infinite'
                          }} />
                        )}
                        {inc.severity}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase px-2.5 py-1 rounded border leading-none tracking-wider"
                        style={{ 
                          color: `var(--${inc.type})`,
                          backgroundColor: `var(--${inc.type})15`,
                          borderColor: `var(--${inc.type})33`
                        }}
                      >
                        {inc.type}
                      </span>
                    </div>
                    <span 
                      className="text-[10px] font-bold uppercase px-2.5 py-1 rounded border leading-none tracking-wider"
                      style={{ 
                        color: statusColor,
                        backgroundColor: statusColor + '15',
                        borderColor: statusColor + '33'
                      }}
                    >
                      {statusLabels[inc.status] || inc.status}
                    </span>
                  </div>

                  {/* ROW 2: Location */}
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 relative" style={{ fontSize: 'var(--body-size)' }}>
                    <MapPin size={12} className="text-[var(--text-muted)]" />
                    <span>{inc.stadiumName}</span>
                    <span className="text-[var(--text-muted)] font-normal">|</span>
                    <span className="text-[var(--text-secondary)]">Zone {inc.zoneLocation}</span>
                  </div>

                  {/* ROW 3: Description */}
                  <div className="text-[var(--text-secondary)] leading-relaxed font-medium italic relative" style={{ fontSize: 'var(--body-size)' }}>
                    "{descDisplay}"
                  </div>

                  {/* ROW 4: Footer indicators */}
                  <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-3 mt-1 font-semibold text-[var(--text-muted)] relative" style={{ fontSize: 'var(--caption-size)' }}>
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
                      className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold leading-none p-0 flex items-center gap-1 hover:gap-1.5 transition-all"
                      style={{ fontSize: 'var(--caption-size)' }}
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