import React, { useState } from 'react';
import type { LedgerBlock, Organization } from '../../types';
import {
  DatabaseIcon
} from '../icons/Icons';

interface SecurityEventsViewProps {
  blocks: LedgerBlock[];
  organizations: Organization[];
}

export const SecurityEventsView: React.FC<SecurityEventsViewProps> = ({
  blocks,
  organizations
}) => {
  const [filterType, setFilterType] = useState('all');
  const orgMap = new Map(organizations.map(o => [o.id, o.name]));

  const filteredBlocks = blocks.filter(b => {
    if (filterType === 'all') return true;
    return b.event_type === filterType;
  });

  const getEventBadge = (type: string) => {
    if (type.includes('DUPLICATE')) return <span className="badge badge-high">CTI Duplicate</span>;
    if (type.includes('SUBMISSION')) return <span className="badge badge-success">CTI Ingestion</span>;
    if (type.includes('PRIVACY')) return <span className="badge badge-crypto">DP Query</span>;
    if (type.includes('FEDERATED')) return <span className="badge badge-low">FL Round</span>;
    return <span className="badge badge-muted">{type}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Events & Audit Log</h1>
          <div className="page-subtitle">
            Real-time auditable security events extracted from cryptographic ledger blocks
          </div>
        </div>
        <span className="data-tag data-tag-live">Live Ledger Stream</span>
      </div>

      {/* Filter Control Bar */}
      <div className="soc-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Event Type:</span>
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '260px', padding: '6px 12px', fontSize: '12px' }}
          >
            <option value="all">All Events ({blocks.length})</option>
            <option value="CTI_SUBMISSION">CTI Ingestions</option>
            <option value="CTI_DUPLICATE_SUBMISSION">Duplicate Submissions</option>
            <option value="PRIVACY_QUERY">Differential Privacy Queries</option>
            <option value="FEDERATED_ROUND">Federated Learning Rounds</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="soc-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Audited Security Transactions ({filteredBlocks.length})
          </div>
          <span className="badge badge-success">Immutable Records</span>
        </div>

        {filteredBlocks.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Block #</th>
                  <th>Event Type</th>
                  <th>Originating Organization</th>
                  <th>Timestamp (UTC)</th>
                  <th>Payload Hash</th>
                  <th>Block Hash</th>
                  <th>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlocks.map((b) => (
                  <tr key={b.index}>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                      #{b.index}
                    </td>
                    <td>{getEventBadge(b.event_type)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {orgMap.get(b.organization_id) || `Org-${b.organization_id.substring(0, 8)}`}
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(b.timestamp).toUTCString()}
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {b.payload_hash.substring(0, 14)}...
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--primary-blue)' }}>
                      {b.current_hash.substring(0, 14)}...
                    </td>
                    <td>
                      <span className="badge badge-success">Audited</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <DatabaseIcon className="empty-icon" />
            <div className="empty-title">No Security Events Recorded</div>
            <div className="empty-desc">
              Security transactions will populate when CTI ingestions or DP queries occur.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
