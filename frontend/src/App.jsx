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
        const baseURL = import.meta.env.VITE_API_URL || 'https://stadiumopsiq.onrender.com';
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border)]" style={{ height: '56px' }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        height: '100%',
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center'
      }}>
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 select-none decoration-none text-[var(--text-primary)] hover:opacity-90">
            <Shield size={18} className="text-[var(--accent)]" />
            <span className="text-sm font-black tracking-tight text-white">
              StadiumOps IQ
            </span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)] font-bold tracking-wider uppercase">
            FIFA 2026
          </span>
        </div>

        {/* Center Section (Nav Links) */}
        <div className="flex items-center h-full gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center h-full text-[11px] uppercase tracking-wider font-bold border-b-2 transition duration-200 ${
                isActive
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`
            }
            style={{ height: '56px' }}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `flex items-center h-full text-[11px] uppercase tracking-wider font-bold border-b-2 transition duration-200 ${
                isActive
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`
            }
            style={{ height: '56px' }}
          >
            Audit Log
          </NavLink>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 select-none justify-self-end">
          <span
            className={`w-2 h-2 rounded-full pulsing-dot ${
              isOnline ? 'bg-[var(--low)]' : 'bg-[var(--critical)]'
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hide-mobile">
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
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Fixed Header */}
        <Navbar />

        {/* Offset fixed navbar */}
        <main className="flex-grow pt-14" style={{ paddingBottom: '32px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </main>

        {/* Simple Operations Footer */}
        <footer className="py-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-t border-[var(--border)] bg-[var(--bg-card)]">
          © {new Date().getFullYear()} StadiumOps IQ • Operational Intelligence Command Center
        </footer>
      </div>
    </BrowserRouter>
  );
}
