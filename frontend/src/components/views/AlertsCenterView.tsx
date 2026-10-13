import React, { useState, useEffect } from 'react';
import type { SecurityAlert } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

interface AlertsCenterViewProps {
  token: string;
  onOpenIncident?: (incidentId: string) => void;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  token,
  onOpenIncident
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const fetchAlerts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/analytics/security-alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
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
    fetch('http://127.0.0.1:8000/api/analytics/security-alerts', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => {
        if (isMounted) {
          setAlerts(data);
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
  }, [token]);

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/analytics/security-alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_resolved: true } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Security Alert Intelligence Queue"
        description="Correlated high-confidence security alerts, cross-vector anomaly streams, and automated recommended mitigation actions."
        badge="SOC ALERT CENTER"
        badgeColor="rose"
        actions={
          <div className="flex items-center gap-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="p-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-800"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button
              onClick={fetchAlerts}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
            >
              Refresh Stream
            </button>
          </div>
        }
      />

      {/* Alert Stream List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs">
            <LoadingState message="Querying Correlated Alert Stream..." />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <EmptyState
              title="All Security Alerts Clear"
              description="No unresolved critical alerts or cross-vector telemetry anomalies currently flagged."
              icon="🛡️"
            />
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 bg-white rounded-2xl border transition shadow-xs space-y-4 ${
                alert.is_resolved
                  ? 'border-slate-200 opacity-75'
                  : alert.severity === 'CRITICAL'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={alert.is_resolved ? 'RESOLVED' : 'NEW'} size="sm" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {alert.trigger_type || 'ANOMALY_CORRELATION'}
                  </span>
                </div>
              </div>

              {/* Description & Evidence */}
              <div className="text-xs text-slate-700 leading-relaxed font-medium">
                {alert.description}
              </div>

              {/* Recommended Action */}
              {alert.recommended_action && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs flex items-center justify-between gap-4">
                  <div className="text-indigo-950 font-medium">
                    <span className="font-bold">Recommended Mitigation: </span>
                    {alert.recommended_action}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Alert ID: {alert.id.substring(0, 16)}...
                </span>

                <div className="flex items-center gap-2">
                  {onOpenIncident && (
                    <button
                      onClick={() => onOpenIncident(alert.id)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                    >
                      🚨 Escalate to Incident
                    </button>
                  )}

                  {!alert.is_resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
                    >
                      ✓ Resolve & Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
