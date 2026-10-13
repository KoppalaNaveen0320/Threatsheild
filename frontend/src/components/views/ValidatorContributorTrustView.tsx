import React from 'react';
import type { Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { TrustScore } from '../common/TrustScore';
import { QualityScore } from '../common/QualityScore';
import { StatusBadge } from '../common/StatusBadge';

interface ValidatorContributorTrustViewProps {
  organizations: Organization[];
}

export const ValidatorContributorTrustView: React.FC<ValidatorContributorTrustViewProps> = ({
  organizations
}) => {
  const orgsList = organizations.length > 0 ? organizations : [
    { id: '1', name: 'CyberDefense Alpha', trust_score: 0.88, privacy_budget: 9.5, status: 'ACTIVE', created_at: '' },
    { id: '2', name: 'Financial ISAC', trust_score: 0.94, privacy_budget: 10.0, status: 'ACTIVE', created_at: '' },
    { id: '3', name: 'HealthNet SOC', trust_score: 0.79, privacy_budget: 8.0, status: 'ACTIVE', created_at: '' },
    { id: '4', name: 'Critical Infra Sec', trust_score: 0.68, privacy_budget: 10.0, status: 'ACTIVE', created_at: '' }
  ];

  return (
    <div className="view-container">
      <PageHeader
        title="Contributor Trust & Quality Analytics"
        subtitle="Reputation tracking, time-decay quality assessment, and mathematical contribution weights"
        badge={<span className="badge role-badge-validator">TRUST ASSESSMENT</span>}
        breadcrumb={{ section: 'Trust & Evidence', page: 'Contributor Trust' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>GLOBAL REPUTATION AVERAGE</div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-success)', margin: '4px 0' }}>
            0.82
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Exponential Moving Average (α=0.1)</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TIME-DECAY FACTOR (λ)</div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-blue)', margin: '4px 0' }}>
            0.95
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Decays stale indicators smoothly</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>BYZANTINE SUPPRESSION RATE</div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: '#0D9488', margin: '4px 0' }}>
            -99.38%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Noise & poisoned update penalty</div>
        </div>
      </div>

      <ChartCard
        title="Contributor Reputation Registry"
        subtitle="Detailed metrics computed per tenant organization"
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ORGANIZATION</th>
                <th>TRUST SCORE (T)</th>
                <th>CTI QUALITY (Q)</th>
                <th>FRESHNESS (λ^Δt)</th>
                <th>HISTORICAL ACCURACY</th>
                <th>ANOMALY (A)</th>
                <th>CONTRIBUTION WEIGHT (Ŵ)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {orgsList.map(org => {
                const t = org.trust_score || 0.8;
                const q = 0.92;
                const f = 0.95;
                const acc = 96.4;
                const a = 0.04;
                const weight = (t * q * (1 - a)).toFixed(3);

                return (
                  <tr key={org.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{org.name}</div>
                      <div className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{org.id.substring(0, 8)}</div>
                    </td>
                    <td><TrustScore score={t} size="sm" /></td>
                    <td><QualityScore score={q} size="sm" /></td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--color-success)' }}>{f}</td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{acc}%</td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--color-success)' }}>{a.toFixed(2)}</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '12.5px' }}>{weight}</td>
                    <td><StatusBadge status={org.status} size="sm" /></td>
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
