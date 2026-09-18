import React, { useState } from 'react';
import { X, Fingerprint, Key, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { UserRole } from '../types.js';

interface RegisterDidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterDidModal: React.FC<RegisterDidModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateRandomWallet = () => {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    setWalletAddress(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !walletAddress.trim()) {
      setError('Name and Wallet Address are required');
      return;
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError('Please provide a valid 42-character Ethereum hex address (0x...)');
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      const res = await fetch('/api/dids/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          walletAddress: walletAddress.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'DID registration failed');
      }

      onRegisterSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Register Decentralized Identity (DID)</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name / Designation *</label>
            <input
              type="text"
              placeholder="e.g. Lt. Col. Vikrant Sharma (Radar Systems)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">Ethereum Wallet Address *</label>
              <button
                type="button"
                onClick={handleGenerateRandomWallet}
                className="text-sky-400 hover:text-sky-300 text-[11px] underline"
              >
                Generate Address
              </button>
            </div>
            <input
              type="text"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Initial RBAC Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="USER">USER - Standard Personnel</option>
              <option value="AUDITOR">AUDITOR - Cyber Compliance Inspector</option>
              <option value="MANAGER">MANAGER - Project Lead</option>
              <option value="ADMIN">ADMIN - Defense Security Administrator</option>
            </select>
          </div>

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
            <div>W3C Format: <strong>did:blockvault:{'{address}'}</strong></div>
            <div>Public Key: <strong>Secp256k1 VerificationMethod</strong></div>
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
              disabled={registering}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
            >
              {registering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering DID...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Register DID on Blockchain</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
