import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_DIR = path.join(DATA_DIR, 'encrypted_vault');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

export interface StoredAsset {
  id: string;             // UUID or BEL-ASSET-XXX
  name: string;
  description: string;
  assetType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string;
  encryptedFilePath: string;
  ivHex: string;
  authTagHex: string;
  metadataURI: string;
  tokenId: number;
  ownerDID: string;
  ownerWallet: string;
  createdAt: number;
  updatedAt: number;
  status: 'ACTIVE' | 'TRANSFERRED' | 'REVOKED' | 'ARCHIVED';
  confidentialityLevel: 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'RESTRICTED';
}

export interface UserSession {
  token: string;
  walletAddress: string;
  did: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER';
  createdAt: number;
  expiresAt: number;
}

export interface RoleConfig {
  role: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER';
  description: string;
  permissions: string[];
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  ADMIN: {
    role: 'ADMIN',
    description: 'System Administrator with full management and cryptographic minting authority',
    permissions: [
      'CREATE_IDENTITY',
      'REGISTER_DID',
      'VERIFY_IDENTITY',
      'DEACTIVATE_IDENTITY',
      'ASSIGN_ROLE',
      'REVOKE_ROLE',
      'MINT_NFT',
      'ALLOCATE_ASSET',
      'TRANSFER_ASSET',
      'GRANT_PERMISSIONS',
      'REVOKE_PERMISSIONS',
      'VIEW_ALL_ASSETS',
      'VIEW_ALL_AUDIT_LOGS',
      'MANAGE_CONFIGURATION',
      'DOWNLOAD_ALL_ASSETS',
      'VERIFY_INTEGRITY',
    ],
  },
  MANAGER: {
    role: 'MANAGER',
    description: 'Project & Asset Operations Manager (e.g. Radar Systems, Avionics)',
    permissions: [
      'VIEW_AUTHORIZED_USERS',
      'VIEW_AUTHORIZED_ASSETS',
      'MANAGE_ASSIGNED_ASSETS',
      'TRANSFER_OWN_ASSET',
      'ALLOCATE_TEAM_ASSET',
      'VIEW_RELEVANT_AUDIT_HISTORY',
      'DOWNLOAD_ASSIGNED_ASSET',
      'VERIFY_INTEGRITY',
    ],
  },
  AUDITOR: {
    role: 'AUDITOR',
    description: 'Independent Cyber & Quality Assurance Auditor (Read-only + Verification)',
    permissions: [
      'VIEW_IDENTITIES',
      'VIEW_ASSET_OWNERSHIP',
      'VERIFY_ASSET_AUTHENTICITY',
      'VERIFY_HASHES',
      'VIEW_BLOCKCHAIN_TRANSACTIONS',
      'VIEW_ALL_AUDIT_LOGS',
      'EXPORT_AUDIT_REPORTS',
      'RUN_SECURITY_ANALYTICS',
      'VERIFY_INTEGRITY',
    ],
  },
  USER: {
    role: 'USER',
    description: 'Standard Authenticated Engineer / Defense Personnel',
    permissions: [
      'VIEW_OWN_IDENTITY',
      'VIEW_OWN_DID',
      'VIEW_AUTHORIZED_ASSETS',
      'VIEW_OWN_NFT_OWNERSHIP',
      'VIEW_ALLOWED_RESOURCES',
      'REQUEST_PERMITTED_ACTIONS',
      'VIEW_PERSONAL_ACTIVITY_HISTORY',
      'DOWNLOAD_OWN_ASSET',
      'VERIFY_INTEGRITY',
    ],
  },
};

interface DatabaseSchema {
  assets: StoredAsset[];
  sessions: UserSession[];
  nonces: Record<string, { nonce: string; timestamp: number; address: string }>;
}

class LocalPostgresDbStore {
  private db: DatabaseSchema = {
    assets: [],
    sessions: [],
    nonces: {},
  };

  constructor() {
    this.load();
    if (this.db.assets.length === 0) {
      this.seedInitial();
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load db.json, using in-memory state', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save db.json', e);
    }
  }

  private seedInitial() {
    // Seed sample stored assets with encrypted storage
    const initialAssets: StoredAsset[] = [
      {
        id: 'BEL-RADAR-SPEC-001',
        name: 'Coastal Surveillance Radar (CSR) Mark-IV Technical Spec',
        description: 'Confidential architecture documentation for high-resolution maritime coastal radar tracking array.',
        assetType: 'Engineering Specification',
        fileName: 'CSR_MarkIV_Technical_Spec.pdf',
        fileSize: 418290,
        mimeType: 'application/pdf',
        sha256Hash: '0x7e83b27b38d35e16b9b3e157795ecda9895c1c4f5cdad3d39589d6e408ec2159',
        encryptedFilePath: path.join(VAULT_DIR, 'BEL-RADAR-SPEC-001.enc'),
        ivHex: '4a8b1c9d2e3f4a5b6c7d8e9f',
        authTagHex: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
        metadataURI: 'ipfs://bafybeicwz2u5f4u6c5b5n6m7k8j9h0g1f2d3s4a5p',
        tokenId: 1,
        ownerDID: 'did:blockvault:0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
        ownerWallet: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        status: 'ACTIVE',
        confidentialityLevel: 'SECRET',
      },
      {
        id: 'BEL-FIRMWARE-AUTH-002',
        name: 'Tactical Radio Frequency Firmware Image v4.2.1',
        description: 'Cryptographically signed binary integrity checksum and authorization ticket for field SDR deployment.',
        assetType: 'Firmware Authorization',
        fileName: 'SDR_Tactical_Firmware_v4.2.1.bin',
        fileSize: 1048576,
        mimeType: 'application/octet-stream',
        sha256Hash: '0x15354fb22c2a050519a77ddbb7c040d705c74eb5f77fa8f607d73fbca5fa2cfd',
        encryptedFilePath: path.join(VAULT_DIR, 'BEL-FIRMWARE-AUTH-002.enc'),
        ivHex: '3b7c8d9e0f1a2b3c4d5e6f7a',
        authTagHex: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
        metadataURI: 'ipfs://bafybeih6m7n8b9v0c1x2z3a4s5d6f7g8h9j0k1l2p',
        tokenId: 2,
        ownerDID: 'did:blockvault:0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        ownerWallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        createdAt: Date.now() - 86400000 * 1.5,
        updatedAt: Date.now() - 86400000 * 1.5,
        status: 'ACTIVE',
        confidentialityLevel: 'TOP_SECRET',
      },
      {
        id: 'BEL-BLUEPRINT-OPT-003',
        name: 'Electro-Optic Fire Control Subsystem CAD Blueprint',
        description: 'High-precision opto-electronic targeting system schematics for naval surface combatants.',
        assetType: 'Design Blueprint',
        fileName: 'EO_FireControl_Naval_Schematic.dwg',
        fileSize: 2097152,
        mimeType: 'application/acad',
        sha256Hash: '0x627341e3d6f46a782b6b553adcf3072fdfce0a9f5d344ec3c2e646f9038221ad',
        encryptedFilePath: path.join(VAULT_DIR, 'BEL-BLUEPRINT-OPT-003.enc'),
        ivHex: '8c9d0e1f2a3b4c5d6e7f8a9b',
        authTagHex: '5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a',
        metadataURI: 'ipfs://bafybeid9k8j7h6g5f4d3s2a1p0o9i8u7y6t5r4e3w',
        tokenId: 3,
        ownerDID: 'did:blockvault:0x71A9B6a5240212f4585B1741E0fF7a76c8D2592F',
        ownerWallet: '0x71A9B6a5240212f4585B1741E0fF7a76c8D2592F',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        status: 'ACTIVE',
        confidentialityLevel: 'SECRET',
      },
      {
        id: 'BEL-CERT-COMPLIANCE-004',
        name: 'MoD Airworthiness & Cryptographic Compliance Cert',
        description: 'Official Ministry of Defence cyber assurance verification certificate.',
        assetType: 'Compliance Certificate',
        fileName: 'MoD_Cyber_Assurance_Cert_2026.pdf',
        fileSize: 154200,
        mimeType: 'application/pdf',
        sha256Hash: '0x32f1a6628ef371b69f697475d40cb97213ee84dc096a15ca4df8f4a61ffbcaee',
        encryptedFilePath: path.join(VAULT_DIR, 'BEL-CERT-COMPLIANCE-004.enc'),
        ivHex: '1e2f3a4b5c6d7e8f9a0b1c2d',
        authTagHex: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
        metadataURI: 'ipfs://bafybeif1o2p3a4s5d6f7g8h9j0k1l2z3x4c5v6b7n',
        tokenId: 4,
        ownerDID: 'did:blockvault:0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        ownerWallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        createdAt: Date.now() - 86400000 * 0.5,
        updatedAt: Date.now() - 86400000 * 0.5,
        status: 'ACTIVE',
        confidentialityLevel: 'CONFIDENTIAL',
      },
    ];

    this.db.assets = initialAssets;
    this.save();
  }

  // Assets
  public getAssets(): StoredAsset[] {
    return this.db.assets;
  }

  public getAsset(id: string): StoredAsset | undefined {
    return this.db.assets.find((a) => a.id === id || String(a.tokenId) === id);
  }

  public addAsset(asset: StoredAsset): StoredAsset {
    this.db.assets.unshift(asset);
    this.save();
    return asset;
  }

  public updateAsset(id: string, updates: Partial<StoredAsset>): StoredAsset | undefined {
    const asset = this.db.assets.find((a) => a.id === id || String(a.tokenId) === id);
    if (!asset) return undefined;
    Object.assign(asset, updates, { updatedAt: Date.now() });
    this.save();
    return asset;
  }

  // Nonces for wallet challenges
  public setNonce(address: string, nonce: string) {
    this.db.nonces[address.toLowerCase()] = {
      nonce,
      timestamp: Date.now(),
      address,
    };
    this.save();
  }

  public getNonce(address: string): string | undefined {
    const record = this.db.nonces[address.toLowerCase()];
    if (!record) return undefined;
    // 10 minutes expiry
    if (Date.now() - record.timestamp > 600000) {
      delete this.db.nonces[address.toLowerCase()];
      this.save();
      return undefined;
    }
    return record.nonce;
  }

  public removeNonce(address: string) {
    delete this.db.nonces[address.toLowerCase()];
    this.save();
  }

  // Sessions
  public setSession(session: UserSession) {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== session.token);
    this.db.sessions.push(session);
    this.save();
  }

  public getSession(token: string): UserSession | undefined {
    const s = this.db.sessions.find((session) => session.token === token);
    if (!s) return undefined;
    if (Date.now() > s.expiresAt) {
      this.db.sessions = this.db.sessions.filter((x) => x.token !== token);
      this.save();
      return undefined;
    }
    return s;
  }

  public removeSession(token: string) {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
    this.save();
  }
}

export const dbStore = new LocalPostgresDbStore();
export { VAULT_DIR };
