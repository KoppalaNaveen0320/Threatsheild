import React from 'react';

interface QualityScoreProps {
  score: number;
  decayFactor?: number;
  size?: 'sm' | 'md';
}

export const QualityScore: React.FC<QualityScoreProps> = ({
  score,
  size = 'md'
}) => {
  const clamped = Math.max(0, Math.min(1, Number(score) || 0));
  const percentage = (clamped * 100).toFixed(0);

  let color = 'var(--color-critical)';
  let qualityText = 'Poor';

  if (clamped >= 0.85) {
    color = 'var(--color-success)';
    qualityText = 'High Quality';
  } else if (clamped >= 0.65) {
    color = 'var(--primary-blue)';
    qualityText = 'Good';
  } else if (clamped >= 0.4) {
    color = 'var(--color-warning)';
    qualityText = 'Moderate';
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: size === 'sm' ? '8px' : '10px',
          height: size === 'sm' ? '8px' : '10px',
          borderRadius: '50%',
          backgroundColor: color
        }}
      />
      <span className="font-mono" style={{ fontWeight: 700, fontSize: size === 'sm' ? '11px' : '12.5px', color }}>
        {percentage}%
      </span>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
        ({qualityText})
      </span>
    </div>
  );
};
