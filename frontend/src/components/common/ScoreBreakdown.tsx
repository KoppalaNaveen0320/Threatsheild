import React from 'react';

interface ComponentBreakdown {
  quality_contribution: number;
  trust_contribution: number;
  relevance_contribution: number;
  freshness_contribution: number;
  graph_centrality_contribution: number;
  sighting_contribution: number;
}

interface ScoreBreakdownProps {
  score: number;
  classification: string;
  breakdown?: ComponentBreakdown;
  reasons?: string[];
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  score,
  classification,
  breakdown,
  reasons = []
}) => {
  const getClassificationColor = (cls: string) => {
    switch (cls) {
      case 'CRITICAL_ALERT':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'HIGH_PRIORITY':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'ELEVATED_MONITORING':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const factors = [
    { label: 'Quality Score (Q)', weight: 'w1 = 0.25', val: breakdown?.quality_contribution ?? 0, max: 0.25, color: 'bg-blue-600' },
    { label: 'Source Trust (T)', weight: 'w2 = 0.20', val: breakdown?.trust_contribution ?? 0, max: 0.20, color: 'bg-emerald-600' },
    { label: 'Sector Relevance (R)', weight: 'w3 = 0.20', val: breakdown?.relevance_contribution ?? 0, max: 0.20, color: 'bg-indigo-600' },
    { label: 'Freshness Decay (F)', weight: 'w4 = 0.15', val: breakdown?.freshness_contribution ?? 0, max: 0.15, color: 'bg-cyan-600' },
    { label: 'Graph Centrality (G)', weight: 'w5 = 0.10', val: breakdown?.graph_centrality_contribution ?? 0, max: 0.10, color: 'bg-purple-600' },
    { label: 'Sighting Frequency (S)', weight: 'w6 = 0.10', val: breakdown?.sighting_contribution ?? 0, max: 0.10, color: 'bg-amber-600' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ThreatShield Decision Score v2 (TS_v2)
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
            {score.toFixed(4)} <span className="text-base text-slate-400 font-normal">/ 1.0000</span>
          </div>
        </div>

        <div>
          <span className={`px-3 py-1.5 text-xs font-bold border rounded-full ${getClassificationColor(classification)}`}>
            {classification}
          </span>
        </div>
      </div>

      {/* 6 Factors Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factors.map((f, idx) => {
          const pct = Math.min(100, Math.max(0, (f.val / f.max) * 100));
          return (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{f.label}</span>
                <span className="font-mono font-bold text-slate-900">{f.val.toFixed(4)}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${f.color} rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{f.weight}</span>
                <span>Max: {f.max.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explainability Rationales */}
      {reasons.length > 0 && (
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
          <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
            <span>💡</span> Why is this threat important?
          </div>
          <ul className="text-xs text-indigo-900 space-y-1 list-disc list-inside font-medium leading-relaxed">
            {reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
