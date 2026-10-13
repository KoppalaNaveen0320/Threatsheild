import React, { useState, useEffect } from 'react';
import type { Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';

interface PrivacyCenterViewProps {
  token: string;
  currentOrg: Organization | null;
}

export const PrivacyCenterView: React.FC<PrivacyCenterViewProps> = ({
  token,
  currentOrg
}) => {
  const [budget, setBudget] = useState<number>(currentOrg?.privacy_budget ?? 10.0);
  const [frontierData, setFrontierData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Noise Simulator
  const [simEps, setSimEps] = useState<number>(1.0);
  const [simSens, setSimSens] = useState<number>(1.0);
  const [simValue, setSimValue] = useState<number>(150);
  const [noisyOutput, setNoisyOutput] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    Promise.all([
      fetch('http://127.0.0.1:8000/api/privacy/budget', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('http://127.0.0.1:8000/api/privacy/utility-frontier', { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resBudget, resFrontier]) => {
        if (resBudget.ok && isMounted) {
          const dBudget = await resBudget.json();
          setBudget(dBudget.privacy_budget);
        }
        if (resFrontier.ok && isMounted) {
          const dFrontier = await resFrontier.json();
          setFrontierData(dFrontier);
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
  }, [token]);

  const handleSimulateNoise = () => {
    // Generate Laplace sample: b = sensitivity / epsilon
    const b = simSens / (simEps || 0.1);
    const u = Math.random() - 0.5;
    const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    setNoisyOutput(Math.max(0, Math.round(simValue + noise)));
  };

  const consumedBudget = Math.max(0, 10.0 - budget);
  const pctConsumed = Math.min(100, (consumedBudget / 10.0) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Differential Privacy Budget Accounting"
        description="Manage organization privacy budgets (ε), evaluate privacy-utility frontiers, and execute calibrated statistical queries."
        badge="PRIVACY ACCOUNTING"
        badgeColor="indigo"
        actions={
          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 font-mono">
            <span className="font-bold text-slate-800">Guarantee: </span>
            Pr[M(D) ∈ S] ≤ exp(ε) · Pr[M(D') ∈ S]
          </div>
        }
      />

      {/* Budget KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Allocated Budget" value="10.0 ε" subtext="Max Org Allocation" icon="🔒" />
        <MetricCard label="Consumed Budget" value={`${consumedBudget.toFixed(2)} ε`} subtext={`${pctConsumed.toFixed(1)}% Consumed`} icon="📉" />
        <MetricCard label="Remaining Budget" value={`${budget.toFixed(2)} ε`} subtext="Active query capacity" icon="🛡️" alertLevel={budget < 2.0 ? 'warning' : 'normal'} />
        <MetricCard label="Noise Mechanism" value="Laplace (0, b)" subtext="b = Δf / ε scale" icon="🧪" />
      </div>

      {/* Visual Budget Depletion Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">Privacy Budget Depletion</span>
          <span className="font-mono font-bold text-slate-900">{budget.toFixed(2)} / 10.00 ε Remaining</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budget < 2.0 ? 'bg-rose-500' : budget < 5.0 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${(budget / 10.0) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>0.0 ε (Exhausted)</span>
          <span>10.0 ε (Full Capacity)</span>
        </div>
      </div>

      {/* Noise Simulator & Frontier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laplace Noise Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Calibrated Laplace Mechanism Simulator
            </h3>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Lap(0, Δf/ε)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">True Value (f(D))</label>
              <input
                type="number"
                value={simValue}
                onChange={(e) => setSimValue(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Privacy Budget (ε)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={simEps}
                  onChange={(e) => setSimEps(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Sensitivity (Δf)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={simSens}
                  onChange={(e) => setSimSens(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateNoise}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs"
            >
              Execute Perturbation Sample
            </button>

            {noisyOutput !== null && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-purple-700 font-bold">Differentially Private Response:</div>
                  <div className="text-2xl font-extrabold text-purple-950 font-mono mt-0.5">{noisyOutput}</div>
                </div>
                <div className="text-right text-[11px] text-purple-600 font-mono">
                  Error: {Math.abs(noisyOutput - simValue)} (±{((Math.abs(noisyOutput - simValue) / simValue) * 100).toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empirical Privacy-Utility Frontier Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Empirical Privacy-Utility Frontier (v1.2 Artifact)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Empirical MAE measured across 1,000 queries per epsilon configuration.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 font-sans">
                  <th className="p-2.5">Epsilon (ε)</th>
                  <th className="p-2.5">Scale (b)</th>
                  <th className="p-2.5">Empirical MAE</th>
                  <th className="p-2.5">Relative Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-400 font-sans">Loading frontier data...</td></tr>
                ) : (
                  frontierData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-purple-700">{row.epsilon}</td>
                      <td className="p-2.5 text-slate-600">{row.laplace_scale_b}</td>
                      <td className="p-2.5 text-slate-800">{row.empirical_mae}</td>
                      <td className="p-2.5 font-bold text-emerald-700">{row.relative_error_pct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
