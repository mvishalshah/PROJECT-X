export type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR' | 'USER';

export interface UserSession {
  token: string;
  walletAddress: string;
  did: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export interface AccountProfile {
  role: UserRole;
  name: string;
  designation: string;
  organization: string;
  walletAddress: string;
  did: string;
}

export interface DIDRecord {
  did: string;
  walletAddress: string;
  publicKeyHex: string;
  displayName: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: number;
  updatedAt: number;
  isVerified: boolean;
  registrationTxHash: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string;
  metadataURI: string;
  tokenId: number;
  ownerDID: string;
  ownerWallet: string;
  createdAt: number;
  updatedAt: number;
  status: 'ACTIVE' | 'TRANSFERRED' | 'REVOKED' | 'ARCHIVED';
  confidentialityLevel: 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'RESTRICTED';
  onChainTokenId?: number;
  onChainOwnerWallet?: string;
  onChainOwnerDID?: string;
  onChainStatus?: string;
  onChainTxHash?: string;
  onChainFileHash?: string;
}

export interface AuditLog {
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

export interface VerificationResult {
  isAuthentic: boolean;
  asset?: Asset;
  onChainHash?: string;
  calculatedHash: string;
  blockNumber: number;
  timestamp: number;
  txHash: string;
  message: string;
}

export interface ContractInfo {
  name: string;
  address: string;
  description: string;
  sourceCode: string;
}

export interface AiAnalysisResult {
  analysis: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  keyFindings: string[];
  recommendations: string[];
  timestamp: number;
}
