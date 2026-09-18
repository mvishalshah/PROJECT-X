import React, { useState } from 'react';
import { X, Send, Shield, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { Asset, DIDRecord } from '../types.js';

interface TransferAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  dids: DIDRecord[];
  onTransferSuccess: () => void;
}

export const TransferAssetModal: React.FC<TransferAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  dids,
  onTransferSuccess,
}) => {
  const [selectedDID, setSelectedDID] = useState<string>(dids[0]?.did || '');
  const [reason, setReason] = useState('Mission Reassignment to Production Squadron');
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const targetDidRecord = dids.find((d) => d.did === selectedDID);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDidRecord) {
      setError('Please select a valid recipient identity');
      return;
    }

    setTransferring(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${asset.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toWallet: targetDidRecord.walletAddress,
          toDID: targetDidRecord.did,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      onTransferSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Transfer Digital Asset NFT</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-500 font-mono text-[10px] uppercase">Asset Selected:</div>
            <div className="font-bold text-white">{asset.name}</div>
            <div className="text-sky-400 font-mono text-[11px]">Token ID #{asset.tokenId} • {asset.id}</div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Transfer Ownership To (Target DID):</label>
            <select
              value={selectedDID}
              onChange={(e) => setSelectedDID(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {dids
                .filter((d) => d.did !== asset.ownerDID)
                .map((d) => (
                  <option key={d.did} value={d.did}>
                    {d.displayName} ({d.role}) - {d.did.slice(0, 16)}...
                  </option>
                ))}
            </select>
          </div>

          {targetDidRecord && (
            <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500 block text-[10px]">Recipient Wallet:</span>
              <span className="text-emerald-400 break-all">{targetDidRecord.walletAddress}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Authorization Justification / Reason:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 font-mono">
            Transaction will call <strong className="text-sky-300">transferAsset(tokenId, to)</strong> on{' '}
            <strong>BlockVaultAssetNFT.sol</strong> and record event in audit ledger.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferring}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              {transferring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transferring on Blockchain...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm Ownership Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
