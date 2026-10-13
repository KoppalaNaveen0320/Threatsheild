import React from 'react';
import type { CTIRecord, Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SeverityBadge } from '../common/SeverityBadge';

interface ConsumerSightingsViewProps {
  ctiList: CTIRecord[];
  organizations: Organization[];
}

export const ConsumerSightingsView: React.FC<ConsumerSightingsViewProps> = ({ ctiList, organizations }) => {
  const sightings = ctiList.slice(0, 8).map((c, idx) => ({
    id: `sighting-${idx}`,
    indicator: c.value,
    type: c.type,
    severity: c.severity,
    reportingOrg: organizations[idx % organizations.length]?.name || 'Global Peer Node',
    sightingsCount: (idx + 1) * 7 + 3,
    location: idx % 2 === 0 ? 'US-East Region' : 'EU-West Cluster',
    recommendedMitigation: idx % 2 === 0 ? 'Null-route at Border BGP Gateway' : 'Deploy TLS Interception Rule'
  }));

  return (
    <div className="view-container">
      <PageHeader
        title="Recent Sightings Telemetry"
        subtitle="Live multi-org sensor detections, sighting frequency counters, and recommended perimeter mitigations"
        badge={<span className="badge role-badge-consumer">OBSERVED SIGHTINGS</span>}
        breadcrumb={{ section: 'Threat Discovery', page: 'Recent Sightings' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {sightings.map(s => (
          <div
            key={s.id}
            className="card"
            style={{
              padding: '18px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info badge-sm font-mono">{s.type}</span>
                <div className="font-mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px' }}>
                  {s.indicator}
                </div>
              </div>
              <SeverityBadge severity={s.severity} size="sm" />
            </div>

            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reporting Node:</span>
                <span style={{ fontWeight: 600 }}>{s.reportingOrg}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Observed Sightings:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-critical)' }}>{s.sightingsCount} Events</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location / Cluster:</span>
                <span>{s.location}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              🛡️ Recommended Action: <strong style={{ color: 'var(--text-primary)' }}>{s.recommendedMitigation}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
