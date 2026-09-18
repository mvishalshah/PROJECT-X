// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVaultAuditLedger
 * @dev Immutable on-chain audit trail contract for Bharat Electronics Limited (SIH 2026)
 * Captures all security-critical operations in append-only cryptographic event logs.
 */
contract BlockVaultAuditLedger {
    enum ActionType {
        IDENTITY_REGISTER,
        IDENTITY_UPDATE,
        NFT_MINT,
        ASSET_ALLOCATE,
        OWNERSHIP_TRANSFER,
        ROLE_ASSIGNMENT,
        ROLE_REVOCATION,
        PERMISSION_UPDATE,
        SECURITY_VERIFICATION,
        ACCESS_ATTEMPT
    }

    struct AuditEntry {
        uint256 id;
        ActionType actionType;
        string actorDID;
        address actorWallet;
        string targetIdentifier; // DID, Asset ID, or Token ID
        string details;          // JSON or formatted string of operation payload
        string cryptographicProof;// Signature or block hash
        uint256 timestamp;
        uint256 blockNumber;
        bool statusSuccess;
    }

    address public owner;
    mapping(address => bool) public authorizedLoggers;
    AuditEntry[] private auditLog;

    event AuditLogged(
        uint256 indexed id,
        ActionType indexed actionType,
        string actorDID,
        address indexed actorWallet,
        string targetIdentifier,
        uint256 timestamp,
        bool statusSuccess
    );

    modifier onlyLogger() {
        require(msg.sender == owner || authorizedLoggers[msg.sender], "BlockVaultAuditLedger: Unauthorized logger");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedLoggers[msg.sender] = true;
    }

    function setAuthorizedLogger(address logger, bool isAuth) external {
        require(msg.sender == owner, "Only contract owner can authorize loggers");
        authorizedLoggers[logger] = isAuth;
    }

    function recordAudit(
        ActionType actionType,
        string memory actorDID,
        address actorWallet,
        string memory targetIdentifier,
        string memory details,
        string memory cryptographicProof,
        bool statusSuccess
    ) external onlyLogger returns (uint256) {
        uint256 entryId = auditLog.length + 1;

        AuditEntry memory entry = AuditEntry({
            id: entryId,
            actionType: actionType,
            actorDID: actorDID,
            actorWallet: actorWallet,
            targetIdentifier: targetIdentifier,
            details: details,
            cryptographicProof: cryptographicProof,
            timestamp: block.timestamp,
            blockNumber: block.number,
            statusSuccess: statusSuccess
        });

        auditLog.push(entry);

        emit AuditLogged(entryId, actionType, actorDID, actorWallet, targetIdentifier, block.timestamp, statusSuccess);
        return entryId;
    }

    function getAuditLogCount() external view returns (uint256) {
        return auditLog.length;
    }

    function getAuditEntry(uint256 index) external view returns (AuditEntry memory) {
        require(index < auditLog.length, "Index out of range");
        return auditLog[index];
    }

    function getRecentLogs(uint256 limit) external view returns (AuditEntry[] memory) {
        uint256 count = auditLog.length;
        if (limit > count) {
            limit = count;
        }
        AuditEntry[] memory recent = new AuditEntry[](limit);
        for (uint256 i = 0; i < limit; i++) {
            recent[i] = auditLog[count - 1 - i];
        }
        return recent;
    }
}
