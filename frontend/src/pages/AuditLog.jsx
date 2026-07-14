import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Download, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, FilterX, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 0' }}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="tracking-tight text-white flex items-center gap-2.5 font-black" style={{ fontSize: '32px', margin: 0 }}>
            <span>Operational Audit Log</span> 
            <span className="text-[11px] px-2.5 py-1 rounded bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)] font-bold tracking-wider">{incidents.length} LEDGERS</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
            Historical audit records of language translations, climate analytics, automated actions, and supervisor approvals.
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] font-bold cursor-not-allowed opacity-50 flex items-center gap-2 transition"
        >
          <Download size={13} />
          <span>Export Log (CSV)</span>
        </button>
      </div>

      {/* FILTER ROW (All controls same height) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4" style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search query */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Search Description</label>
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
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 pl-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
                style={{ height: '36px' }}
              />
            </div>
          </div>

          {/* Severity dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] transition cursor-pointer"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] transition cursor-pointer"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] transition cursor-pointer"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Stadium</label>
            <select
              value={filterStadium}
              onChange={(e) => {
                setFilterStadium(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-xl p-2 focus:outline-none focus:border-[var(--accent)] transition cursor-pointer"
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
        <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-4 text-[11px] font-semibold">
          <span className="text-[var(--text-muted)]">
            Showing {filteredIncidents.length} of {incidents.length} logs
          </span>
          {(filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' || filterStadium !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={handleClearFilters}
              className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold flex items-center gap-1 leading-none"
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
          <span className="text-xs text-[var(--text-muted)] font-semibold">Loading Database Ledger...</span>
        </div>
      ) : paginatedIncidents.length === 0 ? (
        /* Empty State */
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 text-center text-[var(--text-muted)]">
          <Inbox size={32} className="mx-auto mb-3" />
          <h4 className="text-sm font-bold text-[var(--text-secondary)]">No incidents match search criteria</h4>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-xs font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none sticky top-0 z-10">
                  <th
                    onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="px-6 py-4.5 cursor-pointer hover:text-white transition group"
                  >
                    Time {sortDirection === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="px-6 py-4.5">Stadium</th>
                  <th className="px-6 py-4.5">Zone</th>
                  <th className="px-6 py-4.5">Type</th>
                  <th className="px-6 py-4.5">Severity</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Confidence</th>
                  <th className="px-6 py-4.5">Language</th>
                  <th className="px-6 py-4.5">Actions</th>
                  <th className="px-6 py-4.5 text-center">Override</th>
                  <th className="px-6 py-4.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-xs select-none">
                {paginatedIncidents.map((inc) => {
                  const hasOverride = inc.humanOverride;
                  const langKey = inc.detectedLanguage || 'en';
                  const langConfig = LANGUAGE_FLAGS[langKey] || { name: 'English', label: 'EN' };

                  const rowClass = hasOverride 
                    ? 'bg-[rgba(234,179,8,0.06)] border-l-2 border-l-[var(--medium)]' 
                    : 'hover:bg-[var(--bg-card-hover)]/30';

                  return (
                    <tr key={inc._id} className={`${rowClass} transition duration-150`} style={{ height: '52px' }}>
                      {/* 1. Time */}
                      <td className="px-6 py-2 text-[var(--text-secondary)] font-mono whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      
                      {/* 2. Stadium */}
                      <td className="px-6 py-2 font-bold text-[var(--text-primary)]">
                        {inc.stadiumName}
                      </td>

                      {/* 3. Zone */}
                      <td className="px-6 py-2 text-[var(--text-secondary)]">
                        {inc.zoneLocation}
                      </td>

                      {/* 4. Type */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-wider"
                          style={{ backgroundColor: typeColors[inc.type] || 'var(--text-muted)' }}
                        >
                          {inc.type}
                        </span>
                      </td>

                      {/* 5. Severity */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-wider"
                          style={{ backgroundColor: severityColors[inc.severity] || 'var(--low)' }}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="px-6 py-2">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-white tracking-wider"
                          style={{ backgroundColor: statusColors[inc.status] || 'var(--accent)' }}
                        >
                          {statusLabels[inc.status] || inc.status}
                        </span>
                      </td>

                      {/* 7. Confidence */}
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-secondary)]">
                            {Math.round(inc.confidence * 100)}%
                          </span>
                          <div className="w-10 h-1 bg-[var(--border)] rounded overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.round(inc.confidence * 100)}%`,
                                backgroundColor: inc.confidence >= 0.8 ? 'var(--low)' : inc.confidence >= 0.6 ? 'var(--medium)' : 'var(--critical)'
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
                      <td className="px-6 py-2 max-w-[120px] truncate">
                        <div className="flex items-center gap-1.5">
                          {(inc.actionsTaken || []).map((action, actionIdx) => {
                            let icon = '⚡';
                            let title = action;
                            if (action === 'dispatchMedical') { icon = '🚑'; title = 'Medical Dispatch'; }
                            else if (action === 'escalateToSecurity') { icon = '🚔'; title = 'Security Escalation'; }
                            else if (action === 'resolveAsLowPriority') { icon = '✅'; title = 'Auto Resolved'; }
                            else if (action === 'flagForHumanReview') { icon = '🚩'; title = 'Human Review'; }
                            else if (action === 'sendDiscordNotification') { icon = '📢'; title = 'Discord Alert'; }
                            else if (action === 'sendReportEmail') { icon = '📧'; title = 'Report Emailed'; }

                            return (
                              <span key={actionIdx} title={title} className="cursor-help font-normal">
                                {icon}
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
                          className="px-2 py-1 bg-[var(--border)] text-[var(--text-secondary)] hover:text-white rounded transition hover:bg-[var(--bg-card-hover)] font-bold text-xs inline-flex items-center"
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
          <div className="bg-[var(--bg-primary)] border-t border-[var(--border)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 select-none text-xs">
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
                className="w-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-center text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] font-bold"
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
