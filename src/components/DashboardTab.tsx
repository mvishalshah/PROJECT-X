import React from 'react';
import {
  ShieldAlert,
  FileCheck2,
  Fingerprint,
  Layers,
  Sparkles,
  ArrowUpRight,
  Lock,
  Cpu,
  AlertTriangle,
  History,
  CheckCircle2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { UserRole, Asset, DIDRecord, AuditLog } from '../types.js';

interface DashboardTabProps {
  currentRole: UserRole;
  dids: DIDRecord[];
  assets: Asset[];
  logs: AuditLog[];
  blockHeight: number;
  onNavigate: (tab: string) => void;
  onOpenMintModal: () => void;
  onOpenDIDModal: () => void;
}

const ACTIVITY_DATA = [
  { time: '06:00', transactions: 4, verifications: 12, gas: 140 },
  { time: '09:00', transactions: 11, verifications: 28, gas: 380 },
  { time: '12:00', transactions: 18, verifications: 45, gas: 590 },
  { time: '15:00', transactions: 24, verifications: 62, gas: 820 },
  { time: '18:00', transactions: 31, verifications: 84, gas: 1040 },
  { time: 'Now', transactions: 39, verifications: 112, gas: 1280 },
];

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b'];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentRole,
  dids,
  assets,
  logs,
  blockHeight,
  onNavigate,
  onOpenMintModal,
  onOpenDIDModal,
}) => {
  const assetTypes = assets.reduce((acc, curr) => {
    acc[curr.assetType] = (acc[curr.assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(assetTypes).map(([name, value]) => ({ name, value }));

  const recentTransactions = logs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-sky-800/40 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Decentralized Identity, Access Control & Asset Security
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Replacing vulnerable centralized IAM with cryptographically verifiable DIDs (W3C), smart-contract-enforced RBAC,
              ERC-721 digital asset ownership, and immutable on-chain audit trails for defense & critical infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentRole === 'ADMIN' && (
              <button
                onClick={onOpenMintModal}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Mint Defense NFT</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('verifier')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Verify File Integrity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Decentralized Identities</span>
            <Fingerprint className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{dids.length}</span>
            <span className="text-xs text-emerald-400 font-medium">100% Cryptographically Bound</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">W3C did:blockvault identifiers registered</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Asset NFTs Minted</span>
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{assets.length}</span>
            <span className="text-xs text-sky-400 font-medium">ERC-721 Anchored</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Radar specs, firmware & schematics</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Immutable Audit Logs</span>
            <History className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{logs.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Block #{blockHeight}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Append-only blockchain event receipts</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Cryptographic Security</span>
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">SHA-256</span>
            <span className="text-xs text-teal-400 font-medium">AES-256-GCM</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Zero private files stored directly on-chain</p>
        </div>
      </div>

      {/* Analytics Charts & Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction & Integrity Activity Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Cryptographic Activity & Gas Telemetry</h3>
              <p className="text-xs text-slate-400">On-chain transaction throughput and file hash verifications</p>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded border border-sky-800/40">
              Live Network
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_DATA}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="verifications" stroke="#34d399" fillOpacity={1} fill="url(#colorVer)" name="SHA-256 Verifications" />
                <Area type="monotone" dataKey="transactions" stroke="#38bdf8" fillOpacity={1} fill="url(#colorTx)" name="On-Chain Transactions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Type Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Asset Classification Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">NFT assets categorized by defense classification</p>

            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-mono text-slate-400 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Blockchain Ledger Events */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Immutable Audit Trail Records</h3>
            <p className="text-xs text-slate-400">Chronological ledger of identity operations and smart contract transactions</p>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Tx Hash / Block</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Actor DID</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentTransactions.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-medium">
                    <div className="text-sky-400">{log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}</div>
                    <div className="text-[10px] text-slate-500">Block #{log.blockNumber}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-200">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs font-sans">
                    {log.actorDID}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">
                    {log.targetIdentifier}
                  </td>
                  <td className="py-2.5 px-3">
                    {log.statusSuccess ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        REVERTED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
