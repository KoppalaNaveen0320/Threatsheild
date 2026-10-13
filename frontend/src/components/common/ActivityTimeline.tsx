import React from 'react';
import { ShieldIcon, AlertTriangleIcon, ActivityIcon, LockIcon, HashIcon } from '../icons/Icons';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'CTI' | 'SECURITY' | 'AUDIT' | 'PRIVACY' | 'HEALTH';
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  metadata?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  emptyMessage?: string;
  maxItems?: number;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  emptyMessage = 'No recent activity recorded.',
  maxItems = 8
}) => {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        {emptyMessage}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SECURITY': return AlertTriangleIcon;
      case 'AUDIT': return HashIcon;
      case 'PRIVACY': return LockIcon;
      case 'CTI': return ShieldIcon;
      default: return ActivityIcon;
    }
  };

  const getAccent = (type: string, severity?: string) => {
    if (severity === 'CRITICAL') return { color: 'var(--color-critical)', bg: 'var(--bg-critical)' };
    if (severity === 'HIGH') return { color: 'var(--color-warning)', bg: 'var(--bg-warning)' };
    switch (type) {
      case 'SECURITY': return { color: 'var(--color-critical)', bg: 'var(--bg-critical)' };
      case 'AUDIT': return { color: 'var(--color-crypto)', bg: 'var(--bg-crypto)' };
      case 'PRIVACY': return { color: 'var(--color-crypto)', bg: 'var(--bg-crypto)' };
      default: return { color: 'var(--primary-blue)', bg: 'var(--primary-light)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {displayItems.map((item, index) => {
        const Icon = getIcon(item.type);
        const { color, bg } = getAccent(item.type, item.severity);
        const isLast = index === displayItems.length - 1;

        return (
          <div key={item.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            {/* Timeline connector line */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '28px',
                  bottom: '-8px',
                  width: '2px',
                  backgroundColor: 'var(--border-default)'
                }}
              />
            )}

            {/* Icon bubble */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: bg,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1
              }}
            >
              <Icon size={14} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {item.timestamp}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                {item.description}
              </p>
              {item.metadata && (
                <div className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {item.metadata}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
