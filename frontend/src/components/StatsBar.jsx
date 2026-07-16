import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Percent, Radio } from 'lucide-react';

// Lightweight count-up — purely presentational, driven by the same stat value
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const isNumeric = typeof target === 'number';

  useEffect(() => {
    if (!isNumeric) return;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, isNumeric, duration]);

  return isNumeric ? value : target;
}

function StatCard({ card, index }) {
  const displayValue = useCountUp(card.value);
  const isCritical = card.label === 'Critical' && typeof card.value === 'number' && card.value > 0;

  return (
    <div
      className="hover-lift"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(255,255,255,0.02) 100%)',
        border: isCritical ? `1px solid ${card.color}` : '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        padding: 'var(--card-padding)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '108px',
        overflow: 'hidden',
        cursor: 'default',
        backdropFilter: 'blur(6px)',
        boxShadow: isCritical
          ? `0 0 0 1px ${card.color}33, 0 0 24px ${card.color}40, 0 4px 14px rgba(0,0,0,0.35)`
          : '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        animation: `statCardIn 0.45s ease both`,
        animationDelay: `${index * 60}ms`
      }}
    >
      {/* ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-30%',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: card.color,
        opacity: isCritical ? 0.18 : 0.09,
        filter: 'blur(24px)',
        pointerEvents: 'none'
      }} />

      {/* diagonal scan sheen */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(115deg, transparent 40%, ${card.color}14 50%, transparent 60%)`,
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        position: 'relative'
      }}>
        <span style={{
          fontSize: 'var(--caption-size)',
          color: 'var(--text-secondary)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {card.label}
          {isCritical && (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: card.color,
              animation: 'pulseDot 1.4s ease-in-out infinite',
              boxShadow: `0 0 6px ${card.color}`
            }} />
          )}
        </span>
        <card.icon
          size={15}
          style={{
            color: card.color,
            filter: isCritical ? `drop-shadow(0 0 4px ${card.color})` : 'none'
          }}
        />
      </div>

      <div style={{
        fontSize: 'var(--kpi-size)',
        fontWeight: '800',
        color: '#fff',
        lineHeight: '1',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
        position: 'relative',
        textShadow: isCritical ? `0 0 18px ${card.color}80` : 'none'
      }}>
        {typeof card.value === 'number' ? displayValue : card.value}
      </div>
    </div>
  );
}

export default function StatsBar({ stats }) {
  const kpiSkeleton = [...Array(6)].map((_, i) => (
    <div key={i} className="animate-pulse" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      height: '108px'
    }} />
  ));

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" style={{ padding: '8px 0' }}>
        {kpiSkeleton}
      </div>
    );
  }

  const cards = [
    { label: 'Total Incidents', value: stats.totalIncidents ?? 0, color: 'var(--accent)', icon: BarChart2 },
    { label: 'Critical', value: stats.bySeverity?.critical ?? 0, color: 'var(--critical)', icon: ShieldAlert },
    { label: 'High', value: stats.bySeverity?.high ?? 0, color: 'var(--high)', icon: AlertTriangle },
    { label: 'Pending', value: stats.byStatus?.['pending-confirmation'] ?? 0, color: 'var(--medium)', icon: Clock },
    { label: 'Resolved', value: stats.byStatus?.resolved ?? 0, color: 'var(--low)', icon: CheckCircle2 },
    { label: 'Avg Confidence', value: Math.round((stats.avgConfidence || 0) * 100) + '%', color: 'var(--accent)', icon: Percent }
  ];

  return (
    <>
      <style>{`
        @keyframes statCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" style={{ padding: '8px 0' }}>
        {cards.map((card, index) => (
          <StatCard key={index} card={card} index={index} />
        ))}
      </div>
    </>
  );
}