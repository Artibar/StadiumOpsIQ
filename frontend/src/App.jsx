import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import IncidentDetail from './pages/IncidentDetail.jsx';
import AuditLog from './pages/AuditLog.jsx';

function Navbar() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const baseURL = typeof window !== 'undefined' && window.location?.hostname === 'localhost'
          ? 'http://localhost:5000'
          : (import.meta.env.VITE_API_URL || 'https://stadiumopsiq.onrender.com');
        const res = await fetch(`${baseURL}/api/incidents`, { method: 'GET' });
        setIsOnline(res.status === 200);
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[rgba(10,15,26,0.92)] backdrop-blur-sm" style={{ height: '64px' }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: '100%',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 select-none decoration-none text-[var(--text-primary)] hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--accent-soft)]">
              <Shield size={16} className="text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-white">
                StadiumOps IQ
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Enterprise Command Center
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center h-full gap-4 md:gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center h-full text-[11px] uppercase tracking-[0.16em] font-bold border-b-2 transition duration-200 ${
                isActive
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`
            }
            style={{ height: '64px' }}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `flex items-center h-full text-[11px] uppercase tracking-[0.16em] font-bold border-b-2 transition duration-200 ${
                isActive
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`
            }
            style={{ height: '64px' }}
          >
            Audit Log
          </NavLink>
        </div>

        <div className="flex items-center gap-2 select-none justify-self-end">
          <span className={`w-2 h-2 rounded-full pulsing-dot ${isOnline ? 'bg-[var(--low)]' : 'bg-[var(--critical)]'}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] hide-mobile">
            {isOnline ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />

        <main className="flex-1 pt-16 pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </main>

        <footer className="border-t border-[var(--border)] bg-[rgba(10,15,26,0.75)] py-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          © {new Date().getFullYear()} StadiumOps IQ • Operational Intelligence Command Center
        </footer>
      </div>
    </BrowserRouter>
  );
}
