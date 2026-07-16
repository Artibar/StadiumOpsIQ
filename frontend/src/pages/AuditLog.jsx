import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Download, Search, ChevronLeft, ChevronRight, Eye, FilterX, AlertCircle, Loader2, Inbox,
  Ambulance, Siren, CheckCircle2, Flag, MessageSquare, Mail, Zap, History
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

// Presentational only — maps the same action strings used below to an icon + label,
// doesn't change which actions are considered valid.
const ACTION_META = {
  dispatchMedical: { icon: Ambulance, title: 'Medical Dispatch', color: 'var(--critical)' },
  escalateToSecurity: { icon: Siren, title: 'Security Escalation', color: 'var(--high)' },
  resolveAsLowPriority: { icon: CheckCircle2, title: 'Auto Resolved', color: 'var(--low)' },
  flagForHumanReview: { icon: Flag, title: 'Human Review', color: 'var(--medium)' },
  sendDiscordNotification: { icon: MessageSquare, title: 'Discord Alert', color: 'var(--accent)' },
  sendReportEmail: { icon: Mail, title: 'Report Emailed', color: 'var(--accent)' }
};

export default function AuditLog() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStadium, setFilterStadium] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting & Pagination states
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
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

  // Get unique list of stadiums dynamically present in the incidents list
  const uniqueStadiums = Array.from(new Set(incidents.map(inc => inc.stadiumName))).filter(Boolean);

  // Apply filters
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

  // Apply sorting by Time (createdAt)
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
  });

  // Apply pagination
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

  // Badge styling helpers
  const severityColors = {
    critical: 'var(--critical)',
    high: 'var(--high)',
    medium: 'var(--medium)',
    low: 'var(--low)'
  };
  const typeColors = {
    medical: 'var(--medical)',
    security: 'var(--security)',
    crowd: 'var(--crowd)',
    fire: 'var(--fire)',
    weather: 'var(--weather)',
    'lost-item': 'var(--lost-item)',
    other: 'var(--text-muted)'
  };
  const statusColors = {
    open: 'var(--accent)',
    'pending-confirmation': 'var(--medium)',
    escalated: 'var(--critical)',
    resolved: 'var(--low)',
    'flagged-for-review': 'var(--high)'
  };
  const statusLabels = {
    'open': 'Open',
    'pending-confirmation': 'Pending',
    'escalated': 'Escalated',
    'resolved': 'Resolved',
    'flagged-for-review': 'Flagged'
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--section-spacing) 0' }}>
      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ledgerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6" style={{ marginBottom: 'var(--section-spacing)' }}>
        <div>
          <h1 className="font-semibold tracking-tight text-white flex items-center gap-2.5" style={{ fontSize: 'var(--title-size)', margin: 0 }}>
            <History size={20} className="text-[var(--accent)]" />
            <span>Operational Audit Log</span>
            <span
              className="font-bold tracking-wider uppercase bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)] rounded px-2.5 py-1 flex items-center gap-1.5"
              style={{ fontSize: 'var(--caption-size)' }}
            >
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--low)',
                animation: 'ledgerPulse 2s ease-in-out infinite'
              }} />
              {incidents.length} LEDGERS
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 font-medium" style={{ fontSize: 'var(--caption-size)' }}>
            Historical audit records of language translations, climate analytics, automated actions, and supervisor approvals.
          </p>
        </div>
        <button
          disabled
          title="Export coming soon"
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] font-bold cursor-not-allowed opacity-50 flex items-center gap-2 transition"
          style={{ fontSize: 'var(--caption-size)' }}
        >
          <Download size={13} />
          <span>Export Log (CSV)</span>
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-[var(--critical)]/10 border border-[var(--critical)]/20 text-[var(--critical)] rounded-lg font-semibold flex items-center gap-2" style={{ fontSize: 'var(--caption-size)' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* FILTER ROW (All controls same height) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] shadow-sm space-y-4" style={{ padding: 'var(--card-padding)', borderRadius: 'var(--card-radius)', borderTop: '4px solid var(--accent)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)', marginBottom: 'var(--section-spacing)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--field-gap)',
          alignItems: 'end'
        }}>
          {/* Search query */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
            <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontSize: 'var(--caption-size)' }}>Search Description</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Query narrative..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 pl-8 text-[var(--body-size)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition"
                style={{ height: '36px' }}
              />
            </div>
          </div>

          {/* Severity dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
            <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontSize: 'var(--caption-size)' }}>Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--body-size)] text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition cursor-pointer"
              style={{ height: '36px' }}
            >
              <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Severities</option>
              <option value="critical" style={{ background: '#151B2E', color: '#fff' }}>Critical</option>
              <option value="high" style={{ background: '#151B2E', color: '#fff' }}>High</option>
              <option value="medium" style={{ background: '#151B2E', color: '#fff' }}>Medium</option>
              <option value="low" style={{ background: '#151B2E', color: '#fff' }}>Low</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
            <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontSize: 'var(--caption-size)' }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--body-size)] text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition cursor-pointer"
              style={{ height: '36px' }}
            >
              <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Statuses</option>
              <option value="open" style={{ background: '#151B2E', color: '#fff' }}>Open</option>
              <option value="pending-confirmation" style={{ background: '#151B2E', color: '#fff' }}>Pending</option>
              <option value="escalated" style={{ background: '#151B2E', color: '#fff' }}>Escalated</option>
              <option value="resolved" style={{ background: '#151B2E', color: '#fff' }}>Resolved</option>
              <option value="flagged-for-review" style={{ background: '#151B2E', color: '#fff' }}>Flagged</option>
            </select>
          </div>

          {/* Type dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
            <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontSize: 'var(--caption-size)' }}>Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--body-size)] text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition cursor-pointer"
              style={{ height: '36px' }}
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
          </div>

          {/* Stadium dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--label-value-gap)' }}>
            <label className="font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontSize: 'var(--caption-size)' }}>Stadium</label>
            <select
              value={filterStadium}
              onChange={(e) => {
                setFilterStadium(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[rgba(255,255,255,0.15)] text-[var(--body-size)] text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition cursor-pointer"
              style={{ height: '36px' }}
            >
              <option value="all" style={{ background: '#151B2E', color: '#fff' }}>All Stadiums</option>
              {uniqueStadiums.map((name, idx) => (
                <option key={idx} value={name} style={{ background: '#151B2E', color: '#fff' }}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row & Clear Filters button */}
        <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-4 font-semibold" style={{ fontSize: 'var(--caption-size)' }}>
          <span className="text-[var(--text-muted)]">
            Showing <strong className="text-[var(--text-secondary)]">{filteredIncidents.length}</strong> of {incidents.length} logs
          </span>
          {(filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' || filterStadium !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={handleClearFilters}
              className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold flex items-center gap-1 leading-none transition-transform hover:scale-105"
            >
              <FilterX size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE REGISTER */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[var(--accent)]" />
          <span className="font-semibold text-[var(--text-muted)]" style={{ fontSize: 'var(--caption-size)' }}>Loading Database Ledger...</span>
        </div>
      ) : paginatedIncidents.length === 0 ? (
        /* Empty State */
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-16 text-center text-[var(--text-muted)]" style={{ borderRadius: 'var(--card-radius)' }}>
          <Inbox size={32} className="mx-auto mb-3" />
          <h4 className="font-bold text-[var(--text-secondary)]" style={{ fontSize: 'var(--body-size)' }}>No incidents match search criteria</h4>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer transition"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden shadow-sm" style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--card-radius)', borderTop: '4px solid var(--accent)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border)] font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none sticky top-0 z-10" style={{ fontSize: 'var(--caption-size)' }}>
                  <th
                    onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="px-6 py-4 cursor-pointer hover:text-white transition group"
                  >
                    Time {sortDirection === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="px-6 py-4">Stadium</th>
                  <th className="px-6 py-4">Zone</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Actions</th>
                  <th className="px-6 py-4 text-center">Override</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 select-none text-[var(--text-primary)]" style={{ fontSize: 'var(--body-size)' }}>
                {paginatedIncidents.map((inc, idx) => {
                  const hasOverride = inc.humanOverride;
                  const langKey = inc.detectedLanguage || 'en';
                  const langConfig = LANGUAGE_FLAGS[langKey] || { name: 'English', label: 'EN' };

                  const rowClass = hasOverride 
                    ? 'bg-[rgba(234,179,8,0.06)] border-l-2 border-l-[var(--medium)]' 
                    : 'hover:bg-[var(--bg-card-hover)]/30';

                  const typeColor = typeColors[inc.type] || 'var(--text-muted)';
                  const severityColor = severityColors[inc.severity] || 'var(--low)';
                  const statusColor = statusColors[inc.status] || 'var(--accent)';
                  const confidencePct = Math.round(inc.confidence * 100);
                  const confidenceColor = inc.confidence >= 0.8 ? 'var(--low)' : inc.confidence >= 0.6 ? 'var(--medium)' : 'var(--critical)';

                  return (
                    <tr
                      key={inc._id}
                      className={`${rowClass} transition duration-150`}
                      style={{ height: '52px', animation: 'rowIn 0.25s ease both', animationDelay: `${Math.min(idx, 20) * 20}ms` }}
                    >
                      {/* 1. Time */}
                      <td className="px-6 py-2 text-[var(--text-secondary)] font-mono whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      
                      {/* 2. Stadium */}
                      <td className="px-6 py-2 font-bold">
                        {inc.stadiumName}
                      </td>

                      {/* 3. Zone */}
                      <td className="px-6 py-2 text-[var(--text-secondary)]">
                        {inc.zoneLocation}
                      </td>

                      {/* 4. Type */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{ 
                            color: typeColor,
                            backgroundColor: typeColor + '15',
                            borderColor: typeColor + '33'
                          }}
                        >
                          {inc.type}
                        </span>
                      </td>

                      {/* 5. Severity */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{ 
                            color: severityColor,
                            backgroundColor: severityColor + '15',
                            borderColor: severityColor + '33'
                          }}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{ 
                            color: statusColor,
                            backgroundColor: statusColor + '15',
                            borderColor: statusColor + '33'
                          }}
                        >
                          {statusLabels[inc.status] || inc.status}
                        </span>
                      </td>

                      {/* 7. Confidence */}
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: confidenceColor }}>
                            {confidencePct}%
                          </span>
                          <div className="w-12 h-1.5 bg-[var(--border)] rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-500"
                              style={{
                                width: `${confidencePct}%`,
                                backgroundColor: confidenceColor,
                                boxShadow: `0 0 6px ${confidenceColor}80`
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 8. Language */}
                      <td className="px-6 py-2 text-[var(--text-secondary)] whitespace-nowrap font-semibold">
                        <span className="mr-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)]">
                          {langConfig.label}
                        </span> 
                        <span>{langConfig.name}</span>
                      </td>

                      {/* 9. Actions Badges */}
                      <td className="px-6 py-2 max-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          {(inc.actionsTaken || []).map((action, actionIdx) => {
                            const meta = ACTION_META[action] || { icon: Zap, title: action, color: 'var(--text-muted)' };
                            const ActionIcon = meta.icon;
                            return (
                              <span
                                key={actionIdx}
                                title={meta.title}
                                className="cursor-help flex items-center justify-center rounded"
                                style={{ width: '20px', height: '20px', background: meta.color + '18' }}
                              >
                                <ActionIcon size={11} style={{ color: meta.color }} />
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 10. Override marker */}
                      <td className="px-6 py-2 text-center">
                        {hasOverride ? (
                          <AlertCircle size={14} className="text-[var(--medium)] mx-auto cursor-help" title="Supervisor Override Applied" />
                        ) : null}
                      </td>

                      {/* 11. Details Link */}
                      <td className="px-6 py-2">
                        <RouterLink
                          to={`/incidents/${inc._id}`}
                          className="px-2.5 py-1 bg-[var(--border)] text-[var(--text-secondary)] hover:text-white rounded transition-all hover:bg-[var(--bg-card-hover)] hover:scale-105 font-bold inline-flex items-center"
                          style={{ fontSize: 'var(--caption-size)' }}
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

          {/* PAGINATION PANEL */}
          <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 select-none" style={{ fontSize: 'var(--caption-size)' }}>
            {/* Left buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={13} />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
              <span className="text-[var(--text-secondary)] font-semibold ml-2">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {/* Jump input */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-semibold">Jump to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Page..."
                className="w-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-bold"
                style={{ fontSize: 'var(--caption-size)' }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-card-hover)] font-bold transition cursor-pointer"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}