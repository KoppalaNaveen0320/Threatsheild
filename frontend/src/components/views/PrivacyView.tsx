import React from 'react';
import type { Organization, PrivacyStats } from '../../types';
import {
  LockIcon,
  DatabaseIcon,
  InfoIcon
} from '../icons/Icons';

interface PrivacyViewProps {
  currentOrg: Organization | null;
  privacyStats: PrivacyStats | null;
  onConsumePrivacy: () => void;
  isLoadingPrivacy: boolean;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  currentOrg,
  privacyStats,
  onConsumePrivacy,
  isLoadingPrivacy
}) => {
  const budget = currentOrg ? currentOrg.privacy_budget : 10.0;
  const maxBudget = 10.0;
  const usedBudget = maxBudget - budget;
  const percentageRemaining = Math.max(0, Math.min(100, (budget / maxBudget) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Privacy Center & Cryptographic Engine</h1>
          <div className="page-subtitle">
            Formal mathematical privacy guarantees via Laplace Differential Privacy and AES-256-GCM storage encryption
          </div>
        </div>
        <span className="data-tag data-tag-live">Laplace Mechanism Active</span>
      </div>

      {/* Primary Privacy Budget Meter */}
      <div className="soc-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Tenant Differential Privacy Budget
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-crypto)', letterSpacing: '-0.03em' }}>
                {budget.toFixed(1)} ε
              </span>
              <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>remaining of {maxBudget.toFixed(1)} ε</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={onConsumePrivacy}
            disabled={isLoadingPrivacy || budget <= 0}
          >
            <LockIcon size={13} />
            <span>{isLoadingPrivacy ? 'Executing Noisy Query...' : 'Run DP Statistics Query (-0.5 ε)'}</span>
          </button>
        </div>

        {/* Budget Progress Bar */}
        <div className="progress-bar-bg" style={{ height: '10px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentageRemaining}%`,
              backgroundColor: percentageRemaining > 30 ? 'var(--color-crypto)' : 'var(--color-critical)'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
          <span>Consumed: {usedBudget.toFixed(1)} ε</span>
          <span>Remaining: {percentageRemaining.toFixed(0)}%</span>
        </div>
      </div>

      {/* Two Pillars: 1. Differential Privacy vs 2. AES-256 Storage Encryption */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Pillar 1: Differential Privacy */}
        <div className="soc-card">
          <div className="card-header">
            <div className="card-title">
              <LockIcon size={16} style={{ color: 'var(--color-crypto)' }} />
              <span>1. Mathematical Differential Privacy</span>
            </div>
            <span className="badge badge-crypto">Laplace Mechanism</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div style={{ background: '#FAFBFD', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Laplace Noise Scale Formulation</div>
              <div className="font-mono" style={{ color: 'var(--color-crypto)', fontWeight: 600, fontSize: '12.5px' }}>
                b = Δf / ε = 1.0 / 0.5 = 2.0
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Query Sensitivity (Δf):</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>1.0 (Counting Query)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Epsilon per Query (ε_query):</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>0.5 ε</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>DP Queries Executed:</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>{Math.round(usedBudget / 0.5)} Queries</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: AES-256-GCM AEAD Storage Encryption */}
        <div className="soc-card">
          <div className="card-header">
            <div className="card-title">
              <DatabaseIcon size={16} style={{ color: 'var(--primary-blue)' }} />
              <span>2. Storage Encryption at Rest</span>
            </div>
            <span className="badge badge-success">AES-256-GCM AEAD</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div style={{ background: '#FAFBFD', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>Cryptographic Primitive</div>
              <div className="font-mono" style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '12.5px' }}>
                AES-256-GCM with 128-bit Authentication Tag
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cipher Spec:</span>
              <span style={{ fontWeight: 600 }}>256-bit Symmetric Key</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nonce Size:</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>96-bit Unique Nonce</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Data Protection Target:</span>
              <span style={{ fontWeight: 600 }}>Confidential CTI Indicators</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Distinction Notice */}
      <div className="soc-card" style={{ background: '#FAFBFD', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          <InfoIcon size={15} style={{ color: 'var(--primary-blue)' }} />
          <span>Cryptographic & Privacy Architecture Scope Note</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Important:</strong> Storage encryption (AES-256-GCM) protects stored records at rest from unauthorized physical database access, while Differential Privacy (Laplace Mechanism) provides mathematically provable bounded privacy loss ($\epsilon$) against membership inference during statistical query execution.
        </div>
      </div>

      {/* Latest Query Output Card */}
      {privacyStats && (
        <div className="soc-card">
          <div className="card-header">
            <div className="card-title">
              <LockIcon size={16} />
              <span>Latest Differential Privacy Query Result</span>
            </div>
            <span className="badge badge-crypto">Noise Added (b=2.0)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '12px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Perturbed Active Threats</div>
              <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-blue)', margin: '2px 0' }}>
                {privacyStats.active_threats}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Perturbed Verified IOCs</div>
              <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)', margin: '2px 0' }}>
                {privacyStats.verified_iocs}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Epsilon Cost</div>
              <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-crypto)', margin: '2px 0' }}>
                -{privacyStats.epsilon_consumed} ε
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
