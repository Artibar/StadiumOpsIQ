import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
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
    <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 bg-[var(--bg-card)] border-b border-[var(--border)]" style={{ height: '56px' }}>
      {/* Left Section */}
      <Link to="/" className="flex items-center gap-2 select-none decoration-none text-[var(--text-primary)] hover:opacity-90">
        <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
          <span>🏟️</span> StadiumOps IQ
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)] font-medium leading-none hide-mobile">
          FIFA 2026
        </span>
      </Link>

      {/* Center Section (Nav Links) */}
      <div className="flex items-center h-full gap-8">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center h-full text-xs uppercase tracking-wider font-bold border-b-2 transition duration-200 ${
              isActive
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `flex items-center h-full text-xs uppercase tracking-wider font-bold border-b-2 transition duration-200 ${
              isActive
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`
          }
        >
          Audit Log
        </NavLink>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 select-none">
        <span
          className={`w-2 h-2 rounded-full pulsing-dot ${
            isOnline ? 'bg-[var(--low)]' : 'bg-[var(--critical)]'
          }`}
          style={{
            boxShadow: isOnline 
              ? '0 0 6px var(--low)' 
              : '0 0 6px var(--critical)'
          }}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hide-mobile">
          {isOnline ? 'System Online' : 'System Offline'}
        </span>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        {/* Fixed Header */}
        <Navbar />

        {/* Padding-top of 64px to offset fixed navbar */}
        <main className="flex-grow pt-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </main>

        {/* Simple Operations Footer */}
        <footer className="py-4 text-center text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-t border-[var(--border)] bg-[var(--bg-primary)]">
          © {new Date().getFullYear()} StadiumOps IQ • Operational Intelligence Command Center
        </footer>
      </div>
    </BrowserRouter>
  );
}
