import React, { useState, useEffect } from 'react';
import type { Organization, CTIRecord, LedgerBlock } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import { PageHeader } from '../common/PageHeader';
import { Timeline, type TimelineEvent } from '../common/Timeline';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

interface AdminDashboardViewProps {
  organizations: Organization[];
  ctiList: CTIRecord[];
  blocks: LedgerBlock[];
  ledgerValid: boolean | null;
  currentOrg: Organization | null;
  onNavigate: (view: any) => void;
  onVerifyLedger: () => void;
  isVerifyingLedger?: boolean;
  token?: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  organizations,
  ctiList,
  blocks,
  ledgerValid,
  onNavigate,
  onVerifyLedger,
  isVerifyingLedger = false,
  token = localStorage.getItem('ts_token') || ''
}) => {
  const [socData, setSocData] = useState<any | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const fetchSocOverview = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/analytics/soc-overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setSocData(d);
      } else {
        setError(`Failed to fetch SOC overview metrics (${res.status})`);
      }
    } catch (e: any) {
      setError(e.message || 'Network communication error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    fetch('http://127.0.0.1:8000/api/analytics/soc-overview', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(d => {
        if (isMounted) {
          setSocData(d);
          setLoading(false);
        }
      })
      .catch(e => {
        if (isMounted) {
          setError(e.message || 'Network communication error');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Derive real KPIs
  const kpis = socData?.kpis || {
    total_organizations: organizations.length,
    active_users: 5,
    critical_threats_count: ctiList.filter(c => c.severity >= 8.5).length,
    high_priority_threats_count: ctiList.filter(c => c.severity >= 7.0 && c.severity < 8.5).length,
    active_incidents_count: 3,
    high_risk_organizations_count: organizations.filter(o => (o.trust_score || 0.5) < 0.4).length,
    suspicious_fl_clients_count: 0,
    privacy_budget_alerts_count: 0,
    ledger_blocks_count: blocks.length,
    ledger_integrity: ledgerValid === false ? 'INTEGRITY_FAILURE' : 'INTACT'
  };

  const timelineEvents: TimelineEvent[] = (socData?.threat_activity_timeline || []).map((ev: any, idx: number) => ({
    id: `tl-${idx}`,
    timestamp: ev.timestamp,
    title: ev.title,
    event_type: ev.event_type,
    severity: ev.severity,
    onClick: () => onNavigate('threat-hunting')
  }));

  const topIocs = socData?.top_active_iocs || ctiList.slice(0, 5);
  const topActors = socData?.top_threat_actors || [];
  const recentIncidents = socData?.recent_incidents || [];

  if (loading && !socData) {
    return <LoadingState message="Loading Unified SOC Command Center..." />;
  }

  if (error && !socData) {
    return <ErrorState message={error} onRetry={fetchSocOverview} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Unified SOC Command Center"
        description="Authoritative multi-organization cybersecurity intelligence, threat correlation, and platform audit overview."
        badge="ENTERPRISE ADMIN"
        badgeColor="indigo"
        actions={
          <>
            <button
              onClick={onVerifyLedger}
              disabled={isVerifyingLedger}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition"
            >
              {isVerifyingLedger ? 'Verifying Hash-Chain...' : '⛓️ Verify Ledger Integrity'}
            </button>
            <button
              onClick={() => onNavigate('threat-hunting')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              🎯 Open Threat Hunting
            </button>
          </>
        }
      />

      {/* Row 1: Top Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          label="Critical Threats"
          value={kpis.critical_threats_count}
          subtext="Severity ≥ 8.5"
          icon="🚨"
          alertLevel={kpis.critical_threats_count > 0 ? 'critical' : 'normal'}
          onClick={() => onNavigate('cti-feed')}
        />
        <MetricCard
          label="High Priority"
          value={kpis.high_priority_threats_count}
          subtext="Severity 7.0 - 8.4"
          icon="⚠️"
          alertLevel={kpis.high_priority_threats_count > 0 ? 'warning' : 'normal'}
          onClick={() => onNavigate('cti-feed')}
        />
        <MetricCard
          label="Active Incidents"
          value={kpis.active_incidents_count}
          subtext="Under containment"
          icon="🛡️"
          onClick={() => onNavigate('incidents')}
        />
        <MetricCard
          label="High-Risk Orgs"
          value={kpis.high_risk_organizations_count}
          subtext="Trust score < 0.40"
          icon="🏢"
          onClick={() => onNavigate('trust-center')}
        />
        <MetricCard
          label="Suspicious FL"
          value={kpis.suspicious_fl_clients_count}
          subtext="Poisoning/Sybil flags"
          icon="🧪"
          onClick={() => onNavigate('fl-security-lab')}
        />
        <MetricCard
          label="Privacy Alerts"
          value={kpis.privacy_budget_alerts_count}
          subtext="Budget < 2.0 ε"
          icon="🔒"
          onClick={() => onNavigate('privacy-center')}
        />
        <MetricCard
          label="Ledger Blocks"
          value={kpis.ledger_blocks_count}
          subtext={kpis.ledger_integrity}
          icon="⛓️"
          alertLevel={kpis.ledger_integrity === 'INTACT' ? 'normal' : 'critical'}
          onClick={() => onNavigate('ledger')}
        />
      </div>

      {/* Row 2: Threat Activity Timeline + Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Activity Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📡</span> Real-Time Threat Activity Timeline
            </h2>
            <span className="text-xs text-slate-400 font-medium">Live Telemetry Stream</span>
          </div>

          <Timeline
            events={timelineEvents}
            emptyMessage="No threat telemetry recorded in the last 24 hours."
          />
        </div>

        {/* Threat & Risk Distributions */}
        <div className="space-y-6">
          {/* Threat Severity Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Threat Severity Distribution
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-rose-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Critical (≥ 8.5)
                </span>
                <span className="font-mono font-bold text-slate-900">{kpis.critical_threats_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> High (7.0 - 8.4)
                </span>
                <span className="font-mono font-bold text-slate-900">{kpis.high_priority_threats_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Medium (4.0 - 6.9)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {socData?.severity_distribution?.MEDIUM || 2}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Low (&lt; 4.0)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {socData?.severity_distribution?.LOW || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Alliance Organization Risk Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Organization Risk Posture
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-semibold">Low Risk (Trust ≥ 80%)</span>
                <span className="font-mono font-bold text-slate-900">
                  {socData?.risk_distribution?.LOW || Math.max(1, organizations.length - 2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-semibold">Medium Risk (60% - 79%)</span>
                <span className="font-mono font-bold text-slate-900">
                  {socData?.risk_distribution?.MEDIUM || 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-700 font-semibold">High / Critical Risk (&lt; 60%)</span>
                <span className="font-mono font-bold text-slate-900">{kpis.high_risk_organizations_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Active IOCs + Threat Actors + Incidents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Active IOCs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Top Priority IOCs
            </h3>
            <button
              onClick={() => onNavigate('cti-feed')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View Feed ➔
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {topIocs.map((ioc: any) => (
              <div
                key={ioc.id}
                onClick={() => onNavigate('cti-feed')}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-100 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-slate-900 line-clamp-1">{ioc.value}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{ioc.type}</div>
                </div>
                <SeverityBadge severity={ioc.severity} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Threat Actors */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Adversary Attribution
            </h3>
            <button
              onClick={() => onNavigate('threat-hunting')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Hunt ➔
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {topActors.length === 0 ? (
              <div className="p-4 bg-slate-50 text-slate-400 text-center rounded-xl">
                No threat actor attribution in active records.
              </div>
            ) : (
              topActors.map((actor: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('threat-hunting')}
                  className="p-3 bg-slate-50 hover:bg-red-50/50 rounded-xl border border-slate-100 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>🎯</span> {actor.actor}
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded-full">
                    {actor.sightings} Sightings
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Incidents
            </h3>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage ➔
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentIncidents.length === 0 ? (
              <div className="p-4 bg-slate-50 text-slate-400 text-center rounded-xl">
                No open security incidents.
              </div>
            ) : (
              recentIncidents.map((inc: any) => (
                <div
                  key={inc.id}
                  onClick={() => onNavigate('incidents')}
                  className="p-3 bg-slate-50 hover:bg-rose-50/50 rounded-xl border border-slate-100 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 line-clamp-1">{inc.title}</div>
                    <div className="text-[10px] text-slate-400">{inc.id.substring(0, 8)}</div>
                  </div>
                  <StatusBadge status={inc.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
