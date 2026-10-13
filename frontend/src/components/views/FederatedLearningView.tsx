import React, { useState } from 'react';
import {
  CpuIcon,
  ShieldIcon,
  AlertTriangleIcon
} from '../icons/Icons';

export const FederatedLearningView: React.FC = () => {
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);
  const [attackActive, setAttackActive] = useState(false);

  const handleSimulateAttack = () => {
    setIsSimulatingAttack(true);
    setTimeout(() => {
      setAttackActive(!attackActive);
      setIsSimulatingAttack(false);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Federated Learning Defense Console</h1>
          <div className="page-subtitle">
            Collaborative intrusion detection training with Trust-Weighted Byzantine-robust aggregation
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-success">Flower 1.30 • PyTorch</span>
          <span className="data-tag data-tag-live">Active Federation</span>
        </div>
      </div>

      {/* Top FL KPI Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <span className="kpi-label">Current Round</span>
          <div className="kpi-value" style={{ color: 'var(--primary-blue)' }}>Round 24</div>
          <div className="kpi-context"><span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Synchronized</span></div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Active Participants</span>
          <div className="kpi-value">2 Nodes</div>
          <div className="kpi-context"><span>Org A & Org B</span></div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Global Accuracy</span>
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>76.60%</div>
          <div className="kpi-context"><span>Multi-Class Evaluation</span></div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Macro F1 Score</span>
          <div className="kpi-value" style={{ color: 'var(--color-crypto)' }}>0.6974</div>
          <div className="kpi-context"><span>Non-IID Dirichlet (α=0.5)</span></div>
        </div>
      </div>

      {/* Client Contribution Weights Visualizer */}
      <div className="soc-card">
        <div className="card-header">
          <div className="card-title">
            <CpuIcon size={16} />
            <span>Real-time Client Aggregation Weights (TrustWeightedFedAvg)</span>
          </div>
          <button
            className={`btn ${attackActive ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={handleSimulateAttack}
            disabled={isSimulatingAttack}
          >
            <AlertTriangleIcon size={13} />
            <span>{isSimulatingAttack ? 'Simulating...' : attackActive ? 'Disable Byzantine Simulation' : 'Simulate Byzantine Attack on Org B'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
          {/* Org A (Clean Client) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Organization A (Honest Participant)
              </span>
              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                Weight: {attackActive ? '99.4%' : '50.0%'} (W_A = {attackActive ? '0.485' : '0.485'})
              </span>
            </div>
            <div className="progress-bar-bg" style={{ height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: attackActive ? '99.4%' : '50.0%',
                  backgroundColor: 'var(--primary-blue)'
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Trust: 0.85 | Quality: 0.91 | Anomaly Score: 0.04 (Normal)
            </div>
          </div>

          {/* Org B (Target Client) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: attackActive ? 'var(--color-critical)' : 'var(--text-primary)' }}>
                Organization B {attackActive ? '(Byzantine Poisoning Detected)' : '(Honest Participant)'}
              </span>
              <span className="font-mono" style={{ fontWeight: 700, color: attackActive ? 'var(--color-critical)' : 'var(--primary-blue)' }}>
                Weight: {attackActive ? '0.6%' : '50.0%'} (W_B = {attackActive ? '0.003' : '0.485'})
              </span>
            </div>
            <div className="progress-bar-bg" style={{ height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: attackActive ? '0.6%' : '50.0%',
                  backgroundColor: attackActive ? 'var(--color-critical)' : 'var(--primary-blue)'
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: attackActive ? 'var(--color-critical)' : 'var(--text-muted)', marginTop: '2px' }}>
              {attackActive ? (
                <span>⚠️ L2 Anomaly: 0.994 | Malicious gradient influence suppressed by <strong>99.38%</strong></span>
              ) : (
                <span>Trust: 0.85 | Quality: 0.91 | Anomaly Score: 0.04 (Normal)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Experimental 5-Seed Poisoning Defense Benchmarks */}
      <div className="soc-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">
              <ShieldIcon size={16} />
              <span>Empirical Model Poisoning Defense Benchmarks</span>
            </div>
            <div className="card-subtitle">5-Seed Statistical Validation across seeds (42, 123, 456, 789, 2024)</div>
          </div>
          <span className="data-tag data-tag-exp">EXPERIMENTAL RESULT</span>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="soc-table">
            <thead>
              <tr>
                <th>Poisoning Noise Rate</th>
                <th>Standard FedAvg Weight</th>
                <th>Trust-Weighted FedAvg Weight</th>
                <th>Adversarial Weight Reduction</th>
                <th>Global Model Accuracy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-low">10% Perturbation</span></td>
                <td className="font-mono">50.00%</td>
                <td className="font-mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>0.31%</td>
                <td><strong style={{ color: 'var(--color-success)' }}>-99.38%</strong></td>
                <td className="font-mono">76.70% (Maintained)</td>
              </tr>
              <tr>
                <td><span className="badge badge-medium">20% Perturbation</span></td>
                <td className="font-mono">50.00%</td>
                <td className="font-mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>0.09%</td>
                <td><strong style={{ color: 'var(--color-success)' }}>-99.82%</strong></td>
                <td className="font-mono">76.70% (Maintained)</td>
              </tr>
              <tr>
                <td><span className="badge badge-high">30% Perturbation</span></td>
                <td className="font-mono">50.00%</td>
                <td className="font-mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>0.05%</td>
                <td><strong style={{ color: 'var(--color-success)' }}>-99.89%</strong></td>
                <td className="font-mono">76.70% (Maintained)</td>
              </tr>
              <tr>
                <td><span className="badge badge-critical">40% Perturbation</span></td>
                <td className="font-mono">50.00%</td>
                <td className="font-mono" style={{ color: 'var(--color-success)', fontWeight: 600 }}>0.04%</td>
                <td><strong style={{ color: 'var(--color-success)' }}>-99.91%</strong></td>
                <td className="font-mono">76.70% (Maintained)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
