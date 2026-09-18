// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVaultAssetNFT
 * @dev ERC-721 Compatible Digital Asset Ownership Smart Contract
 * Sponsoring Org: Bharat Electronics Limited (BEL) | SIH 2026 Problem Statement SIH26125
 * Enforces:
 *  - authorized NFT creation (onlyAuthorizedAdmin can mint)
 *  - immutable file SHA-256 hash anchoring
 *  - DID and wallet ownership tracking
 *  - on-chain asset verification
 */
contract BlockVaultAssetNFT {
    string public name = "BlockVault Asset NFT";
    string public symbol = "BVA";

    struct DigitalAsset {
        uint256 tokenId;
        string assetId;         // e.g. "BEL-ASSET-001"
        string assetName;       // e.g. "Coastal Radar System Specification v3"
        string assetType;       // Blueprint, Specification, Firmware, Certificate, Telemetry
        string fileHash;        // SHA-256 hex string of encrypted or canonical payload
        string metadataURI;     // Secure metadata storage reference (IPFS CID / Vault URI)
        string ownerDID;        // did:blockvault:0x...
        address ownerWallet;    // Current wallet owner
        uint256 createdAt;      // Unix timestamp
        string status;          // ACTIVE, TRANSFERRED, REVOKED, ARCHIVED
    }

    address public admin;
    uint256 private _tokenCounter;

    // TokenId => DigitalAsset
    mapping(uint256 => DigitalAsset) private assets;
    // AssetId string => TokenId
    mapping(string => uint256) private assetIdToTokenId;
    // TokenId => Owner address (ERC-721)
    mapping(uint256 => address) private _owners;
    // Owner address => token count
    mapping(address => uint256) private _balances;

    // Historical ownership tracking
    struct OwnershipRecord {
        address previousOwner;
        address newOwner;
        string fromDID;
        string toDID;
        uint256 timestamp;
        string reason;
    }
    mapping(uint256 => OwnershipRecord[]) private assetHistory;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AssetMinted(uint256 indexed tokenId, string assetId, string fileHash, string ownerDID, address indexed ownerWallet, uint256 timestamp);
    event AssetAllocated(uint256 indexed tokenId, string assetId, string toDID, address indexed toWallet, uint256 timestamp);
    event OwnershipTransferred(uint256 indexed tokenId, address indexed previousOwner, address indexed newOwner, string toDID, uint256 timestamp);

    modifier onlyAuthorizedAdmin() {
        require(msg.sender == admin, "BlockVaultAssetNFT: onlyAuthorizedAdmin can mint or manage assets");
        _;
    }

    constructor() {
        admin = msg.sender;
        _tokenCounter = 0;
    }

    function setAdmin(address newAdmin) external onlyAuthorizedAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }

    /**
     * @notice Mint an authorized digital asset NFT
     * Requirement: Only ADMIN should be able to mint NFTs.
     */
    function mintAsset(
        string memory assetId,
        string memory assetName,
        string memory assetType,
        string memory fileHash,
        string memory metadataURI,
        string memory ownerDID,
        address initialOwnerWallet
    ) external onlyAuthorizedAdmin returns (uint256) {
        require(bytes(assetId).length > 0, "Asset ID required");
        require(bytes(fileHash).length > 0, "File hash required");
        require(initialOwnerWallet != address(0), "Invalid owner wallet");
        require(assetIdToTokenId[assetId] == 0, "Asset ID already exists");

        _tokenCounter += 1;
        uint256 newTokenId = _tokenCounter;

        DigitalAsset memory newAsset = DigitalAsset({
            tokenId: newTokenId,
            assetId: assetId,
            assetName: assetName,
            assetType: assetType,
            fileHash: fileHash,
            metadataURI: metadataURI,
            ownerDID: ownerDID,
            ownerWallet: initialOwnerWallet,
            createdAt: block.timestamp,
            status: "ACTIVE"
        });

        assets[newTokenId] = newAsset;
        assetIdToTokenId[assetId] = newTokenId;
        _owners[newTokenId] = initialOwnerWallet;
        _balances[initialOwnerWallet] += 1;

        // Record genesis ownership
        assetHistory[newTokenId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner: initialOwnerWallet,
            fromDID: "system:genesis",
            toDID: ownerDID,
            timestamp: block.timestamp,
            reason: "Initial Authorized Mint"
        }));

        emit Transfer(address(0), initialOwnerWallet, newTokenId);
        emit AssetMinted(newTokenId, assetId, fileHash, ownerDID, initialOwnerWallet, block.timestamp);

        return newTokenId;
    }

    /**
     * @notice Transfer digital asset ownership
     */
    function transferAsset(
        uint256 tokenId,
        address toWallet,
        string memory toDID,
        string memory reason
    ) external {
        address currentOwner = _owners[tokenId];
        require(msg.sender == currentOwner || msg.sender == admin, "BlockVaultAssetNFT: Unauthorized transfer request");
        require(toWallet != address(0), "Invalid destination wallet");

        string memory prevDID = assets[tokenId].ownerDID;
        _balances[currentOwner] -= 1;
        _balances[toWallet] += 1;
        _owners[tokenId] = toWallet;

        assets[tokenId].ownerWallet = toWallet;
        assets[tokenId].ownerDID = toDID;
        assets[tokenId].status = "TRANSFERRED";

        assetHistory[tokenId].push(OwnershipRecord({
            previousOwner: currentOwner,
            newOwner: toWallet,
            fromDID: prevDID,
            toDID: toDID,
            timestamp: block.timestamp,
            reason: reason
        }));

        emit Transfer(currentOwner, toWallet, tokenId);
        emit OwnershipTransferred(tokenId, currentOwner, toWallet, toDID, block.timestamp);
    }

    /**
     * @notice Verify asset integrity on-chain by comparing SHA-256 hash
     */
    function verifyAssetHash(uint256 tokenId, string memory testHash) external view returns (bool isAuthentic, string memory recordedHash) {
        require(_owners[tokenId] != address(0), "Asset does not exist");
        string memory onChainHash = assets[tokenId].fileHash;
        return (keccak256(abi.encodePacked(onChainHash)) == keccak256(abi.encodePacked(testHash)), onChainHash);
    }

    function getAsset(uint256 tokenId) external view returns (DigitalAsset memory) {
        require(_owners[tokenId] != address(0), "Asset does not exist");
        return assets[tokenId];
    }

    function getAssetById(string memory assetId) external view returns (DigitalAsset memory) {
        uint256 tokenId = assetIdToTokenId[assetId];
        require(tokenId != 0, "Asset ID not found");
        return assets[tokenId];
    }

    function getOwnershipHistory(uint256 tokenId) external view returns (OwnershipRecord[] memory) {
        require(_owners[tokenId] != address(0), "Asset does not exist");
        return assetHistory[tokenId];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address ownerAddr = _owners[tokenId];
        require(ownerAddr != address(0), "Token does not exist");
        return ownerAddr;
    }

    function balanceOf(address ownerAddr) external view returns (uint256) {
        return _balances[ownerAddr];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCounter;
    }
}
