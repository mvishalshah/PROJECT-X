import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Cpu,
  Terminal,
  Layers,
  Shield,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { ContractInfo } from '../types.js';

export const ContractsTab: React.FC = () => {
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('BlockVaultDIDRegistry.sol');
  const [copiedCode, setCopiedCode] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/contracts')
      .then((res) => res.json())
      .then((data) => {
        setContracts(data.contracts || []);
        setNetworkInfo(data.network || {});
      })
      .catch(console.error);
  }, []);

  const activeContract = contracts.find((c) => c.name === selectedContract);

  const copyCode = () => {
    if (activeContract) {
      navigator.clipboard.writeText(activeContract.sourceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Solidity Smart Contracts & Architecture</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Modular, OpenZeppelin-compatible smart contracts deployed to the BlockVault EVM Subnet.
          Source code is immutable and auditable on-chain.
        </p>
      </div>

      {/* Network Telemetry & Contract Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {contracts.map((c) => (
          <div
            key={c.name}
            onClick={() => setSelectedContract(c.name)}
            className={`cursor-pointer p-3.5 rounded-xl border transition ${
              selectedContract === c.name
                ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px] truncate">{c.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">{c.address}</div>
          </div>
        ))}
      </div>

      {/* Code Inspector */}
      {activeContract && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-xs font-bold text-white">{activeContract.name}</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400 hidden sm:inline">{activeContract.description}</span>
            </div>

            <button
              onClick={copyCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Solidity'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs text-sky-200 overflow-x-auto max-h-[500px]">
            <pre>{activeContract.sourceCode || '// Loading contract source...'}</pre>
          </div>
        </div>
      )}

      {/* VS Code & Local Deployment Instructions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Local Run & Deployment Guide (VS Code)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-sky-950 border border-sky-600 flex items-center justify-center text-[10px] text-sky-300">
                1
              </span>
              <span>Install & Configure</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Clone repository, open in VS Code, and ensure Node.js 18+ and Docker or PostgreSQL are available.
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-slate-300">
              npm install
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-950 border border-indigo-600 flex items-center justify-center text-[10px] text-indigo-300">
                2
              </span>
              <span>Compile & Deploy Contracts</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Compile Solidity smart contracts using Hardhat and deploy to local node or testnet.
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-slate-300">
              npx hardhat compile
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-[10px] text-emerald-300">
                3
              </span>
              <span>Launch Full-Stack App</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Launches both Express backend and React Vite frontend on port 3000.
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-slate-300">
              npm run dev
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
