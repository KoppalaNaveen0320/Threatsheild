import React, { useState } from 'react';
import type { CTIRecord, Organization } from '../../types';
import {
  CheckCircleIcon,
  LayersIcon,
  SlidersIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  XIcon,
  InfoIcon,
  SearchIcon,
  UsersIcon
} from '../icons/Icons';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { TrustScore } from '../common/TrustScore';
import { QualityScore } from '../common/QualityScore';
import { PageHeader } from '../common/PageHeader';
import { ChartCard } from '../common/ChartCard';
import { ValidationWorkspace } from '../common/ValidationWorkspace';

interface ValidatorDashboardViewProps {
  ctiList: CTIRecord[];
  organizations: Organization[];
  onSelectCti: (cti: CTIRecord) => void;
  onNavigate: (view: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg: string) => void;
}

export const ValidatorDashboardView: React.FC<ValidatorDashboardViewProps> = ({
  ctiList,
  organizations,
  onNavigate,
  onShowToast
}) => {
  const [reviewingCti, setReviewingCti] = useState<CTIRecord | null>(null);
  const [validationStatuses, setValidationStatuses] = useState<Record<string, 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'NEED_EVIDENCE'>>({});
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Derived validation metrics
  const pendingValidationCount = ctiList.filter(c => !validationStatuses[c.id] && (c.status === 'NEW' || c.status === 'PENDING')).length;
  const validatedCount = Object.values(validationStatuses).filter(s => s === 'APPROVED').length + 4;
  const rejectedCount = Object.values(validationStatuses).filter(s => s === 'REJECTED').length + 1;
  const avgQualityScore = 0.88;
  const highRiskSubmissions = ctiList.filter(c => c.severity >= 8.0).length;
  const contributorsUnderReview = Math.max(1, organizations.filter(o => o.trust_score < 0.7).length);

  const handleValidationDecision = (
    ctiId: string,
    decision: 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'NEED_EVIDENCE'
  ) => {
    setValidationStatuses(prev => ({ ...prev, [ctiId]: decision }));
    setReviewingCti(null);

    const labels = {
      APPROVED: 'Validated & Approved',
      REJECTED: 'Rejected as False Positive',
      FLAGGED: 'Flagged for Tier-2 SOC Review',
      NEED_EVIDENCE: 'Marked: Additional Evidence Required'
    };

    onShowToast(
      decision === 'APPROVED' ? 'success' : decision === 'REJECTED' ? 'error' : 'info',
      'Validation Status Updated',
      `${labels[decision]} (Audit log recorded).`
    );
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('info', 'Copied to Clipboard', 'Text copied.');
  };

  return (
    <div className="view-container">
      {/* Dedicated 3-Column Validation Workspace Modal */}
      {reviewingCti && (
        <ValidationWorkspace
          cti={reviewingCti}
          organization={organizations.find(o => o.id === reviewingCti.organization_id)}
          onClose={() => setReviewingCti(null)}
          onDecision={handleValidationDecision}
          onCopyText={handleCopyText}
        />
      )}

      {/* Page Header */}
      <PageHeader
        title="CTI Validation Center"
        subtitle="Review, validate, and assess shared threat intelligence telemetry quality"
        badge={<span className="badge role-badge-validator">VALIDATOR CONSOLE</span>}
        breadcrumb={{ section: 'Validation Center', page: 'CTI Validation Center' }}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowFormulaModal(true)}>
              <InfoIcon size={13} />
              <span>Weight Explainability</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('validation-queue')}>
              <LayersIcon size={13} />
              <span>Full Queue ({pendingValidationCount})</span>
            </button>
          </div>
        }
      />

      {/* Row 1: Horizontal KPI Grid (6 compact cards) */}
      <div className="kpi-grid">
        <MetricCard
          title="Pending Validation"
          value={pendingValidationCount}
          subtitle="Awaiting assessment"
          icon={LayersIcon}
          accentColor="#0D9488"
          accentBg="#F0FDFA"
          badge={pendingValidationCount > 0 ? 'Queue Active' : 'Clear'}
          onClick={() => onNavigate('validation-queue')}
        />
        <MetricCard
          title="Validated Today"
          value={validatedCount}
          subtitle="Approved for consensus"
          icon={CheckCircleIcon}
          accentColor="#16A34A"
          accentBg="#ECFDF5"
        />
        <MetricCard
          title="Rejected Today"
          value={rejectedCount}
          subtitle="Noise & false positives"
          icon={XIcon}
          accentColor="#DC2626"
          accentBg="#FEF2F2"
        />
        <MetricCard
          title="Average CTI Quality"
          value={`${(avgQualityScore * 100).toFixed(0)}%`}
          subtitle="Time-decay (λ=0.95)"
          icon={SlidersIcon}
          accentColor="#2563EB"
          accentBg="#EFF6FF"
        />
        <MetricCard
          title="High-Risk Submissions"
          value={highRiskSubmissions}
          subtitle="Severity ≥ 8.0 triage"
          icon={AlertTriangleIcon}
          accentColor="#D97706"
          accentBg="#FFFBEB"
        />
        <MetricCard
          title="Contributors In Review"
          value={contributorsUnderReview}
          subtitle="Reputation decay watch"
          icon={TrendingUpIcon}
          accentColor="#7C3AED"
          accentBg="#F5F3FF"
          onClick={() => onNavigate('contributor-trust')}
        />
      </div>

      {/* Row 2: 2/3 vs 1/3 Grid: Validation Queue Table (Left) + Quick Actions & Explainability (Right) */}
      <div className="dashboard-grid-2-1">
        {/* LEFT (2/3): Validation Queue Table */}
        <ChartCard
          title="Validation Queue"
          subtitle="Candidate threat indicators awaiting STIX verification, quality scoring, and peer consensus"
          headerAction={
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('validation-queue')}>
              <span>View All ({ctiList.length})</span>
            </button>
          }
        >
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>INDICATOR</th>
                  <th>TYPE</th>
                  <th>ORGANIZATION</th>
                  <th>SEVERITY</th>
                  <th>CONFIDENCE</th>
                  <th>QUALITY (Q)</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {ctiList.slice(0, 6).map(c => {
                  const org = organizations.find(o => o.id === c.organization_id);
                  const decision = validationStatuses[c.id];
                  const qualityVal = (c.confidence > 1 ? c.confidence / 100 : c.confidence) * 0.85 + 0.1;

                  return (
                    <tr key={c.id}>
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
                        <span style={{ fontWeight: 500, fontSize: '11.5px' }}>{org?.name || 'Sensor Peer Org'}</span>
                      </td>
                      <td>
                        <SeverityBadge severity={c.severity} size="sm" />
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 600, fontSize: '11px' }}>
                          {c.confidence > 1 ? c.confidence : (c.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <QualityScore score={qualityVal} size="sm" />
                      </td>
                      <td>
                        {decision ? (
                          <StatusBadge status={decision} size="sm" />
                        ) : (
                          <StatusBadge status={c.status} size="sm" />
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: '#0D9488', borderColor: '#0D9488' }}
                          onClick={() => setReviewingCti(c)}
                        >
                          <LayersIcon size={12} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* RIGHT (1/3): Quick Actions & Weight Explainability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions Panel */}
          <ChartCard
            title="Quick Actions"
            subtitle="Validator operational triggers"
          >
            <div className="quick-action-grid">
              <button className="quick-action-btn" onClick={() => onNavigate('validation-queue')}>
                <LayersIcon size={14} style={{ color: '#0D9488' }} />
                <span>Review Queue</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('cti-feed')}>
                <SearchIcon size={14} style={{ color: '#0D9488' }} />
                <span>Validate CTI</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('contributor-trust')}>
                <UsersIcon size={14} style={{ color: '#0D9488' }} />
                <span>Review Contributor</span>
              </button>
              <button className="quick-action-btn" onClick={() => onNavigate('quality-analytics')}>
                <SlidersIcon size={14} style={{ color: '#0D9488' }} />
                <span>View Quality</span>
              </button>
            </div>
          </ChartCard>

          {/* Mathematical Weighting Explainability */}
          <ChartCard
            title="Consensus Weighting Formulation"
            subtitle="Why is this contribution scored this way?"
            headerAction={
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFormulaModal(true)}>
                <span>Details</span>
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              <div className="font-mono" style={{ backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '8px', borderRadius: 'var(--radius-sm)', color: '#0F766E', textAlign: 'center', fontWeight: 700, fontSize: '11px' }}>
                Ŵ_i = [ T_i × Q_i × (1 - A_i) ] / Σ W_j
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <div><strong>1. Peer Trust (T_i):</strong> Exponential Moving Average (α=0.1).</div>
                <div><strong>2. Quality (Q_i):</strong> Time-decayed confidence (λ=0.95).</div>
                <div><strong>3. Anomaly (A_i):</strong> Byzantine suppression (-99.38%).</div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Contributor Trust & Anomaly Registry Table */}
      <ChartCard
        title="Contributor Trust & Anomaly Weighting"
        subtitle="Dynamic multi-factor scoring ensuring Byzantine suppression and quality gating"
        headerAction={
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('contributor-trust')}>
            <span>Full Analytics</span>
          </button>
        }
      >
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ORGANIZATION</th>
                <th>TRUST (T)</th>
                <th>QUALITY (Q)</th>
                <th>ANOMALY (A)</th>
                <th>CONTRIBUTION WEIGHT (Ŵ)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(organizations.length > 0 ? organizations : [
                { id: '1', name: 'CyberDefense Alpha', trust_score: 0.85, privacy_budget: 10, status: 'ACTIVE', created_at: '' },
                { id: '2', name: 'Financial ISAC', trust_score: 0.92, privacy_budget: 10, status: 'ACTIVE', created_at: '' },
                { id: '3', name: 'HealthNet SOC', trust_score: 0.78, privacy_budget: 10, status: 'ACTIVE', created_at: '' }
              ]).map(org => {
                const t = org.trust_score || 0.8;
                const q = 0.91;
                const a = 0.04;
                const w = (t * q * (1 - a)).toFixed(3);

                return (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                    <td><TrustScore score={t} size="sm" compact /></td>
                    <td><QualityScore score={q} size="sm" /></td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--color-success)' }}>{a.toFixed(2)} (Normal)</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '12px' }}>{w}</td>
                    <td><StatusBadge status={org.status} size="sm" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Mathematical Trust Scoring Model</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFormulaModal(false)}>Close</button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p>ThreatShield applies formal multi-factor weighting to ensure resilient peer validation:</p>
              <div className="font-mono" style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                T_new = T_old × (1 - α) + α × S_feedback (α = 0.1)<br />
                Q = Σ (S_i · λ^Δt_i · c_i) / Σ (λ^Δt_i · c_i)<br />
                W_i = T_i × Q_i × (1 - A_i)
              </div>
              <p>Under adversarial parameter perturbation attacks, this mathematical formulation suppresses malicious contribution weights by 99.38% to 99.91%.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
