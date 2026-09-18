import React, { useState } from 'react';
import {
  X,
  Lock,
  UploadCloud,
  FileText,
  Shield,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../types.js';

interface MintAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMintSuccess: () => void;
  currentRole: UserRole;
}

export const MintAssetModal: React.FC<MintAssetModalProps> = ({
  isOpen,
  onClose,
  onMintSuccess,
  currentRole,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assetType, setAssetType] = useState('Engineering Specification');
  const [confidentialityLevel, setConfidentialityLevel] = useState('CONFIDENTIAL');
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Asset name is required');
      return;
    }

    if (!file && !textContent.trim()) {
      setError('Please provide a file or text document content to anchor and encrypt');
      return;
    }

    setMinting(true);
    setError(null);

    try {
      let contentBase64 = '';
      let fileName = 'document.txt';

      if (file) {
        fileName = file.name;
        const reader = new FileReader();
        const p = new Promise<string>((resolve) => {
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || res);
          };
          reader.readAsDataURL(file);
        });
        contentBase64 = await p;
      } else {
        contentBase64 = Buffer.from(textContent).toString('base64');
        fileName = `${name.replace(/\s+/g, '_').toLowerCase()}.txt`;
      }

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          assetType,
          confidentialityLevel,
          fileName,
          contentBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Minting failed');
      }

      onMintSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Mint Defense Digital Asset NFT</h3>
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

        <form onSubmit={handleMint} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Defense Asset Title *</label>
            <input
              type="text"
              placeholder="e.g. CSR-400 Radar Core Signal Processing Algorithm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Asset Classification</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Engineering Specification">Engineering Specification</option>
                <option value="Firmware Authorization">Firmware Authorization</option>
                <option value="Design Blueprint">Design Blueprint</option>
                <option value="Compliance Certificate">Compliance Certificate</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Security Level</label>
              <select
                value={confidentialityLevel}
                onChange={(e) => setConfidentialityLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="SECRET">SECRET</option>
                <option value="TOP_SECRET">TOP SECRET</option>
                <option value="RESTRICTED">RESTRICTED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Technical Description</label>
            <textarea
              rows={2}
              placeholder="Provide mission scope, versioning parameters, or handling instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Mode Switch: Upload File vs Write Specification */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-300">Payload Document Content</label>
              <button
                type="button"
                onClick={() => setIsTextMode(!isTextMode)}
                className="text-sky-400 hover:text-sky-300 text-[11px] underline"
              >
                {isTextMode ? 'Switch to File Upload' : 'Switch to Direct Text Entry'}
              </button>
            </div>

            {isTextMode ? (
              <textarea
                rows={4}
                placeholder="Enter confidential engineering payload or security specifications..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            ) : (
              <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-xl p-4 text-center bg-slate-950/50">
                <UploadCloud className="w-6 h-6 text-sky-400 mx-auto mb-1.5" />
                <div className="font-medium text-slate-300">
                  {file ? file.name : 'Upload File (PDF, DWG, BIN, DOCX)'}
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="mint-file-input"
                />
                <label
                  htmlFor="mint-file-input"
                  className="mt-2 inline-block bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition"
                >
                  {file ? 'Change Selected File' : 'Browse File'}
                </label>
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
            <div>1. Payload will be encrypted with <strong>AES-256-GCM</strong></div>
            <div>2. SHA-256 hash will be permanently anchored in <strong>BlockVaultAssetNFT.sol</strong></div>
            <div>3. Mint event recorded in <strong>BlockVaultAuditLedger.sol</strong></div>
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
              disabled={minting}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
            >
              {minting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Minting...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Mint NFT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
