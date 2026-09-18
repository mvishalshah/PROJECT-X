import { UserRole, AccountProfile, DIDRecord, Asset, AuditLog, UserSession } from '../types.js';
import { SEED_ACCOUNTS, SEED_DIDS, SEED_ASSETS, SEED_LOGS } from '../data/seedData.js';

const STORAGE_KEYS = {
  CURRENT_ROLE: 'blockvault_current_role',
  DIDS: 'blockvault_dids',
  ASSETS: 'blockvault_assets',
  LOGS: 'blockvault_logs',
  BLOCK_HEIGHT: 'blockvault_block_height',
};

// Safe JSON parser for localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not persist ${key} to localStorage:`, e);
  }
}

// Check if backend API is reachable
let isBackendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const res = await fetch('/api/network', { signal: AbortSignal.timeout(2000) });
    isBackendAvailable = res.ok;
    return res.ok;
  } catch {
    isBackendAvailable = false;
    return false;
  }
}

// Generate random hex string
function randomHex(bytes: number = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return '0x' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const ApiClient = {
  async getInitialState(currentRole: UserRole): Promise<{
    session: UserSession;
    accounts: AccountProfile[];
    dids: DIDRecord[];
    assets: Asset[];
    logs: AuditLog[];
    blockHeight: number;
  }> {
    const backendOnline = await checkBackend();

    if (backendOnline) {
      try {
        const [sessionRes, didsRes, assetsRes, logsRes, networkRes] = await Promise.all([
          fetch('/api/auth/session', { headers: { 'x-blockvault-role': currentRole } }),
          fetch('/api/dids', { headers: { 'x-blockvault-role': currentRole } }),
          fetch('/api/assets', { headers: { 'x-blockvault-role': currentRole } }),
          fetch('/api/audit-logs', { headers: { 'x-blockvault-role': currentRole } }),
          fetch('/api/network'),
        ]);

        if (sessionRes.ok && didsRes.ok && assetsRes.ok && logsRes.ok) {
          const sessionData = await sessionRes.json();
          const didsData = await didsRes.json();
          const assetsData = await assetsRes.json();
          const logsData = await logsRes.json();
          const networkData = networkRes.ok ? await networkRes.json() : { blockHeight: 1042 };

          return {
            session: sessionData.session,
            accounts: sessionData.preconfiguredAccounts || SEED_ACCOUNTS,
            dids: didsData.dids || [],
            assets: assetsData.assets || [],
            logs: logsData.logs || [],
            blockHeight: networkData.blockHeight || 1042,
          };
        }
      } catch (err) {
        console.warn('Backend query failed, switching to local client engine:', err);
        isBackendAvailable = false;
      }
    }

    // Client-Side Simulation fallback for GitHub Pages
    const accounts = SEED_ACCOUNTS;
    const activeAccount = accounts.find((a) => a.role === currentRole) || accounts[0];
    const dids = loadFromStorage<DIDRecord[]>(STORAGE_KEYS.DIDS, SEED_DIDS);
    const assets = loadFromStorage<Asset[]>(STORAGE_KEYS.ASSETS, SEED_ASSETS);
    const logs = loadFromStorage<AuditLog[]>(STORAGE_KEYS.LOGS, SEED_LOGS);
    const blockHeight = loadFromStorage<number>(STORAGE_KEYS.BLOCK_HEIGHT, 1042);

    return {
      session: {
        token: 'local-session-token',
        walletAddress: activeAccount.walletAddress,
        did: activeAccount.did,
        displayName: activeAccount.name,
        role: activeAccount.role,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      },
      accounts,
      dids,
      assets,
      logs,
      blockHeight,
    };
  },

  async switchRole(newRole: UserRole): Promise<{ success: boolean; account: AccountProfile }> {
    const backendOnline = await checkBackend();
    if (backendOnline) {
      try {
        const res = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch {
        isBackendAvailable = false;
      }
    }

    const account = SEED_ACCOUNTS.find((a) => a.role === newRole) || SEED_ACCOUNTS[0];
    return { success: true, account };
  },

  async updateDIDStatus(
    targetDid: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    currentRole: UserRole
  ): Promise<{ success: boolean; txHash: string }> {
    const backendOnline = await checkBackend();
    if (backendOnline) {
      try {
        const res = await fetch(`/api/dids/${encodeURIComponent(targetDid)}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-blockvault-role': currentRole,
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        isBackendAvailable = false;
      }
    }

    // Local client update
    const dids = loadFromStorage<DIDRecord[]>(STORAGE_KEYS.DIDS, SEED_DIDS);
    const updated = dids.map((d) => (d.did === targetDid ? { ...d, status, updatedAt: Date.now() } : d));
    saveToStorage(STORAGE_KEYS.DIDS, updated);

    const txHash = randomHex(32);
    this.addLocalAuditLog('DID_STATUS_UPDATE', targetDid, `Status updated to ${status}`, txHash, currentRole);
    return { success: true, txHash };
  },

  async assignRole(
    targetDid: string,
    newRole: UserRole,
    currentRole: UserRole
  ): Promise<{ success: boolean; txHash: string }> {
    const backendOnline = await checkBackend();
    if (backendOnline) {
      try {
        const res = await fetch('/api/roles/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-blockvault-role': currentRole,
          },
          body: JSON.stringify({ targetDID: targetDid, newRole }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        isBackendAvailable = false;
      }
    }

    const dids = loadFromStorage<DIDRecord[]>(STORAGE_KEYS.DIDS, SEED_DIDS);
    const updated = dids.map((d) => (d.did === targetDid ? { ...d, role: newRole, updatedAt: Date.now() } : d));
    saveToStorage(STORAGE_KEYS.DIDS, updated);

    const txHash = randomHex(32);
    this.addLocalAuditLog('ROLE_ASSIGNMENT', targetDid, `Role updated to ${newRole}`, txHash, currentRole);
    return { success: true, txHash };
  },

  addLocalAuditLog(actionType: string, targetIdentifier: string, details: string, txHash: string, role: UserRole) {
    const logs = loadFromStorage<AuditLog[]>(STORAGE_KEYS.LOGS, SEED_LOGS);
    const blockHeight = loadFromStorage<number>(STORAGE_KEYS.BLOCK_HEIGHT, 1042) + 1;
    saveToStorage(STORAGE_KEYS.BLOCK_HEIGHT, blockHeight);

    const account = SEED_ACCOUNTS.find((a) => a.role === role) || SEED_ACCOUNTS[0];

    const newLog: AuditLog = {
      id: logs.length + 1,
      actionType,
      actorDID: account.did,
      actorWallet: account.walletAddress,
      targetIdentifier,
      details,
      cryptographicProof: txHash,
      timestamp: Date.now(),
      blockNumber: blockHeight,
      txHash,
    };

    logs.unshift(newLog);
    saveToStorage(STORAGE_KEYS.LOGS, logs);
  },
};
