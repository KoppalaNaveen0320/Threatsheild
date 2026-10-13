import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  badgeColor?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
  actions?: React.ReactNode;
  breadcrumb?: {
    section: string;
    page: string;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  badge,
  badgeColor = 'blue',
  actions,
  breadcrumb
}) => {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const displayText = description || subtitle;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="space-y-1">
        {breadcrumb && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
            {breadcrumb.section} / {breadcrumb.page}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {badge && (
            typeof badge === 'string' ? (
              <span className={`px-2.5 py-0.5 text-[11px] font-bold border rounded-full ${getBadgeStyle()}`}>
                {badge}
              </span>
            ) : (
              badge
            )
          )}
        </div>
        {displayText && (
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            {displayText}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
