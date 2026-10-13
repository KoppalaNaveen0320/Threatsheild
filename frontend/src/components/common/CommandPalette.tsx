import React, { useState, useEffect } from 'react';
import type { ActiveView } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onStartDemo: () => void;
  onOpenIoc?: (iocId: string) => void;
  token: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onStartDemo,
  onOpenIoc,
  token
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val || val.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/threat-hunting/search?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setResults(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="text-slate-400 font-bold text-base">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search IOC, actor, CVE, incident (e.g. APT29, Cobalt Strike, T1059)..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
          {loading && <span className="text-xs text-blue-600 font-medium">Searching...</span>}
          <kbd className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-600 rounded">ESC</kbd>
        </div>

        {/* Command / Results Container */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          {!query && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Quick Platform Actions
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => { onNavigate('knowledge-graph'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left font-semibold text-slate-800 transition"
                >
                  <span>🕸️</span> Open Knowledge Graph
                </button>
                <button
                  onClick={() => { onNavigate('threat-hunting'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-left font-semibold text-slate-800 transition"
                >
                  <span>🎯</span> Threat Hunting Workspace
                </button>
                <button
                  onClick={() => { onNavigate('incidents'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-left font-semibold text-slate-800 transition"
                >
                  <span>🚨</span> Incident Management
                </button>
                <button
                  onClick={() => { onNavigate('fl-security-lab'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left font-semibold text-slate-800 transition"
                >
                  <span>🧪</span> FL Adversarial Defense Lab
                </button>
                <button
                  onClick={() => { onNavigate('privacy-center'); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl text-left font-semibold text-slate-800 transition"
                >
                  <span>🔒</span> Privacy Budget Center
                </button>
                <button
                  onClick={() => { onStartDemo(); onClose(); }}
                  className="flex items-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left font-bold text-amber-900 transition"
                >
                  <span>🚀</span> Launch Guided Demo Tour (7m)
                </button>
              </div>
            </div>
          )}

          {query && results && (
            <div className="space-y-3">
              {results.matching_indicators?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Matching Indicators ({results.matching_indicators.length})
                  </div>
                  <div className="space-y-1">
                    {results.matching_indicators.slice(0, 5).map((ioc: any) => (
                      <div
                        key={ioc.id}
                        onClick={() => { if (onOpenIoc) onOpenIoc(ioc.id); onClose(); }}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-blue-50/70 rounded-lg cursor-pointer text-xs transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{ioc.value}</span>
                          <span className="text-[10px] text-slate-500 capitalize">({ioc.type})</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600">Investigate ➔</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.matching_incidents?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Matching Incidents ({results.matching_incidents.length})
                  </div>
                  <div className="space-y-1">
                    {results.matching_incidents.slice(0, 3).map((inc: any) => (
                      <div
                        key={inc.id}
                        onClick={() => { onNavigate('incidents'); onClose(); }}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-rose-50/70 rounded-lg cursor-pointer text-xs transition"
                      >
                        <span className="font-bold text-slate-900">{inc.title}</span>
                        <span className="text-[10px] font-bold text-rose-600">{inc.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Tip: Press <kbd className="font-bold">Ctrl + K</kbd> anywhere to open Command Center</span>
          <span className="text-slate-400">ThreatShield v1.2 Enterprise</span>
        </div>
      </div>
    </div>
  );
};
