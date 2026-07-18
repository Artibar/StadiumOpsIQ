import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Shield, AlertTriangle, Users, BarChart2, RotateCcw, HelpCircle, Radio,
  Bell, Settings, Plus, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Command Center', icon: Shield, to: '/' },
  { label: 'Incidents', icon: AlertTriangle, to: '/audit' },
  { label: 'Resources', icon: Users, to: null },
  { label: 'Analytics', icon: BarChart2, to: null },
  { label: 'Archives', icon: RotateCcw, to: null }
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  const isDashboard = location.pathname === '/';
  const isAuditLog = location.pathname.startsWith('/audit');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      {/*
        Layout-only styles. Global theme tokens (colors, spacing, radii) and the
        shared .soft-input / .soft-button / .soft-label / .surface-card / .hover-lift
        / .page-container utility classes now live exclusively in index.css.
        This block only adds the nav/sidebar-specific pieces that index.css doesn't cover.
      */}
      <style>{`
        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px; text-decoration: none;
          font-size: 12.5px; font-weight: 700; color: var(--text-secondary);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .nav-link:hover { background: rgba(148,163,184,0.06); color: var(--text-primary); }
        .nav-link.active { background: var(--accent); color: #fff; }
        .nav-link.disabled { opacity: 0.4; cursor: not-allowed; }

        @keyframes livePulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }

        @media (max-width: 900px) {
          .sidebar-desktop { display: none !important; }
          .topbar-title { display: none !important; }
        }
        @media (min-width: 901px) {
          .mobile-only { display: none !important; }
        }
      `}</style>

      {/* ---- Mobile off-canvas sidebar ---- */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: mobileNavOpen ? 0 : '-280px',
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'left 0.2s ease',
          overflowY: 'auto'
        }}
      >
        <SidebarContent onNavigate={() => setMobileNavOpen(false)} isDashboard={isDashboard} isAuditLog={isAuditLog} />
      </aside>

      {/* ---- Desktop sidebar ---- */}
      <aside
        className="sidebar-desktop"
        style={{
          width: '260px',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        <SidebarContent isDashboard={isDashboard} isAuditLog={isAuditLog} />
      </aside>

      {/* ---- Main column ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(10,15,26,0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--border)',
            padding: '20px 28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
              <button
                className="soft-button mobile-only"
                onClick={() => setMobileNavOpen(true)}
                style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                aria-label="Open menu"
              >
                <Menu size={16} />
              </button>
              <h1 className="topbar-title" style={{ margin: 0, fontSize: 'var(--title-size)', fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                Command Station 04
              </h1>
              <nav style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <NavLink
                  to="/"
                  end
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: isDashboard ? 'underline' : 'none',
                    textUnderlineOffset: '6px',
                    color: isDashboard ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/audit"
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: isAuditLog ? 'underline' : 'none',
                    textUnderlineOffset: '6px',
                    color: isAuditLog ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  Audit Log
                </NavLink>
              </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isOnline ? 'var(--low)' : 'var(--critical)',
                  border: `1px solid ${isOnline ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                  background: isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  borderRadius: '999px',
                  padding: '6px 12px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span
                  className="pulsing-dot"
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? 'var(--low)' : 'var(--critical)' }}
                />
                {isOnline ? 'System Online' : 'System Offline'}
              </span>
              <button className="soft-button" style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Notifications">
                <Bell size={14} />
              </button>
              <button className="soft-button" style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Settings">
                <Settings size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '0 28px', maxWidth: '1500px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>

        {/* Status footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            padding: '14px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 20px',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.06em'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
            <span>ENCRYPTION: AES-256 ACTIVE</span>
            <span>LATENCY: 14MS</span>
            <span>UPTIME: 14D 02H 14M</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--low)' }}>
            <Radio size={11} />
            SECURE TERMINAL ALPHA
          </span>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate, isDashboard, isAuditLog }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <Link to="/" onClick={onNavigate} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '19px', fontWeight: 800, color: '#fff', lineHeight: 1.15, display: 'block' }}>
            StadiumOps<br />IQ
          </span>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="soft-button"
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid var(--border)', borderRadius: '10px', padding: '10px',
          marginBottom: '18px', background: 'rgba(148,163,184,0.04)'
        }}
      >
        <div
          style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), #4338ca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff'
          }}
        >
          CS
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>CS-04</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Dispatcher</div>
        </div>
      </div>

      <Link
        to="/"
        onClick={onNavigate}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: '12px',
          padding: '12px', borderRadius: '12px', textDecoration: 'none', marginBottom: '26px'
        }}
      >
        <Plus size={14} />
        New Dispatch
      </Link>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.to === '/' ? isDashboard : item.to === '/audit' ? isAuditLog : false;
          if (!item.to) {
            return (
              <span key={item.label} className="nav-link disabled" title="Coming soon">
                <item.icon size={15} />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: '26px', borderTop: '1px solid var(--border)', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span className="nav-link disabled" title="Coming soon">
          <HelpCircle size={15} />
          Support
        </span>
        <span className="nav-link disabled" title="Coming soon">
          <Radio size={15} />
          System Status
        </span>
      </div>
    </>
  );
}