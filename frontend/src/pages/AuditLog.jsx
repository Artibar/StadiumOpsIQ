import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Download, Search, ChevronLeft, ChevronRight, Eye, FilterX, AlertCircle, Loader2, Inbox,
  Ambulance, Siren, CheckCircle2, Flag, MessageSquare, Mail, Zap, Clock, MapPin
} from 'lucide-react';
import { getIncidents } from '../services/api.js';

const LANGUAGE_FLAGS = {
  en: { name: 'English', label: 'EN' },
  hi: { name: 'Hindi', label: 'HI' },
  es: { name: 'Spanish', label: 'ES' },
  fr: { name: 'French', label: 'FR' },
  pt: { name: 'Portuguese', label: 'PT' },
  ar: { name: 'Arabic', label: 'AR' },
  de: { name: 'German', label: 'DE' },
  ja: { name: 'Japanese', label: 'JA' },
  ko: { name: 'Korean', label: 'KO' },
  ta: { name: 'Tamil', label: 'TA' },
  zh: { name: 'Chinese', label: 'ZH' },
  sw: { name: 'Swahili', label: 'SW' },
  mr: { name: 'Marathi', label: 'MR' },
  kn: { name: 'Kannada', label: 'KN' },
  ur: { name: 'Urdu', label: 'UR' },
  nl: { name: 'Dutch', label: 'NL' },
  ml: { name: 'Malayalam', label: 'ML' }
};

const ACTION_META = {
  dispatchMedical: { icon: Ambulance, title: 'Medical Dispatch', color: 'var(--critical)' },
  escalateToSecurity: { icon: Siren, title: 'Security Escalation', color: 'var(--high)' },
  resolveAsLowPriority: { icon: CheckCircle2, title: 'Auto Resolved', color: 'var(--low)' },
  flagForHumanReview: { icon: Flag, title: 'Human Review', color: 'var(--medium)' },
  sendDiscordNotification: { icon: MessageSquare, title: 'Discord Alert', color: 'var(--accent)' },
  sendReportEmail: { icon: Mail, title: 'Report Emailed', color: 'var(--accent)' }
};

const SPACE = { xs: '6px', sm: '10px', md: '16px', lg: '24px', xl: '32px' };

function cleanValue(val) {
  if (!val) return null;
  const trimmed = String(val).trim();
  if (!trimmed || ['-', '—', '–', 'n/a', 'na', 'unknown', 'null', 'undefined'].includes(trimmed.toLowerCase())) {
    return null;
  }
  return trimmed;
}

function Badge({ color, children }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: '7px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`
      }}
    >
      {children}
    </span>
  );
}

export default function AuditLog() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStadium, setFilterStadium] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadIncidents() {
      try {
        const result = await getIncidents();
        setIncidents(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch incidents.');
      } finally {
        setLoading(false);
      }
    }
    loadIncidents();
  }, []);

  const handleClearFilters = () => {
    setFilterSeverity('all');
    setFilterStatus('all');
    setFilterType('all');
    setFilterStadium('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const uniqueStadiums = Array.from(new Set(incidents.map(inc => inc.stadiumName))).filter(Boolean);

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (filterStadium !== 'all' && inc.stadiumName !== filterStadium) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (inc.originalDescription || '').toLowerCase();
      const trans = (inc.translatedDescription || '').toLowerCase();
      const zone = (inc.zoneLocation || '').toLowerCase();
      if (!desc.includes(q) && !trans.includes(q) && !zone.includes(q)) return false;
    }
    return true;
  });

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.max(1, Math.ceil(sortedIncidents.length / itemsPerPage));
  const paginatedIncidents = sortedIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleJumpPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPageInput('');
    }
  };

  const severityColors = { critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };
  const typeColors = {
    medical: 'var(--medical)', security: 'var(--security)', crowd: 'var(--crowd)', fire: 'var(--fire)',
    weather: 'var(--weather)', 'lost-item': 'var(--lost-item)', other: 'var(--text-muted)'
  };
  const statusColors = {
    open: 'var(--accent)', 'pending-confirmation': 'var(--medium)', escalated: 'var(--critical)',
    resolved: 'var(--low)', 'flagged-for-review': 'var(--high)'
  };
  const statusLabels = {
    open: 'Open', 'pending-confirmation': 'Pending', escalated: 'Escalated',
    resolved: 'Resolved', 'flagged-for-review': 'Flagged'
  };

  const hasActiveFilters = filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' || filterStadium !== 'all' || searchQuery.trim() !== '';

  const filterLabelStyle = {
    display: 'block', fontSize: 'var(--caption-size)', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)',
    marginBottom: SPACE.xs
  };
  const filterInputStyle = { width: '100%', height: '42px', padding: `0 ${SPACE.md}`, fontSize: 'var(--body-size)' };

  // th/td get explicit padding always — no responsive prefix that might not
  // compile, no reliance on Tailwind bracket arbitrary values.
  const thStyle = {
    padding: '14px 20px',
    fontSize: 'var(--caption-size)',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    borderBottom: '1px solid var(--border)'
  };
  const tdStyle = { padding: '14px 20px', whiteSpace: 'nowrap', fontSize: 'var(--body-size)' };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: `${SPACE.xl} 0` }}>
      <style>{`
        @keyframes rowIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ledgerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .audit-table-wrap { display: block; }
        .audit-card-wrap { display: none; }
        @media (max-width: 860px) {
          .audit-table-wrap { display: none; }
          .audit-card-wrap { display: flex; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: SPACE.md, borderBottom: '1px solid var(--border)', paddingBottom: SPACE.lg, marginBottom: SPACE.lg
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.md, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: SPACE.xs,
              borderRadius: '999px', border: '1px solid rgba(99,102,241,0.25)', background: 'var(--accent-soft)',
              padding: '6px 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)',
              flexShrink: 0
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'ledgerPulse 2s ease-in-out infinite' }} />
            Live Review
          </span>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--caption-size)', lineHeight: 1.5 }}>
            Historical audit records of translations, climate analytics, automated actions, and supervisor approvals.
          </p>
        </div>
        <button
          disabled
          title="Export coming soon"
          className="soft-button"
          style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, padding: '10px 16px', fontWeight: 700, fontSize: 'var(--caption-size)', opacity: 0.5, cursor: 'not-allowed', flexShrink: 0 }}
        >
          <Download size={13} />
          <span>Export Log (CSV)</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: SPACE.lg, padding: SPACE.md, borderRadius: '10px',
            border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: 'var(--critical)',
            fontSize: 'var(--caption-size)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: SPACE.sm
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="surface-card" style={{ padding: 'var(--card-padding)', borderTop: '4px solid var(--accent)', marginBottom: SPACE.xl }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: SPACE.md }}>
          <div>
            <label style={filterLabelStyle}>Search Description</label>
            <div className="soft-input" style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, height: '42px', padding: `0 ${SPACE.md}` }}>
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Query narrative..."
                style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 'var(--body-size)', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div>
            <label style={filterLabelStyle}>Severity</label>
            <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }} className="soft-input" style={filterInputStyle}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={filterLabelStyle}>Status</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="soft-input" style={filterInputStyle}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending-confirmation">Pending</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="flagged-for-review">Flagged</option>
            </select>
          </div>

          <div>
            <label style={filterLabelStyle}>Type</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} className="soft-input" style={filterInputStyle}>
              <option value="all">All Types</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="crowd">Crowd</option>
              <option value="fire">Fire</option>
              <option value="weather">Weather</option>
              <option value="lost-item">Lost Item</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={filterLabelStyle}>Stadium</label>
            <select value={filterStadium} onChange={(e) => { setFilterStadium(e.target.value); setCurrentPage(1); }} className="soft-input" style={filterInputStyle}>
              <option value="all">All Stadiums</option>
              {uniqueStadiums.map((name, idx) => (<option key={idx} value={name}>{name}</option>))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm,
            borderTop: '1px solid var(--border)', marginTop: SPACE.lg, paddingTop: SPACE.md,
            fontSize: 'var(--caption-size)', fontWeight: 600
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-secondary)' }}>{filteredIncidents.length}</strong> of {incidents.length} records
          </span>
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="soft-button" style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE.xs, padding: '8px 14px', fontWeight: 700, fontSize: 'var(--caption-size)' }}>
              <FilterX size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading / empty states */}
      {loading ? (
        <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, padding: '80px 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--caption-size)' }}>Loading review board…</span>
        </div>
      ) : paginatedIncidents.length === 0 ? (
        <div className="surface-card" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Inbox size={32} style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 'var(--body-size)', margin: 0 }}>No incidents match search criteria</h4>
          <button onClick={handleClearFilters} className="soft-button" style={{ marginTop: SPACE.md, padding: '10px 16px', fontWeight: 700, fontSize: 'var(--caption-size)' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop / wide-screen table */}
          <div className="audit-table-wrap surface-card" style={{ flexDirection: 'column', borderTop: '4px solid var(--accent)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1180px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)' }}>
                    <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}>
                      Time {sortDirection === 'desc' ? '↓' : '↑'}
                    </th>
                    <th style={thStyle}>Stadium</th>
                    <th style={thStyle}>Zone</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Severity</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Approval</th>
                    <th style={thStyle}>Confidence</th>
                    <th style={thStyle}>Language</th>
                    <th style={thStyle}>Actions</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Override</th>
                    <th style={thStyle}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncidents.map((inc, idx) => {
                    const hasOverride = inc.humanOverride;
                    const hasApproval = Boolean(inc.humanConfirmedAt);
                    const langKey = inc.detectedLanguage || 'en';
                    const langConfig = LANGUAGE_FLAGS[langKey] || { name: 'English', label: 'EN' };

                    const rowBg = hasOverride ? 'rgba(234,179,8,0.06)' : idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent';
                    const rowBorderLeft = hasOverride ? '3px solid var(--medium)' : '3px solid transparent';

                    const typeColor = typeColors[inc.type] || 'var(--text-muted)';
                    const severityColor = severityColors[inc.severity] || 'var(--low)';
                    const statusColor = statusColors[inc.status] || 'var(--accent)';
                    const approvalColor = hasApproval ? 'var(--low)' : inc.status === 'pending-confirmation' ? 'var(--medium)' : 'var(--text-muted)';
                    const approvalLabel = hasApproval ? 'Supervisor Approved' : inc.status === 'pending-confirmation' ? 'Awaiting Approval' : 'No Approval';
                    const confidencePct = Math.round((inc.confidence || 0) * 100);
                    const confidenceColor = inc.confidence >= 0.8 ? 'var(--low)' : inc.confidence >= 0.6 ? 'var(--medium)' : 'var(--critical)';

                    return (
                      <tr
                        key={inc._id}
                        style={{
                          background: rowBg, borderLeft: rowBorderLeft, borderBottom: '1px solid rgba(148,163,184,0.08)',
                          animation: 'rowIn 0.25s ease both', animationDelay: `${Math.min(idx, 20) * 20}ms`
                        }}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{cleanValue(inc.stadiumName) || 'Command Station 04'}</td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{cleanValue(inc.zoneLocation) || '—'}</td>
                        <td style={tdStyle}><Badge color={typeColor}>{inc.type}</Badge></td>
                        <td style={tdStyle}><Badge color={severityColor}>{inc.severity}</Badge></td>
                        <td style={tdStyle}><Badge color={statusColor}>{statusLabels[inc.status] || inc.status}</Badge></td>
                        <td style={tdStyle}><Badge color={approvalColor}>{approvalLabel}</Badge></td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs }}>
                            <span style={{ fontWeight: 700, color: confidenceColor }}>{confidencePct}%</span>
                            <div style={{ width: '48px', height: '6px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                              <div style={{ width: `${confidencePct}%`, height: '100%', borderRadius: '4px', background: confidenceColor, boxShadow: `0 0 6px ${confidenceColor}80` }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <span style={{ marginRight: SPACE.xs, fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--border)', color: 'var(--text-muted)' }}>
                            {langConfig.label}
                          </span>
                          {langConfig.name}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs }}>
                            {(inc.actionsTaken || []).map((action, actionIdx) => {
                              const meta = ACTION_META[action] || { icon: Zap, title: action, color: 'var(--text-muted)' };
                              const ActionIcon = meta.icon;
                              return (
                                <span key={actionIdx} title={meta.title} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', background: `${meta.color}18`, cursor: 'help' }}>
                                  <ActionIcon size={12} style={{ color: meta.color }} />
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {hasOverride ? <AlertCircle size={14} style={{ color: 'var(--medium)', cursor: 'help' }} title="Supervisor Override Applied" /> : null}
                        </td>
                        <td style={tdStyle}>
                          <RouterLink
                            to={`/incidents/${inc._id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: '7px', background: 'var(--border)', color: 'var(--text-secondary)', fontSize: 'var(--caption-size)', fontWeight: 700 }}
                          >
                            <Eye size={12} />
                          </RouterLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
              jumpPageInput={jumpPageInput} setJumpPageInput={setJumpPageInput} handleJumpPage={handleJumpPage}
            />
          </div>

          {/* Narrow-viewport card list — a 12-column table cannot work on a phone
              no matter how it's padded, so this is a genuine layout, not a shrink */}
          <div className="audit-card-wrap surface-card" style={{ flexDirection: 'column', borderTop: '4px solid var(--accent)', padding: SPACE.md, gap: SPACE.sm }}>
            {paginatedIncidents.map((inc, idx) => {
              const severityColor = severityColors[inc.severity] || 'var(--low)';
              const typeColor = typeColors[inc.type] || 'var(--text-muted)';
              const statusColor = statusColors[inc.status] || 'var(--accent)';
              return (
                <RouterLink
                  key={inc._id}
                  to={`/incidents/${inc._id}`}
                  style={{
                    display: 'block', padding: SPACE.md, borderRadius: '12px',
                    border: `1px solid ${severityColor}30`, borderLeft: `3px solid ${severityColor}`,
                    background: 'rgba(255,255,255,0.02)', textDecoration: 'none', color: 'inherit',
                    animation: 'rowIn 0.25s ease both', animationDelay: `${Math.min(idx, 20) * 20}ms`
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.xs }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: 'var(--body-size)', color: 'var(--text-primary)' }}>
                      <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                      {cleanValue(inc.stadiumName) || 'Command Station 04'}
                      {cleanValue(inc.zoneLocation) && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · Zone {inc.zoneLocation}</span>}
                    </span>
                    <Badge color={severityColor}>{inc.severity}</Badge>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.sm }}>
                    <Badge color={typeColor}>{inc.type}</Badge>
                    <Badge color={statusColor}>{statusLabels[inc.status] || inc.status}</Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: SPACE.sm, fontSize: 'var(--caption-size)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Clock size={11} />
                    {new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </RouterLink>
              );
            })}

            <Pagination
              currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
              jumpPageInput={jumpPageInput} setJumpPageInput={setJumpPageInput} handleJumpPage={handleJumpPage}
              compact
            />
          </div>
        </>
      )}
    </div>
  );
}

function Pagination({ currentPage, totalPages, setCurrentPage, jumpPageInput, setJumpPageInput, handleJumpPage, compact }) {
  const SPACE = { xs: '6px', sm: '10px', md: '16px' };
  return (
    <div
      style={{
        borderTop: compact ? 'none' : '1px solid var(--border)',
        background: compact ? 'transparent' : 'rgba(10,15,26,0.9)',
        padding: compact ? `${SPACE.md} 0 0` : SPACE.md,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.md,
        fontSize: 'var(--caption-size)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, flexWrap: 'wrap' }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="soft-button"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontWeight: 700, opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={13} /><span>Previous</span>
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="soft-button"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontWeight: 700, opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <span>Next</span><ChevronRight size={13} />
        </button>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
      </div>

      <form onSubmit={handleJumpPage} style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Jump to:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpPageInput}
          onChange={(e) => setJumpPageInput(e.target.value)}
          placeholder="#"
          className="soft-input"
          style={{ width: '56px', height: '34px', textAlign: 'center', fontWeight: 700 }}
        />
        <button type="submit" className="soft-button" style={{ padding: '8px 14px', fontWeight: 700 }}>Go</button>
      </form>
    </div>
  );
}