import React from 'react';
import type { CTIRecord } from '../../types';
import {
  XIcon,
  ShieldIcon,
  CopyIcon,
  FileCodeIcon,
  TrendingUpIcon
} from '../icons/Icons';

interface InvestigationDrawerProps {
  cti: CTIRecord | null;
  onClose: () => void;
  onCopyText: (text: string) => void;
}

export const InvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  cti,
  onClose,
  onCopyText
}) => {
  if (!cti) return null;

  const getStixPattern = () => {
    switch (cti.type) {
      case 'ipv4-addr': return `[ipv4-addr:value = '${cti.value}']`;
      case 'domain-name': return `[domain-name:value = '${cti.value}']`;
      case 'file-hash': return `[file:hashes.'SHA-256' = '${cti.value}']`;
      case 'url': return `[url:value = '${cti.value}']`;
      default: return `[custom-object:value = '${cti.value}']`;
    }
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8.5) return <span className="badge badge-critical">Critical {severity.toFixed(1)}</span>;
    if (severity >= 7.0) return <span className="badge badge-high">High {severity.toFixed(1)}</span>;
    if (severity >= 4.0) return <span className="badge badge-medium">Medium {severity.toFixed(1)}</span>;
    return <span className="badge badge-low">Low {severity.toFixed(1)}</span>;
  };

  return (
    <>
      {/* Dim Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="drawer-panel">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={16} style={{ color: 'var(--primary-blue)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Threat Investigation
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                IOC Details & STIX 2.1 Provenance
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px', borderRadius: '50%' }}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Body Content */}
        <div className="drawer-body">
          {/* Top Summary Card */}
          <div style={{ background: '#FAFBFD', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="badge badge-muted font-mono">{cti.type}</span>
              {getSeverityBadge(cti.severity)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-blue)', wordBreak: 'break-all' }}>
                {cti.value}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onCopyText(cti.value)}
                title="Copy Value"
                style={{ padding: '4px 6px' }}
              >
                <CopyIcon size={12} />
              </button>
            </div>

            {cti.description && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {cti.description}
              </div>
            )}
          </div>

          {/* Section 1: Indicator Overview */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Indicator Overview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Confidence Level</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
                  {(cti.confidence * 100).toFixed(0)}%
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Ingestion Status</div>
                <div style={{ margin: '2px 0' }}>
                  <span className="badge badge-success">{cti.status}</span>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>First Observed (UTC)</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', margin: '2px 0' }}>
                  {new Date(cti.created_at).toUTCString()}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Source Node</div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', margin: '2px 0' }}>
                  {cti.source || 'Local Sensor Node'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: STIX 2.1 Representation */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCodeIcon size={13} style={{ color: 'var(--primary-blue)' }} />
              <span>2. STIX 2.1 Representation</span>
            </div>

            <div style={{ background: '#FAFBFD', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>STIX Indicator ID</div>
                <div className="font-mono" style={{ color: 'var(--primary-blue)', fontSize: '11px', wordBreak: 'break-all' }}>
                  indicator--{cti.id}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>STIX 2.1 Pattern Expression</div>
                <div className="font-mono" style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '11.5px' }}>
                  {getStixPattern()}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Entity Relationships */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Entity Relationships
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Malware:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AgentTesla / Mirai Variant</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Observed Sightings:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-critical)' }}>14 Federated Sightings</span>
              </div>
            </div>
          </div>

          {/* Section 4: Organization Context & Trust */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUpIcon size={13} style={{ color: 'var(--color-success)' }} />
              <span>4. Submitting Tenant Context</span>
            </div>

            <div style={{ background: '#FAFBFD', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tenant ID:</span>
                <span className="font-mono" style={{ color: 'var(--primary-blue)' }}>{cti.organization_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trust Score:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>0.85 (High Reputation)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contribution Weight (W_i):</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>0.485</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
