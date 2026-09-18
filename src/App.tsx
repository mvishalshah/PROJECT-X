import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Layers,
  FileCheck2,
  History,
  BrainCircuit,
  FileCode,
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import { Header } from './components/Header.js';
import { DashboardTab } from './components/DashboardTab.js';
import { DidHubTab } from './components/DidHubTab.js';
import { AssetVaultTab } from './components/AssetVaultTab.js';
import { VerifierTab } from './components/VerifierTab.js';
import { AuditTrailTab } from './components/AuditTrailTab.js';
import { AiAnalyticsTab } from './components/AiAnalyticsTab.js';
import { ContractsTab } from './components/ContractsTab.js';
import { MintAssetModal } from './components/MintAssetModal.js';
import { RegisterDidModal } from './components/RegisterDidModal.js';
import { TransferAssetModal } from './components/TransferAssetModal.js';
import { WalletModal } from './components/WalletModal.js';
import { UniverseBackground } from './components/UniverseBackground.js';
import { UserRole, AccountProfile, DIDRecord, Asset, AuditLog } from './types.js';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [walletAddress, setWalletAddress] = useState<string>('0x71A9140A8128e9C0d60BE0A5212558fFA477d92F');
  const [did, setDid] = useState<string>('did:blockvault:0x71A9140A8128e9C0d60BE0A5212558fFA477d92F');
  const [displayName, setDisplayName] = useState<string>('Dr. Rajesh Verma');
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [dids, setDids] = useState<DIDRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [blockHeight, setBlockHeight] = useState<number>(1042);

  // Modals state
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [isRegisterDIDOpen, setIsRegisterDIDOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [verifyTargetAsset, setVerifyTargetAsset] = useState<Asset | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Session & Initial State
  const fetchSessionAndData = async () => {
    try {
      const [sessionRes, didsRes, assetsRes, logsRes, networkRes] = await Promise.all([
        fetch('/api/auth/session', { headers: { 'x-blockvault-role': currentRole } }),
        fetch('/api/dids', { headers: { 'x-blockvault-role': currentRole } }),
        fetch('/api/assets', { headers: { 'x-blockvault-role': currentRole } }),
        fetch('/api/audit-logs', { headers: { 'x-blockvault-role': currentRole } }),
        fetch('/api/network'),
      ]);

      const sessionData = await sessionRes.json();
      const didsData = await didsRes.json();
      const assetsData = await assetsRes.json();
      const logsData = await logsRes.json();
      const networkData = await networkRes.json();

      if (sessionData.preconfiguredAccounts) {
        setAccounts(sessionData.preconfiguredAccounts);
      }
      if (sessionData.session) {
        setWalletAddress(sessionData.session.walletAddress);
        setDid(sessionData.session.did);
        setDisplayName(sessionData.session.displayName);
      }

      setDids(didsData.dids || []);
      setAssets(assetsData.assets || []);
      setLogs(logsData.logs || []);
      if (networkData.blockHeight) {
        setBlockHeight(networkData.blockHeight);
      }
    } catch (e) {
      console.error('Error fetching BlockVault data:', e);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, [currentRole]);

  // Handle Switching Roles (RBAC Simulation)
  const handleRoleChange = async (newRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setCurrentRole(data.account.role);
        setWalletAddress(data.account.walletAddress);
        setDid(data.account.did);
        setDisplayName(data.account.name);
        showNotification(`RBAC Context switched to ${data.account.role} (${data.account.name})`, 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // DID Lifecycle update
  const handleUpdateDIDStatus = async (targetDid: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => {
    try {
      const res = await fetch(`/api/dids/${encodeURIComponent(targetDid)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-blockvault-role': currentRole,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update status');
        return;
      }
      showNotification(`DID status updated to ${status} on blockchain (Tx: ${data.txHash.slice(0, 12)}...)`);
      fetchSessionAndData();
    } catch (e) {
      console.error(e);
    }
  };

  // Role Assignment
  const handleAssignRole = async (targetDid: string, newRole: UserRole) => {
    try {
      const res = await fetch('/api/roles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-blockvault-role': currentRole,
        },
        body: JSON.stringify({ targetDID: targetDid, newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to assign role');
        return;
      }
      showNotification(`Role ${newRole} assigned on-chain to ${targetDid.slice(0, 16)}...`);
      fetchSessionAndData();
    } catch (e) {
      console.error(e);
    }
  };

  // Tab definitions
  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'dids', label: 'DID Hub (W3C)', icon: Fingerprint },
    { id: 'assets', label: 'Asset Vault (NFTs)', icon: Layers },
    { id: 'verifier', label: 'Integrity Verifier', icon: FileCheck2 },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'ai', label: 'AI Analytics', icon: BrainCircuit },
    { id: 'contracts', label: 'Smart Contracts', icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden">
      {/* Animated Universe Cosmic Canvas */}
      <UniverseBackground />

      {/* Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        walletAddress={walletAddress}
        did={did}
        displayName={displayName}
        accounts={accounts}
        blockHeight={blockHeight}
        onOpenWalletModal={() => setIsWalletOpen(true)}
      />

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-[65px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-slate-900 border border-sky-500/50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentRole={currentRole}
            dids={dids}
            assets={assets}
            logs={logs}
            blockHeight={blockHeight}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenMintModal={() => setIsMintOpen(true)}
            onOpenDIDModal={() => setIsRegisterDIDOpen(true)}
          />
        )}

        {activeTab === 'dids' && (
          <DidHubTab
            currentRole={currentRole}
            dids={dids}
            onOpenRegisterModal={() => setIsRegisterDIDOpen(true)}
            onUpdateStatus={handleUpdateDIDStatus}
            onAssignRole={handleAssignRole}
          />
        )}

        {activeTab === 'assets' && (
          <AssetVaultTab
            currentRole={currentRole}
            currentWallet={walletAddress}
            assets={assets}
            onOpenMintModal={() => setIsMintOpen(true)}
            onOpenTransferModal={(asset) => setTransferAsset(asset)}
            onVerifyAsset={(asset) => {
              setVerifyTargetAsset(asset);
              setActiveTab('verifier');
            }}
          />
        )}

        {activeTab === 'verifier' && (
          <VerifierTab
            assets={assets}
            initialAsset={verifyTargetAsset}
          />
        )}

        {activeTab === 'audit' && <AuditTrailTab logs={logs} />}

        {activeTab === 'ai' && <AiAnalyticsTab logs={logs} />}

        {activeTab === 'contracts' && <ContractsTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-md py-4 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-slate-300">BlockVault</span>
            <span>— Decentralized Identity, Access Control & Asset Security</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400">PoA EVM Subnet Active</span>
            <span>•</span>
            <span className="font-mono text-slate-500">Block #{blockHeight}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MintAssetModal
        isOpen={isMintOpen}
        onClose={() => setIsMintOpen(false)}
        onMintSuccess={() => {
          showNotification('Defense Digital Asset NFT minted & anchored on blockchain successfully!');
          fetchSessionAndData();
        }}
        currentRole={currentRole}
      />

      <RegisterDidModal
        isOpen={isRegisterDIDOpen}
        onClose={() => setIsRegisterDIDOpen(false)}
        onRegisterSuccess={() => {
          showNotification('New W3C Decentralized Identity (DID) registered on blockchain!');
          fetchSessionAndData();
        }}
      />

      <TransferAssetModal
        isOpen={!!transferAsset}
        onClose={() => setTransferAsset(null)}
        asset={transferAsset}
        dids={dids}
        onTransferSuccess={() => {
          showNotification('NFT ownership transferred on-chain and recorded in audit ledger!');
          fetchSessionAndData();
        }}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        accounts={accounts}
        currentRole={currentRole}
        onSelectAccount={handleRoleChange}
        onWalletLoginSuccess={(session) => {
          setWalletAddress(session.walletAddress);
          setDid(session.did);
          setDisplayName(session.displayName);
          setCurrentRole(session.role);
          showNotification(`Authenticated via Web3 Wallet: ${session.displayName}`);
          fetchSessionAndData();
        }}
      />
    </div>
  );
}

export default App;
