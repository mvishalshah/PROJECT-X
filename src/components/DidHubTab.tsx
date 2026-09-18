import React, { useState } from 'react';
import {
  Fingerprint,
  Plus,
  ShieldCheck,
  KeyRound,
  FileCode,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { UserRole, DIDRecord } from '../types.js';

interface DidHubTabProps {
  currentRole: UserRole;
  dids: DIDRecord[];
  onOpenRegisterModal: () => void;
  onUpdateStatus: (did: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => void;
  onAssignRole: (did: string, newRole: UserRole) => void;
}

export const DidHubTab: React.FC<DidHubTabProps> = ({
  currentRole,
  dids,
  onOpenRegisterModal,
  onUpdateStatus,
  onAssignRole,
}) => {
  const [selectedDIDDoc, setSelectedDIDDoc] = useState<any | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchDIDDocument = async (did: string) => {
    try {
      setLoadingDoc(true);
      const res = await fetch(`/api/dids/${encodeURIComponent(did)}/document`);
      const data = await res.json();
      setSelectedDIDDoc(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDoc(false);
    }
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    MANAGER: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    AUDITOR: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    USER: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
  };

  const statusColors = {
    ACTIVE: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60',
    SUSPENDED: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
    DEACTIVATED: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
  };

  return (
    <div className="space-y-6">
      {/* Header & Concept Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-sky-400" />
              Decentralized Identity (DID) Registry
            </h2>
            <span className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20 font-mono">
              W3C DID v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cryptographically binding user wallets, Secp256k1 public keys, and organization roles on the blockchain.
            Eliminates central IDP single points of failure.
          </p>
        </div>

        {currentRole === 'ADMIN' ? (
          <button
            onClick={onOpenRegisterModal}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 shrink-0 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register New DID</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>DID Registration restricted to ADMIN</span>
          </div>
        )}
      </div>

      {/* DIDs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Identity / DID</th>
                <th className="py-3 px-4">Wallet & Public Key</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dids.map((record) => (
                <tr key={record.did} className="hover:bg-slate-800/30 transition">
                  {/* Name & DID */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {record.displayName}
                      {record.isVerified && (
                        <span title="Cryptographically Verified Identity">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-sky-400 flex items-center gap-1 mt-0.5">
                      <span>{record.did.slice(0, 24)}...{record.did.slice(-6)}</span>
                      <button
                        onClick={() => copyText(record.did, record.did)}
                        className="text-slate-500 hover:text-sky-300 transition"
                        title="Copy Full DID"
                      >
                        {copiedKey === record.did ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Wallet & PubKey */}
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-300 flex items-center gap-1">
                      <span>{record.walletAddress.slice(0, 8)}...{record.walletAddress.slice(-6)}</span>
                      <button
                        onClick={() => copyText(record.walletAddress, record.walletAddress)}
                        className="text-slate-500 hover:text-sky-300 transition"
                      >
                        {copiedKey === record.walletAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-0.5">
                      PubKey: {record.publicKeyHex.slice(0, 12)}...
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${roleColors[record.role]}`}>
                      {record.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${statusColors[record.status]}`}>
                      {record.status}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => fetchDIDDocument(record.did)}
                        className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-2 py-1 rounded text-[11px] transition flex items-center gap-1"
                        title="Inspect W3C DID Document"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>W3C Doc</span>
                      </button>

                      {currentRole === 'ADMIN' && (
                        <>
                          {record.status === 'ACTIVE' ? (
                            <button
                              onClick={() => onUpdateStatus(record.did, 'SUSPENDED')}
                              className="text-amber-400 hover:bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded text-[11px] transition"
                              title="Suspend DID"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateStatus(record.did, 'ACTIVE')}
                              className="text-emerald-400 hover:bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded text-[11px] transition"
                              title="Reactivate DID"
                            >
                              Activate
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* W3C DID Document Modal */}
      {selectedDIDDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">W3C DID Document (JSON-LD)</h3>
              </div>
              <button
                onClick={() => setSelectedDIDDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Conforms strictly to the W3C Decentralized Identifiers (DIDs) v1.0 standard, providing cryptographic proof
              of control without centralized intermediaries.
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedDIDDoc, null, 2)}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => copyText('w3cdoc', JSON.stringify(selectedDIDDoc, null, 2))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedKey === 'w3cdoc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy JSON-LD</span>
              </button>
              <button
                onClick={() => setSelectedDIDDoc(null)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role-Based Access Control Matrix Explainer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          Smart Contract Role-Based Access Control (RBAC) Specification
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Enforced directly by <code className="text-sky-400">BlockVaultRBAC.sol</code> and{' '}
          <code className="text-sky-400">BlockVaultAssetNFT.sol</code> on-chain modifiers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 border border-rose-900/40 rounded-lg p-3 space-y-2">
            <div className="font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              ADMIN (System CISO)
            </div>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Create & Register DIDs</li>
              <li>Verify / Deactivate identities</li>
              <li>Mint ERC-721 NFTs</li>
              <li>Allocate & Transfer assets</li>
              <li>Assign / Revoke all roles</li>
              <li>View all audit logs</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 border border-amber-900/40 rounded-lg p-3 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              MANAGER (Project Lead)
            </div>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Manage assigned project assets</li>
              <li>Transfer authorized NFTs</li>
              <li>Allocate assets to team</li>
              <li>View relevant audit trails</li>
              <li>Verify asset integrity</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 border border-emerald-900/40 rounded-lg p-3 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              AUDITOR (Cyber QA / MoD)
            </div>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Read-only inspection</li>
              <li>Verify SHA-256 asset hashes</li>
              <li>Verify blockchain tx proofs</li>
              <li>View complete audit history</li>
              <li>Export compliance reports</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 border border-sky-900/40 rounded-lg p-3 space-y-2">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              USER (Defense Personnel)
            </div>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>View own identity & DID</li>
              <li>View own NFT ownership</li>
              <li>Download permitted assets</li>
              <li>Verify file authenticity</li>
              <li>View personal activity log</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
