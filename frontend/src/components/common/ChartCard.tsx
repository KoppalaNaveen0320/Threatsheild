import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  headerAction,
  children,
  className = '',
  style
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xs)',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            {badge && (
              <span className="badge badge-sm badge-info">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', marginBottom: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerAction && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {headerAction}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
};
