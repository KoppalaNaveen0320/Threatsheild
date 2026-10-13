import React, { useState } from 'react';
import type { Organization, CTIRecord } from '../../types';
import {
  UsersIcon
} from '../icons/Icons';

interface OrganizationsViewProps {
  organizations: Organization[];
  ctiList: CTIRecord[];
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({
  organizations,
  ctiList
}) => {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(organizations[0] || null);

  const getOrgCtiCount = (orgId: string) => {
    return ctiList.filter(c => c.organization_id === orgId).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Organizations & Federated Multi-Tenancy</h1>
          <div className="page-subtitle">
            Collaborative participant directory, reputation scores, and privacy allocations
          </div>
        </div>
        <span className="data-tag data-tag-live">Active Tenants ({organizations.length})</span>
      </div>

      {/* Directory Table */}
      <div className="soc-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Tenant Directory
          </div>
          <span className="badge badge-success">Multi-Tenant Scoped</span>
        </div>

        {organizations.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Tenant ID</th>
                  <th>Trust Score (T)</th>
                  <th>CTI Contributions</th>
                  <th>Privacy Budget</th>
                  <th>FL Status</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="clickable" onClick={() => setSelectedOrg(org)}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {org.name}
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {org.id.substring(0, 14)}...
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>
                        {(org.trust_score * 100).toFixed(0)}% ({org.trust_score.toFixed(2)})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {getOrgCtiCount(org.id)} IOCs
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--color-crypto)' }}>
                        {org.privacy_budget.toFixed(1)} ε
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-low">Active Node</span>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {org.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrg(org);
                        }}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <UsersIcon className="empty-icon" />
            <div className="empty-title">No Organizations Registered</div>
            <div className="empty-desc">New federated tenants will appear in this directory upon registration.</div>
          </div>
        )}
      </div>

      {/* Selected Tenant Detail Inspection Card */}
      {selectedOrg && (
        <div className="soc-card">
          <div className="card-header">
            <div className="card-title">
              <UsersIcon size={16} />
              <span>Inspected Tenant: <strong>{selectedOrg.name}</strong></span>
            </div>
            <span className="badge badge-muted font-mono">{selectedOrg.id}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '4px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trust Score</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-blue)', margin: '2px 0' }}>
                {(selectedOrg.trust_score * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>● Normal Reputation</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contributed IOCs</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0' }}>
                {getOrgCtiCount(selectedOrg.id)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validated Telemetry</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Privacy Budget</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-crypto)', margin: '2px 0' }}>
                {selectedOrg.privacy_budget.toFixed(1)} ε
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Laplace Allocation</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Member Since</div>
              <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                {new Date(selectedOrg.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-success)' }}>Active Status</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
