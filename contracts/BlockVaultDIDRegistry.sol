// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVaultDIDRegistry
 * @dev Decentralized Identifier (DID) Registry for Bharat Electronics Limited (SIH 2026 - SIH26125)
 * Conforms to W3C Decentralized Identifiers (DIDs) v1.0 standard recommendations.
 */
contract BlockVaultDIDRegistry {
    enum IdentityStatus { ACTIVE, SUSPENDED, DEACTIVATED }

    struct DIDDocument {
        string did;             // e.g. "did:blockvault:0x71A9...92F"
        address walletAddress;  // EVM wallet address
        string publicKeyHex;    // Secp256k1 public key in hex
        string displayName;     // User / System Display Name
        string role;            // ADMIN, MANAGER, AUDITOR, USER
        IdentityStatus status;  // ACTIVE, SUSPENDED, DEACTIVATED
        uint256 createdAt;      // Unix timestamp
        uint256 updatedAt;      // Unix timestamp
        bool isVerified;        // Cryptographically verified identity
    }

    address public owner;
    mapping(address => bool) public admins;
    mapping(string => DIDDocument) private didDocuments;
    mapping(address => string) private walletToDID;
    string[] private allDIDs;

    // Events for immutable logging
    event DIDRegistered(string indexed did, address indexed wallet, string role, uint256 timestamp);
    event DIDStatusUpdated(string indexed did, IdentityStatus status, address indexed updatedBy, uint256 timestamp);
    event DIDVerified(string indexed did, address indexed verifiedBy, uint256 timestamp);
    event DIDRoleUpdated(string indexed did, string newRole, address indexed updatedBy, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender], "BlockVaultDIDRegistry: Caller is not an authorized Admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    function setAdmin(address adminAddr, bool status) external onlyAdmin {
        admins[adminAddr] = status;
    }

    /**
     * @notice Register a new decentralized identity
     */
    function registerDID(
        string memory did,
        address wallet,
        string memory publicKeyHex,
        string memory displayName,
        string memory role
    ) external onlyAdmin {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(wallet != address(0), "Invalid wallet address");
        require(didDocuments[did].walletAddress == address(0), "DID already registered");
        require(bytes(walletToDID[wallet]).length == 0, "Wallet already mapped to another DID");

        DIDDocument memory newDoc = DIDDocument({
            did: did,
            walletAddress: wallet,
            publicKeyHex: publicKeyHex,
            displayName: displayName,
            role: role,
            status: IdentityStatus.ACTIVE,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: true
        });

        didDocuments[did] = newDoc;
        walletToDID[wallet] = did;
        allDIDs.push(did);

        emit DIDRegistered(did, wallet, role, block.timestamp);
    }

    /**
     * @notice Update identity status (e.g. suspend or deactivate compromised identity)
     */
    function updateStatus(string memory did, IdentityStatus status) external onlyAdmin {
        require(didDocuments[did].walletAddress != address(0), "DID not found");
        didDocuments[did].status = status;
        didDocuments[did].updatedAt = block.timestamp;

        emit DIDStatusUpdated(did, status, msg.sender, block.timestamp);
    }

    /**
     * @notice Assign or update role associated with DID
     */
    function updateRole(string memory did, string memory newRole) external onlyAdmin {
        require(didDocuments[did].walletAddress != address(0), "DID not found");
        didDocuments[did].role = newRole;
        didDocuments[did].updatedAt = block.timestamp;

        emit DIDRoleUpdated(did, newRole, msg.sender, block.timestamp);
    }

    /**
     * @notice Fetch DID Document by DID string
     */
    function getDIDDocument(string memory did) external view returns (DIDDocument memory) {
        require(didDocuments[did].walletAddress != address(0), "DID not found");
        return didDocuments[did];
    }

    /**
     * @notice Fetch DID mapped to wallet address
     */
    function getDIDByWallet(address wallet) external view returns (string memory) {
        return walletToDID[wallet];
    }

    /**
     * @notice Get all registered DIDs count
     */
    function getTotalDIDs() external view returns (uint256) {
        return allDIDs.length;
    }
}
