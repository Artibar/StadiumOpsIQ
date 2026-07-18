import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, MapPin, Clock, Thermometer, ShieldAlert, ArrowRight, Inbox, Radio,
  HeartPulse, Flame, Users, CloudRain, Search as SearchIcon, HelpCircle, SlidersHorizontal
} from 'lucide-react';

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

const TYPE_ICONS = {
  medical: HeartPulse,
  security: ShieldAlert,
  crowd: Users,
  fire: Flame,
  weather: CloudRain,
  'lost-item': SearchIcon,
  other: HelpCircle
};

const TYPE_COLORS = {
  medical: 'var(--medical)',
  security: 'var(--security)',
  crowd: 'var(--crowd)',
  fire: 'var(--fire)',
  weather: 'var(--weather)',
  'lost-item': 'var(--lost-item)',
  other: 'var(--text-muted)'
};

const SEVERITY_COLORS = {
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
  'flagged-for-review': 'Flagged For Review'
};

export default function IncidentFeed({ incidents, onRefresh, lastUpdated }) {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSecondsSinceUpdate(0);
    const timer = setInterval(() => {
      setSecondsSinceUpdate((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const filteredIncidents = (incidents || []).filter((inc) => {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    return true;
  });

  return (
    <section className="flex h-full flex-col justify-between" style={{ minHeight: '420px' }} aria-labelledby="feed-title">
      <div>
        <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="space-y-1">
            <span id="feed-title" className="flex items-center gap-2" style={{ fontSize: 'var(--section-title-size)', fontWeight: 700 }}>
              <Radio size={14} style={{ color: 'var(--low)' }} />
              Live Incident Feed
              <span className="pulsing-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--critical)', flexShrink: 0 }} />
            </span>
            <span className="soft-label flex items-center gap-1.5" aria-live="polite">
              <span className="pulsing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--low)', flexShrink: 0 }} />
              Updated {secondsSinceUpdate}s ago
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="soft-button flex h-[30px] w-[30px] items-center justify-center"
              style={{ color: filtersOpen ? 'var(--accent)' : undefined, borderColor: filtersOpen ? 'var(--accent)' : undefined }}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={13} />
            </button>
            <button
              onClick={onRefresh}
              className="soft-button flex items-center gap-1.5 px-3 py-1.5 font-bold transition-all duration-200 active:scale-[0.98]"
              style={{ fontSize: 'var(--caption-size)' }}
            >
              <RefreshCw size={12} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by Incident Type" className="soft-input p-2.5 font-semibold" style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)' }}>
              <option value="all">All Types</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="crowd">Crowd</option>
              <option value="fire">Fire</option>
              <option value="weather">Weather</option>
              <option value="lost-item">Lost Item</option>
              <option value="other">Other</option>
            </select>

            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} aria-label="Filter by Incident Severity" className="soft-input p-2.5 font-semibold" style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)' }}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by Incident Status" className="soft-input p-2.5 font-semibold" style={{ fontSize: 'var(--caption-size)', color: 'var(--text-secondary)' }}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending-confirmation">Pending</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="flagged-for-review">Flagged</option>
            </select>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '440px' }} aria-live="polite">
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: 'var(--text-muted)' }}>
              <Inbox size={30} className="mb-2.5" />
              <h3 style={{ fontSize: 'var(--body-size)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                No active incidents matched
              </h3>
              <p className="mx-auto mt-1.5 max-w-xs leading-relaxed" style={{ fontSize: 'var(--caption-size)' }}>
                Incidents matching selected criteria will display here.
              </p>
            </div>
          ) : (
            filteredIncidents.map((inc, idx) => {
              const typeColor = TYPE_COLORS[inc.type] || 'var(--text-muted)';
              const severityColor = SEVERITY_COLORS[inc.severity] || 'var(--low)';
              const descPreview = inc.translatedDescription || inc.originalDescription || inc.description || '';
              const descDisplay = descPreview.length > 90 ? `${descPreview.substring(0, 90)}...` : descPreview;
              const temp = inc.liveContext?.weather?.temperature;
              const phase = inc.liveContext?.matchStatus?.phase;
              const TypeIcon = TYPE_ICONS[inc.type] || HelpCircle;
              const isUrgent = inc.severity === 'critical' || inc.status === 'escalated';

              return (
                <div
                  key={inc._id}
                  onClick={() => navigate(`/incidents/${inc._id}`)}
                  className="hover-lift surface-card relative flex cursor-pointer flex-col gap-3 p-5"
                  style={{
                    borderColor: `${severityColor}40`,
                    boxShadow: isUrgent ? `0 0 0 1px ${severityColor}22, 0 10px 26px rgba(0,0,0,0.3)` : undefined,
                    animation: 'subtle-rise 0.35s ease both',
                    animationDelay: `${Math.min(idx, 8) * 45}ms`
                  }}
                >
                  {/* Corner severity + type badge */}
                  <span
                    className="absolute right-0 top-0 font-bold uppercase"
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      padding: '6px 12px',
                      color: severityColor,
                      background: `${severityColor}1f`,
                      borderBottomLeftRadius: '12px',
                      borderLeft: `1px solid ${severityColor}55`,
                      borderBottom: `1px solid ${severityColor}55`
                    }}
                  >
                    {inc.severity === 'critical' && (
                      <span className="pulsing-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: severityColor }} />
                    )}
                    {inc.severity} {inc.type}
                  </span>

                  <div className="flex items-start gap-3 pr-24">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${typeColor}1a`, border: `1px solid ${typeColor}40` }}
                    >
                      <TypeIcon size={16} style={{ color: typeColor }} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: 'var(--body-size)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <MapPin size={11} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <span className="truncate">{inc.stadiumName || 'Command Station 04'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span className="whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Zone {inc.zoneLocation}</span>
                      </div>
                      <div style={{ fontSize: 'var(--body-size)', lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                        {descDisplay}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-block rounded-md px-2 py-1 font-bold uppercase"
                      style={{ fontSize: '9px', letterSpacing: '0.06em', color: 'var(--text-secondary)', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)' }}
                    >
                      {statusLabels[inc.status] || inc.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--border)', fontSize: 'var(--caption-size)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1"><Clock size={11} /><span>{formatTimeAgo(inc.createdAt)}</span></span>
                      {temp !== undefined && temp !== null && <span className="flex items-center gap-1"><Thermometer size={11} /><span>{temp}°C</span></span>}
                      {phase && phase !== 'inactive' && <span className="flex items-center gap-1 uppercase"><ShieldAlert size={11} /><span>{phase}</span></span>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${inc._id}`); }}
                      className="border-none bg-transparent p-0 hover:underline"
                      style={{ fontSize: 'var(--caption-size)', fontWeight: 700, color: 'var(--accent)' }}
                    >
                      VIEW DETAILS <ArrowRight size={12} className="ml-1 inline" />
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