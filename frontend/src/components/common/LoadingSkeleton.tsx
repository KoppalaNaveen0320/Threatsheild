import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  type?: 'table' | 'card' | 'text';
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  type = 'table',
  height
}) => {
  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="card"
            style={{
              height: height || '110px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}
          >
            <div style={{ width: '40%', height: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }} />
            <div style={{ width: '60%', height: '24px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }} />
            <div style={{ width: '80%', height: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '100%',
            height: height || '40px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            animation: 'pulse 1.5s infinite ease-in-out',
            opacity: 1 - i * 0.15
          }}
        />
      ))}
    </div>
  );
};
