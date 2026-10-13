import React from 'react';
import type { CTIRecord } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { BookmarkIcon, DownloadIcon, EyeIcon, XIcon } from '../icons/Icons';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';

interface ConsumerSavedViewProps {
  savedCtis: CTIRecord[];
  onSelectCti: (cti: CTIRecord) => void;
  onRemoveSaved: (ctiId: string) => void;
  onExportSaved: () => void;
  onNavigateToSearch: () => void;
}

export const ConsumerSavedView: React.FC<ConsumerSavedViewProps> = ({
  savedCtis,
  onSelectCti,
  onRemoveSaved,
  onExportSaved,
  onNavigateToSearch
}) => {
  return (
    <div className="view-container">
      <PageHeader
        title="Saved Intelligence Watchlist"
        subtitle="Bookmarked indicators and tailored threat telemetry for rapid export and SOC ingestion"
        badge={<span className="badge role-badge-consumer">{savedCtis.length} SAVED</span>}
        breadcrumb={{ section: 'Threat Discovery', page: 'Saved Intelligence' }}
        actions={
          savedCtis.length > 0 ? (
            <button className="btn btn-primary btn-sm" onClick={onExportSaved}>
              <DownloadIcon size={13} />
              <span>Export Watchlist (JSON)</span>
            </button>
          ) : undefined
        }
      />

      {savedCtis.length === 0 ? (
        <EmptyState
          icon={BookmarkIcon}
          title="No Saved Intelligence Yet"
          description="Browse the threat intelligence feed and bookmark critical indicators to build your custom organization watchlist."
          actionText="Explore Intelligence Feed"
          onAction={onNavigateToSearch}
        />
      ) : (
        <ChartCard title="Bookmarked Threat Indicators">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SEVERITY</th>
                  <th>INDICATOR</th>
                  <th>TYPE</th>
                  <th>CONFIDENCE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {savedCtis.map(c => (
                  <tr key={c.id}>
                    <td><SeverityBadge severity={c.severity} size="sm" /></td>
                    <td>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '12.5px' }}>
                        {c.value}
                      </div>
                      {c.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.description}</div>}
                    </td>
                    <td><span className="badge badge-info badge-sm font-mono">{c.type}</span></td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{c.confidence > 1 ? c.confidence : (c.confidence * 100).toFixed(0)}%</td>
                    <td><StatusBadge status={c.status} size="sm" /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => onSelectCti(c)}
                        >
                          <EyeIcon size={12} />
                          <span>View</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--color-critical)' }}
                          onClick={() => onRemoveSaved(c.id)}
                          title="Remove from Watchlist"
                        >
                          <XIcon size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
};
