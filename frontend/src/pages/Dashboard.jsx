import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Wifi } from 'lucide-react';
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
      // The /api/stadiums endpoint proxies an external API that wraps the
      // array in a { stadiums: [...] } object rather than returning a bare
      // array, so we unwrap it here instead of checking Array.isArray on
      // the raw response (which would always be false and silently drop
      // every stadium).
      setStadiums(Array.isArray(stadiumsRes?.stadiums) ? stadiumsRes.stadiums : []);
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
      <style>{`
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Utility row: last-updated + manual sync (page context already lives in the topbar) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5" style={{ fontSize: 'var(--caption-size)', color: 'var(--text-muted)' }}>
          <Wifi size={11} className="text-[var(--low)]" />
          Last synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[4fr_6fr]">
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