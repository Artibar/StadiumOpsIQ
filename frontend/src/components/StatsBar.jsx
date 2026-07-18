import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Percent, Hourglass } from 'lucide-react';

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
        background: 'linear-gradient(180deg, rgba(17,23,38,0.96), rgba(9,13,22,0.98))',
        border: `1px solid ${card.color}4d`,
        borderRadius: 'var(--card-radius)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '104px',
        overflow: 'hidden',
        cursor: 'default',
        boxShadow: isCritical
          ? `0 0 0 1px ${card.color}33, 0 12px 30px rgba(0,0,0,0.28)`
          : '0 10px 24px rgba(0,0,0,0.22)',
        animation: `statCardIn 0.45s ease both`,
        animationDelay: `${index * 60}ms`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {card.label}
          {isCritical && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: card.color,
                animation: 'pulseDot 1.4s ease-in-out infinite'
              }}
            />
          )}
        </span>
        <card.icon size={14} style={{ color: card.color, opacity: 0.85 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: 'var(--kpi-size)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {typeof card.value === 'number' ? String(displayValue).padStart(card.pad || 0, '0') : card.value}
        </span>
        {(card.suffix || card.SuffixIcon) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: card.suffixColor || 'var(--text-muted)'
            }}
          >
            {card.SuffixIcon && <card.SuffixIcon size={12} />}
            {card.suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function StatsBar({ stats }) {
  const kpiSkeleton = [...Array(6)].map((_, i) => (
    <div
      key={i}
      className="animate-pulse"
      style={{
        background: 'linear-gradient(180deg, rgba(17,23,38,0.98), rgba(9,13,22,0.98))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        height: '104px'
      }}
    />
  ));

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" style={{ padding: '8px 0' }}>
        {kpiSkeleton}
      </div>
    );
  }

  const confidencePct = Math.round((stats.avgConfidence || 0) * 100);
  const confidenceLabel = confidencePct >= 90 ? 'Optimal' : confidencePct >= 75 ? 'Good' : confidencePct >= 50 ? 'Fair' : 'Low';
  const highCount = stats.bySeverity?.high ?? 0;
  const criticalCount = stats.bySeverity?.critical ?? 0;

  const cards = [
    { label: 'Total', value: stats.totalIncidents ?? 0, color: 'var(--accent)', icon: BarChart2 },
    { label: 'Critical', value: criticalCount, color: 'var(--critical)', icon: ShieldAlert, pad: 2, suffix: criticalCount > 0 ? 'Alert' : 'Clear', suffixColor: criticalCount > 0 ? 'var(--critical)' : 'var(--text-muted)' },
    { label: 'High', value: highCount, color: 'var(--high)', icon: AlertTriangle, pad: 2, suffix: highCount > 0 ? 'Active' : 'Clear', suffixColor: highCount > 0 ? 'var(--high)' : 'var(--text-muted)' },
    { label: 'Pending', value: stats.byStatus?.['pending-confirmation'] ?? 0, color: 'var(--low)', icon: Clock, pad: 2, SuffixIcon: Hourglass, suffixColor: 'var(--low)' },
    { label: 'Resolved', value: stats.byStatus?.resolved ?? 0, color: '#cbd5e1', icon: CheckCircle2, SuffixIcon: CheckCircle2, suffixColor: 'var(--low)' },
    { label: 'Avg Confidence', value: confidencePct + '%', color: '#cbd5e1', icon: Percent, suffix: confidenceLabel, suffixColor: confidencePct >= 75 ? 'var(--low)' : confidencePct >= 50 ? 'var(--medium)' : 'var(--critical)' }
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