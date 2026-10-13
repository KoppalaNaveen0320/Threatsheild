import React, { useState, useEffect } from 'react';

interface IocInvestigateModalProps {
  iocId: string | null;
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onFeedbackSubmitted?: () => void;
}

export const IocInvestigateModal: React.FC<IocInvestigateModalProps> = ({
  iocId,
  isOpen,
  onClose,
  token,
  onFeedbackSubmitted
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState('CONFIRMED_MALICIOUS');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchDetails = async (id: string) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cti/${id}/investigate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !iocId || !token) return;
    let isMounted = true;
    fetch(`http://127.0.0.1:8000/api/cti/${iocId}/investigate`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(d => {
        if (isMounted) {
          setData(d);
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
  }, [isOpen, iocId, token]);

  const handleSendFeedback = async () => {
    if (!iocId) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cti/${iocId}/feedback`, {
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
        fetchDetails(iocId);
        if (onFeedbackSubmitted) onFeedbackSubmitted();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!isOpen || !iocId) return null;

  const identity = data?.identity;
  const intel = data?.intelligence;
  const rels = data?.relationships;
  const breakdown = intel?.component_breakdown;

  const getScoreColor = (classification: string) => {
    switch (classification) {
      case 'CRITICAL_ALERT': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH_PRIORITY': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ELEVATED_MONITORING': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full font-mono uppercase">
              {identity?.type || 'IOC'}
            </span>
            <h2 className="text-base font-bold text-slate-900 font-mono">{identity?.value || 'Loading...'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading || !data ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Synthesizing 360° Threat Intelligence Dossier...
            </div>
          ) : (
            <>
              {/* Top Intelligence & Score Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500">ThreatShield Decision Score v2</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                    {intel?.threatshield_score_v2?.toFixed(4) || '0.0000'}
                  </div>
                  <div className={`mt-2 px-2 py-0.5 text-[10px] font-bold border rounded-full inline-block ${getScoreColor(intel?.classification)}`}>
                    {intel?.classification || 'INFORMATIONAL_FEED'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500">Source Organization & Reputation</div>
                  <div className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                    {identity?.source_organization_name}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-1">
                    Trust: {((identity?.source_reputation || 0.5) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500">Telemetry Sightings & Validation</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {identity?.sightings_count || 1}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.feedback_summary?.positive_validations || 0} Peer Validations
                  </div>
                </div>
              </div>

              {/* 6-Factor Mathematical Contribution Breakdown */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    6-Factor Composite Score Breakdown (TS_v2)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">w1=0.25, w2=0.20, w3=0.20, w4=0.15, w5=0.10, w6=0.10</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Quality Score (Q)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.quality_contribution?.toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Source Trust (T)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.trust_contribution?.toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Sector Relevance (R)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.relevance_contribution?.toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Freshness Decay (F)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.freshness_contribution?.toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Graph Centrality (G)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.graph_centrality_contribution?.toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Sighting Frequency (S)</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{breakdown?.sighting_contribution?.toFixed(4)}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Explainability Rationales</div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {intel?.explainability_reasons?.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Threat Relationships */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Associated Threat Actors & Malware</h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">Actors: </span>
                      <span className="font-bold text-red-700">{rels?.threat_actors?.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Malware: </span>
                      <span className="font-bold text-orange-700">{rels?.malware_families?.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Exploited CVEs & ATT&CK Techniques</h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-500">CVEs: </span>
                      <span className="font-mono font-bold text-purple-700">{rels?.cves_exploited?.join(', ') || 'None directly noted'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">ATT&CK: </span>
                      <span className="font-mono font-bold text-indigo-700">{rels?.mitre_techniques?.join(', ') || 'None directly noted'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Peer Validation Feedback */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Submit Validator Peer Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">Feedback Classification</label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="CONFIRMED_MALICIOUS">CONFIRMED_MALICIOUS (High Confidence)</option>
                      <option value="USEFUL">USEFUL (Corroborated Telemetry)</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE (Penalizes Source Trust)</option>
                      <option value="EXPIRED">EXPIRED (Stale Indicator)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Validator Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Observed matching C2 egress in SIEM..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSendFeedback}
                    disabled={submittingFeedback}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    {submittingFeedback ? 'Recording on Ledger...' : 'Commit Validation Feedback'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
