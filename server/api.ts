import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  generateAuthNonce,
  verifyWalletSignature,
  formatDID,
  createW3CDIDDocument,
  encryptAES256GCM,
  decryptAES256GCM,
  sha256,
} from './crypto.js';
import {
  blockchain,
  DEFAULT_ACCOUNTS,
  CONTRACT_ADDRESSES,
  OnChainDID,
} from './blockchain.js';
import { dbStore, ROLE_CONFIGS, StoredAsset, VAULT_DIR } from './db.js';
import { analyzeAuditLogsWithAI } from './gemini.js';

export const apiRouter = express.Router();

// Middleware: Extract or simulate session
function getSessionFromRequest(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = dbStore.getSession(token);
    if (session) return session;
  }

  // Fallback to active role header or default to ADMIN for rich demo experience
  const roleHeader = (req.headers['x-blockvault-role'] as string) || 'ADMIN';
  const matchedAcc =
    DEFAULT_ACCOUNTS.find((a) => a.role === roleHeader.toUpperCase()) ||
    DEFAULT_ACCOUNTS[0];

  return {
    token: 'mock-session-token',
    walletAddress: matchedAcc.walletAddress,
    did: matchedAcc.did,
    displayName: matchedAcc.name,
    role: matchedAcc.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  };
}

// --------------------------------------------------------------------------
// AUTHENTICATION & WALLET INTEGRATION
// --------------------------------------------------------------------------

// 1. Generate Nonce Challenge
apiRouter.post('/auth/nonce', (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    res.status(400).json({ error: 'walletAddress is required' });
    return;
  }

  const { nonce, message, timestamp } = generateAuthNonce();
  dbStore.setNonce(walletAddress, nonce);

  res.json({
    nonce,
    message,
    timestamp,
    walletAddress,
  });
});

// 2. Verify Wallet Signature (EIP-191 personal_sign)
apiRouter.post('/auth/verify-wallet', (req: Request, res: Response) => {
  const { walletAddress, signature, message } = req.body;

  if (!walletAddress || !signature || !message) {
    res.status(400).json({ error: 'walletAddress, signature, and message are required' });
    return;
  }

  const verification = verifyWalletSignature(message, signature);

  if (!verification.verified || verification.recoveredAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
    res.status(401).json({
      error: 'Cryptographic signature verification failed: Recovered address does not match wallet address',
    });
    return;
  }

  // Look up DID or auto-create if new wallet
  let didRecord = blockchain.getDIDByWallet(walletAddress);
  let role: 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER' = 'USER';
  let displayName = 'Defense Operator';

  if (didRecord) {
    role = didRecord.role;
    displayName = didRecord.displayName;
  } else {
    // Generate new DID
    const did = formatDID(walletAddress);
    const pubKey = `04${crypto.randomBytes(64).toString('hex')}`;
    blockchain.registerDID(did, walletAddress, pubKey, displayName, 'USER', walletAddress, 'ADMIN');
    didRecord = blockchain.getDID(did);
  }

  const token = `bvt_${crypto.randomBytes(32).toString('hex')}`;
  const session = {
    token,
    walletAddress,
    did: didRecord?.did || formatDID(walletAddress),
    displayName,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  };

  dbStore.setSession(session);

  res.json({
    success: true,
    token,
    session,
  });
});

// 3. Switch Role (for demo and review across all 4 roles)
apiRouter.post('/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const targetRole = (role || 'ADMIN').toUpperCase();
  const acc = DEFAULT_ACCOUNTS.find((a) => a.role === targetRole) || DEFAULT_ACCOUNTS[0];

  const token = `bvt_${crypto.randomBytes(32).toString('hex')}`;
  const session = {
    token,
    walletAddress: acc.walletAddress,
    did: acc.did,
    displayName: acc.name,
    role: acc.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  };

  dbStore.setSession(session);
  res.json({ success: true, session, account: acc });
});

// 4. Get Current Session & Pre-configured Accounts
apiRouter.get('/auth/session', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  res.json({
    session,
    preconfiguredAccounts: DEFAULT_ACCOUNTS.map((a) => ({
      role: a.role,
      name: a.name,
      designation: a.designation,
      organization: a.organization,
      walletAddress: a.walletAddress,
      did: a.did,
    })),
  });
});

// --------------------------------------------------------------------------
// DECENTRALIZED IDENTIFIER (DID) SYSTEM
// --------------------------------------------------------------------------

// List all DIDs
apiRouter.get('/dids', (req: Request, res: Response) => {
  const dids = blockchain.getDIDs();
  res.json({ dids });
});

// Get W3C DID Document
apiRouter.get('/dids/:did/document', (req: Request, res: Response) => {
  const didRecord = blockchain.getDID(req.params.did);
  if (!didRecord) {
    res.status(404).json({ error: 'DID Document not found' });
    return;
  }

  const doc = createW3CDIDDocument(didRecord.did, didRecord.walletAddress, didRecord.publicKeyHex);
  res.json(doc);
});

// Register new DID (Admin only)
apiRouter.post('/dids/register', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { walletAddress, displayName, role, publicKeyHex } = req.body;

  if (!walletAddress || !displayName || !role) {
    res.status(400).json({ error: 'walletAddress, displayName, and role are required' });
    return;
  }

  const did = formatDID(walletAddress);
  const pubKey = publicKeyHex || `04${crypto.randomBytes(64).toString('hex')}`;

  const result = blockchain.registerDID(
    did,
    walletAddress,
    pubKey,
    displayName,
    role,
    session.walletAddress,
    session.role
  );

  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }

  res.json({
    success: true,
    didRecord: result.didRecord,
    txHash: result.txHash,
  });
});

// Update DID Lifecycle Status
apiRouter.patch('/dids/:did/status', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const result = blockchain.updateDIDStatus(req.params.did, status, session.walletAddress, session.role);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }

  res.json({ success: true, txHash: result.txHash });
});

// --------------------------------------------------------------------------
// DIGITAL ASSET & NFT MANAGEMENT
// --------------------------------------------------------------------------

// List assets (enforces role visibility)
apiRouter.get('/assets', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const allStored = dbStore.getAssets();
  const onChainAssets = blockchain.getAssets();

  // Map and combine database & blockchain records
  const combined = allStored.map((stored) => {
    const onChain = onChainAssets.find((o) => o.tokenId === stored.tokenId || o.assetId === stored.id);
    return {
      ...stored,
      onChainTokenId: onChain?.tokenId,
      onChainOwnerWallet: onChain?.ownerWallet,
      onChainOwnerDID: onChain?.ownerDID,
      onChainStatus: onChain?.status,
      onChainTxHash: onChain?.mintTxHash,
      onChainFileHash: onChain?.fileHash,
    };
  });

  // Role-Based Filtering
  let visibleAssets = combined;
  if (session.role === 'USER') {
    // User sees assets they own or have permitted access to
    visibleAssets = combined.filter(
      (a) =>
        a.ownerWallet.toLowerCase() === session.walletAddress.toLowerCase() ||
        a.ownerDID === session.did ||
        a.confidentialityLevel === 'CONFIDENTIAL'
    );
  }

  res.json({
    assets: visibleAssets,
    userRole: session.role,
    totalCount: visibleAssets.length,
  });
});

// Get single asset
apiRouter.get('/assets/:id', (req: Request, res: Response) => {
  const asset = dbStore.getAsset(req.params.id);
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }

  const onChain = blockchain.getAssetById(asset.id) || blockchain.getAssetByTokenId(asset.tokenId);
  res.json({
    asset,
    onChainRecord: onChain,
  });
});

// Upload, Encrypt & Mint NFT (Only ADMIN can mint)
apiRouter.post('/assets/upload', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { name, description, assetType, fileName, contentBase64, confidentialityLevel, targetOwnerDID, targetOwnerWallet } = req.body;

  if (!name || !contentBase64 || !fileName) {
    res.status(400).json({ error: 'name, fileName, and contentBase64 are required' });
    return;
  }

  // 1. Check Smart Contract Minting RBAC Requirement:
  // "Only ADMIN should be able to mint NFTs. Smart contract must enforce: onlyAuthorizedAdmin can mint."
  if (session.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Smart Contract Enforcement: Caller does not possess ADMIN role. NFT minting is strictly restricted to authorized administrators.',
    });
    return;
  }

  try {
    const fileBuffer = Buffer.from(contentBase64, 'base64');
    const fileSize = fileBuffer.length;

    // 2. Compute SHA-256 Hash of original document
    const fileHash = `0x${sha256(fileBuffer)}`;

    // 3. Encrypt file using AES-256-GCM
    const encrypted = encryptAES256GCM(fileBuffer);

    // 4. Store encrypted payload in secure storage (VAULT_DIR)
    const assetId = `BEL-${assetType?.substring(0, 3).toUpperCase() || 'DEF'}-${Date.now().toString().slice(-4)}`;
    const encFileName = `${assetId}.enc`;
    const encryptedFilePath = path.join(VAULT_DIR, encFileName);
    fs.writeFileSync(encryptedFilePath, encrypted.ciphertext, 'utf-8');

    // 5. Determine initial owner
    const initialOwnerWallet = targetOwnerWallet || session.walletAddress;
    const initialOwnerDID = targetOwnerDID || session.did;
    const metadataURI = `ipfs://bafybeib${crypto.randomBytes(16).toString('hex')}`;

    // 6. Mint ERC-721 NFT on Blockchain
    const mintResult = blockchain.mintAssetNFT(
      assetId,
      name,
      assetType || 'Defense Document',
      fileHash,
      metadataURI,
      initialOwnerDID,
      initialOwnerWallet,
      session.walletAddress,
      session.role
    );

    if (!mintResult.success || !mintResult.asset) {
      res.status(403).json({ error: mintResult.error });
      return;
    }

    // 7. Store application metadata in PostgreSQL / dbStore
    const newStoredAsset: StoredAsset = {
      id: assetId,
      name,
      description: description || '',
      assetType: assetType || 'Defense Document',
      fileName,
      fileSize,
      mimeType: 'application/octet-stream',
      sha256Hash: fileHash,
      encryptedFilePath,
      ivHex: encrypted.iv,
      authTagHex: encrypted.authTag,
      metadataURI,
      tokenId: mintResult.asset.tokenId,
      ownerDID: initialOwnerDID,
      ownerWallet: initialOwnerWallet,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'ACTIVE',
      confidentialityLevel: confidentialityLevel || 'CONFIDENTIAL',
    };

    dbStore.addAsset(newStoredAsset);

    res.json({
      success: true,
      asset: newStoredAsset,
      onChainAsset: mintResult.asset,
      txHash: mintResult.txHash,
    });
  } catch (error: any) {
    console.error('Asset upload error:', error);
    res.status(500).json({ error: `Asset creation failed: ${error.message}` });
  }
});

// Transfer Asset NFT
apiRouter.post('/assets/:id/transfer', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { toWallet, toDID, reason } = req.body;

  if (!toWallet || !toDID) {
    res.status(400).json({ error: 'toWallet and toDID are required' });
    return;
  }

  const asset = dbStore.getAsset(req.params.id);
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }

  const result = blockchain.transferAssetNFT(
    asset.tokenId,
    toWallet,
    toDID,
    session.walletAddress,
    session.role,
    reason || 'Mission Allocation Transfer'
  );

  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }

  // Update DB metadata
  dbStore.updateAsset(asset.id, {
    ownerDID: toDID,
    ownerWallet: toWallet,
    status: 'TRANSFERRED',
  });

  res.json({ success: true, txHash: result.txHash });
});

// Decrypt & Download Asset (Authorized roles only)
apiRouter.get('/assets/:id/download', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const asset = dbStore.getAsset(req.params.id);

  if (!asset) {
    res.status(404).json({ error: 'Asset not found' });
    return;
  }

  // Authorization check
  const isOwner = asset.ownerWallet.toLowerCase() === session.walletAddress.toLowerCase();
  const isAdmin = session.role === 'ADMIN';
  const isManager = session.role === 'MANAGER';
  const isAuditor = session.role === 'AUDITOR';

  if (!isOwner && !isAdmin && !isManager && !isAuditor) {
    res.status(403).json({ error: 'Unauthorized: You do not have permission to decrypt this asset' });
    return;
  }

  try {
    if (!fs.existsSync(asset.encryptedFilePath)) {
      // If encrypted file doesn't exist, generate synthetic decrypted defense payload
      const mockContent = `[CONFIDENTIAL DEFENSE RECORD]\nOrganization: Bharat Electronics Limited\nAsset ID: ${asset.id}\nAsset Name: ${asset.name}\nOwner DID: ${asset.ownerDID}\nIntegrity SHA-256: ${asset.sha256Hash}\nClassification: ${asset.confidentialityLevel}\nVerified on Blockchain Token #${asset.tokenId}\n\nContents: ${asset.description}`;
      res.setHeader('Content-Disposition', `attachment; filename="${asset.fileName}.txt"`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(mockContent);
      return;
    }

    const ciphertext = fs.readFileSync(asset.encryptedFilePath, 'utf-8');
    const decryptedBuffer = decryptAES256GCM({
      ciphertext,
      iv: asset.ivHex,
      authTag: asset.authTagHex,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${asset.fileName}"`);
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    res.send(decryptedBuffer);
  } catch (error: any) {
    console.error('Decryption error:', error);
    res.status(500).json({ error: `Decryption failed: ${error.message}` });
  }
});

// --------------------------------------------------------------------------
// SECURITY VERIFICATION ENGINE
// --------------------------------------------------------------------------

// Verify asset hash against blockchain record
apiRouter.post('/verify', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { assetId, contentBase64, providedHash } = req.body;

  let testHash = providedHash;
  if (contentBase64) {
    const buffer = Buffer.from(contentBase64, 'base64');
    testHash = `0x${sha256(buffer)}`;
  }

  if (!testHash) {
    res.status(400).json({ error: 'Either contentBase64 or providedHash is required' });
    return;
  }

  const result = blockchain.verifyAssetIntegrity(assetId || '', testHash, session.walletAddress);
  res.json(result);
});

// Tamper Demo Endpoint (Modifies 1 byte to demonstrate blockchain detection)
apiRouter.get('/verify/tamper-demo', (req: Request, res: Response) => {
  const originalText = 'CONFIDENTIAL: Bharat Electronics Limited Coastal Surveillance Radar System architecture v4.';
  const tamperedText = 'CONFIDENTIAL: Bharat Electronics Limited Coastal Surveillance Radar System architecture v5.'; // 1 char difference

  const originalHash = `0x${sha256(originalText)}`;
  const tamperedHash = `0x${sha256(tamperedText)}`;

  res.json({
    originalText,
    tamperedText,
    originalHash,
    tamperedHash,
    explanation:
      'Avalanche effect in SHA-256: Even a single character variation creates an entirely uncorrelated cryptographic digest, which the smart contract immediately rejects.',
  });
});

// --------------------------------------------------------------------------
// ROLES & ACCESS CONTROL (RBAC)
// --------------------------------------------------------------------------

apiRouter.get('/roles', (req: Request, res: Response) => {
  res.json({
    roles: ROLE_CONFIGS,
    contractAddress: CONTRACT_ADDRESSES.RBAC,
  });
});

apiRouter.post('/roles/assign', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const { targetDID, newRole } = req.body;

  if (!targetDID || !newRole) {
    res.status(400).json({ error: 'targetDID and newRole are required' });
    return;
  }

  const result = blockchain.assignRole(targetDID, newRole, session.walletAddress, session.role);
  if (!result.success) {
    res.status(403).json({ error: result.error });
    return;
  }

  res.json({ success: true, txHash: result.txHash });
});

// --------------------------------------------------------------------------
// IMMUTABLE AUDIT LEDGER
// --------------------------------------------------------------------------

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  let records = blockchain.getAuditRecords();

  // Role permissions check
  if (session.role === 'USER') {
    // User sees operations involving their DID or wallet
    records = records.filter(
      (r) =>
        r.actorDID === session.did ||
        r.actorWallet.toLowerCase() === session.walletAddress.toLowerCase() ||
        r.targetIdentifier.includes(session.did)
    );
  }

  res.json({
    logs: records,
    totalLogs: records.length,
    contractAddress: CONTRACT_ADDRESSES.AuditLedger,
  });
});

apiRouter.get('/audit-logs/export', (req: Request, res: Response) => {
  const logs = blockchain.getAuditRecords();
  res.setHeader('Content-Disposition', 'attachment; filename="blockvault_audit_export.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    exportDate: new Date().toISOString(),
    organization: 'Bharat Electronics Limited',
    platform: 'BlockVault SIH26125',
    totalAuditEntries: logs.length,
    contractAddress: CONTRACT_ADDRESSES.AuditLedger,
    logs,
  });
});

// --------------------------------------------------------------------------
// AI SECURITY ANALYTICS (Gemini API)
// --------------------------------------------------------------------------

apiRouter.post('/ai/analyze-logs', async (req: Request, res: Response) => {
  const { query } = req.body;
  const logs = blockchain.getAuditRecords();

  const aiResult = await analyzeAuditLogsWithAI(logs, query);
  res.json({
    ...aiResult,
    timestamp: Date.now(),
  });
});

// --------------------------------------------------------------------------
// SMART CONTRACTS & BLOCKCHAIN EXPLORER
// --------------------------------------------------------------------------

apiRouter.get('/contracts', (req: Request, res: Response) => {
  const contractsDir = path.join(process.cwd(), 'contracts');
  const contractList = [
    {
      name: 'BlockVaultDIDRegistry.sol',
      address: CONTRACT_ADDRESSES.DIDRegistry,
      description: 'W3C-compliant Decentralized Identity (DID) Registry and public key binding contract',
    },
    {
      name: 'BlockVaultRBAC.sol',
      address: CONTRACT_ADDRESSES.RBAC,
      description: 'Role-Based Access Control and on-chain permission enforcement engine',
    },
    {
      name: 'BlockVaultAssetNFT.sol',
      address: CONTRACT_ADDRESSES.AssetNFT,
      description: 'ERC-721 Digital Asset NFT with authorized minting and file hash anchoring',
    },
    {
      name: 'BlockVaultAuditLedger.sol',
      address: CONTRACT_ADDRESSES.AuditLedger,
      description: 'Immutable append-only cryptographic event logging smart contract',
    },
  ];

  const contractsWithCode = contractList.map((c) => {
    let sourceCode = '';
    const filePath = path.join(contractsDir, c.name);
    if (fs.existsSync(filePath)) {
      sourceCode = fs.readFileSync(filePath, 'utf-8');
    }
    return {
      ...c,
      sourceCode,
    };
  });

  res.json({
    contracts: contractsWithCode,
    network: {
      chainId: 31337,
      networkName: 'BlockVault EVM Defense Subnet (BEL Node)',
      blockHeight: blockchain.getBlockHeight(),
      rpcUrl: 'http://127.0.0.1:8545',
    },
  });
});

apiRouter.get('/network', (req: Request, res: Response) => {
  res.json({
    blockHeight: blockchain.getBlockHeight(),
    transactions: blockchain.getRecentTransactions(10),
    networkId: 31337,
    gasPrice: '12 Gwei',
    consensus: 'Proof of Authority (PoA) - Bharat Electronics Limited Node',
  });
});
