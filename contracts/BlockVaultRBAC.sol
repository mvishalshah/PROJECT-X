// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVaultRBAC
 * @dev Role-Based Access Control smart contract for Bharat Electronics Limited (BEL / SIH 2026)
 * Governs permission management and role authorization on-chain.
 */
contract BlockVaultRBAC {
    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");
    bytes32 public constant ROLE_MANAGER = keccak256("ROLE_MANAGER");
    bytes32 public constant ROLE_AUDITOR = keccak256("ROLE_AUDITOR");
    bytes32 public constant ROLE_USER = keccak256("ROLE_USER");

    // Permission identifiers
    bytes32 public constant PERM_REGISTER_DID = keccak256("PERM_REGISTER_DID");
    bytes32 public constant PERM_MINT_NFT = keccak256("PERM_MINT_NFT");
    bytes32 public constant PERM_ALLOCATE_ASSET = keccak256("PERM_ALLOCATE_ASSET");
    bytes32 public constant PERM_TRANSFER_ASSET = keccak256("PERM_TRANSFER_ASSET");
    bytes32 public constant PERM_ASSIGN_ROLE = keccak256("PERM_ASSIGN_ROLE");
    bytes32 public constant PERM_VIEW_ALL_LOGS = keccak256("PERM_VIEW_ALL_LOGS");
    bytes32 public constant PERM_VERIFY_INTEGRITY = keccak256("PERM_VERIFY_INTEGRITY");

    address public owner;

    // Mapping: wallet address => role
    mapping(address => bytes32) private userRoles;
    // Mapping: role => permission => isAllowed
    mapping(bytes32 => mapping(bytes32 => bool)) private rolePermissions;

    event RoleAssigned(address indexed account, bytes32 indexed role, address indexed assignedBy, uint256 timestamp);
    event RoleRevoked(address indexed account, bytes32 indexed previousRole, address indexed revokedBy, uint256 timestamp);
    event PermissionSet(bytes32 indexed role, bytes32 indexed permission, bool isGranted, address indexed updatedBy, uint256 timestamp);

    modifier onlyAdmin() {
        require(userRoles[msg.sender] == ROLE_ADMIN || msg.sender == owner, "BlockVaultRBAC: Caller is not an Admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        userRoles[msg.sender] = ROLE_ADMIN;

        // Initialize default RBAC matrix
        // ADMIN permissions
        _setPermission(ROLE_ADMIN, PERM_REGISTER_DID, true);
        _setPermission(ROLE_ADMIN, PERM_MINT_NFT, true);
        _setPermission(ROLE_ADMIN, PERM_ALLOCATE_ASSET, true);
        _setPermission(ROLE_ADMIN, PERM_TRANSFER_ASSET, true);
        _setPermission(ROLE_ADMIN, PERM_ASSIGN_ROLE, true);
        _setPermission(ROLE_ADMIN, PERM_VIEW_ALL_LOGS, true);
        _setPermission(ROLE_ADMIN, PERM_VERIFY_INTEGRITY, true);

        // MANAGER permissions
        _setPermission(ROLE_MANAGER, PERM_ALLOCATE_ASSET, true);
        _setPermission(ROLE_MANAGER, PERM_TRANSFER_ASSET, true);
        _setPermission(ROLE_MANAGER, PERM_VIEW_ALL_LOGS, true);
        _setPermission(ROLE_MANAGER, PERM_VERIFY_INTEGRITY, true);

        // AUDITOR permissions (Read-only + Verification)
        _setPermission(ROLE_AUDITOR, PERM_VIEW_ALL_LOGS, true);
        _setPermission(ROLE_AUDITOR, PERM_VERIFY_INTEGRITY, true);

        // USER permissions
        _setPermission(ROLE_USER, PERM_VERIFY_INTEGRITY, true);
    }

    function _setPermission(bytes32 role, bytes32 permission, bool granted) internal {
        rolePermissions[role][permission] = granted;
        emit PermissionSet(role, permission, granted, msg.sender, block.timestamp);
    }

    function assignRole(address account, bytes32 role) external onlyAdmin {
        require(account != address(0), "Invalid account");
        userRoles[account] = role;
        emit RoleAssigned(account, role, msg.sender, block.timestamp);
    }

    function revokeRole(address account) external onlyAdmin {
        require(account != address(0), "Invalid account");
        bytes32 previousRole = userRoles[account];
        userRoles[account] = bytes32(0);
        emit RoleRevoked(account, previousRole, msg.sender, block.timestamp);
    }

    function setRolePermission(bytes32 role, bytes32 permission, bool granted) external onlyAdmin {
        _setPermission(role, permission, granted);
    }

    function hasPermission(address account, bytes32 permission) external view returns (bool) {
        bytes32 role = userRoles[account];
        return rolePermissions[role][permission];
    }

    function getRole(address account) external view returns (bytes32) {
        return userRoles[account];
    }

    function isRole(address account, bytes32 role) external view returns (bool) {
        return userRoles[account] == role;
    }
}
