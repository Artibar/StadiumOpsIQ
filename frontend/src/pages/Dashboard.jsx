import React, { useState, useEffect } from 'react';
import StatsBar from '../components/StatsBar.jsx';
import IncidentForm from '../components/IncidentForm.jsx';
import IncidentFeed from '../components/IncidentFeed.jsx';
import { getIncidents, getStats, getStadiums } from '../services/api.js';

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const [incidentsRes, statsRes, stadiumsRes] = await Promise.all([
        getIncidents(),
        getStats(),
        getStadiums()
      ]);

      setIncidents(Array.isArray(incidentsRes) ? incidentsRes : []);
      setStats(statsRes || null);
      setStadiums(Array.isArray(stadiumsRes) ? stadiumsRes : []);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error("Dashboard refresh error:", err.message);
      setError('Connection to backend failed. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleIncidentCreated = () => {
    fetchData();
  };

  return (
    <div className="page-container" style={{ padding: '24px 0' }}>
      {/* Header section with live stats status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span aria-hidden="true">🏟️</span> StadiumOps IQ <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold border border-[var(--accent)]/20">LIVE OPS CONTROL</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time decision support assistant for FIFA World Cup 2026 operations staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold cursor-pointer text-[var(--text-primary)] transition"
          >
            <span aria-hidden="true">🔄</span> Sync Live Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 mb-6 bg-[var(--critical)]/10 border border-[var(--critical)]/25 text-[var(--critical)] rounded-lg text-xs font-medium flex items-center gap-1.5" aria-live="assertive">
          <span aria-hidden="true">⚠️</span> {error}
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Two Column Grid */}
      <div className="dashboard-grid" style={{
        display: 'grid',
        gap: '24px',
        marginTop: '24px',
        alignItems: 'start'
      }}>
        {/* Left — Incident Form */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <IncidentForm 
            stadiums={stadiums}
            onIncidentCreated={handleIncidentCreated} />
        </div>

        {/* Right — Incident Feed */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <IncidentFeed 
            incidents={incidents}
            onRefresh={fetchData}
            lastUpdated={lastUpdated} />
        </div>
      </div>
    </div>
  );
}
