import crypto from 'crypto';
import { ethers } from 'ethers';

// Master encryption key derived from environment or secure hardware module simulation
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_MASTER_KEY).digest()
  : crypto.createHash('sha256').update('BLOCKVAULT_BEL_SIH2026_DEFENSE_MASTER_SECRET_KEY').digest();

export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string;         // Hex
  authTag: string;    // Hex
  fileHash: string;   // SHA-256 hex of original unencrypted content
}

/**
 * Generate SHA-256 hash of a buffer or string
 */
export function sha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Encrypt a buffer or UTF-8 string using AES-256-GCM
 */
export function encryptAES256GCM(data: Buffer | string): EncryptedData {
  const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  const fileHash = sha256(bufferData);

  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(bufferData), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    fileHash: `0x${fileHash}`,
  };
}

/**
 * Decrypt an AES-256-GCM payload with authenticated tag verification
 */
export function decryptAES256GCM(encryptedData: {
  ciphertext: string;
  iv: string;
  authTag: string;
}): Buffer {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  const ciphertextBuffer = Buffer.from(encryptedData.ciphertext, 'base64');
  const decrypted = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);
  return decrypted;
}

/**
 * Generate cryptographic authentication challenge nonce
 */
export function generateAuthNonce(): { nonce: string; message: string; timestamp: number } {
  const nonce = crypto.randomBytes(24).toString('hex');
  const timestamp = Date.now();
  const message = `BlockVault Authentication Challenge\nSign this message to prove ownership of your EVM wallet.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\nOrganization: Bharat Electronics Limited (SIH26125)`;
  return { nonce, message, timestamp };
}

/**
 * Verify cryptographic EIP-191 personal_sign signature
 */
export function verifyWalletSignature(message: string, signature: string): { verified: boolean; recoveredAddress?: string } {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return { verified: true, recoveredAddress: ethers.getAddress(recoveredAddress) };
  } catch (error) {
    return { verified: false };
  }
}

/**
 * Generate standard W3C-compliant DID identifier for BlockVault
 */
export function formatDID(walletAddress: string): string {
  const cleanAddr = ethers.getAddress(walletAddress);
  return `did:blockvault:${cleanAddr}`;
}

/**
 * Construct W3C DID Document (JSON-LD)
 */
export function createW3CDIDDocument(did: string, walletAddress: string, publicKeyHex?: string) {
  const cleanWallet = ethers.getAddress(walletAddress);
  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: "EcdsaSecp256k1RecoveryMethod2020",
        controller: did,
        blockchainAccountId: `eip155:1337:${cleanWallet}`,
        publicKeyHex: publicKeyHex || `04${crypto.createHash('sha256').update(cleanWallet).digest('hex')}`
      }
    ],
    authentication: [
      `${did}#key-1`
    ],
    assertionMethod: [
      `${did}#key-1`
    ],
    service: [
      {
        id: `${did}#asset-vault`,
        type: "BlockVaultSecureStorage",
        serviceEndpoint: "https://blockvault.bel.gov.in/vault/v1"
      }
    ]
  };
}
