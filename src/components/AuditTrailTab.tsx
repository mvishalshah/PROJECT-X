import React, { useState } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { AuditLog } from '../types.js';

interface AuditTrailTabProps {
  logs: AuditLog[];
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actorDID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'ALL' || log.actionType === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'NFT_MINT':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
      case 'IDENTITY_REGISTER':
      case 'IDENTITY_UPDATE':
        return 'bg-sky-950/80 text-sky-300 border-sky-700/60';
      case 'OWNERSHIP_TRANSFER':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'ROLE_ASSIGNMENT':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'SECURITY_VERIFICATION':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Immutable Blockchain Audit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Append-only smart contract event log governed by <code className="text-sky-300">BlockVaultAuditLedger.sol</code>.
            Records identity events, NFT mints, role assignments, ownership transfers, and security verifications.
          </p>
        </div>

        <a
          href="/api/audit-logs/export"
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shrink-0"
          download
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>Export Compliance Report (JSON)</span>
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by actor DID, target ID, tx hash, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
        >
          <option value="ALL">All Action Types</option>
          <option value="NFT_MINT">NFT Minting Events</option>
          <option value="IDENTITY_REGISTER">Identity (DID) Registrations</option>
          <option value="IDENTITY_UPDATE">Identity Updates</option>
          <option value="OWNERSHIP_TRANSFER">Ownership Transfers</option>
          <option value="ROLE_ASSIGNMENT">Role Assignments</option>
          <option value="SECURITY_VERIFICATION">Security Verifications</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Log # / Time</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor DID</th>
                <th className="py-3 px-4">Target / Resource</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-800/30 transition">
                      {/* ID & Time */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-200">Log #{log.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()} • Block #{log.blockNumber}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${getActionBadge(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>

                      {/* Actor DID */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300 truncate max-w-xs">
                        {log.actorDID}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {log.targetIdentifier}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {log.statusSuccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            REVERTED
                          </span>
                        )}
                      </td>

                      {/* Expand Toggle */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-slate-400 hover:text-white p-1 rounded transition inline-flex items-center gap-1"
                        >
                          <span className="text-[11px]">{isExpanded ? 'Hide' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={6} className="p-4 border-t border-b border-slate-800 space-y-2.5">
                          <div className="text-xs text-slate-300 font-medium">
                            <span className="text-slate-500 uppercase font-mono text-[10px] block">Details:</span>
                            {log.details}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
                            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                              <span className="text-slate-500 text-[10px] uppercase block">Transaction Hash (TxHash):</span>
                              <div className="flex items-center justify-between gap-1 text-sky-400 break-all mt-0.5">
                                <span>{log.txHash}</span>
                                <button
                                  onClick={() => copyText(`tx_${log.id}`, log.txHash)}
                                  className="text-slate-500 hover:text-sky-300 shrink-0"
                                >
                                  {copiedId === `tx_${log.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                              <span className="text-slate-500 text-[10px] uppercase block">Actor Wallet Address:</span>
                              <div className="text-slate-300 break-all mt-0.5">{log.actorWallet}</div>
                            </div>
                          </div>
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
