import React, { useState } from 'react';
import type { User, ActiveView } from '../../types';
import {
  ShieldIcon,
  FileCodeIcon,
  CheckCircleIcon
} from '../icons/Icons';

interface SubmitCtiViewProps {
  currentUser: User | null;
  onSubmit: (payload: {
    type: string;
    value: string;
    description: string;
    severity: number;
    confidence: number;
    source: string;
  }) => Promise<boolean>;
  onNavigate: (view: ActiveView) => void;
}

export const SubmitCtiView: React.FC<SubmitCtiViewProps> = ({
  currentUser,
  onSubmit,
  onNavigate
}) => {
  const [type, setType] = useState('ipv4-addr');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(7.5);
  const [confidence, setConfidence] = useState(0.85);
  const [source, setSource] = useState('Edge SOC Sensor Alpha');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = currentUser?.role !== 'THREAT_CONSUMER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      type,
      value: value.trim(),
      description: description.trim(),
      severity,
      confidence,
      source
    });

    setIsSubmitting(false);
    if (success) {
      onNavigate('cti-feed');
    }
  };

  const getStixPatternPreview = () => {
    switch (type) {
      case 'ipv4-addr': return `[ipv4-addr:value = '${value || '198.51.100.1'}']`;
      case 'domain-name': return `[domain-name:value = '${value || 'malicious-domain.com'}']`;
      case 'file-hash': return `[file:hashes.'SHA-256' = '${value || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}']`;
      case 'url': return `[url:value = '${value || 'https://malicious-site.com/login'}']`;
      default: return `[custom-object:value = '${value || 'identifier'}']`;
    }
  };

  return (
    <div style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Threat Indicator</h1>
          <div className="page-subtitle">
            Ingest normalized Indicators of Compromise into the federated cryptographic ledger
          </div>
        </div>
        <span className="badge badge-success">STIX 2.1 Compliant</span>
      </div>

      {!canSubmit ? (
        <div className="soc-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '4px' }}>
            Insufficient Permissions
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Your account role (<strong>{currentUser?.role}</strong>) has read-only access. Indicator submission requires <strong>ADMIN</strong>, <strong>ANALYST</strong>, or <strong>VALIDATOR</strong> role.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="soc-card">
            <div className="card-title" style={{ marginBottom: '16px' }}>
              <ShieldIcon size={16} />
              <span>Indicator Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Indicator Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="ipv4-addr">IPv4 Address (ipv4-addr)</option>
                  <option value="domain-name">Domain Name (domain-name)</option>
                  <option value="file-hash">File Hash (file-hash)</option>
                  <option value="url">URL (url)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Indicator Value</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'ipv4-addr' ? '185.220.101.5' : type === 'domain-name' ? 'c2.malicious-network.org' : 'Value...'}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Threat Description / Context</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Observed C2 communication node targeting perimeter firewalls..."
                rows={3}
              />
            </div>
          </div>

          {/* Scoring & Origin Card */}
          <div className="soc-card">
            <div className="card-title" style={{ marginBottom: '16px' }}>
              <CheckCircleIcon size={16} />
              <span>Scoring & Telemetry Context</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Severity Score</label>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{severity.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={severity}
                  onChange={(e) => setSeverity(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Confidence Rating</label>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-success)' }}>{(confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Source Node</label>
                <input
                  type="text"
                  className="form-input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* STIX 2.1 Live Pattern Preview */}
          <div className="soc-card" style={{ background: '#FAFBFD' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              <FileCodeIcon size={14} style={{ color: 'var(--primary-blue)' }} />
              <span>OASIS STIX 2.1 Output Formulation</span>
            </div>
            <div className="font-mono" style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--primary-blue)' }}>
              {getStixPatternPreview()}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('cti-feed')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !value.trim()}
            >
              <ShieldIcon size={14} />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest to Cryptographic Ledger'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
