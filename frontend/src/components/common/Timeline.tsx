import React from 'react';
import { SeverityBadge } from './SeverityBadge';

export interface TimelineEvent {
  id?: string;
  timestamp: string;
  title: string;
  description?: string;
  event_type?: string;
  severity?: number | string;
  actor?: string;
  badge?: string;
  onClick?: () => void;
}

interface TimelineProps {
  events: TimelineEvent[];
  emptyMessage?: string;
  loading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  emptyMessage = "No chronological investigation events recorded.",
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 items-start animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 text-slate-400 text-xs text-center rounded-xl font-medium">
        {emptyMessage}
      </div>
    );
  }

  const getEventIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'CTI_INGESTION':
      case 'IOC_SUBMITTED':
        return '🔍';
      case 'STIX_GENERATION':
        return '📦';
      case 'SIGHTING':
        return '📡';
      case 'TRUST_UPDATE':
        return '📈';
      case 'ALERT_GENERATED':
        return '🚨';
      case 'INCIDENT_CREATED':
      case 'STATUS_CHANGE':
        return '🛡️';
      case 'ATTCK_MAPPING':
        return '🎯';
      case 'LEDGER_BLOCK':
        return '⛓️';
      default:
        return '📌';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((ev, idx) => {
        let timeStr = ev.timestamp;
        try {
          if (ev.timestamp) {
            timeStr = new Date(ev.timestamp).toLocaleString();
          }
        } catch {
          // Keep raw string
        }

        return (
          <div
            key={ev.id || idx}
            onClick={ev.onClick}
            className={`relative flex items-start gap-4 text-xs group ${
              ev.onClick ? 'cursor-pointer' : ''
            }`}
          >
            {/* Timeline Dot / Icon */}
            <div className="absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 border-indigo-600 text-[10px] shadow-xs group-hover:scale-110 transition">
              {getEventIcon(ev.event_type)}
            </div>

            {/* Event Body */}
            <div className="flex-1 bg-slate-50/70 group-hover:bg-indigo-50/40 p-3.5 rounded-xl border border-slate-200 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{ev.title}</span>
                  {ev.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-md uppercase">
                      {ev.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ev.severity !== undefined && (
                    <SeverityBadge severity={ev.severity} showScore={false} />
                  )}
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{timeStr}</span>
                </div>
              </div>

              {ev.description && (
                <p className="mt-1.5 text-slate-600 leading-relaxed font-medium">
                  {ev.description}
                </p>
              )}

              {ev.actor && (
                <div className="mt-2 text-[11px] text-slate-400">
                  Logged by: <span className="font-semibold text-slate-600">{ev.actor}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
