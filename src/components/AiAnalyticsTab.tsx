import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Send,
  FileText,
  Lock,
  Cpu,
  CheckCircle2,
  BrainCircuit,
} from 'lucide-react';
import { AiAnalysisResult, AuditLog } from '../types.js';

interface AiAnalyticsTabProps {
  logs: AuditLog[];
}

export const AiAnalyticsTab: React.FC<AiAnalyticsTabProps> = ({ logs }) => {
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);

  const presetQueries = [
    'Audit recent NFT minting operations for authorization compliance',
    'Scan for privilege escalation attempts or unauthorized role changes',
    'Generate Ministry of Defence (MoD) Executive Cyber Compliance Briefing',
    'Assess zero-trust integrity of defense document fingerprints',
  ];

  const handleRunAnalysis = async (customQuery?: string) => {
    const q = customQuery || query;
    setAnalyzing(true);

    try {
      const res = await fetch('/api/ai/analyze-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const threatBadges = {
    LOW: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    MEDIUM: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    HIGH: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
    CRITICAL: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  };

  return (
    <div className="space-y-6">
      {/* Header & Architectural Principle */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-bold text-white">Gemini AI Security & Threat Analytics</h2>
          <span className="text-[11px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20 font-mono">
            gemini-3.8-flash
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl">
          Automated natural-language threat assessment of append-only blockchain audit records and defense telemetry.
        </p>

        {/* Security Isolation Notice */}
        <div className="bg-slate-950 border border-amber-900/40 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2.5 mt-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Defense Architectural Isolation:</strong> AI operates strictly
            as an analytical, reporting, and advisory layer. All identity verification, role permissions, and asset ownership
            are enforced deterministically by Solidity smart contracts (<code className="text-amber-200">BlockVaultRBAC.sol</code>).
          </div>
        </div>
      </div>

      {/* Preset Prompts */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
          Preset Threat Analysis Modules:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presetQueries.map((promptText) => (
            <button
              key={promptText}
              onClick={() => {
                setQuery(promptText);
                handleRunAnalysis(promptText);
              }}
              disabled={analyzing}
              className="text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 p-3 rounded-xl text-xs text-slate-300 transition flex items-center justify-between gap-2 group"
            >
              <span>{promptText}</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex gap-2">
        <input
          type="text"
          placeholder="Ask AI auditor: e.g. Evaluate whether any unauthorized address attempted to transfer asset #3..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={() => handleRunAnalysis()}
          disabled={analyzing}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-lg shadow-sky-500/20"
        >
          {analyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze Logs</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Output */}
      {result && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          {/* Header & Threat Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Cybersecurity Audit Report</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against {logs.length} immutable on-chain audit records
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Assessed Threat Level:</span>
              <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${threatBadges[result.threatLevel]}`}>
                {result.threatLevel}
              </span>
            </div>
          </div>

          {/* Executive Briefing */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Executive Cyber Briefing</h4>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {result.analysis}
            </div>
          </div>

          {/* Key Findings */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Key Findings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Recommended Hardening Actions
            </h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
