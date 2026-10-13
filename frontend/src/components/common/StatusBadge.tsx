import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'NEW':
      case 'UNASSIGNED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TRIAGED':
      case 'IN_REVIEW':
      case 'INVESTIGATING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CONTAINED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'RESOLVED':
      case 'APPROVED':
      case 'ACTIVE':
      case 'HEALTHY':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CLOSED':
      case 'REVOKED':
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'REJECTED':
      case 'CRITICAL':
      case 'SUSPICIOUS':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-bold border rounded-full ${pad} ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {normalized}
    </span>
  );
};
