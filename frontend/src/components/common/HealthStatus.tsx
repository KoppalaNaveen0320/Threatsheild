import React from 'react';

interface HealthStatusProps {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | string;
  label?: string;
  size?: 'sm' | 'md';
}

export const HealthStatus: React.FC<HealthStatusProps> = ({
  status,
  label,
  size = 'md'
}) => {
  const normalized = (status || '').toUpperCase();
  let dotColor = 'var(--color-success)';
  let text = label || 'Operational';

  if (normalized === 'DEGRADED') {
    dotColor = 'var(--color-warning)';
    text = label || 'Degraded';
  } else if (normalized === 'UNAVAILABLE' || normalized === 'DOWN') {
    dotColor = 'var(--color-critical)';
    text = label || 'Unavailable';
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: size === 'sm' ? '6px' : '8px',
          height: size === 'sm' ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0
        }}
      />
      <span style={{ fontSize: size === 'sm' ? '11px' : '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {text}
      </span>
    </div>
  );
};
