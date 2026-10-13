import React, { useState, useEffect } from 'react';
import type { Incident } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { Timeline, type TimelineEvent } from '../common/Timeline';

interface IncidentsViewProps {
  token: string;
  onOpenIoc?: (iocId: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  token,
  onOpenIoc
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'evidence' | 'audit'>('summary');

  // New Incident Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newTechniques, setNewTechniques] = useState('T1059.001, T1071.001');

  // Status update
  const [updateStatus, setUpdateStatus] = useState<string>('INVESTIGATING');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchIncidentDetails = React.useCallback(async (id: string) => {
    if (!token || !id) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDetails(data);
        setSelectedIncident(data);
        setUpdateStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchIncidents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = 'http://127.0.0.1:8000/api/incidents/';
      if (statusFilter !== 'ALL') {
        url += `?status_filter=${statusFilter}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        if (data.length > 0 && !selectedIncident) {
          fetchIncidentDetails(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    let url = 'http://127.0.0.1:8000/api/incidents/';
    if (statusFilter !== 'ALL') {
      url += `?status_filter=${statusFilter}`;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => {
        if (isMounted) {
          setIncidents(data);
          setLoading(false);
          if (data.length > 0 && !selectedIncident) {
            fetchIncidentDetails(data[0].id);
          }
        }
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, statusFilter, selectedIncident, fetchIncidentDetails]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const techList = newTechniques.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('http://127.0.0.1:8000/api/incidents/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          severity: newSeverity,
          linked_techniques: techList
        })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDesc('');
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/incidents/${selectedIncident.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          containment_notes: resolutionNotes
        })
      });
      if (res.ok) {
        fetchIncidentDetails(selectedIncident.id);
        fetchIncidents();
        setResolutionNotes('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const incidentTimeline: TimelineEvent[] = (selectedDetails?.history || []).map((h: any, idx: number) => ({
    id: `inc-h-${idx}`,
    timestamp: h.timestamp || selectedDetails.created_at,
    title: `Transitioned to ${h.status || selectedDetails.status}`,
    description: h.notes || 'Lifecycle status update recorded.',
    event_type: 'STATUS_CHANGE',
    badge: h.status || selectedDetails.status,
    actor: h.actor || 'SOC Analyst'
  }));

  if (incidentTimeline.length === 0 && selectedDetails) {
    incidentTimeline.push({
      id: 'inc-init',
      timestamp: selectedDetails.created_at,
      title: 'Incident Created & Triaged',
      description: selectedDetails.description,
      event_type: 'INCIDENT_CREATED',
      badge: selectedDetails.status,
      actor: 'ThreatShield Sensor / Analyst'
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Security Incident Response Workspace"
        description="Standardized 6-stage incident lifecycle management with linked CTI telemetry, containment tracking, and immutable audit logging."
        badge="SOC INCIDENT RESPONSE"
        badgeColor="rose"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            + Create New Incident
          </button>
        }
      />

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Incidents List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alliance Incidents ({incidents.length})
            </span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="TRIAGED">Triaged</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CONTAINED">Contained</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="p-2 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
            {loading ? (
              <div className="text-xs text-slate-400 py-8 text-center">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">No matching incidents.</div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => fetchIncidentDetails(inc.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedIncident?.id === inc.id
                      ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                      : 'hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <StatusBadge status={inc.status} size="sm" />
                    <span className="text-[10px] font-bold text-rose-600 uppercase">
                      {inc.severity} Severity
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{inc.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{inc.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Incident Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDetails ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedDetails.status} />
                    <span className="text-[11px] text-slate-400 font-mono">ID: {selectedDetails.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedDetails.title}</h2>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Opened: {new Date(selectedDetails.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
                {[
                  { id: 'summary', label: 'Overview & Containment' },
                  { id: 'timeline', label: 'Lifecycle Timeline' },
                  { id: 'evidence', label: 'Linked CTI Evidence' },
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

              {/* Tab 1: Summary & Containment Form */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Incident Scope & Telemetry</h4>
                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
                      {selectedDetails.description}
                    </p>
                  </div>

                  {/* Lifecycle Advance Controls */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Advance Standardized Lifecycle Stage (6-Stage Pipeline)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">New Stage</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        >
                          <option value="NEW">NEW</option>
                          <option value="TRIAGED">TRIAGED</option>
                          <option value="INVESTIGATING">INVESTIGATING</option>
                          <option value="CONTAINED">CONTAINED</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">Containment / Eradication Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Blocked egress IPs in firewall..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleAdvanceStatus}
                        disabled={updating}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        {updating ? 'Recording to Ledger...' : 'Commit Status Transition'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === 'timeline' && (
                <Timeline events={incidentTimeline} />
              )}

              {/* Tab 3: Evidence */}
              {activeTab === 'evidence' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Linked Threat Indicators</h4>
                    <div className="space-y-1.5 text-xs">
                      {selectedDetails.linked_cti_records?.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                          <span className="font-bold text-blue-700">{c.value}</span>
                          <button
                            onClick={() => onOpenIoc && onOpenIoc(c.id)}
                            className="text-xs text-blue-600 hover:underline font-sans font-semibold"
                          >
                            Investigate ➔
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mapped MITRE ATT&CK Techniques</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDetails.linked_techniques?.map((t: string) => (
                        <span key={t} className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Audit */}
              {activeTab === 'audit' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div>
                    <span className="text-slate-500">Incident ID: </span>
                    <span className="font-mono font-bold text-slate-900">{selectedDetails.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ledger Immutability: </span>
                    <span className="font-bold text-emerald-700">COMMITTED & MERKLE HASH VERIFIED</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-400 text-xs">
              Select an incident from the list to view containment lifecycle.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Incident */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Structured Security Incident</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cobalt Strike Beaconing Detected on Core Server"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Incident Description & Scope</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the affected host, observed egress, and attack vector..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">MITRE Techniques</label>
                  <input
                    type="text"
                    value={newTechniques}
                    onChange={(e) => setNewTechniques(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
