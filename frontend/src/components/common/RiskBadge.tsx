import React from 'react';

interface RiskBadgeProps {
  score: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  let label = 'LOW';
  let color = 'bg-emerald-50 text-emerald-800 border-emerald-200';

  if (score >= 75) {
    label = 'CRITICAL';
    color = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (score >= 50) {
    label = 'HIGH';
    color = 'bg-orange-50 text-orange-800 border-orange-200';
  } else if (score >= 25) {
    label = 'MEDIUM';
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border rounded-full ${color}`}>
      <span>Risk {score.toFixed(1)}/100</span>
      <span className="opacity-70 font-semibold uppercase">({label})</span>
    </span>
  );
};
