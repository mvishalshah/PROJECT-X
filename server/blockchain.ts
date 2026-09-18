import crypto from 'crypto';
import { ethers } from 'ethers';
import { sha256 } from './crypto.js';

export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  contract: string;
  method: string;
  inputParams: Record<string, any>;
  gasUsed: number;
  timestamp: number;
  status: 'SUCCESS' | 'REVERTED';
  logs: BlockchainLog[];
}

export interface BlockchainLog {
  event: string;
  contract: string;
  data: Record<string, any>;
  transactionHash: string;
  blockNumber: number;
}

export interface OnChainAsset {
  tokenId: number;
  assetId: string;
  assetName: string;
  assetType: string;
  fileHash: string; // SHA-256 hex with 0x
  metadataURI: string;
  ownerDID: string;
  ownerWallet: string;
  createdAt: number;
  status: 'ACTIVE' | 'TRANSFERRED' | 'ARCHIVED' | 'REVOKED';
  mintTxHash: string;
}

export interface OnChainDID {
  did: string;
  walletAddress: string;
  publicKeyHex: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: number;
  updatedAt: number;
  isVerified: boolean;
  registrationTxHash: string;
}

export interface OnChainAuditRecord {
  id: number;
  actionType: string;
  actorDID: string;
  actorWallet: string;
  targetIdentifier: string;
  details: string;
  cryptographicProof: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  statusSuccess: boolean;
}

// Pre-seeded authentic EVM accounts for Bharat Electronics Limited (BEL)
export const DEFAULT_ACCOUNTS = [
  {
    role: 'ADMIN' as const,
    name: 'Dr. Rajesh Sharma',
    designation: 'Chief Information Security Officer (CISO)',
    organization: 'Bharat Electronics Limited',
    walletAddress: '0x71A9B6a5240212f4585B1741E0fF7a76c8D2592F',
    publicKey: '04a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    privateKey: '0x0123456789012345678901234567890123456789012345678901234567890123',
    did: 'did:blockvault:0x71A9B6a5240212f4585B1741E0fF7a76c8D2592F',
  },
  {
    role: 'MANAGER' as const,
    name: 'Priya Verma',
    designation: 'Defense Radar Systems Project Lead',
    organization: 'Bharat Electronics Limited',
    walletAddress: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    publicKey: '04b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
    privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
    did: 'did:blockvault:0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
  },
  {
    role: 'AUDITOR' as const,
    name: 'Col. Amit Sengupta',
    designation: 'Defense Cyber Agency / QA Auditor',
    organization: 'Ministry of Defence, Govt of India',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    publicKey: '04c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012',
    privateKey: '0x2345678901234567890123456789012345678901234567890123456789012345',
    did: 'did:blockvault:0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
  {
    role: 'USER' as const,
    name: 'Vikram Joshi',
    designation: 'Senior Avionics Hardware Engineer',
    organization: 'Bharat Electronics Limited',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    publicKey: '04d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123',
    privateKey: '0x3456789012345678901234567890123456789012345678901234567890123456',
    did: 'did:blockvault:0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  },
];

export const CONTRACT_ADDRESSES = {
  DIDRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  RBAC: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  AssetNFT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  AuditLedger: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};

class BlockchainNetwork {
  private blockHeight: number = 1042;
  private transactions: BlockchainTransaction[] = [];
  private onChainAssets: Map<number, OnChainAsset> = new Map();
  private onChainDIDs: Map<string, OnChainDID> = new Map();
  private auditRecords: OnChainAuditRecord[] = [];
  private tokenCounter: number = 0;

  constructor() {
    this.seedInitialState();
  }

  private seedInitialState() {
    // Register pre-seeded DIDs on-chain
    for (const acc of DEFAULT_ACCOUNTS) {
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      this.blockHeight += 1;
      const didRecord: OnChainDID = {
        did: acc.did,
        walletAddress: acc.walletAddress,
        publicKeyHex: acc.publicKey,
        displayName: acc.name,
        role: acc.role,
        status: 'ACTIVE',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
        isVerified: true,
        registrationTxHash: txHash,
      };
      this.onChainDIDs.set(acc.did, didRecord);

      this.transactions.push({
        hash: txHash,
        blockNumber: this.blockHeight,
        from: CONTRACT_ADDRESSES.DIDRegistry,
        to: acc.walletAddress,
        contract: 'BlockVaultDIDRegistry',
        method: 'registerDID',
        inputParams: { did: acc.did, wallet: acc.walletAddress, role: acc.role },
        gasUsed: 84210,
        timestamp: didRecord.createdAt,
        status: 'SUCCESS',
        logs: [
          {
            event: 'DIDRegistered',
            contract: 'BlockVaultDIDRegistry',
            data: { did: acc.did, wallet: acc.walletAddress, role: acc.role },
            transactionHash: txHash,
            blockNumber: this.blockHeight,
          },
        ],
      });

      this.auditRecords.push({
        id: this.auditRecords.length + 1,
        actionType: 'IDENTITY_REGISTER',
        actorDID: 'did:blockvault:system:root',
        actorWallet: CONTRACT_ADDRESSES.DIDRegistry,
        targetIdentifier: acc.did,
        details: `Registered decentralized identity for ${acc.name} (${acc.role})`,
        cryptographicProof: txHash,
        timestamp: didRecord.createdAt,
        blockNumber: this.blockHeight,
        txHash,
        statusSuccess: true,
      });
    }

    // Seed Initial Assets for Bharat Electronics Limited
    const seedAssets = [
      {
        assetId: 'BEL-RADAR-SPEC-001',
        assetName: 'Coastal Surveillance Radar (CSR) Mark-IV Technical Spec',
        assetType: 'Engineering Specification',
        rawText: 'CONFIDENTIAL: Bharat Electronics Limited Coastal Surveillance Radar System architecture, frequency hopping matrix, and secure transmitter specs.',
        ownerRole: 'MANAGER' as const,
        description: 'Classified architecture documentation for high-resolution maritime coastal radar tracking array.',
      },
      {
        assetId: 'BEL-FIRMWARE-AUTH-002',
        assetName: 'Tactical Radio Frequency Firmware Image v4.2.1',
        assetType: 'Firmware Authorization',
        rawText: 'CRYPTOGRAPHIC CERTIFICATE: Secure boot firmware release signed with SHA-256 for SDR-Tactical battlefield radio units.',
        ownerRole: 'USER' as const,
        description: 'Cryptographically signed binary integrity checksum and authorization ticket for field SDR deployment.',
      },
      {
        assetId: 'BEL-BLUEPRINT-OPT-003',
        assetName: 'Electro-Optic Fire Control Subsystem CAD Blueprint',
        assetType: 'Design Blueprint',
        rawText: 'DEFENSE BLUEPRINT: Mechanical mount tolerances, thermal imaging sensor schematic and gimbal synchronization logic.',
        ownerRole: 'ADMIN' as const,
        description: 'High-precision opto-electronic targeting system schematics for naval surface combatants.',
      },
      {
        assetId: 'BEL-CERT-COMPLIANCE-004',
        assetName: 'MoD Airworthiness & Cryptographic Compliance Cert',
        assetType: 'Compliance Certificate',
        rawText: 'GOVERNMENT OF INDIA - MoD: Certified tamper-proof security audit adherence for airborne radar transponder payload.',
        ownerRole: 'AUDITOR' as const,
        description: 'Official Ministry of Defence cyber assurance verification certificate.',
      },
    ];

    for (const sa of seedAssets) {
      const ownerAcc = DEFAULT_ACCOUNTS.find((a) => a.role === sa.ownerRole) || DEFAULT_ACCOUNTS[0];
      const fileHash = `0x${sha256(sa.rawText)}`;
      this.mintNFTInternal(
        sa.assetId,
        sa.assetName,
        sa.assetType,
        fileHash,
        `ipfs://bafybeic${crypto.randomBytes(16).toString('hex')}`,
        ownerAcc.did,
        ownerAcc.walletAddress,
        DEFAULT_ACCOUNTS[0].walletAddress // Admin minted
      );
    }
  }

  public getBlockHeight(): number {
    return this.blockHeight;
  }

  public getRecentTransactions(limit = 15): BlockchainTransaction[] {
    return [...this.transactions].reverse().slice(0, limit);
  }

  public getAuditRecords(): OnChainAuditRecord[] {
    return [...this.auditRecords].reverse();
  }

  public getDIDs(): OnChainDID[] {
    return Array.from(this.onChainDIDs.values());
  }

  public getDID(did: string): OnChainDID | undefined {
    return this.onChainDIDs.get(did);
  }

  public getDIDByWallet(walletAddress: string): OnChainDID | undefined {
    const clean = walletAddress.toLowerCase();
    return Array.from(this.onChainDIDs.values()).find(
      (d) => d.walletAddress.toLowerCase() === clean
    );
  }

  public getAssets(): OnChainAsset[] {
    return Array.from(this.onChainAssets.values()).sort((a, b) => b.tokenId - a.tokenId);
  }

  public getAssetByTokenId(tokenId: number): OnChainAsset | undefined {
    return this.onChainAssets.get(tokenId);
  }

  public getAssetById(assetId: string): OnChainAsset | undefined {
    return Array.from(this.onChainAssets.values()).find((a) => a.assetId === assetId);
  }

  /**
   * Internal minting helper
   */
  private mintNFTInternal(
    assetId: string,
    assetName: string,
    assetType: string,
    fileHash: string,
    metadataURI: string,
    ownerDID: string,
    ownerWallet: string,
    callerWallet: string
  ): OnChainAsset {
    this.tokenCounter += 1;
    this.blockHeight += 1;
    const tokenId = this.tokenCounter;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const timestamp = Date.now();

    const asset: OnChainAsset = {
      tokenId,
      assetId,
      assetName,
      assetType,
      fileHash,
      metadataURI,
      ownerDID,
      ownerWallet,
      createdAt: timestamp,
      status: 'ACTIVE',
      mintTxHash: txHash,
    };

    this.onChainAssets.set(tokenId, asset);

    this.transactions.push({
      hash: txHash,
      blockNumber: this.blockHeight,
      from: callerWallet,
      to: CONTRACT_ADDRESSES.AssetNFT,
      contract: 'BlockVaultAssetNFT',
      method: 'mintAsset',
      inputParams: { tokenId, assetId, fileHash, ownerDID, ownerWallet },
      gasUsed: 142850,
      timestamp,
      status: 'SUCCESS',
      logs: [
        {
          event: 'AssetMinted',
          contract: 'BlockVaultAssetNFT',
          data: { tokenId, assetId, fileHash, ownerDID, ownerWallet },
          transactionHash: txHash,
          blockNumber: this.blockHeight,
        },
      ],
    });

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'NFT_MINT',
      actorDID: this.getDIDByWallet(callerWallet)?.did || 'did:blockvault:unknown',
      actorWallet: callerWallet,
      targetIdentifier: `Token #${tokenId} (${assetId})`,
      details: `Minted ERC-721 NFT for asset "${assetName}" with SHA-256 fingerprint ${fileHash}`,
      cryptographicProof: txHash,
      timestamp,
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: true,
    });

    return asset;
  }

  /**
   * Authorized NFT Minting
   * Requirement: Only ADMIN should be able to mint NFTs. Smart contract must enforce: onlyAuthorizedAdmin can mint.
   */
  public mintAssetNFT(
    assetId: string,
    assetName: string,
    assetType: string,
    fileHash: string,
    metadataURI: string,
    ownerDID: string,
    ownerWallet: string,
    callerWallet: string,
    callerRole: string
  ): { success: boolean; asset?: OnChainAsset; error?: string; txHash?: string } {
    // Smart Contract RBAC verification
    if (callerRole !== 'ADMIN') {
      const errTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      this.blockHeight += 1;
      this.transactions.push({
        hash: errTxHash,
        blockNumber: this.blockHeight,
        from: callerWallet,
        to: CONTRACT_ADDRESSES.AssetNFT,
        contract: 'BlockVaultAssetNFT',
        method: 'mintAsset',
        inputParams: { assetId, fileHash },
        gasUsed: 21000,
        timestamp: Date.now(),
        status: 'REVERTED',
        logs: [],
      });

      this.auditRecords.push({
        id: this.auditRecords.length + 1,
        actionType: 'NFT_MINT',
        actorDID: this.getDIDByWallet(callerWallet)?.did || 'did:blockvault:unauthorized',
        actorWallet: callerWallet,
        targetIdentifier: assetId,
        details: `REVERTED: Unauthorized NFT mint attempt by role "${callerRole}". Only ADMIN role can mint NFTs.`,
        cryptographicProof: errTxHash,
        timestamp: Date.now(),
        blockNumber: this.blockHeight,
        txHash: errTxHash,
        statusSuccess: false,
      });

      return {
        success: false,
        error: 'Smart Contract Error: BlockVaultAssetNFT: onlyAuthorizedAdmin can mint or manage assets',
        txHash: errTxHash,
      };
    }

    const asset = this.mintNFTInternal(
      assetId,
      assetName,
      assetType,
      fileHash,
      metadataURI,
      ownerDID,
      ownerWallet,
      callerWallet
    );

    return { success: true, asset, txHash: asset.mintTxHash };
  }

  /**
   * Transfer Asset Ownership on-chain
   */
  public transferAssetNFT(
    tokenId: number,
    toWallet: string,
    toDID: string,
    callerWallet: string,
    callerRole: string,
    reason: string
  ): { success: boolean; error?: string; txHash?: string } {
    const asset = this.onChainAssets.get(tokenId);
    if (!asset) {
      return { success: false, error: 'Asset NFT not found on blockchain' };
    }

    // RBAC: Only Admin or the current asset owner can transfer
    const isOwner = asset.ownerWallet.toLowerCase() === callerWallet.toLowerCase();
    const isAdmin = callerRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Unauthorized: Only the NFT owner or an authorized ADMIN can transfer asset ownership',
      };
    }

    this.blockHeight += 1;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const previousOwner = asset.ownerWallet;
    const previousDID = asset.ownerDID;

    asset.ownerWallet = toWallet;
    asset.ownerDID = toDID;
    asset.status = 'TRANSFERRED';

    this.transactions.push({
      hash: txHash,
      blockNumber: this.blockHeight,
      from: callerWallet,
      to: CONTRACT_ADDRESSES.AssetNFT,
      contract: 'BlockVaultAssetNFT',
      method: 'transferAsset',
      inputParams: { tokenId, toWallet, toDID, reason },
      gasUsed: 98450,
      timestamp: Date.now(),
      status: 'SUCCESS',
      logs: [
        {
          event: 'OwnershipTransferred',
          contract: 'BlockVaultAssetNFT',
          data: { tokenId, previousOwner, newOwner: toWallet, toDID, reason },
          transactionHash: txHash,
          blockNumber: this.blockHeight,
        },
      ],
    });

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'OWNERSHIP_TRANSFER',
      actorDID: this.getDIDByWallet(callerWallet)?.did || callerWallet,
      actorWallet: callerWallet,
      targetIdentifier: `Token #${tokenId} (${asset.assetId})`,
      details: `Transferred ownership from ${previousDID} to ${toDID}. Reason: ${reason}`,
      cryptographicProof: txHash,
      timestamp: Date.now(),
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: true,
    });

    return { success: true, txHash };
  }

  /**
   * Register Decentralized Identity (DID) on-chain
   */
  public registerDID(
    did: string,
    walletAddress: string,
    publicKeyHex: string,
    displayName: string,
    role: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER',
    callerWallet: string,
    callerRole: string
  ): { success: boolean; didRecord?: OnChainDID; error?: string; txHash?: string } {
    if (callerRole !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only ADMIN can register new decentralized identities' };
    }

    if (this.onChainDIDs.has(did)) {
      return { success: false, error: 'DID already registered on-chain' };
    }

    this.blockHeight += 1;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const timestamp = Date.now();

    const didRecord: OnChainDID = {
      did,
      walletAddress,
      publicKeyHex,
      displayName,
      role,
      status: 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
      isVerified: true,
      registrationTxHash: txHash,
    };

    this.onChainDIDs.set(did, didRecord);

    this.transactions.push({
      hash: txHash,
      blockNumber: this.blockHeight,
      from: callerWallet,
      to: CONTRACT_ADDRESSES.DIDRegistry,
      contract: 'BlockVaultDIDRegistry',
      method: 'registerDID',
      inputParams: { did, walletAddress, role },
      gasUsed: 78900,
      timestamp,
      status: 'SUCCESS',
      logs: [
        {
          event: 'DIDRegistered',
          contract: 'BlockVaultDIDRegistry',
          data: { did, wallet: walletAddress, role },
          transactionHash: txHash,
          blockNumber: this.blockHeight,
        },
      ],
    });

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'IDENTITY_REGISTER',
      actorDID: this.getDIDByWallet(callerWallet)?.did || callerWallet,
      actorWallet: callerWallet,
      targetIdentifier: did,
      details: `Registered on-chain DID for ${displayName} with role ${role}`,
      cryptographicProof: txHash,
      timestamp,
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: true,
    });

    return { success: true, didRecord, txHash };
  }

  /**
   * Update DID Status (Active, Suspended, Deactivated)
   */
  public updateDIDStatus(
    did: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    callerWallet: string,
    callerRole: string
  ): { success: boolean; error?: string; txHash?: string } {
    if (callerRole !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only ADMIN can change DID lifecycle status' };
    }

    const didRecord = this.onChainDIDs.get(did);
    if (!didRecord) {
      return { success: false, error: 'DID record not found' };
    }

    this.blockHeight += 1;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    didRecord.status = status;
    didRecord.updatedAt = Date.now();

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'IDENTITY_UPDATE',
      actorDID: this.getDIDByWallet(callerWallet)?.did || callerWallet,
      actorWallet: callerWallet,
      targetIdentifier: did,
      details: `Updated DID status to ${status}`,
      cryptographicProof: txHash,
      timestamp: Date.now(),
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: true,
    });

    return { success: true, txHash };
  }

  /**
   * Assign or Update Role (Admin only)
   */
  public assignRole(
    targetDID: string,
    newRole: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER',
    callerWallet: string,
    callerRole: string
  ): { success: boolean; error?: string; txHash?: string } {
    if (callerRole !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Only ADMIN can assign or update roles' };
    }

    const didRecord = this.onChainDIDs.get(targetDID);
    if (!didRecord) {
      return { success: false, error: 'DID not found' };
    }

    const previousRole = didRecord.role;
    didRecord.role = newRole;
    didRecord.updatedAt = Date.now();

    this.blockHeight += 1;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'ROLE_ASSIGNMENT',
      actorDID: this.getDIDByWallet(callerWallet)?.did || callerWallet,
      actorWallet: callerWallet,
      targetIdentifier: targetDID,
      details: `Changed role from ${previousRole} to ${newRole}`,
      cryptographicProof: txHash,
      timestamp: Date.now(),
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: true,
    });

    return { success: true, txHash };
  }

  /**
   * Security Verification: Compares test SHA-256 hash against on-chain anchored hash
   */
  public verifyAssetIntegrity(
    assetIdentifier: string,
    calculatedHash: string,
    callerWallet?: string
  ): {
    isAuthentic: boolean;
    asset?: OnChainAsset;
    onChainHash?: string;
    calculatedHash: string;
    blockNumber: number;
    timestamp: number;
    txHash: string;
    message: string;
  } {
    this.blockHeight += 1;
    const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const timestamp = Date.now();

    // Look up by assetId or tokenId
    let asset: OnChainAsset | undefined;
    if (assetIdentifier.startsWith('Token #')) {
      const id = parseInt(assetIdentifier.replace('Token #', '').trim());
      asset = this.onChainAssets.get(id);
    } else {
      asset = this.getAssetById(assetIdentifier);
    }

    if (!asset) {
      // Check if hash matches any asset on chain
      const cleanCalculated = calculatedHash.toLowerCase().startsWith('0x')
        ? calculatedHash.toLowerCase()
        : `0x${calculatedHash.toLowerCase()}`;

      asset = Array.from(this.onChainAssets.values()).find(
        (a) => a.fileHash.toLowerCase() === cleanCalculated
      );
    }

    if (!asset) {
      this.auditRecords.push({
        id: this.auditRecords.length + 1,
        actionType: 'SECURITY_VERIFICATION',
        actorDID: callerWallet ? this.getDIDByWallet(callerWallet)?.did || callerWallet : 'did:blockvault:verifier',
        actorWallet: callerWallet || '0x0000000000000000000000000000000000000000',
        targetIdentifier: assetIdentifier || calculatedHash,
        details: `INTEGRITY VERIFICATION FAILED: Hash ${calculatedHash} is NOT anchored in any registered BlockVault smart contract.`,
        cryptographicProof: txHash,
        timestamp,
        blockNumber: this.blockHeight,
        txHash,
        statusSuccess: false,
      });

      return {
        isAuthentic: false,
        calculatedHash,
        blockNumber: this.blockHeight,
        timestamp,
        txHash,
        message: 'TAMPERED / UNREGISTERED: Hash was not found in on-chain smart contract registry.',
      };
    }

    const cleanOnChain = asset.fileHash.toLowerCase();
    const cleanCalc = calculatedHash.toLowerCase().startsWith('0x')
      ? calculatedHash.toLowerCase()
      : `0x${calculatedHash.toLowerCase()}`;

    const isAuthentic = cleanOnChain === cleanCalc;

    this.auditRecords.push({
      id: this.auditRecords.length + 1,
      actionType: 'SECURITY_VERIFICATION',
      actorDID: callerWallet ? this.getDIDByWallet(callerWallet)?.did || callerWallet : 'did:blockvault:verifier',
      actorWallet: callerWallet || '0x0000000000000000000000000000000000000000',
      targetIdentifier: asset.assetId,
      details: isAuthentic
        ? `VERIFIED: Asset "${asset.assetName}" cryptographic SHA-256 matches blockchain anchor (${cleanCalc}).`
        : `TAMPER DETECTED: Asset "${asset.assetName}" calculated SHA-256 (${cleanCalc}) does NOT match on-chain hash (${cleanOnChain}).`,
      cryptographicProof: txHash,
      timestamp,
      blockNumber: this.blockHeight,
      txHash,
      statusSuccess: isAuthentic,
    });

    return {
      isAuthentic,
      asset,
      onChainHash: asset.fileHash,
      calculatedHash,
      blockNumber: this.blockHeight,
      timestamp,
      txHash,
      message: isAuthentic
        ? 'VERIFIED & AUTHENTIC: Cryptographic SHA-256 fingerprint matches immutable blockchain record.'
        : 'TAMPER DETECTED: File content has been modified or corrupted! Hashes do not match.',
    };
  }
}

export const blockchain = new BlockchainNetwork();
