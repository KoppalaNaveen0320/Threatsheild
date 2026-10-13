import React, { useState } from 'react';
import type { CTIRecord, Organization } from '../../types';
import {
  XIcon,
  CheckIcon,
  AlertTriangleIcon,
  CopyIcon,
  LayersIcon,
  SlidersIcon,
  FileCodeIcon,
  InfoIcon
} from '../icons/Icons';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { TrustScore } from './TrustScore';
import { QualityScore } from './QualityScore';

interface ValidationWorkspaceProps {
  cti: CTIRecord | null;
  organization?: Organization;
  onClose: () => void;
  onDecision: (ctiId: string, decision: 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'NEED_EVIDENCE', notes: string) => void;
  onCopyText: (text: string) => void;
}

export const ValidationWorkspace: React.FC<ValidationWorkspaceProps> = ({
  cti,
  organization,
  onClose,
  onDecision,
  onCopyText
}) => {
  const [decisionNotes, setDecisionNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'decision' | 'explainability'>('decision');

  if (!cti) return null;

  // Derive mathematical STIX and Quality scores
  const stixId = `indicator--${cti.id}`;
  const pattern = `[${cti.type}:value = '${cti.value}']`;
  const trustScore = organization?.trust_score ?? 0.82;
  const confidenceScore = cti.confidence > 1 ? cti.confidence / 100 : cti.confidence;
  const qualityScore = (trustScore * 0.4 + confidenceScore * 0.4 + (cti.status === 'DUPLICATE' ? 0.1 : 0.2));
  const anomalyScore = cti.status === 'DUPLICATE' ? 0.45 : 0.05;
  const normalizedWeight = (trustScore * qualityScore * (1 - anomalyScore)).toFixed(3);

  const stixJson = {
    type: "bundle",
    id: `bundle--${cti.id}`,
    spec_version: "2.1",
    objects: [
      {
        type: "identity",
        spec_version: "2.1",
        id: `identity--${cti.organization_id}`,
        name: organization?.name || "Contributing Organization",
        identity_class: "organization"
      },
      {
        type: "indicator",
        spec_version: "2.1",
        id: stixId,
        created: cti.created_at,
        modified: cti.created_at,
        name: `${cti.type.toUpperCase()}: ${cti.value}`,
        description: cti.description || "Ingested indicator from collaborative sensor",
        indicator_types: ["malicious-activity"],
        pattern: pattern,
        pattern_type: "stix",
        confidence: Math.round(confidenceScore * 100)
      },
      {
        type: "relationship",
        spec_version: "2.1",
        id: `rel--${cti.organization_id}--${cti.id}`,
        relationship_type: "submitted-by",
        source_ref: `identity--${cti.organization_id}`,
        target_ref: stixId
      }
    ]
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          height: '88vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Workspace Top Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-success)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LayersIcon size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  CTI Validation Workspace
                </h2>
                <StatusBadge status={cti.validation_status || cti.status} size="sm" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Target Indicator: <span className="font-mono" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{cti.value}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onCopyText(JSON.stringify(stixJson, null, 2))}
              title="Copy STIX 2.1 Bundle JSON"
            >
              <CopyIcon size={13} />
              <span>Copy STIX</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ padding: '6px' }}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Workspace 3-Column Grid */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr 1.15fr',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF'
          }}
        >
          {/* COLUMN 1 (LEFT): CTI Details */}
          <div
            style={{
              padding: '24px',
              borderRight: '1px solid var(--border-default)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              1. Ingested CTI Details
            </div>

            <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>INDICATOR VALUE</div>
              <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {cti.value}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TYPE</div>
                <span className="badge badge-info font-mono">{cti.type}</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SEVERITY</div>
                <SeverityBadge severity={cti.severity} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>CONFIDENCE</div>
                <div className="font-mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {Math.round(confidenceScore * 100)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>STATUS</div>
                <StatusBadge status={cti.status} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>CONTEXT & DESCRIPTION</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                {cti.description || 'No additional analyst description provided upon ingestion.'}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TELEMETRY SOURCE</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {cti.source || 'Local Sensor Network'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>SUBMISSION TIMESTAMP</div>
              <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {cti.created_at}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (MIDDLE): STIX 2.1 Representation */}
          <div
            style={{
              padding: '24px',
              borderRight: '1px solid var(--border-default)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#FAFAFA'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                2. OASIS STIX 2.1 Specification
              </div>
              <span className="badge badge-sm badge-info font-mono">v2.1</span>
            </div>

            {/* STIX Visual Mapping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>STIX OBJECT ID</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  {stixId}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>STIX PATTERN EXPRESSION</div>
                <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--color-crypto)', fontWeight: 600 }}>
                  {pattern}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>GRAPH RELATIONSHIP</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>[Identity: {organization?.name || 'Org'}]</span>
                  <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}> -- submitted-by --&gt; </span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>[Indicator: {cti.type}]</span>
                </div>
              </div>
            </div>

            {/* STIX JSON Viewer */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCodeIcon size={13} />
                <span>Raw Standardized STIX 2.1 Bundle</span>
              </div>
              <pre
                className="font-mono"
                style={{
                  flex: 1,
                  backgroundColor: '#0F172A',
                  color: '#94A3B8',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px',
                  lineHeight: 1.45,
                  overflowY: 'auto',
                  maxHeight: '300px',
                  margin: 0
                }}
              >
                {JSON.stringify(stixJson, null, 2)}
              </pre>
            </div>
          </div>

          {/* COLUMN 3 (RIGHT): Validation Decision & Assessment */}
          <div
            style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                3. Quality Assessment & Decision
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`btn btn-sm ${activeTab === 'decision' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('decision')}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                >
                  Decision
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'explainability' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('explainability')}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                >
                  Formula
                </button>
              </div>
            </div>

            {/* Quality Metrics Panel */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calculated CTI Quality (Q):</span>
                <QualityScore score={qualityScore} size="sm" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contributor Trust (T):</span>
                <TrustScore score={trustScore} size="sm" compact />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Telemetry Freshness (λ^Δt):</span>
                <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)' }}>0.95 (Fresh)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Anomaly Deviation (A):</span>
                <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: anomalyScore > 0.3 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {anomalyScore.toFixed(2)} {anomalyScore > 0.3 ? '(Duplicate Flag)' : '(Normal)'}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Effective Contribution Weight (Ŵ):</span>
                <span className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-blue)' }}>{normalizedWeight}</span>
              </div>
            </div>

            {activeTab === 'explainability' ? (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid var(--border-info)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '6px' }}>
                  <InfoIcon size={14} />
                  <span>Contribution Weight Explanation</span>
                </div>
                <p style={{ lineHeight: 1.5, margin: '0 0 8px 0', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  ThreatShield computes aggregation weight dynamically using:
                </p>
                <div className="font-mono" style={{ backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '8px' }}>
                  W_i = T_i × Q_i × (1 - A_i)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  • T_i = {trustScore.toFixed(2)} (Historical Peer Reputation)<br />
                  • Q_i = {qualityScore.toFixed(2)} (Time-Decayed Indicator Precision)<br />
                  • A_i = {anomalyScore.toFixed(2)} (L2 Norm Anomaly Penalty)
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: '11.5px' }}>Validation Review Notes (Recorded to Audit Trail)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Enter analytical review notes, verification context, or justification..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    style={{ fontSize: '12px', resize: 'vertical' }}
                  />
                </div>

                {/* Decision Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => onDecision(cti.id, 'APPROVED', decisionNotes)}
                    style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    <CheckIcon size={14} />
                    <span>Approve CTI</span>
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => onDecision(cti.id, 'REJECTED', decisionNotes)}
                    style={{ color: 'var(--color-critical)', borderColor: 'var(--border-critical)', backgroundColor: 'var(--bg-critical)' }}
                  >
                    <XIcon size={14} />
                    <span>Reject</span>
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => onDecision(cti.id, 'FLAGGED', decisionNotes)}
                    style={{ color: 'var(--color-warning)', borderColor: 'var(--border-warning)', backgroundColor: 'var(--bg-warning)' }}
                  >
                    <AlertTriangleIcon size={14} />
                    <span>Flag for Review</span>
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => onDecision(cti.id, 'NEED_EVIDENCE', decisionNotes)}
                  >
                    <SlidersIcon size={14} />
                    <span>Require Evidence</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
