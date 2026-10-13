import React from 'react';

interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subtext?: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  badge?: string;
  icon?: React.ReactNode | React.FC<any> | string;
  loading?: boolean;
  alertLevel?: 'normal' | 'warning' | 'critical';
  accentColor?: string;
  accentBg?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  subtext,
  subtitle,
  trend,
  trendDirection,
  icon,
  loading = false,
  alertLevel = 'normal',
  onClick
}) => {
  const displayLabel = label || title || '';
  const displaySubtext = subtext || subtitle;

  const getAlertBorder = () => {
    switch (alertLevel) {
      case 'critical':
        return 'border-rose-300 bg-rose-50/40 hover:border-rose-400';
      case 'warning':
        return 'border-amber-300 bg-amber-50/40 hover:border-amber-400';
      default:
        return 'border-slate-200 bg-white hover:border-slate-300';
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'down':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="text-xl">{icon}</span>;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as React.FC<{ size?: number }>;
      return <IconComponent size={20} />;
    }
    return icon;
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all duration-150 shadow-xs flex flex-col justify-between space-y-2 ${getAlertBorder()} ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
          {displayLabel}
        </span>
        {icon && (
          <div className="text-slate-400 shrink-0">
            {renderIcon()}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md my-1" />
        ) : (
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {value}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
        {displaySubtext && (
          <span className="text-[11px] text-slate-400 font-medium truncate">
            {displaySubtext}
          </span>
        )}
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
