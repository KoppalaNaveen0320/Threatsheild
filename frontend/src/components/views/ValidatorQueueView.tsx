import React, { useState } from 'react';
import type { CTIRecord, Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { FilterBar } from '../common/FilterBar';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { QualityScore } from '../common/QualityScore';
import { ValidationWorkspace } from '../common/ValidationWorkspace';

interface ValidatorQueueViewProps {
  ctiList: CTIRecord[];
  organizations: Organization[];
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg: string) => void;
}

export const ValidatorQueueView: React.FC<ValidatorQueueViewProps> = ({
  ctiList,
  organizations,
  onShowToast
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [reviewingCti, setReviewingCti] = useState<CTIRecord | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const filteredList = ctiList.filter(c => {
    const matchesSearch = c.value.toLowerCase().includes(search.toLowerCase()) || (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
    const matchesSeverity = severityFilter === 'ALL' || 
      (severityFilter === 'CRITICAL' && c.severity >= 8.5) ||
      (severityFilter === 'HIGH' && c.severity >= 7.0 && c.severity < 8.5) ||
      (severityFilter === 'MEDIUM' && c.severity < 7.0);
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleDecision = (ctiId: string, decision: any) => {
    setLocalStatuses(prev => ({ ...prev, [ctiId]: decision }));
    setReviewingCti(null);
    onShowToast('success', 'Validation Saved', `Decision recorded: ${decision}`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('info', 'Copied to Clipboard', 'Text copied.');
  };

  return (
    <div className="view-container">
      {reviewingCti && (
        <ValidationWorkspace
          cti={reviewingCti}
          organization={organizations.find(o => o.id === reviewingCti.organization_id)}
          onClose={() => setReviewingCti(null)}
          onDecision={handleDecision}
          onCopyText={handleCopyText}
        />
      )}

      <PageHeader
        title="Validation Queue"
        subtitle="Full queue of candidate threat indicators awaiting multi-factor quality inspection"
        badge={<span className="badge role-badge-validator">{filteredList.length} IN QUEUE</span>}
        breadcrumb={{ section: 'Validation Center', page: 'Validation Queue' }}
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

      <ChartCard title="Queue Items">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>INDICATOR</th>
                <th>TYPE</th>
                <th>ORGANIZATION</th>
                <th>SEVERITY</th>
                <th>CONFIDENCE</th>
                <th>QUALITY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(c => {
                const org = organizations.find(o => o.id === c.organization_id);
                const status = localStatuses[c.id] || c.status;

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '12.5px' }}>
                        {c.value}
                      </div>
                      {c.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.description}</div>
                      )}
                    </td>
                    <td><span className="badge badge-info badge-sm font-mono">{c.type}</span></td>
                    <td>{org?.name || 'Sensor Org'}</td>
                    <td><SeverityBadge severity={c.severity} size="sm" /></td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{c.confidence > 1 ? c.confidence : (c.confidence * 100).toFixed(0)}%</td>
                    <td><QualityScore score={0.92} size="sm" /></td>
                    <td><StatusBadge status={status} size="sm" /></td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: '#0D9488', borderColor: '#0D9488', fontSize: '11.5px' }}
                        onClick={() => setReviewingCti(c)}
                      >
                        Review
                      </button>
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
