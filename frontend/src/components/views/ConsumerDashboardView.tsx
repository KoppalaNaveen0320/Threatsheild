import React, { useState } from 'react';
import type { CTIRecord, Organization } from '../../types';
import {
  ShieldIcon,
  SearchIcon,
  EyeIcon,
  ActivityIcon,
  UsersIcon,
  BookmarkIcon,
  AlertTriangleIcon
} from '../icons/Icons';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { TrustScore } from '../common/TrustScore';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';

interface ConsumerDashboardViewProps {
  ctiList: CTIRecord[];
  organizations: Organization[];
  onSelectCti: (cti: CTIRecord) => void;
  onNavigate: (view: any) => void;
  onSaveIndicator?: (cti: CTIRecord) => void;
  savedIndicatorIds?: string[];
}

export const ConsumerDashboardView: React.FC<ConsumerDashboardViewProps> = ({
  ctiList,
  organizations,
  onSelectCti,
  onNavigate,
  onSaveIndicator,
  savedIndicatorIds = []
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Derive relevant threats
  const validatedList = ctiList.filter(c => c.status !== 'DUPLICATE');
  const highRiskCount = validatedList.filter(c => c.severity >= 7.5).length;
  const trustedSourcesCount = organizations.filter(o => o.trust_score >= 0.75).length || 3;
  const newIntelCount = validatedList.filter(c => c.status === 'NEW').length;
  const recentSightingsCount = validatedList.length * 3 + 12;

  const filteredList = selectedTypeFilter === 'ALL'
    ? validatedList
    : validatedList.filter(c => c.type === selectedTypeFilter);

  return (
    <div className="view-container">
      {/* Page Header */}
      <PageHeader
        title="Threat Intelligence Center"
        subtitle="Access relevant, validated cyber threat intelligence and active global indicators"
        badge={<span className="badge role-badge-consumer">INTELLIGENCE CONSUMER</span>}
        breadcrumb={{ section: 'Threat Intelligence', page: 'Intelligence Overview' }}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('saved-intel')}>
              <BookmarkIcon size={13} />
              <span>Saved Watchlist ({savedIndicatorIds.length})</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('cti-search')}>
              <SearchIcon size={13} />
              <span>Search Intelligence</span>
            </button>
          </div>
        }
      />

      {/* Row 1: Horizontal KPI Grid (5-6 compact cards) */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <MetricCard
          title="Relevant Threats"
          value={validatedList.length}
          subtitle="Curated for your sector"
          icon={ShieldIcon}
          accentColor="#4F46E5"
          accentBg="#EEF2FF"
          onClick={() => onNavigate('cti-search')}
        />
        <MetricCard
          title="High-Risk Threats"
          value={highRiskCount}
          subtitle="Severity score ≥ 7.5"
          icon={AlertTriangleIcon}
          accentColor="#DC2626"
          accentBg="#FEF2F2"
          badge={highRiskCount > 0 ? 'High Alert' : 'Nominal'}
        />
        <MetricCard
          title="New Intelligence"
          value={newIntelCount}
          subtitle="Fresh IOC submissions"
          icon={ActivityIcon}
          accentColor="#0284C7"
          accentBg="#F0F9FF"
        />
        <MetricCard
          title="Trusted Sources"
          value={trustedSourcesCount}
          subtitle="High-reputation peers"
          icon={UsersIcon}
          accentColor="#16A34A"
          accentBg="#ECFDF5"
          onClick={() => onNavigate('trusted-sources')}
        />
        <MetricCard
          title="Recent Sightings"
          value={recentSightingsCount}
          subtitle="Global sensor hits"
          icon={EyeIcon}
          accentColor="#7C3AED"
          accentBg="#F5F3FF"
          onClick={() => onNavigate('recent-sightings')}
        />
      </div>

      {/* Row 2: 2/3 vs 1/3 Grid: Recommended Threat Intelligence (Left) + Quick Actions & Threat Landscape (Right) */}
      <div className="dashboard-grid-2-1">
        {/* LEFT (2/3): Recommended Intelligence Table */}
        <ChartCard
          title="Recommended Threat Intelligence"
          subtitle="High-confidence indicators curated based on organizational threat profile"
          headerAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-select"
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                style={{ fontSize: '11px', height: '28px', padding: '2px 6px' }}
              >
                <option value="ALL">All Types</option>
                <option value="ipv4-addr">IPv4</option>
                <option value="domain-name">Domain</option>
                <option value="file-hash">Hash</option>
                <option value="url">URL</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('cti-search')}>
                <span>Feed</span>
              </button>
            </div>
          }
        >
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SEVERITY</th>
                  <th>INDICATOR</th>
                  <th>TYPE</th>
                  <th>CONFIDENCE</th>
                  <th>RELEVANCE</th>
                  <th>SOURCE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.slice(0, 6).map(c => {
                  const org = organizations.find(o => o.id === c.organization_id);
                  const isSaved = savedIndicatorIds.includes(c.id);

                  return (
                    <tr key={c.id}>
                      <td>
                        <SeverityBadge severity={c.severity} size="sm" />
                      </td>
                      <td>
                        <div className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)', fontSize: '12px' }}>
                          {c.value}
                        </div>
                        {c.description && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info badge-sm font-mono">{c.type}</span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 600, fontSize: '11px' }}>
                          {c.confidence > 1 ? c.confidence : (c.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success badge-sm" style={{ fontWeight: 700 }}>
                          94% Match
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {org?.name || c.source || 'Alliance Feed'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: '10.5px' }}
                            onClick={() => onSelectCti(c)}
                          >
                            <EyeIcon size={11} />
                            <span>View</span>
                          </button>
                          {onSaveIndicator && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '2px 6px',
                                fontSize: '10.5px',
                                color: isSaved ? 'var(--primary-blue)' : 'var(--text-muted)'
                              }}
                              onClick={() => onSaveIndicator(c)}
                              title={isSaved ? 'Saved to Watchlist' : 'Bookmark to Watchlist'}
                            >
                              <BookmarkIcon size={11} />
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

        {/* RIGHT (1/3): Quick Actions & Threat Landscape */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions Panel */}
          <ChartCard
            title="Quick Actions"
            subtitle="Consumer discovery workflows"
          >
            <div className="quick-action-grid">
              <button className="quick-action-btn" onClick={() => onNavigate('cti-search')}>
                <SearchIcon size={14} style={{ color: '#4F46E5' }} />
                <span>Search CTI</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('threat-landscape')}>
                <ActivityIcon size={14} style={{ color: '#4F46E5' }} />
                <span>Threat Landscape</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('trusted-sources')}>
                <UsersIcon size={14} style={{ color: '#4F46E5' }} />
                <span>Trusted Sources</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('recent-sightings')}>
                <EyeIcon size={14} style={{ color: '#4F46E5' }} />
                <span>Recent Sightings</span>
              </button>
            </div>
          </ChartCard>

          {/* Threat Landscape Summary */}
          <ChartCard
            title="Threat Landscape"
            subtitle="Sector targeting & categories"
            headerAction={
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('threat-landscape')}>
                <span>Details</span>
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ padding: '6px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>C2 HOSTS</div>
                  <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-blue)' }}>
                    {validatedList.filter(c => c.type === 'ipv4-addr').length}
                  </div>
                </div>

                <div style={{ padding: '6px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HASHES</div>
                  <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-critical)' }}>
                    {validatedList.filter(c => c.type === 'file-hash').length}
                  </div>
                </div>

                <div style={{ padding: '6px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PHISHING</div>
                  <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-warning)' }}>
                    {validatedList.filter(c => c.type === 'domain-name' || c.type === 'url').length}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Targeting: Financial (45%), Health (30%)</span>
                </div>
                <div style={{ display: 'flex', height: '6px', borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
                  <div style={{ flex: 45, backgroundColor: 'var(--color-critical)' }} />
                  <div style={{ flex: 30, backgroundColor: 'var(--color-warning)' }} />
                  <div style={{ flex: 25, backgroundColor: 'var(--primary-blue)' }} />
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Trusted Intelligence Sources Table */}
      <ChartCard
        title="Trusted Intelligence Sources"
        subtitle="Top contributing peer organizations with verified reputation scores"
        headerAction={
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('trusted-sources')}>
            <span>All Sources</span>
          </button>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {(organizations.length > 0 ? organizations : [
            { id: '1', name: 'CyberDefense Alpha', trust_score: 0.88, privacy_budget: 10, status: 'ACTIVE', created_at: '' },
            { id: '2', name: 'Financial ISAC', trust_score: 0.94, privacy_budget: 10, status: 'ACTIVE', created_at: '' },
            { id: '3', name: 'HealthNet SOC', trust_score: 0.82, privacy_budget: 10, status: 'ACTIVE', created_at: '' }
          ]).slice(0, 3).map(org => (
            <div
              key={org.id}
              style={{
                padding: '10px 12px',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{org.name}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Verified ISAC Contributor</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <TrustScore score={org.trust_score} size="sm" compact />
                <div style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 600 }}>High Reliability</div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
};
