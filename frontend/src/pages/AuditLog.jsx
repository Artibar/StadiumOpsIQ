import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../services/api.js';

const LANGUAGE_FLAGS = {
  en: { name: 'English', flag: '🌐' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
  de: { name: 'German', flag: '🇩🇪' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  ta: { name: 'Tamil', flag: '🇮🇳' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  sw: { name: 'Swahili', flag: '🇰🇪' },
  mr: { name: 'Marathi', flag: '🇮🇳' },
  kn: { name: 'Kannada', flag: '🇮🇳' },
  ur: { name: 'Urdu', flag: '🇵🇰' },
  nl: { name: 'Dutch', flag: '🇳🇱' },
  ml: { name: 'Malayalam', flag: '🇮🇳' }
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
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            📋 Complete Audit Log <span className="text-xs px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)]">{incidents.length} total</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Historical ledger auditing translations, microclimate telemetry, system actions, and manual supervisor overrides.
          </p>
        </div>
        <button
          disabled
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] font-semibold cursor-not-allowed opacity-50 flex items-center gap-1.5"
        >
          📥 Export Log (CSV)
        </button>
      </div>

      {/* FILTER ROW */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search query */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Search Description / Zone</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Query report text or zone..."
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Severity dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded p-1.5 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded p-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending-confirmation">Pending</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="flagged-for-review">Flagged</option>
            </select>
          </div>

          {/* Type dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded p-1.5 focus:outline-none"
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
          </div>

          {/* Stadium dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Stadium</label>
            <select
              value={filterStadium}
              onChange={(e) => {
                setFilterStadium(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded p-1.5 focus:outline-none"
            >
              <option value="all">All Stadiums</option>
              {uniqueStadiums.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row & Clear Filters button */}
        <div className="flex items-center justify-between border-t border-[var(--border)]/40 pt-3 text-[11px] font-semibold">
          <span className="text-[var(--text-muted)]">
            Showing {filteredIncidents.length} of {incidents.length} incidents
          </span>
          {(filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' || filterStadium !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={handleClearFilters}
              className="text-[var(--accent)] hover:underline border-none bg-transparent cursor-pointer font-bold leading-none"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE REGISTER */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-[var(--text-muted)] font-semibold">Loading Database Ledger...</span>
        </div>
      ) : paginatedIncidents.length === 0 ? (
        /* Empty State */
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-12 text-center text-[var(--text-muted)]">
          <span className="text-3xl block mb-2">📭</span>
          <h4 className="text-sm font-bold text-[var(--text-secondary)]">No incidents match your filters</h4>
          <button
            onClick={handleClearFilters}
            className="mt-3.5 px-3.5 py-1.5 bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded text-xs font-semibold hover:bg-[var(--bg-card-hover)] cursor-pointer transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-primary)] border-b border-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none">
                  <th
                    onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="px-5 py-3.5 cursor-pointer hover:text-white transition group"
                  >
                    Time {sortDirection === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="px-5 py-3.5">Stadium</th>
                  <th className="px-5 py-3.5">Zone</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Confidence</th>
                  <th className="px-5 py-3.5">Language</th>
                  <th className="px-5 py-3.5">Actions</th>
                  <th className="px-5 py-3.5 text-center">Override</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-xs select-none">
                {paginatedIncidents.map((inc) => {
                  const hasOverride = inc.humanOverride;
                  const langKey = inc.detectedLanguage || 'en';
                  const langConfig = LANGUAGE_FLAGS[langKey] || { name: 'English', flag: '🌐' };

                  // Row background style override matching prompt details
                  const rowClass = hasOverride 
                    ? 'bg-[rgba(234,179,8,0.1)] border-l-2 border-l-[var(--medium)]' 
                    : 'hover:bg-[var(--bg-card-hover)]';

                  return (
                    <tr key={inc._id} className={`${rowClass} transition duration-150`}>
                      {/* 1. Time */}
                      <td className="px-5 py-3 text-[var(--text-secondary)] font-mono whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      
                      {/* 2. Stadium */}
                      <td className="px-5 py-3 font-semibold text-[var(--text-primary)]">
                        {inc.stadiumName}
                      </td>

                      {/* 3. Zone */}
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {inc.zoneLocation}
                      </td>

                      {/* 4. Type */}
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: typeColors[inc.type] || 'var(--text-muted)' }}
                        >
                          {inc.type}
                        </span>
                      </td>

                      {/* 5. Severity */}
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: severityColors[inc.severity] || 'var(--low)' }}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: statusColors[inc.status] || 'var(--accent)' }}
                        >
                          {statusLabels[inc.status] || inc.status}
                        </span>
                      </td>

                      {/* 7. Confidence */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-secondary)]">
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
                      <td className="px-5 py-3 text-[var(--text-secondary)] whitespace-nowrap font-medium">
                        <span className="mr-1">{langConfig.flag}</span> {langConfig.name}
                      </td>

                      {/* 9. Actions Badges */}
                      <td className="px-5 py-3 max-w-[120px] truncate">
                        <div className="flex items-center gap-1">
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
                              <span key={actionIdx} title={title} className="cursor-help">
                                {icon}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 10. Override marker */}
                      <td className="px-5 py-3 text-center">
                        {hasOverride ? (
                          <span title="Human Overridden" className="cursor-help text-sm">⚠️</span>
                        ) : null}
                      </td>

                      {/* 11. Details Link */}
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/incidents/${inc._id}`}
                          className="text-[var(--accent)] hover:underline font-bold text-xs"
                        >
                          →
                        </Link>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <span className="text-[var(--text-secondary)] font-medium ml-1">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {/* Jump input */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Jump to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder="Page..."
                className="w-16 bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-1 text-center text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded hover:bg-[var(--bg-card-hover)] font-semibold transition cursor-pointer"
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
