import React from 'react';

export default function StatsBar({ stats }) {
  // Skeleton Loading Placeholders
  if (!stats) {
    return (
      <div className="flex flex-col md:flex-row gap-4 w-full select-none">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-[16px_20px] shadow-sm shimmer"
            style={{ minHeight: '94px' }}
          >
            <div className="h-4 bg-[var(--border)] rounded w-2/3 mb-3 animate-pulse" />
            <div className="h-8 bg-[var(--border)] rounded w-1/3 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalIncidents = 0,
    bySeverity = { low: 0, medium: 0, high: 0, critical: 0 },
    byStatus = { open: 0, 'pending-confirmation': 0, escalated: 0, resolved: 0, 'flagged-for-review': 0 },
    avgConfidence = 0
  } = stats;

  const cards = [
    {
      label: "Total Incidents",
      value: totalIncidents,
      color: "var(--accent)"
    },
    {
      label: "Critical 🔴",
      value: bySeverity.critical || 0,
      color: "var(--critical)"
    },
    {
      label: "High 🟠",
      value: bySeverity.high || 0,
      color: "var(--high)"
    },
    {
      label: "Pending ⏳",
      value: byStatus['pending-confirmation'] || 0,
      color: "var(--medium)"
    },
    {
      label: "Resolved ✅",
      value: byStatus.resolved || 0,
      color: "var(--low)"
    },
    {
      label: "Avg Confidence 🎯",
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      color: "var(--accent)"
    }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full select-none">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="flex-grow flex-shrink-0 md:flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-[16px_20px] flex flex-col justify-between shadow-sm transition hover:border-[var(--text-muted)]"
        >
          <div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider leading-none">
            {card.label}
          </div>
          <div
            className="text-[28px] font-bold tracking-tight mt-2.5 leading-none"
            style={{ color: card.color }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
