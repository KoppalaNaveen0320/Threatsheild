import React from 'react';
import type { CTIRecord } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';

interface ConsumerLandscapeViewProps {
  ctiList: CTIRecord[];
}

export const ConsumerLandscapeView: React.FC<ConsumerLandscapeViewProps> = ({ ctiList }) => {
  const ipCount = ctiList.filter(c => c.type === 'ipv4-addr').length;
  const domainCount = ctiList.filter(c => c.type === 'domain-name').length;
  const hashCount = ctiList.filter(c => c.type === 'file-hash').length;
  const urlCount = ctiList.filter(c => c.type === 'url').length;

  return (
    <div className="view-container">
      <PageHeader
        title="Global Threat Landscape"
        subtitle="Macro threat analytics, attack pattern trends, and infrastructure telemetry overview"
        badge={<span className="badge role-badge-consumer">MACRO LANDSCAPE</span>}
        breadcrumb={{ section: 'Intelligence Center', page: 'Threat Landscape' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>C2 & MALICIOUS HOSTS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-blue)', margin: '4px 0' }}>{ipCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active command & control nodes</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MALWARE HASHES</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-critical)', margin: '4px 0' }}>{hashCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Payload signatures identified</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PHISHING DOMAINS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-warning)', margin: '4px 0' }}>{domainCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Domain squatting & credential traps</div>
        </div>

        <div className="metric-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MALICIOUS URLS</div>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#7C3AED', margin: '4px 0' }}>{urlCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Delivery endpoints tracked</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <ChartCard title="Threat Infrastructure Trends" subtitle="Observed malicious vector growth over time">
          <div style={{ padding: '20px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span>Recent 7-Day Trend</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>+18.4% Defense Coverage</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', padding: '10px 0' }}>
              {[35, 50, 45, 70, 60, 85, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '100%', height: `${h}%`, backgroundColor: i === 6 ? 'var(--primary-blue)' : 'var(--border-strong)', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Day {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Sector Threat Targeting" subtitle="Distribution of observed campaigns by industry">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>Financial & Banking (45%)</span>
                <span className="font-mono">High Exposure</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--color-critical)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>Healthcare Networks (30%)</span>
                <span className="font-mono">Ransomware Wave</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--color-warning)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>Critical Infrastructure (25%)</span>
                <span className="font-mono">Reconnaissance</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: 'var(--primary-blue)' }} />
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
