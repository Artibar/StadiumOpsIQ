import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';
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
    <div className="page-container" style={{ padding: '32px 0' }}>
      {/* Header section with live stats status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="font-black tracking-tight text-white flex items-center gap-2.5" style={{ fontSize: '32px', margin: 0 }}>
            <Activity size={28} className="text-[var(--accent)]" /> 
            <span>Operations Control Center</span> 
            <span className="text-[11px] px-2.5 py-1 rounded bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/20 tracking-wider">LIVE</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
            Real-time decision support for FIFA World Cup 2026 operations staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-bold cursor-pointer text-[var(--text-primary)] transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--critical)]/10 border border-[var(--critical)]/25 text-[var(--critical)] rounded-lg text-xs font-semibold flex items-center gap-2" style={{ marginBottom: '32px' }} aria-live="assertive">
          <AlertTriangle size={15} /> 
          <span>{error}</span>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* 40% / 60% Two Column Grid - stretch matching height */}
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-6 items-stretch" style={{ marginTop: '32px' }}>
        {/* Left — Incident Form */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <IncidentForm 
            stadiums={stadiums}
            onIncidentCreated={handleIncidentCreated} />
        </div>

        {/* Right — Incident Feed */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
