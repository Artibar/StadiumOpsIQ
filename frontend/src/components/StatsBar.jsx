import React from 'react';
import { BarChart2, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Percent } from 'lucide-react';

export default function StatsBar({ stats }) {
  const kpiSkeleton = [...Array(6)].map((_, i) => (
    <div key={i} className="animate-pulse" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      height: '92px'
    }} />
  ));

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" style={{ padding: '8px 0' }}>
        {kpiSkeleton}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Incidents',
      value: stats.totalIncidents ?? 0,
      color: 'var(--accent)',
      icon: BarChart2
    },
    {
      label: 'Critical',
      value: stats.bySeverity?.critical ?? 0,
      color: 'var(--critical)',
      icon: ShieldAlert
    },
    {
      label: 'High',
      value: stats.bySeverity?.high ?? 0,
      color: 'var(--high)',
      icon: AlertTriangle
    },
    {
      label: 'Pending',
      value: stats.byStatus?.['pending-confirmation'] ?? 0,
      color: 'var(--medium)',
      icon: Clock
    },
    {
      label: 'Resolved',
      value: stats.byStatus?.resolved ?? 0,
      color: 'var(--low)',
      icon: CheckCircle2
    },
    {
      label: 'Avg Confidence',
      value: Math.round((stats.avgConfidence || 0) * 100) + '%',
      color: 'var(--accent)',
      icon: Percent
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" style={{ padding: '8px 0' }}>
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '92px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {card.label}
              </span>
              <IconComponent size={15} style={{ color: card.color }} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '900',
              color: '#fff',
              lineHeight: '1',
              marginTop: '8px'
            }}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
