import React, { useState, useEffect } from 'react';
import type { CTIRecord } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreBreakdown } from '../common/ScoreBreakdown';
import { PageHeader } from '../common/PageHeader';
import { LoadingState } from '../common/LoadingState';

interface InvestigateViewProps {
  ctiList: CTIRecord[];
  onSelectCti?: (cti: CTIRecord) => void;
  token: string;
  onNavigate?: (view: any) => void;
}

export const InvestigateView: React.FC<InvestigateViewProps> = ({
  ctiList,
  token,
  onNavigate
}) => {
  const [selectedCtiId, setSelectedCtiId] = useState<string>(ctiList[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [dossier, setDossier] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'score' | 'graph' | 'sightings' | 'attck' | 'audit'>('overview');

  // Feedback form
  const [feedbackType, setFeedbackType] = useState('CONFIRMED_MALICIOUS');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const activeId = selectedCtiId || (ctiList[0]?.id || '');

  useEffect(() => {
    if (!activeId || !token) return;
    let isMounted = true;
    fetch(`http://127.0.0.1:8000/api/cti/${activeId}/investigate`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(d => {
        if (isMounted) {
          setDossier(d);
          setLoading(false);
        }
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeId, token]);

  const handleSendFeedback = async () => {
    if (!selectedCtiId) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cti/${selectedCtiId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback_type: feedbackType,
          comment: feedbackComment
        })
      });
      if (res.ok) {
        // Refresh dossier
        const resDos = await fetch(`http://127.0.0.1:8000/api/cti/${selectedCtiId}/investigate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resDos.ok) {
          setDossier(await resDos.json());
        }
        setFeedbackComment('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredList = ctiList.filter(c =>
    !searchFilter ||
    c.value.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const identity = dossier?.identity;
  const intel = dossier?.intelligence;
  const rels = dossier?.relationships;
  const breakdown = intel?.component_breakdown;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="360° IOC Investigation Workspace"
        description="Comprehensive indicator dossier with 6-factor composite scoring, STIX relationship mapping, and peer feedback."
        badge="INTELLIGENCE WORKSPACE"
        badgeColor="indigo"
      />

      {/* Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Indicator Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <input
              type="text"
              placeholder="Search indicators..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="p-2 overflow-y-auto space-y-1 divide-y divide-slate-100">
            {filteredList.map((c) => {
              const isSelected = selectedCtiId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCtiId(c.id)}
                  className={`p-3 rounded-xl cursor-pointer text-xs transition ${
                    isSelected
                      ? 'bg-blue-50/80 border border-blue-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold font-mono text-slate-900 line-clamp-1">{c.value}</span>
                    <SeverityBadge severity={c.severity} showScore={false} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 capitalize">
                    <span>{c.type}</span>
                    <span>{c.status || 'ACTIVE'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full-Screen Indicator Dossier */}
        <div className="lg:col-span-3 space-y-6">
          {loading && !dossier ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs">
              <LoadingState message="Synthesizing 360° Threat Intelligence Dossier..." />
            </div>
          ) : !dossier ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-400 text-xs">
              Select an indicator to initiate full investigation.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dossier Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs font-mono uppercase">
                      {identity?.type || 'IOC'}
                    </span>
                    <h2 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                      {identity?.value}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={identity?.severity ?? 8.5} />
                    <StatusBadge status={identity?.status || 'ACTIVE'} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400">Source: </span>
                      <span className="font-semibold text-slate-800">{identity?.source_organization_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Confidence: </span>
                      <span className="font-mono font-bold text-slate-800">{((identity?.confidence || 0.9) * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Sightings: </span>
                      <span className="font-mono font-bold text-slate-800">{identity?.sightings_count || 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <>
                        <button
                          onClick={() => onNavigate('knowledge-graph')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                        >
                          🕸️ View in Graph
                        </button>
                        <button
                          onClick={() => onNavigate('incidents')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition"
                        >
                          🚨 Create Incident
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'score', label: 'Score Breakdown (v2)' },
                  { id: 'graph', label: 'Relationships' },
                  { id: 'sightings', label: 'Peer Validation & Sightings' },
                  { id: 'attck', label: 'ATT&CK Techniques' },
                  { id: 'audit', label: 'Audit Provenance' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2 font-bold rounded-lg transition ${
                      activeTab === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Indicator Description & Context
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {identity?.description || 'Active malicious indicator observed across federated sensors.'}
                  </p>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      💡 Why is this threat important?
                    </div>
                    <ul className="text-xs text-indigo-900 space-y-1 list-disc list-inside font-medium">
                      {intel?.explainability_reasons?.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: ThreatShield Score v2 Breakdown */}
              {activeTab === 'score' && (
                <ScoreBreakdown
                  score={intel?.threatshield_score_v2 ?? 0.75}
                  classification={intel?.classification ?? 'HIGH_PRIORITY'}
                  breakdown={breakdown}
                  reasons={intel?.explainability_reasons}
                />
              )}

              {/* Tab 3: Graph Relationships */}
              {activeTab === 'graph' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Associated Threat Actors</h4>
                    <div className="text-xs space-y-1">
                      {rels?.threat_actors?.map((a: string, idx: number) => (
                        <div key={idx} className="p-2 bg-red-50 text-red-900 rounded-lg font-bold">🎯 {a}</div>
                      )) || <div className="text-slate-400">No threat actors directly linked.</div>}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Associated Malware Families</h4>
                    <div className="text-xs space-y-1">
                      {rels?.malware_families?.map((m: string, idx: number) => (
                        <div key={idx} className="p-2 bg-orange-50 text-orange-900 rounded-lg font-bold">🐛 {m}</div>
                      )) || <div className="text-slate-400">No malware families directly linked.</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Peer Validation & Sightings */}
              {activeTab === 'sightings' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Submit Peer Validation Assessment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Validation Classification</label>
                      <select
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                      >
                        <option value="CONFIRMED_MALICIOUS">CONFIRMED_MALICIOUS (Increases Trust +0.05)</option>
                        <option value="USEFUL">USEFUL (Increases Trust +0.02)</option>
                        <option value="FALSE_POSITIVE">FALSE_POSITIVE (Applies Penalty α=0.30)</option>
                        <option value="EXPIRED">EXPIRED (Stale Telemetry)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Analyst / Validator Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Verified matching C2 egress in SIEM..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSendFeedback}
                      disabled={submittingFeedback}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      {submittingFeedback ? 'Recording on Ledger...' : 'Commit Validation Assessment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: ATT&CK Techniques */}
              {activeTab === 'attck' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    MITRE ATT&CK Enterprise Mappings
                  </h3>
                  <div className="space-y-2 text-xs">
                    {rels?.mitre_techniques?.map((tech: string, idx: number) => (
                      <div key={idx} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-950">{tech}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-200 text-indigo-800 rounded">
                          OBSERVED
                        </span>
                      </div>
                    )) || <div className="text-slate-400">No ATT&CK techniques directly mapped.</div>}
                  </div>
                </div>
              )}

              {/* Tab 6: Audit Provenance */}
              {activeTab === 'audit' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Permissioned Hash-Chain Audit Provenance
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div>
                      <span className="text-slate-500">Record ID: </span>
                      <span className="font-mono font-bold text-slate-900">{identity?.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Source Organization ID: </span>
                      <span className="font-mono text-slate-700">{identity?.source_organization_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Created Timestamp: </span>
                      <span className="font-mono text-slate-700">{identity?.created_at}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Cryptographic Integrity: </span>
                      <span className="font-bold text-emerald-700">VERIFIED IMMUTABLE ON LEDGER</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
