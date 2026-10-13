import React, { useState } from 'react';
import type { CTIRecord, Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { FilterBar } from '../common/FilterBar';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { BookmarkIcon, EyeIcon } from '../icons/Icons';

interface ConsumerSearchViewProps {
  ctiList: CTIRecord[];
  organizations: Organization[];
  onSelectCti: (cti: CTIRecord) => void;
  onSaveIndicator?: (cti: CTIRecord) => void;
  savedIndicatorIds?: string[];
}

export const ConsumerSearchView: React.FC<ConsumerSearchViewProps> = ({
  ctiList,
  organizations,
  onSelectCti,
  onSaveIndicator,
  savedIndicatorIds = []
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filtered = ctiList.filter(c => {
    const matchesSearch = c.value.toLowerCase().includes(search.toLowerCase()) || (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSeverity = severityFilter === 'ALL' || 
      (severityFilter === 'CRITICAL' && c.severity >= 8.5) ||
      (severityFilter === 'HIGH' && c.severity >= 7.0 && c.severity < 8.5) ||
      (severityFilter === 'MEDIUM' && c.severity < 7.0);
    return matchesSearch && matchesType && matchesSeverity;
  });

  return (
    <div className="view-container">
      <PageHeader
        title="CTI Search & Discovery Feed"
        subtitle="Search and discover curated threat indicators across all trusted defense alliances"
        badge={<span className="badge role-badge-consumer">{filtered.length} RESULTS</span>}
        breadcrumb={{ section: 'Intelligence Center', page: 'CTI Search & Feed' }}
      />

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
        onReset={() => { setSearch(''); setTypeFilter('ALL'); setSeverityFilter('ALL'); }}
      />

      <ChartCard title="Curated Indicators">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SEVERITY</th>
                <th>INDICATOR</th>
                <th>TYPE</th>
                <th>CONFIDENCE</th>
                <th>SOURCE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const org = organizations.find(o => o.id === c.organization_id);
                const isSaved = savedIndicatorIds.includes(c.id);

                return (
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
                    <td>{org?.name || c.source || 'Threat Intelligence Feed'}</td>
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
                        {onSaveIndicator && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              color: isSaved ? 'var(--primary-blue)' : 'var(--text-muted)'
                            }}
                            onClick={() => onSaveIndicator(c)}
                            title={isSaved ? 'In Watchlist' : 'Save to Watchlist'}
                          >
                            <BookmarkIcon size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
