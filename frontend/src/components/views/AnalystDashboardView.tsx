import React, { useState, useEffect } from 'react';
import type { CTIRecord, Organization } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { PageHeader } from '../common/PageHeader';
import { Timeline, type TimelineEvent } from '../common/Timeline';

interface AnalystDashboardViewProps {
  ctiList: CTIRecord[];
  currentOrg: Organization | null;
  token: string;
  onSelectCti: (cti: CTIRecord) => void;
  onNavigate: (view: any) => void;
  onOpenStix?: () => void;
}

export const AnalystDashboardView: React.FC<AnalystDashboardViewProps> = ({
  ctiList,
  token,
  onSelectCti,
  onNavigate,
  onOpenStix
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    Promise.all([
      fetch('http://127.0.0.1:8000/api/analytics/security-alerts', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('http://127.0.0.1:8000/api/incidents/', { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resAlerts, resInc]) => {
        if (resAlerts.ok && isMounted) {
          const d = await resAlerts.json();
          setAlerts(d);
        }
        if (resInc.ok && isMounted) {
          const d = await resInc.json();
          setIncidents(d);
        }
      })
      .catch(e => {
        console.error(e);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const criticalCtis = ctiList.filter(c => c.severity >= 8.5);
  const openIncidents = incidents.filter(i => i.status !== 'CLOSED');

  const timelineEvents: TimelineEvent[] = ctiList.slice(0, 5).map(c => ({
    id: c.id,
    timestamp: c.created_at || '',
    title: `${c.type.toUpperCase()}: ${c.value}`,
    description: c.description || 'Observed active threat beacon.',
    severity: c.severity,
    event_type: 'CTI_INGESTION',
    onClick: () => onSelectCti(c)
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="SOC Analyst Operations Workspace"
        description="Active threat triage, correlated incident containment, and adversarial pattern attribution."
        badge="TIER 2/3 SOC"
        badgeColor="blue"
        actions={
          <>
            {onOpenStix && (
              <button
                onClick={onOpenStix}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition"
              >
                📦 Export STIX 2.1
              </button>
            )}
            <button
              onClick={() => onNavigate('threat-hunting')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              🎯 Start Threat Hunt
            </button>
          </>
        }
      />

      {/* "What Needs My Attention?" Triage Alert Banner */}
      <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-sm font-bold text-amber-950">Immediate Analyst Priority Queue</h3>
            <p className="text-xs text-amber-900 mt-0.5 font-medium">
              {criticalCtis.length} Critical Indicators and {openIncidents.length} Active Incidents require containment verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('alerts-center')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Review Alerts Queue
          </button>
          <button
            onClick={() => onNavigate('incidents')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition"
          >
            Manage Incidents
          </button>
        </div>
      </div>

      {/* Row 1: Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Critical Alerts"
          value={alerts.filter(a => !a.is_resolved).length}
          subtext="Unresolved in queue"
          icon="🚨"
          alertLevel={alerts.length > 0 ? 'critical' : 'normal'}
          onClick={() => onNavigate('alerts-center')}
        />
        <MetricCard
          label="Open Incidents"
          value={openIncidents.length}
          subtext="Under active containment"
          icon="🛡️"
          onClick={() => onNavigate('incidents')}
        />
        <MetricCard
          label="High-Risk IOCs"
          value={criticalCtis.length}
          subtext="Severity ≥ 8.5"
          icon="🎯"
          onClick={() => onNavigate('cti-feed')}
        />
        <MetricCard
          label="Knowledge Graph"
          value="17 Types"
          subtext="Active correlation web"
          icon="🕸️"
          onClick={() => onNavigate('knowledge-graph')}
        />
      </div>

      {/* Row 2: Active Indicators & Recent Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High-Risk IOC Triage Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              High-Risk Indicator Feed (Top Priority)
            </h3>
            <button
              onClick={() => onNavigate('cti-feed')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Full Feed ➔
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {ctiList.slice(0, 6).map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCti(c)}
                className="p-3 bg-slate-50 hover:bg-blue-50/70 rounded-xl border border-slate-100 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900">{c.value}</span>
                  <span className="text-[10px] text-slate-500 capitalize">({c.type})</span>
                </div>
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={c.severity} />
                  <span className="text-blue-600 font-bold">Investigate ➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Attribution & Pivots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Adversary Threat Vectors
          </h3>

          <div className="space-y-3 text-xs">
            <div
              onClick={() => onNavigate('threat-hunting')}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition space-y-1"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>APT29 (Cozy Bear)</span>
                <span className="text-[10px] text-indigo-700 font-bold">Active Pivot</span>
              </div>
              <p className="text-[11px] text-slate-500">Associated with CVE-2024-3400 and Cobalt Strike C2 egress.</p>
            </div>

            <div
              onClick={() => onNavigate('threat-hunting')}
              className="p-3.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition space-y-1"
            >
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>LockBit 3.0 Ransomware</span>
                <span className="text-[10px] text-indigo-700 font-bold">Active Pivot</span>
              </div>
              <p className="text-[11px] text-slate-500">Associated with T1486 (Data Encrypted for Impact) campaigns.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Chronological Telemetry Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Chronological Telemetry Stream
          </h3>
          <span className="text-xs text-slate-400 font-medium">Real-time sensor sightings</span>
        </div>

        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
};
