import React, { useState } from 'react';
import type { LedgerBlock, Organization } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { MetricCard } from '../common/MetricCard';

interface LedgerViewProps {
  blocks: LedgerBlock[];
  ledgerValid: boolean | null;
  organizations: Organization[];
  onVerifyLedger: () => void;
  isVerifyingLedger: boolean;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  blocks,
  ledgerValid,
  organizations,
  onVerifyLedger,
  isVerifyingLedger
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const orgMap = new Map(organizations.map(o => [o.id, o.name]));

  const isIntact = ledgerValid !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Permissioned Cryptographic Hash-Chain Audit Ledger"
        description="Tamper-evident SHA-256 event provenance with deterministic canonical serialization and Merkle verification."
        badge="CRYPTOGRAPHIC AUDIT LEDGER"
        badgeColor={isIntact ? 'emerald' : 'rose'}
        actions={
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
              isIntact
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {isIntact ? '● Chain Integrity Intact' : '⚠️ Hash-Chain Anomaly Flagged'}
            </div>
            <button
              onClick={onVerifyLedger}
              disabled={isVerifyingLedger}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              {isVerifyingLedger ? 'Verifying Hash-Chain...' : '⛓️ Re-Verify Full Chain'}
            </button>
          </div>
        }
      />

      {/* Ledger KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Blocks" value={blocks.length} subtext="Immutable records" icon="⛓️" />
        <MetricCard label="Hash Algorithm" value="SHA-256" subtext="256-bit digest" icon="🔒" />
        <MetricCard label="Chain Status" value={isIntact ? 'VALID' : 'TAMPERED'} subtext="Deterministic verification" icon="🛡️" alertLevel={isIntact ? 'normal' : 'critical'} />
        <MetricCard label="Participating Orgs" value={organizations.length} subtext="Federated alliance" icon="🏢" />
      </div>

      {/* Cryptographic Hash Formulation Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
        <div className="font-bold text-slate-900 uppercase tracking-wider">
          Cryptographic Block Hash Formulation (SHA-256):
        </div>
        <div className="font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-blue-700 font-bold overflow-x-auto">
          current_hash = SHA-256( previous_hash || payload_hash || canonical_timestamp )
        </div>
        <p className="text-slate-500 font-medium">
          Each block cryptographically seals the preceding block hash and canonical JSON payload. Any retroactive modification breaks all subsequent hashes deterministically.
        </p>
      </div>

      {/* Block Explorer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Block Chain Explorer ({blocks.length} Blocks)
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Chronological sequence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Block #</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Originating Org</th>
                <th className="p-3">Current Hash</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blocks.map((b) => {
                const isExpanded = expandedIndex === b.index;
                return (
                  <React.Fragment key={b.index}>
                    <tr
                      onClick={() => setExpandedIndex(isExpanded ? null : b.index)}
                      className="hover:bg-slate-50 cursor-pointer transition font-mono"
                    >
                      <td className="p-3 font-bold text-blue-600">#{b.index}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{new Date(b.timestamp).toISOString()}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{b.event_type}</td>
                      <td className="p-3 font-sans text-slate-700">
                        {b.organization_id ? (orgMap.get(b.organization_id) || b.organization_id.substring(0, 10)) : 'SYSTEM'}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] font-mono">
                        {b.current_hash.substring(0, 16)}...
                      </td>
                      <td className="p-3 font-sans text-blue-600 font-bold text-[11px]">
                        {isExpanded ? 'Hide Payload ▲' : 'View Payload ▼'}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="p-4 space-y-2">
                          <div className="text-[11px] text-slate-600 space-y-1">
                            <div><span className="font-bold text-slate-800">Previous Hash: </span><span className="font-mono text-slate-600">{b.previous_hash}</span></div>
                            <div><span className="font-bold text-slate-800">Payload Hash: </span><span className="font-mono text-slate-600">{b.payload_hash}</span></div>
                            <div><span className="font-bold text-slate-800">Full Block Hash: </span><span className="font-mono text-blue-700 font-bold">{b.current_hash}</span></div>
                          </div>

                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-2">Canonical Data Payload</div>
                          <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                            {JSON.stringify((b as any).data || (b as any).payload || b, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
