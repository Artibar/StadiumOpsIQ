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

// Fixed spacing scale — same tokens used across the whole dashboard now,
// so cards line up with the form and stat cards instead of drifting.
const SPACE = { xs: '6px', sm: '10px', md: '16px', lg: '24px' };

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
    <section style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }} aria-labelledby="feed-title">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
          <span id="feed-title" style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, fontSize: 'var(--section-title-size)', fontWeight: 700 }}>
            <Radio size={14} style={{ color: 'var(--low)' }} />
            Live Incident Feed
            <span className="pulsing-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--critical)', flexShrink: 0 }} />
          </span>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, fontSize: 'var(--caption-size)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}
            aria-live="polite"
          >
            <span className="pulsing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--low)', flexShrink: 0 }} />
            Updated {secondsSinceUpdate}s ago
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flexShrink: 0 }}>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="soft-button"
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: filtersOpen ? 'var(--accent)' : undefined,
              borderColor: filtersOpen ? 'var(--accent)' : undefined
            }}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={13} />
          </button>
          <button
            onClick={onRefresh}
            className="soft-button"
            style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, padding: '8px 14px', fontWeight: 700, fontSize: 'var(--caption-size)' }}
          >
            <RefreshCw size={12} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: SPACE.sm, marginBottom: SPACE.md }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by Incident Type" className="soft-input" style={{ padding: '10px 12px', fontSize: 'var(--caption-size)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <option value="all">All Types</option>
            <option value="medical">Medical</option>
            <option value="security">Security</option>
            <option value="crowd">Crowd</option>
            <option value="fire">Fire</option>
            <option value="weather">Weather</option>
            <option value="lost-item">Lost Item</option>
            <option value="other">Other</option>
          </select>

          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} aria-label="Filter by Incident Severity" className="soft-input" style={{ padding: '10px 12px', fontSize: 'var(--caption-size)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by Incident Status" className="soft-input" style={{ padding: '10px 12px', fontSize: 'var(--caption-size)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending-confirmation">Pending</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="flagged-for-review">Flagged</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md, overflowY: 'auto', paddingRight: '4px', maxHeight: '520px' }} aria-live="polite">
        {filteredIncidents.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Inbox size={30} style={{ marginBottom: SPACE.sm }} />
            <h3 style={{ fontSize: 'var(--body-size)', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
              No active incidents matched
            </h3>
            <p style={{ margin: `${SPACE.xs} auto 0`, maxWidth: '280px', lineHeight: 1.6, fontSize: 'var(--caption-size)' }}>
              Incidents matching selected criteria will display here.
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc, idx) => {
            const typeColor = TYPE_COLORS[inc.type] || 'var(--text-muted)';
            const severityColor = SEVERITY_COLORS[inc.severity] || 'var(--low)';
            const descPreview = inc.translatedDescription || inc.originalDescription || inc.description || '';
            const descDisplay = descPreview.length > 120 ? `${descPreview.substring(0, 120)}...` : descPreview;
            const temp = inc.liveContext?.weather?.temperature;
            const phase = inc.liveContext?.matchStatus?.phase;
            const TypeIcon = TYPE_ICONS[inc.type] || HelpCircle;
            const isUrgent = inc.severity === 'critical' || inc.status === 'escalated';

            return (
              <div
                key={inc._id}
                onClick={() => navigate(`/incidents/${inc._id}`)}
                className="hover-lift surface-card"
                style={{
                  cursor: 'pointer',
                  padding: SPACE.lg,
                  borderColor: `${severityColor}40`,
                  boxShadow: isUrgent ? `0 0 0 1px ${severityColor}22, 0 10px 26px rgba(0,0,0,0.3)` : undefined,
                  animation: 'subtle-rise 0.35s ease both',
                  animationDelay: `${Math.min(idx, 8) * 45}ms`
                }}
              >
                {/* Header: icon + title on the left, badge on the right — normal
                    flex flow, never absolutely positioned, so long titles and
                    long badges (e.g. "CRITICAL MEDICAL") wrap instead of colliding */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACE.sm, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.sm, minWidth: 0, flex: '1 1 200px' }}>
                    <div
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${typeColor}1a`, border: `1px solid ${typeColor}40`
                      }}
                    >
                      <TypeIcon size={16} style={{ color: typeColor }} />
                    </div>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap', fontSize: 'var(--body-size)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span>{inc.stadiumName || 'Command Station 04'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Zone {inc.zoneLocation}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      color: severityColor,
                      background: `${severityColor}1f`,
                      border: `1px solid ${severityColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {inc.severity === 'critical' && (
                      <span className="pulsing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: severityColor, flexShrink: 0 }} />
                    )}
                    {inc.severity} {inc.type}
                  </span>
                </div>

                {/* Description */}
                <div style={{ marginTop: SPACE.sm, fontSize: 'var(--body-size)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {descDisplay}
                </div>

                {/* Status pill */}
                <div style={{ marginTop: SPACE.md }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      background: 'rgba(148,163,184,0.08)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {statusLabels[inc.status] || inc.status}
                  </span>
                </div>

                {/* Footer */}
                <div
                  style={{
                    marginTop: SPACE.md,
                    paddingTop: SPACE.sm,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACE.sm,
                    fontSize: 'var(--caption-size)',
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.md }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /><span>{formatTimeAgo(inc.createdAt)}</span></span>
                    {temp !== undefined && temp !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={11} /><span>{temp}°C</span></span>
                    )}
                    {phase && phase !== 'inactive' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}><ShieldAlert size={11} /><span>{phase}</span></span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${inc._id}`); }}
                    style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 'var(--caption-size)', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    VIEW DETAILS <ArrowRight size={12} />
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