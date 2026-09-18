import React, { useState } from 'react';
import { Shield, Key, Wallet, RefreshCw, CheckCircle2, ChevronDown, Copy, Check, Lock, Cpu } from 'lucide-react';
import { UserRole, AccountProfile } from '../types.js';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  walletAddress: string;
  did: string;
  displayName: string;
  accounts: AccountProfile[];
  blockHeight: number;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  walletAddress,
  did,
  displayName,
  accounts,
  blockHeight,
  onOpenWalletModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColors: Record<UserRole, { badge: string; border: string; text: string }> = {
    ADMIN: { badge: 'bg-rose-950/80 text-rose-300 border-rose-700/60', border: 'border-rose-500/40', text: 'text-rose-400' },
    MANAGER: { badge: 'bg-amber-950/80 text-amber-300 border-amber-700/60', border: 'border-amber-500/40', text: 'text-amber-400' },
    AUDITOR: { badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', border: 'border-emerald-500/40', text: 'text-emerald-400' },
    USER: { badge: 'bg-sky-950/80 text-sky-300 border-sky-700/60', border: 'border-sky-500/40', text: 'text-sky-400' },
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-600 via-indigo-700 to-slate-900 border border-sky-400/40 flex items-center justify-center shadow-lg shadow-sky-950/50">
            <Lock className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Block<span className="text-sky-400">Vault</span>
              </h1>
              <span className="bg-sky-500/10 text-sky-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/30">
                v2.6.0
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50 font-mono text-[10px] hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PoA Node Active • #{blockHeight}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Decentralized Identity, Access Control & Digital Asset Security Platform
            </p>
          </div>
        </div>

        {/* User Identity, Role Switcher & Wallet */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Role Selector (Dynamic RBAC Switcher) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${roleColors[currentRole].badge} hover:brightness-110`}
              title="Click to switch role and test RBAC authorization rules"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <div className="text-left">
                <div className="text-[10px] opacity-75 uppercase tracking-wider font-semibold">Active Role</div>
                <div className="font-bold flex items-center gap-1">
                  {currentRole}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </div>
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Role (RBAC Simulation)
                </div>
                <div className="mt-1 space-y-1">
                  {accounts.map((acc) => (
                    <button
                      key={acc.role}
                      onClick={() => {
                        onRoleChange(acc.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 transition ${
                        currentRole === acc.role
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${roleColors[acc.role].badge}`}>
                            {acc.role}
                          </span>
                          <span className="font-medium text-slate-200">{acc.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{acc.designation}</div>
                      </div>
                      {currentRole === acc.role && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Connected DID & Wallet Pill */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2.5 text-xs">
            <div className="hidden sm:block">
              <div className="text-[10px] text-slate-400 font-medium">Logged in as {displayName}</div>
              <div className="font-mono text-slate-200 flex items-center gap-1">
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <button
                  onClick={() => copyToClipboard(did)}
                  className="text-slate-400 hover:text-sky-400 transition"
                  title="Copy Full DID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={onOpenWalletModal}
              className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
