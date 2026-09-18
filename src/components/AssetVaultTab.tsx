import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Lock,
  Download,
  Send,
  FileCheck2,
  ExternalLink,
  Shield,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  Key,
} from 'lucide-react';
import { UserRole, Asset } from '../types.js';

interface AssetVaultTabProps {
  currentRole: UserRole;
  currentWallet: string;
  assets: Asset[];
  onOpenMintModal: () => void;
  onOpenTransferModal: (asset: Asset) => void;
  onVerifyAsset: (asset: Asset) => void;
}

export const AssetVaultTab: React.FC<AssetVaultTabProps> = ({
  currentRole,
  currentWallet,
  assets,
  onOpenMintModal,
  onOpenTransferModal,
  onVerifyAsset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [inspectAsset, setInspectAsset] = useState<Asset | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || asset.assetType === selectedType;
    return matchesSearch && matchesType;
  });

  const classificationBadges = {
    TOP_SECRET: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    SECRET: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    CONFIDENTIAL: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
    RESTRICTED: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Digital Asset & NFT Ownership Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Unique, traceable digital defense assets anchored via ERC-721 smart contracts. Large files encrypted with AES-256-GCM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === 'ADMIN' ? (
            <button
              onClick={onOpenMintModal}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Mint Defense Asset NFT</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Contract: Only ADMIN can mint NFTs</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by asset name, Token ID, or SHA-256 hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
        >
          <option value="ALL">All Asset Classifications</option>
          <option value="Engineering Specification">Engineering Specifications</option>
          <option value="Firmware Authorization">Firmware Authorizations</option>
          <option value="Design Blueprint">Design Blueprints</option>
          <option value="Compliance Certificate">Compliance Certificates</option>
        </select>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssets.map((asset) => {
          const isOwner = asset.ownerWallet.toLowerCase() === currentWallet.toLowerCase();
          const canTransfer = isOwner || currentRole === 'ADMIN';

          return (
            <div
              key={asset.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
            >
              <div className="space-y-3">
                {/* Header: ID, Badge, Token ID */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] text-sky-400 font-bold">{asset.id}</span>
                    <h3 className="text-sm font-bold text-white leading-snug mt-0.5">{asset.name}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded font-semibold">
                      ERC-721 #{asset.tokenId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                        classificationBadges[asset.confidentialityLevel] || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {asset.confidentialityLevel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{asset.description}</p>

                {/* Technical Anchors */}
                <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase">SHA-256 Fingerprint:</span>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span>{asset.sha256Hash.slice(0, 10)}...{asset.sha256Hash.slice(-6)}</span>
                      <button
                        onClick={() => copyText(`hash_${asset.id}`, asset.sha256Hash)}
                        className="text-slate-500 hover:text-sky-300 transition"
                      >
                        {copiedKey === `hash_${asset.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase">Current Owner DID:</span>
                    <span className="text-slate-300 truncate max-w-[180px] font-sans text-[11px]">
                      {asset.ownerDID.slice(0, 18)}...
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase">Storage / Encryption:</span>
                    <span className="text-emerald-400 text-[10px]">AES-256-GCM Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setInspectAsset(asset)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    title="Inspect on-chain metadata"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  <a
                    href={`/api/assets/${asset.id}/download`}
                    className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    title="Decrypt and securely download"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Decrypt</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  {canTransfer && (
                    <button
                      onClick={() => onOpenTransferModal(asset)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-900/40 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                      title="Transfer NFT on blockchain"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                  )}

                  <button
                    onClick={() => onVerifyAsset(asset)}
                    className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verify</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-300">No assets found</p>
          <p className="text-xs mt-1">Adjust search parameters or mint a new defense digital asset NFT.</p>
        </div>
      )}

      {/* Inspect Asset Metadata Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">{inspectAsset.name}</h3>
              </div>
              <button
                onClick={() => setInspectAsset(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">ASSET ID</span>
                  <span className="text-white font-bold">{inspectAsset.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NFT TOKEN ID</span>
                  <span className="text-sky-400 font-bold">#{inspectAsset.tokenId} (ERC-721)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CLASSIFICATION</span>
                  <span className="text-amber-400 font-bold">{inspectAsset.confidentialityLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">STATUS</span>
                  <span className="text-emerald-400 font-bold">{inspectAsset.status}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-400 block text-[11px]">IMMUTABLE ON-CHAIN SHA-256 HASH:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 break-all">
                  {inspectAsset.sha256Hash}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-400 block text-[11px]">OWNER DECENTRALIZED IDENTIFIER:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-sky-300 break-all">
                  {inspectAsset.ownerDID}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-400 block text-[11px]">METADATA REFERENCE (IPFS CID):</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-400 break-all">
                  {inspectAsset.metadataURI}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectAsset(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
