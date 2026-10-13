import React, { useState, useEffect } from 'react';
import type { User, Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';
import { RiskBadge } from '../common/RiskBadge';
import { Timeline, type TimelineEvent } from '../common/Timeline';

interface AdaptiveTrustViewProps {
  token: string;
  currentUser: User | null;
  organizations: Organization[];
}

export const AdaptiveTrustView: React.FC<AdaptiveTrustViewProps> = ({
  token,
  currentUser,
  organizations
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return currentUser?.organization_id || (organizations[0]?.id || '');
  });
  const [riskData, setRiskData] = useState<any | null>(null);
  const [trustHistory, setTrustHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!selectedOrgId || !token) return;
    let isMounted = true;
    Promise.all([
      fetch(`http://127.0.0.1:8000/api/analytics/organizations/${selectedOrgId}/risk`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`http://127.0.0.1:8000/api/trust/history/${selectedOrgId}`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resRisk, resHist]) => {
        if (resRisk.ok && isMounted) {
          const dRisk = await resRisk.json();
          setRiskData(dRisk);
        }
        if (resHist.ok && isMounted) {
          const dHist = await resHist.json();
          setTrustHistory(dHist);
        }
        if (isMounted) setLoading(false);
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedOrgId, token]);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);
  const riskScore = riskData?.organization_risk_score ?? 20.0;
  const breakdown = riskData?.component_breakdown;

  const timelineEvents: TimelineEvent[] = trustHistory.map((item, idx) => ({
    id: `trust-h-${idx}`,
    timestamp: item.created_at || '',
    title: item.reason || 'Periodic validation assessment',
    description: `Trust updated from ${(item.previous_score * 100).toFixed(1)}% to ${(item.new_score * 100).toFixed(1)}%`,
    event_type: 'TRUST_UPDATE',
    badge: `${item.new_score >= item.previous_score ? '+' : ''}${((item.new_score - item.previous_score) * 100).toFixed(1)}%`
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Adaptive Organization Trust & Risk Center"
        description="Explainable organization reputation scoring with asymmetric penalty weighting (α=0.30) and multi-factor risk evaluation."
        badge="FEDERATED REPUTATION"
        badgeColor="emerald"
        actions={
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">Select Organization:</label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="p-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-800"
            >
              {organizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Current Trust Score"
          value={`${((selectedOrg?.trust_score ?? 0.85) * 100).toFixed(1)}%`}
          subtext="Dynamic reputation rating"
          icon="🛡️"
          trend="α = 0.30 Penalty"
        />
        <MetricCard
          label="Organization Risk"
          value={`${riskScore.toFixed(1)} / 100`}
          subtext="Multi-factor risk score"
          icon="⚡"
          alertLevel={riskScore >= 50 ? 'warning' : 'normal'}
        />
        <MetricCard
          label="False Positive Rate"
          value={`${((breakdown?.false_positive_penalty ?? 0) * 10).toFixed(1)}%`}
          subtext="Peer validator refutations"
          icon="⚠️"
        />
        <MetricCard
          label="FL Anomalies"
          value={(selectedOrg as any)?.fl_anomalies_count || 0}
          subtext="Byzantine gradient flags"
          icon="🧪"
          alertLevel={((selectedOrg as any)?.fl_anomalies_count || 0) > 0 ? 'critical' : 'normal'}
        />
      </div>

      {/* Row 2: Risk Breakdown & Trust History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Risk Breakdown & Explainability */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              0-100 Risk Score Formulation Breakdown
            </h3>
            <RiskBadge score={riskScore} />
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Base Untrusted Risk (1 - Trust) × 40</span>
                <span className="font-mono font-bold text-slate-900">{breakdown?.base_untrusted_risk?.toFixed(2)} pts</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${(breakdown?.base_untrusted_risk / 40) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">False Positive Ratio Penalty</span>
                <span className="font-mono font-bold text-slate-900">{breakdown?.false_positive_penalty?.toFixed(2)} pts</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${(breakdown?.false_positive_penalty / 25) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Duplicate Submission Penalty</span>
                <span className="font-mono font-bold text-slate-900">{breakdown?.duplicate_penalty?.toFixed(2)} pts</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: `${(breakdown?.duplicate_penalty / 15) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Federated Learning Anomaly Penalty</span>
                <span className="font-mono font-bold text-slate-900">{breakdown?.fl_anomaly_penalty?.toFixed(2)} pts</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-600 h-full" style={{ width: `${(breakdown?.fl_anomaly_penalty / 20) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Explainability Rationales */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              💡 Why did this organization score change?
            </h4>
            <ul className="text-xs text-indigo-900 space-y-1 list-disc list-inside font-medium leading-relaxed">
              {riskData?.reasons?.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Trust Change History Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Adaptive Trust Change Audit History
            </h3>
            <span className="text-xs text-slate-400 font-medium">Asymmetric updates log</span>
          </div>

          <Timeline
            events={timelineEvents}
            emptyMessage="No trust penalty or recovery events recorded for this organization."
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
