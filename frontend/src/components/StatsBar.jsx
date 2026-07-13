import React from 'react'

export default function StatsBar({ stats }) {
  if (!stats) {
    return (
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        padding: '16px 0',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            height: '80px'
          }} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Incidents',
      value: stats.totalIncidents || 0,
      color: 'var(--accent)',
      icon: '📊'
    },
    {
      label: 'Critical',
      value: stats.bySeverity?.critical || 0,
      color: 'var(--critical)',
      icon: '🔴'
    },
    {
      label: 'High',
      value: stats.bySeverity?.high || 0,
      color: 'var(--high)',
      icon: '🟠'
    },
    {
      label: 'Pending',
      value: stats.byStatus?.['pending-confirmation'] || 0,
      color: 'var(--medium)',
      icon: '⏳'
    },
    {
      label: 'Resolved',
      value: stats.byStatus?.resolved || 0,
      color: 'var(--low)',
      icon: '✅'
    },
    {
      label: 'Avg Confidence',
      value: Math.round(
        (stats.avgConfidence || 0) * 100
      ) + '%',
      color: 'var(--accent)',
      icon: '🎯'
    }
  ]

  return (
    <div className="stats-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '12px',
      padding: '16px 0',
    }}>
      {cards.map((card, index) => (
        <div key={index} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: card.color,
            lineHeight: '1'
          }}>
            {card.value}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span>{card.icon}</span>
            <span>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
