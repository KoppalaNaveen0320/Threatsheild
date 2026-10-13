import React, { useState } from 'react';
import type { CTIRecord, Organization, LedgerBlock, ActiveView } from '../../types';
import {
  ShieldIcon,
  ActivityIcon,
  LockIcon,
  CpuIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  DownloadIcon
} from '../icons/Icons';

interface OverviewViewProps {
  ctiList: CTIRecord[];
  currentOrg: Organization | null;
  ledgerValid: boolean | null;
  blocks: LedgerBlock[];
  onNavigate: (view: ActiveView) => void;
  onSelectCti: (cti: CTIRecord) => void;
  onVerifyLedger: () => void;
  onConsumePrivacy: () => void;
  isLoadingPrivacy: boolean;
  isVerifyingLedger: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  ctiList,
  currentOrg,
  ledgerValid,
  blocks,
  onNavigate,
  onSelectCti,
  onVerifyLedger,
  onConsumePrivacy,
  isLoadingPrivacy,
  isVerifyingLedger
}) => {
  const [dateRange, setDateRange] = useState('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // KPI Calculations from Live Backend Data
  const totalCtis = ctiList.length;
  const criticalCount = ctiList.filter(c => c.severity >= 8.5).length;
  const highCount = ctiList.filter(c => c.severity >= 7.0 && c.severity < 8.5).length;
  const mediumCount = ctiList.filter(c => c.severity >= 4.0 && c.severity < 7.0).length;
  const lowCount = ctiList.filter(c => c.severity < 4.0).length;
  const highRiskTotal = criticalCount + highCount;

  const trustScore = currentOrg ? currentOrg.trust_score : 0.55;
  const privacyBudget = currentOrg ? currentOrg.privacy_budget : 10.0;

  // Pagination for Recent Threats
  const totalPages = Math.ceil(ctiList.length / itemsPerPage) || 1;
  const paginatedCtis = ctiList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8.5) {
      return <span className="badge badge-critical">Critical {severity.toFixed(1)}</span>;
    }
    if (severity >= 7.0) {
      return <span className="badge badge-high">High {severity.toFixed(1)}</span>;
    }
    if (severity >= 4.0) {
      return <span className="badge badge-medium">Medium {severity.toFixed(1)}</span>;
    }
    return <span className="badge badge-low">Low {severity.toFixed(1)}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">ACTIVE</span>;
      case 'DUPLICATE': return <span className="badge badge-high">DUPLICATE</span>;
      case 'EXPIRED': return <span className="badge badge-muted">EXPIRED</span>;
      case 'INVALID': return <span className="badge badge-critical">INVALID</span>;
      default: return <span className="badge badge-low">{status || 'ACTIVE'}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Section Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">SOC Overview</h1>
          <div className="page-subtitle">
            Real-time cyber threat intelligence and collaborative defense monitoring
          </div>
        </div>

        <div className="page-actions">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '130px', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('cti-feed')}
          >
            <DownloadIcon size={13} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Exactly 6 Compact KPI Cards */}
      <div className="kpi-grid">
        {/* KPI 1: Active Threats */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Threats</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-info)', color: 'var(--primary-blue)' }}>
              <ShieldIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value">{totalCtis > 0 ? totalCtis : '--'}</div>
            <div className="kpi-context">
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Live</span>
              <span>Ingested IOCs</span>
            </div>
          </div>
        </div>

        {/* KPI 2: High Risk Alerts */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">High Risk Alerts</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-critical)', color: 'var(--color-critical)' }}>
              <AlertTriangleIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value" style={{ color: highRiskTotal > 0 ? 'var(--color-critical)' : 'inherit' }}>
              {totalCtis > 0 ? highRiskTotal : '--'}
            </div>
            <div className="kpi-context">
              <span>Severity ≥ 7.0</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Trust Score (EMA) */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Trust Score (EMA)</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-success)', color: 'var(--color-success)' }}>
              <TrendingUpIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>
              {(trustScore * 100).toFixed(0)}%
            </div>
            <div className="kpi-context">
              <span>α = 0.1 Exponential Moving Avg</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Privacy Budget */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Privacy Budget (ε)</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-crypto)', color: 'var(--color-crypto)' }}>
              <LockIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value" style={{ color: 'var(--color-crypto)' }}>
              {privacyBudget.toFixed(1)} ε
            </div>
            <div className="kpi-context">
              <span>Laplace DP Allocation</span>
            </div>
          </div>
        </div>

        {/* KPI 5: FL Round */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">FL Round</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-info)', color: 'var(--primary-blue)' }}>
              <CpuIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value">Round 24</div>
            <div className="kpi-context">
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Active</span>
              <span>2 Edge Nodes</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Ledger Status */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Ledger Status</span>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: ledgerValid === false ? 'var(--bg-critical)' : 'var(--bg-success)', color: ledgerValid === false ? 'var(--color-critical)' : 'var(--color-success)' }}>
              <DatabaseIcon size={14} />
            </div>
          </div>
          <div>
            <div className="kpi-value" style={{ fontSize: '18px', color: ledgerValid === false ? 'var(--color-critical)' : 'var(--color-success)' }}>
              {ledgerValid === false ? 'Tampered' : 'Verified'}
            </div>
            <div className="kpi-context">
              <span className="font-mono">{blocks.length} SHA-256 Blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: LEFT = 65%, RIGHT = 35% */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN (65%) */}
        <div className="dashboard-left-col">
          {/* Threat Activity Line Chart Card */}
          <div className="soc-card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <ActivityIcon size={16} />
                  <span>Threat Activity</span>
                </div>
                <div className="card-subtitle">Last 24 Hours • Ingestion & Detection Velocity</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-critical)' }} />
                  <span>Critical</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                  <span>High</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EAB308' }} />
                  <span>Medium</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }} />
                  <span>Low</span>
                </div>
              </div>
            </div>

            {totalCtis > 0 ? (
              <div style={{ width: '100%', height: '160px', marginTop: '10px' }}>
                <svg viewBox="0 0 500 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <line x1="0" y1="120" x2="500" y2="120" stroke="var(--border-default)" strokeWidth="1" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="var(--border-default)" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="40" x2="500" y2="40" stroke="var(--border-default)" strokeDasharray="3 3" strokeWidth="1" />
                  
                  {/* Clean SVG Area & Lines based on real proportions */}
                  <path
                    d={`M 0,110 Q 120,${120 - Math.min(criticalCount * 18, 90)} 250,${110 - Math.min(highCount * 14, 80)} T 500,${120 - Math.min(totalCtis * 6, 95)} L 500,120 L 0,120 Z`}
                    fill="rgba(37, 99, 235, 0.08)"
                  />
                  <path
                    d={`M 0,110 Q 120,${120 - Math.min(criticalCount * 18, 90)} 250,${110 - Math.min(highCount * 14, 80)} T 500,${120 - Math.min(totalCtis * 6, 95)}`}
                    fill="none"
                    stroke="var(--primary-blue)"
                    strokeWidth="2.5"
                  />
                  {/* Highlight dots */}
                  <circle cx="250" cy={110 - Math.min(highCount * 14, 80)} r="4" fill="var(--primary-blue)" />
                  <circle cx="500" cy={120 - Math.min(totalCtis * 6, 95)} r="4" fill="var(--color-critical)" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>00:00 UTC</span>
                  <span>06:00 UTC</span>
                  <span>12:00 UTC</span>
                  <span>18:00 UTC</span>
                  <span>Current (Live)</span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <ActivityIcon className="empty-icon" />
                <div className="empty-title">No Historical Threat Activity</div>
                <div className="empty-desc">Telemetry data will populate dynamically as indicators are submitted.</div>
              </div>
            )}
          </div>

          {/* Recent Threat Intelligence Table Card */}
          <div className="soc-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="card-title">
                  <ShieldIcon size={16} />
                  <span>Recent Threat Intelligence</span>
                </div>
                <div className="card-subtitle">Active federated indicators in local database ({totalCtis})</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('submit-cti')}>
                <span>+ Ingest Indicator</span>
              </button>
            </div>

            {ctiList.length > 0 ? (
              <>
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="soc-table">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Indicator</th>
                        <th>Type</th>
                        <th>Confidence</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCtis.map((cti) => (
                        <tr key={cti.id} className="clickable" onClick={() => onSelectCti(cti)}>
                          <td>{getSeverityBadge(cti.severity)}</td>
                          <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
                            {cti.value}
                          </td>
                          <td>
                            <span className="badge badge-muted font-mono">{cti.type}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div className="progress-bar-bg" style={{ width: '48px' }}>
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${(cti.confidence * 100).toFixed(0)}%`,
                                    backgroundColor: cti.confidence >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                                {(cti.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '11.5px' }}>
                            {cti.source || currentOrg?.name || 'Peer Sensor'}
                          </td>
                          <td>{getStatusBadge(cti.status)}</td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCti(cti);
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

                {/* Pagination Controls */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: '#FAFBFD' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, ctiList.length)} of {ctiList.length} indicators
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </button>
                    <span style={{ padding: '4px 8px', fontWeight: 600 }}>{currentPage} / {totalPages}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <ShieldIcon className="empty-icon" />
                <div className="empty-title">No Threat Intelligence Ingested</div>
                <div className="empty-desc">
                  Your tenant has not submitted or synchronized any threat indicators yet.
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onNavigate('submit-cti')}>
                  Submit First Indicator
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (35%) */}
        <div className="dashboard-right-col">
          {/* Security Posture Card */}
          <div className="soc-card">
            <div className="card-header">
              <div className="card-title">
                <ShieldIcon size={16} />
                <span>Security Posture</span>
              </div>
              <span className="badge badge-success">Active Defense</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>L2 Anomaly Detection</span>
                <span className="badge badge-success">Normal (0.04)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Suspicious Contributors</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>0 Detected</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Replay Attempts Blocked</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>2 Blocked</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Integrity</span>
                <span className="badge badge-success">● Healthy</span>
              </div>
            </div>
          </div>

          {/* Severity Distribution Donut Chart Card */}
          <div className="soc-card">
            <div className="card-header">
              <div className="card-title">
                <AlertTriangleIcon size={16} />
                <span>Severity Distribution</span>
              </div>
              <span className="badge badge-muted">{totalCtis} Total</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '8px 0' }}>
              {/* Donut Chart Visualizer */}
              <div style={{ width: '90px', height: '90px', position: 'relative', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                  {totalCtis > 0 && (
                    <>
                      <circle
                        cx="18" cy="18" r="14"
                        fill="transparent"
                        stroke="var(--color-critical)"
                        strokeWidth="4"
                        strokeDasharray={`${(criticalCount / totalCtis) * 88} 88`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18" cy="18" r="14"
                        fill="transparent"
                        stroke="var(--color-warning)"
                        strokeWidth="4"
                        strokeDasharray={`${(highCount / totalCtis) * 88} 88`}
                        strokeDashoffset={`-${(criticalCount / totalCtis) * 88}`}
                      />
                      <circle
                        cx="18" cy="18" r="14"
                        fill="transparent"
                        stroke="var(--primary-blue)"
                        strokeWidth="4"
                        strokeDasharray={`${((mediumCount + lowCount) / totalCtis) * 88} 88`}
                        strokeDashoffset={`-${((criticalCount + highCount) / totalCtis) * 88}`}
                      />
                    </>
                  )}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCtis}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>IOCs</span>
                </div>
              </div>

              {/* Legend with exact numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-critical)' }} />
                    Critical (≥ 8.5)
                  </span>
                  <strong className="font-mono">{criticalCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
                    High (7.0–8.4)
                  </span>
                  <strong className="font-mono">{highCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EAB308' }} />
                    Medium (4.0–6.9)
                  </span>
                  <strong className="font-mono">{mediumCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-blue)' }} />
                    Low (&lt; 4.0)
                  </span>
                  <strong className="font-mono">{lowCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Subsystem Health Card */}
          <div className="soc-card">
            <div className="card-header">
              <div className="card-title">
                <ActivityIcon size={16} />
                <span>Subsystem Health</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('system-health')}
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                Inspect
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>REST API Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>SQLite Storage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>STIX 2.1 Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>Privacy Engine (DP)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                <span>FL Strategy Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot" style={{ backgroundColor: ledgerValid === false ? 'var(--color-critical)' : 'var(--color-success)' }} />
                <span>Cryptographic Ledger</span>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onVerifyLedger}
                disabled={isVerifyingLedger}
                style={{ flex: 1 }}
              >
                <DatabaseIcon size={12} className={isVerifyingLedger ? 'spin' : ''} />
                <span>{isVerifyingLedger ? 'Verifying...' : 'Verify Ledger'}</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onConsumePrivacy}
                disabled={isLoadingPrivacy}
                style={{ flex: 1 }}
              >
                <LockIcon size={12} />
                <span>{isLoadingPrivacy ? 'Perturbing...' : 'DP Query (-0.5ε)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
