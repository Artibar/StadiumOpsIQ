import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';
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
      <style>{`
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
        @keyframes titleIconSpin {
          0%, 92%, 100% { transform: rotate(0deg); }
          96% { transform: rotate(12deg); }
        }
      `}</style>

      {/* Header section with live stats status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-6" style={{ marginBottom: 'var(--section-spacing)' }}>
        <div>
          <h1 className="font-semibold tracking-tight text-white flex items-center gap-2.5" style={{ fontSize: 'var(--title-size)', margin: 0 }}>
            <Activity size={24} className="text-[var(--accent)]" style={{ animation: 'titleIconSpin 6s ease-in-out infinite' }} />
            <span>Operations Control Center</span>
            <span
              className="rounded bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/20 tracking-wider px-2.5 py-1 flex items-center gap-1.5"
              style={{ fontSize: 'var(--caption-size)' }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
                animation: 'livePulseDot 1.8s ease-in-out infinite'
              }} />
              LIVE
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 font-medium flex items-center gap-1.5" style={{ fontSize: 'var(--caption-size)' }}>
            <Wifi size={11} className="text-[var(--low)]" />
            Real-time decision support for FIFA World Cup 2026 operations staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold transition-all duration-200 cursor-pointer active:scale-95 disabled:cursor-wait"
            style={{ fontSize: 'var(--caption-size)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} style={{ color: loading ? 'var(--accent)' : undefined }} />
            <span>{loading ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-4 bg-[var(--critical)]/10 border border-[var(--critical)]/25 text-[var(--critical)] rounded-lg font-semibold flex items-center gap-2"
          style={{ marginBottom: 'var(--section-spacing)', fontSize: 'var(--caption-size)', animation: 'bannerIn 0.25s ease' }}
          aria-live="assertive"
        >
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* 40% / 60% Two Column Grid - stretch matching height */}
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_6fr]" style={{ gap: 'var(--grid-gap)', marginTop: 'var(--section-spacing)' }}>
        {/* Left — Incident Form */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderTop: '4px solid var(--accent)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          animation: 'gridIn 0.4s ease both'
        }}>
          <IncidentForm 
            stadiums={stadiums}
            onIncidentCreated={handleIncidentCreated} />
        </div>

        {/* Right — Incident Feed */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderTop: '4px solid var(--accent)',
          borderRadius: 'var(--card-radius)',
          padding: 'var(--card-padding)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          animation: 'gridIn 0.4s ease both',
          animationDelay: '80ms'
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