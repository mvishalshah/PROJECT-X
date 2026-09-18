import React, { useState } from 'react';
import {
  FileCheck2,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { Asset, VerificationResult } from '../types.js';

interface VerifierTabProps {
  assets: Asset[];
  initialAsset?: Asset | null;
}

export const VerifierTab: React.FC<VerifierTabProps> = ({ assets, initialAsset }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAsset?.id || (assets[0]?.id ?? ''));
  const [file, setFile] = useState<File | null>(null);
  const [manualHash, setManualHash] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Tamper simulator state
  const [simulatingTamper, setSimulatingTamper] = useState(false);
  const [tamperExplanation, setTamperExplanation] = useState<string | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleVerifyAsset = async (useTamper = false) => {
    setVerifying(true);
    setResult(null);
    setTamperExplanation(null);

    try {
      if (useTamper) {
        // Run tamper simulation
        const res = await fetch('/api/verify/tamper-demo');
        const demoData = await res.json();

        // Submit tampered hash against current asset
        const verifyRes = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId: selectedAssetId,
            providedHash: demoData.tamperedHash,
          }),
        });
        const verifyData = await verifyRes.json();
        setResult(verifyData);
        setTamperExplanation(demoData.explanation);
        return;
      }

      let payload: any = { assetId: selectedAssetId };

      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const resultStr = reader.result as string;
            const base64 = resultStr.split(',')[1] || resultStr;
            resolve(base64);
          };
          reader.readAsDataURL(file);
        });
        const contentBase64 = await base64Promise;
        payload.contentBase64 = contentBase64;
      } else if (manualHash.trim()) {
        payload.providedHash = manualHash.trim();
      } else if (selectedAsset) {
        // Verify current asset's canonical hash against blockchain anchor
        payload.providedHash = selectedAsset.sha256Hash;
      }

      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Cryptographic Asset Integrity & Tamper Detection</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Verifies digital asset authenticity against the immutable EVM blockchain anchor.
          Demonstrates how any unauthorized modification to critical defense documents is caught mathematically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400">
              Step 1: Select Target Defense Asset
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Defense Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.name} (Token #{a.tokenId})
                  </option>
                ))}
              </select>
            </div>

            {selectedAsset && (
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80 space-y-1 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase">On-Chain Blockchain Anchor:</div>
                <div className="text-emerald-400 text-[11px] break-all">{selectedAsset.sha256Hash}</div>
                <div className="text-slate-400 text-[10px] mt-1">
                  Owner: <span className="text-slate-200">{selectedAsset.ownerDID}</span>
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              Step 2: Provide File or Hash to Verify
            </h3>

            {/* Drag & Drop File Upload */}
            <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-5 text-center transition bg-slate-950/40">
              <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <div className="text-xs text-slate-300 font-semibold">
                {file ? file.name : 'Upload Local File to Compute SHA-256'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Drag and drop document or click to browse</p>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-verify-input"
              />
              <label
                htmlFor="file-verify-input"
                className="mt-3 inline-block bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                {file ? 'Change File' : 'Select File'}
              </label>
            </div>

            {/* Or Manual Hash */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Or Enter Custom SHA-256 Fingerprint
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Verification Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleVerifyAsset(false)}
                disabled={verifying}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Cryptographic Verification</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleVerifyAsset(true)}
                disabled={verifying}
                className="bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                title="Test how 1-byte alteration causes smart contract to reject file"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Simulate 1-Byte Tamper</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verification Result Display */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 h-full flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                Smart Contract Verification Receipt
              </h3>

              {!result && !verifying && (
                <div className="border border-slate-800/80 rounded-xl p-8 text-center text-slate-500 space-y-2">
                  <FileCheck2 className="w-10 h-10 mx-auto text-slate-700" />
                  <div className="text-sm font-semibold text-slate-400">Ready for Verification</div>
                  <p className="text-xs max-w-sm mx-auto">
                    Select an asset and click "Run Cryptographic Verification" to execute on-chain SHA-256 comparison.
                  </p>
                </div>
              )}

              {verifying && (
                <div className="border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto text-sky-400 animate-spin" />
                  <div className="text-sm font-semibold text-white">Querying EVM Smart Contract...</div>
                  <p className="text-xs">
                    Executing <code className="text-sky-300">verifyAssetHash(tokenId, sha256Digest)</code> on-chain.
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`rounded-xl p-4 border flex items-start gap-3 ${
                      result.isAuthentic
                        ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                    }`}
                  >
                    {result.isAuthentic ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-sm tracking-wide">
                        {result.isAuthentic ? 'AUTHENTIC & VERIFIED' : 'TAMPER DETECTED / INTEGRITY VIOLATION'}
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{result.message}</p>
                    </div>
                  </div>

                  {tamperExplanation && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-200">
                      <strong>Avalanche Effect Analysis:</strong> {tamperExplanation}
                    </div>
                  )}

                  {/* Hash Comparison Matrix */}
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                        Calculated SHA-256 Digest:
                      </span>
                      <div
                        className={`break-all font-bold mt-0.5 ${
                          result.isAuthentic ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {result.calculatedHash}
                      </div>
                    </div>

                    {result.onChainHash && (
                      <div className="border-t border-slate-800/80 pt-2">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                          On-Chain Anchored Hash:
                        </span>
                        <div className="text-sky-300 break-all mt-0.5">{result.onChainHash}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">VERIFICATION BLOCK</span>
                        <span className="text-slate-200 font-bold">#{result.blockNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TIME CONFIRMED</span>
                        <span className="text-slate-200 font-bold">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2">
                      <span className="text-slate-500 block text-[10px]">TRANSACTION RECEIPT</span>
                      <div className="text-slate-400 text-[11px] break-all">{result.txHash}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Security Assurance: Hardware-Rooted Cryptographic Anchoring</span>
              <span className="text-emerald-400">Zero Trust Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
