import React, { useState } from 'react';
import type { ActiveView } from '../../types';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "1. Administrator Authentication & Governance",
      view: 'admin-overview' as ActiveView,
      desc: "Authenticate as an Enterprise Superuser with role-based governance across all federated organizations.",
      badge: "ADMIN GOVERNANCE",
      highlight: "Examine multi-tenant organization posture and system health."
    },
    {
      title: "2. Unified Security Operations Command Center",
      view: 'analyst-soc' as ActiveView,
      desc: "Real-time SOC operations overview tracking active threat feeds, correlated incidents, and alliance KPIs.",
      badge: "SOC OVERVIEW",
      highlight: "Review high-severity telemetry and active indicator streams."
    },
    {
      title: "3. 360° IOC Investigation & Decision Score v2",
      view: 'cti-feed' as ActiveView,
      desc: "Inspect high-priority IOCs with the 6-factor ThreatShield Decision Score v2 with temporal exponential decay.",
      badge: "DECISION SCORE v2",
      highlight: "Examine composite score contributions: Quality, Trust, Relevance, Freshness, Graph Centrality, and Sightings."
    },
    {
      title: "4. Temporal Cyber Threat Knowledge Graph",
      view: 'knowledge-graph' as ActiveView,
      desc: "Explore 17 entity types and 13 relationship types with power-iteration PageRank and shortest threat path traversal.",
      badge: "KNOWLEDGE GRAPH",
      highlight: "Execute BFS attack path finding from APT29 to defended victim assets."
    },
    {
      title: "5. Multi-Pivot Threat Hunting",
      view: 'threat-hunting' as ActiveView,
      desc: "Pivot cross-entity telemetry across IOCs, Malware Families, Threat Actors, CVEs, and Incidents.",
      badge: "THREAT HUNTING",
      highlight: "Trace adversary footprints from initial exploit to lateral movement."
    },
    {
      title: "6. Security Incident Response Lifecycle",
      view: 'incidents' as ActiveView,
      desc: "Manage security incident lifecycles across 6 standardized stages (NEW -> TRIAGED -> INVESTIGATING -> CONTAINED -> RESOLVED -> CLOSED).",
      badge: "INCIDENT RESPONSE",
      highlight: "Advance containment stages with linked CTI telemetry and resolution audit logs."
    },
    {
      title: "7. MITRE ATT&CK® Enterprise Coverage Matrix",
      view: 'threat-hunting' as ActiveView,
      desc: "Visualize enterprise tactic coverage and distinguish observed vs inferred adversary techniques.",
      badge: "ATT&CK MATRIX",
      highlight: "Identify high-frequency initial access and execution vectors."
    },
    {
      title: "8. Adaptive Organization Trust & Risk Score",
      view: 'trust-center' as ActiveView,
      desc: "Review organization reputation updates with asymmetric penalty weighting (α=0.30) and unified 0-100 risk scoring.",
      badge: "ADAPTIVE TRUST",
      highlight: "Inspect trust factor deductions for false positives, duplicate spam, and FL anomalies."
    },
    {
      title: "9. FL Security Operations & 7 Aggregators",
      view: 'fl-security-lab' as ActiveView,
      desc: "Evaluate 7 robust federated aggregation algorithms (Trust-Weighted, Standard FedAvg, FedProx, Multi-Krum, Clipped FedAvg, Trimmed Mean, Median).",
      badge: "FL BENCHMARK",
      highlight: "Compare clean baselines across 5 independent random seeds."
    },
    {
      title: "10. Adversarial Defense & Collusion Detection",
      view: 'fl-security-lab' as ActiveView,
      desc: "Mitigate Gaussian parameter poisoning, gradient sign flips, and multi-client Sybil collusion attacks.",
      badge: "ADVERSARIAL LAB",
      highlight: "Achieve >94% malicious influence reduction while preserving predictive accuracy."
    },
    {
      title: "11. Differential Privacy Budget Accounting",
      view: 'privacy-center' as ActiveView,
      desc: "Manage calibrated Laplace noise injection (ε ∈ [0.1, 10.0]) and dynamic organization budget depletion.",
      badge: "PRIVACY CENTER",
      highlight: "Explore empirical privacy-utility trade-offs on statistical frequency queries."
    },
    {
      title: "12. Permissioned Cryptographic Audit Ledger",
      view: 'ledger' as ActiveView,
      desc: "Verify immutable SHA-256 hash chains and cryptographic Merkle provenance for all platform actions.",
      badge: "AUDIT LEDGER",
      highlight: "Execute tamper detection to mathematically prove chain validity."
    }
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onNavigate(steps[nextStep].view);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onNavigate(steps[prevStep].view);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentStep(idx);
    onNavigate(steps[idx].view);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-white rounded-2xl border-2 border-indigo-500 shadow-2xl p-5 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded">
            DEMO / GUIDED TOUR
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
          ✕
        </button>
      </div>

      {/* Step Content */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{current.badge}</div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">{current.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{current.desc}</p>
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 font-medium">
          💡 <span className="font-bold">Demonstration Focus:</span> {current.highlight}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleJump(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentStep ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs"
        >
          {currentStep === steps.length - 1 ? 'Finish Guided Tour' : 'Next Step ➔'}
        </button>
      </div>
    </div>
  );
};
