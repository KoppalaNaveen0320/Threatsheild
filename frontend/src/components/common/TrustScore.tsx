import React from 'react';

interface TrustScoreProps {
  score: number;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const TrustScore: React.FC<TrustScoreProps> = ({
  score,
  showBar = true,
  size = 'md',
  compact = false
}) => {
  const clamped = Math.max(0, Math.min(1, Number(score) || 0));
  const percentage = (clamped * 100).toFixed(0);

  let color = 'var(--color-critical)';
  let tier = 'Untrusted';

  if (clamped >= 0.8) {
    color = 'var(--color-success)';
    tier = 'High Trust';
  } else if (clamped >= 0.5) {
    color = 'var(--primary-blue)';
    tier = 'Established';
  } else if (clamped >= 0.3) {
    color = 'var(--color-warning)';
    tier = 'Probationary';
  }

  if (compact) {
    return (
      <span
        className="font-mono"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 700,
          color,
          fontSize: size === 'sm' ? '11px' : '12px'
        }}
        title={`Reputation Trust Score: ${(clamped * 100).toFixed(1)}% (${tier})`}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
        <span>{percentage}%</span>
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span className="font-mono" style={{ fontSize: size === 'sm' ? '11.5px' : '13px', fontWeight: 700, color }}>
          {percentage}%
        </span>
        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {tier}
        </span>
      </div>

      {showBar && (
        <div style={{ width: '100%', height: size === 'sm' ? '4px' : '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      )}
    </div>
  );
};
