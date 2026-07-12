import React from 'react';

export default function ReasoningTrail({ trail }) {
  if (!trail || trail.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center text-slate-500 text-sm">
        No reasoning trail recorded for this incident.
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
      {trail.map((step, idx) => {
        // Determine agent accent colors
        let accentClass = 'bg-slate-800 border-slate-700 text-slate-300';
        let badgeIcon = '🤖';
        
        const name = (step.agentName || "").toLowerCase();
        if (name.includes('intake')) {
          accentClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
          badgeIcon = '📥';
        } else if (name.includes('classification')) {
          accentClass = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
          badgeIcon = '🏷️';
        } else if (name.includes('context')) {
          accentClass = 'bg-teal-500/10 border-teal-500/30 text-teal-400';
          badgeIcon = '⛅';
        } else if (name.includes('decision')) {
          accentClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
          badgeIcon = '⚖️';
        } else if (name.includes('human')) {
          accentClass = 'bg-purple-500/15 border-purple-500/30 text-purple-400';
          badgeIcon = '👤';
        }

        return (
          <div key={idx} className="relative group">
            {/* Dot indicator */}
            <div className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-lg ${accentClass}`}>
              {badgeIcon}
            </div>

            {/* Content card */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 shadow-sm transition duration-150">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  {step.agentName}
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-normal">
                    Step {step.step || idx + 1}
                  </span>
                </h4>
                {step.timestamp && (
                  <span className="text-[10px] text-slate-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Thought block */}
              {step.thought && (
                <div className="mb-3 text-slate-300 text-sm italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                  "{step.thought}"
                </div>
              )}

              {/* Action and Result row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t border-slate-800/40 pt-2.5">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[9px]">Action taken</span>
                  <span className="text-slate-300 font-medium">{step.action || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider font-semibold text-[9px]">Result</span>
                  <span className="text-slate-200 font-semibold">{step.result || 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
