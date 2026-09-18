import React, { useState } from 'react';
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ShieldCheck,
  Fingerprint,
  Layers,
} from 'lucide-react';
import { ethers } from 'ethers';
import { UserRole, AccountProfile } from '../types.js';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountProfile[];
  currentRole: UserRole;
  onSelectAccount: (role: UserRole) => void;
  onWalletLoginSuccess: (session: any) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentRole,
  onSelectAccount,
  onWalletLoginSuccess,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real MetaMask Web3 Signature Flow
  const handleConnectMetaMask = async () => {
    setConnecting(true);
    setError(null);
    setStatusMessage('Checking Web3 wallet provider (MetaMask)...');

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error(
          'MetaMask extension was not detected in this browser. You can select one of the pre-configured defense operator profiles below to test the full cryptographic flow!'
        );
      }

      setStatusMessage('Requesting wallet connection...');
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      setStatusMessage(`Requesting cryptographic challenge nonce for ${walletAddress.slice(0, 6)}...`);
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const nonceData = await nonceRes.json();

      setStatusMessage('Please approve EIP-191 signature request in MetaMask...');
      const signature = await signer.signMessage(nonceData.message);

      setStatusMessage('Verifying signature and mapping Decentralized Identity (DID)...');
      const verifyRes = await fetch('/api/auth/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message: nonceData.message,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Wallet verification failed');
      }

      onWalletLoginSuccess(verifyData.session);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
      setStatusMessage(null);
    }
  };

  const roleColors: Record<UserRole, string> = {
    ADMIN: 'border-rose-700/60 bg-rose-950/40 text-rose-300',
    MANAGER: 'border-amber-700/60 bg-amber-950/40 text-amber-300',
    AUDITOR: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300',
    USER: 'border-sky-700/60 bg-sky-950/40 text-sky-300',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Connect Web3 Wallet & DID</h3>
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

        {statusMessage && (
          <div className="bg-sky-950/60 border border-sky-800 text-sky-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Live MetaMask Connect Button */}
        <button
          onClick={handleConnectMetaMask}
          disabled={connecting}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold p-3.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect with MetaMask (EIP-191 Nonce Signing)</span>
        </button>

        {/* Preconfigured Personas */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Or Select Defense Personnel Role (Instant RBAC Switch):
            </span>
            <span className="text-[10px] text-slate-500">RBAC Profile Switcher</span>
          </div>

          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => {
                  onSelectAccount(acc.role);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 hover:brightness-110 ${
                  roleColors[acc.role]
                } ${currentRole === acc.role ? 'ring-2 ring-sky-400' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{acc.role}</span>
                    <span className="text-white text-xs font-medium">• {acc.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{acc.designation}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-1 truncate max-w-sm">
                    {acc.walletAddress}
                  </div>
                </div>
                {currentRole === acc.role && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cybersecurity Standard Compliance:</span>
          </div>
          <p>
            Private keys never leave the client device or server. Authentication relies exclusively on ECDSA public-key
            cryptography, nonce challenges, and on-chain DID identity bindings.
          </p>
        </div>
      </div>
    </div>
  );
};
