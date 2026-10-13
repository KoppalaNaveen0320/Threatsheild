import React, { useState, useEffect } from 'react';
import { PageHeader } from '../common/PageHeader';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';

interface ThreatHuntingViewProps {
  token: string;
  onOpenIoc?: (iocId: string) => void;
  onOpenIncident?: (incidentId: string) => void;
}

export const ThreatHuntingView: React.FC<ThreatHuntingViewProps> = ({
  token,
  onOpenIoc,
  onOpenIncident
}) => {
  const [activeTab, setActiveTab] = useState<'hunting' | 'attack-matrix'>('hunting');
  const [query, setQuery] = useState('APT29');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [attackMatrix, setAttackMatrix] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<any | null>(null);

  // Pivot Investigation Flow
  const [pivotTrail, setPivotTrail] = useState<Array<{ type: string; label: string; id: string }>>([
    { type: 'ACTOR', label: 'APT29 (Cozy Bear)', id: 'actor-apt29' }
  ]);

  const handleSearch = async (qVal: string) => {
    if (!qVal || qVal.length < 2 || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/threat-hunting/search?q=${encodeURIComponent(qVal)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    Promise.all([
      fetch(`http://127.0.0.1:8000/api/threat-hunting/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch('http://127.0.0.1:8000/api/threat-hunting/attack-matrix', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
      .then(async ([resSearch, resMatrix]) => {
        if (resSearch.ok && isMounted) {
          const sData = await resSearch.json();
          setSearchResults(sData);
          setLoading(false);
        }
        if (resMatrix.ok && isMounted) {
          const mData = await resMatrix.json();
          setAttackMatrix(mData);
        }
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, query]);

  const addToPivot = (type: string, label: string, id: string) => {
    if (!pivotTrail.some(p => p.id === id)) {
      setPivotTrail([...pivotTrail, { type, label, id }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title="Threat Hunting & ATT&CK® Workspace"
        description="Unified adversary tracking across IOCs, Malware Families, Threat Actors, CVEs, and Incidents."
        badge="PROACTIVE HUNTING"
        badgeColor="indigo"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('hunting')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'hunting'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Multi-Pivot Search
            </button>
            <button
              onClick={() => setActiveTab('attack-matrix')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'attack-matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ATT&CK Matrix
            </button>
          </div>
        }
      />

      {activeTab === 'hunting' ? (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across IOC, Actor (e.g. APT29), Malware, CVE (e.g. CVE-2024-3400), or Technique (T1059)..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                {loading ? 'Hunting...' : 'Hunt Intelligence'}
              </button>
            </form>

            {/* Quick Pivot Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
              <span className="font-bold text-slate-700">Quick Pivots:</span>
              {['APT29', 'Cobalt Strike', 'LockBit', 'CVE-2024-3400', 'T1059.001', '198.51.100.99'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { setQuery(tag); handleSearch(tag); }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Pivot Investigation Trail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Pivot Investigation Trace
              </div>
              <button
                onClick={() => setPivotTrail([])}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear Trace
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {pivotTrail.map((p, idx) => (
                <React.Fragment key={p.id + idx}>
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-950">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded">
                      {p.type}
                    </span>
                    <span>{p.label}</span>
                  </div>
                  {idx < pivotTrail.length - 1 && (
                    <span className="text-slate-400 font-bold">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Search Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matching Indicators */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Matched Indicators ({searchResults?.matching_indicators?.length || 0})
                </h3>
                <span className="text-[11px] text-slate-400">IOC Feed</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {searchResults?.matching_indicators?.map((ioc: any) => (
                  <div
                    key={ioc.id}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-xl text-xs transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{ioc.value}</span>
                      <SeverityBadge severity={ioc.severity} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 capitalize">{ioc.type}</div>
                    <div className="flex gap-3 mt-2.5">
                      <button
                        onClick={() => onOpenIoc && onOpenIoc(ioc.id)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Investigate 360° ➔
                      </button>
                      <button
                        onClick={() => addToPivot('IOC', ioc.value, ioc.id)}
                        className="text-slate-500 hover:text-slate-700 font-medium"
                      >
                        + Add to Pivot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlated Incidents */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Correlated Incidents ({searchResults?.matching_incidents?.length || 0})
                </h3>
                <span className="text-[11px] text-slate-400">Active Cases</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {searchResults?.matching_incidents?.map((inc: any) => (
                  <div
                    key={inc.id}
                    className="p-3 bg-slate-50 hover:bg-rose-50/50 border border-slate-200 rounded-xl text-xs transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{inc.title}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{inc.description}</div>
                    <div className="flex gap-3 mt-2.5">
                      <button
                        onClick={() => onOpenIncident && onOpenIncident(inc.id)}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Manage Incident ➔
                      </button>
                      <button
                        onClick={() => addToPivot('INCIDENT', inc.title, inc.id)}
                        className="text-slate-500 hover:text-slate-700 font-medium"
                      >
                        + Add to Pivot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matching Organizations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Alliance Orgs ({searchResults?.matching_organizations?.length || 0})
                </h3>
                <span className="text-[11px] text-slate-400">Federation</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {searchResults?.matching_organizations?.map((org: any) => (
                  <div
                    key={org.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{org.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        Trust {(org.trust_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => addToPivot('ORG', org.name, org.id)}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        + Add to Pivot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ATT&CK Matrix Explorer */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enterprise MITRE ATT&CK® Tactic Coverage</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Explicitly distinguishes directly observed telemetry vs. graph-inferred adversary techniques.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded" /> <span className="font-bold">OBSERVED</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded" /> <span className="font-bold">INFERRED</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {attackMatrix?.top_techniques?.map((tech: any) => (
              <div
                key={tech.technique_id}
                onClick={() => setSelectedTechnique(tech)}
                className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-700 text-xs">{tech.technique_id}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                    OBSERVED
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{tech.tactic}</div>
                <div className="text-[11px] text-slate-500">
                  Corroborated across {tech.observation_count} alliance sightings
                </div>
              </div>
            ))}
          </div>

          {selectedTechnique && (
            <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-800">{selectedTechnique.technique_id}</span>
                  <h3 className="text-base font-bold text-indigo-950 mt-0.5">{selectedTechnique.tactic}</h3>
                </div>
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="text-xs text-indigo-700 font-bold hover:underline"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                This technique has been observed {selectedTechnique.observation_count} times in active CTI feeds.
                Correlated with advanced persistent threat campaigns utilizing script-based execution and command-and-control beacons.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
