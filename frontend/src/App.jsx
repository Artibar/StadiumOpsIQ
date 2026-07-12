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
    <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 bg-[var(--bg-card)] border-b border-[var(--border)]" style={{ height: '64px' }}>
      {/* Left Section */}
      <Link to="/" className="flex flex-col justify-center select-none decoration-none text-[var(--text-primary)] hover:opacity-90">
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
          <span>🏟️</span> StadiumOps IQ
        </span>
        <span className="text-[12px] text-[var(--text-muted)] font-medium leading-none mt-0.5">
          FIFA World Cup 2026 Operations
        </span>
      </Link>

      {/* Center Section (Nav Links) */}
      <div className="flex items-center h-full gap-8">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center h-full text-sm font-semibold tracking-wide border-b-2 transition duration-200 ${
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
            `flex items-center h-full text-sm font-semibold tracking-wide border-b-2 transition duration-200 ${
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
          className={`w-2.5 h-2.5 rounded-full pulsing-dot ${
            isOnline ? 'bg-[var(--low)]' : 'bg-[var(--critical)]'
          }`}
          style={{
            boxShadow: isOnline 
              ? '0 0 8px var(--low)' 
              : '0 0 8px var(--critical)'
          }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
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
          © {new Date().getFullYear()} StadiumOps IQ • PromptWars Challenge 4 Team • Powered by Groq & MongoDB Atlas
        </footer>
      </div>
    </BrowserRouter>
  );
}
