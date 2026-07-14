import React from 'react';
import { BarChart2, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Percent } from 'lucide-react';

export default function StatsBar({ stats }) {
  const kpiSkeleton = [...Array(6)].map((_, i) => (
    <div key={i} className="animate-pulse" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--card-radius)',
      height: '96px'
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
          <div key={index} className="hover-lift" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderTop: `4px solid ${card.color}`,
            borderRadius: 'var(--card-radius)',
            padding: 'var(--card-padding)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '96px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            cursor: 'default'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <span style={{
                fontSize: 'var(--caption-size)',
                color: 'var(--text-secondary)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {card.label}
              </span>
              <IconComponent size={14} style={{ color: card.color }} />
            </div>
            <div style={{
              fontSize: 'var(--kpi-size)',
              fontWeight: '600',
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
