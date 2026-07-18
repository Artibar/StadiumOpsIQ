import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, Wifi, Bell, Settings } from 'lucide-react';
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
    <div className="page-container" style={{ padding: 'var(--section-spacing) 0' }}>
      {/* ---- Theme tokens: terminal / command-center palette ---- */}
      <style>{`
        .page-container {
          --font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
          --bg-primary: #090d16;
          --bg-card: linear-gradient(180deg, rgba(17,23,38,0.92), rgba(9,13,22,0.98));
          --border: rgba(148,163,184,0.16);
          --text-primary: #e9edf6;
          --text-secondary: #93a1b8;
          --text-muted: #5b667c;
          --accent: #8b7cf6;
          --accent-soft: rgba(139,124,246,0.12);
          --critical: #ff5470;
          --high: #ff9f43;
          --medium: #ffcc66;
          --low: #2dd4d4;
          --card-radius: 12px;
          --card-padding: 22px;
          --section-spacing: 26px;
          --title-size: 24px;
          --section-title-size: 15px;
          --body-size: 13.5px;
          --caption-size: 10.5px;
          --kpi-size: 32px;
          --medical: #2dd4d4;
          --security: #ff9f43;
          --crowd: #a78bfa;
          --fire: #ff5470;
          --weather: #38bdf8;
          --lost-item: #f5b942;
          --other: #94a3b8;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }
        .soft-input {
          background: rgba(6,9,16,0.85);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-mono);
        }
        .soft-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
        .soft-button {
          background: rgba(148,163,184,0.06);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .soft-button:hover { border-color: var(--accent); color: var(--text-primary); }
        .surface-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--card-radius);
        }
        .hover-lift { transition: transform 0.18s ease, border-color 0.18s ease; }
        .hover-lift:hover { transform: translateY(-2px); }

        @keyframes livePulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ---- Command-station header bar ---- */}
      <div
        className="mb-6 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="m-0" style={{ fontSize: 'var(--title-size)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Operations Control Center
          </h1>
          <span
            className="rounded-full px-2.5 py-1 font-bold uppercase"
            style={{
              fontSize: '9px',
              letterSpacing: '0.18em',
              color: 'var(--low)',
              border: '1px solid rgba(45,212,212,0.35)',
              background: 'rgba(45,212,212,0.08)'
            }}
          >
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: 'var(--low)', animation: 'livePulseDot 1.8s ease-in-out infinite' }}
            />
            System Online
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 md:flex"
            style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)' }}
          >
            <Wifi size={11} className="text-[var(--low)]" />
            FIFA World Cup 2026 Ops Network
          </span>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            disabled={loading}
            className="soft-button flex items-center gap-2 px-3.5 py-2 font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-wait"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} style={{ color: loading ? 'var(--accent)' : undefined }} />
            <span>{loading ? 'SYNCING...' : 'SYNC LIVE DATA'}</span>
          </button>
          <button className="soft-button flex h-[34px] w-[34px] items-center justify-center" aria-label="Notifications">
            <Bell size={14} />
          </button>
          <button className="soft-button flex h-[34px] w-[34px] items-center justify-center" aria-label="Settings">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 flex items-center gap-2 rounded-xl border p-4 font-semibold"
          style={{
            fontSize: 'var(--caption-size)',
            animation: 'bannerIn 0.25s ease',
            borderColor: 'rgba(255,84,112,0.3)',
            background: 'rgba(255,84,112,0.08)',
            color: 'var(--critical)'
          }}
          aria-live="assertive"
        >
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      <StatsBar stats={stats} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[4fr_6fr]">
        <div className="surface-card p-[var(--card-padding)]" style={{ animation: 'gridIn 0.4s ease both' }}>
          <IncidentForm stadiums={stadiums} onIncidentCreated={handleIncidentCreated} />
        </div>

        <div className="surface-card p-[var(--card-padding)]" style={{ animation: 'gridIn 0.4s ease both', animationDelay: '80ms' }}>
          <IncidentFeed incidents={incidents} onRefresh={fetchData} lastUpdated={lastUpdated} />
        </div>
      </div>
    </div>
  );
}