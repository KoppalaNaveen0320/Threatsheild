import React from 'react';
import type { CTIRecord } from '../../types';
import {
  NetworkIcon,
  InfoIcon
} from '../icons/Icons';

interface ThreatMapViewProps {
  ctiList: CTIRecord[];
}

export const ThreatMapView: React.FC<ThreatMapViewProps> = ({ ctiList }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Threat Map & Distribution</h1>
          <div className="page-subtitle">
            Geographic and autonomous system origin analysis for federated indicators
          </div>
        </div>
        <span className="data-tag data-tag-live">Active Telemetry</span>
      </div>

      {/* Primary Container */}
      <div className="soc-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="empty-state">
          <NetworkIcon className="empty-icon" style={{ width: '48px', height: '48px' }} />
          <div className="empty-title">Geographic Threat Distribution</div>
          <div className="empty-desc">
            Direct IP geolocation mapping is currently unpopulated for the {ctiList.length} indicators in the local database to preserve client telemetry privacy.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <InfoIcon size={14} style={{ color: 'var(--primary-blue)' }} />
            <span>To observe relationships and origin clusters, use the <strong>Threat Investigation Console</strong>.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
