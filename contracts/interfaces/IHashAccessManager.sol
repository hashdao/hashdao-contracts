// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

/// @notice Hash DAO access manager interface.
interface IHashAccessManager {
    function listedAccounts(uint256 listId, address account) external returns (bool);

    function joinList(
        uint256 listId,
        address account,
        bytes32[] calldata merkleProof
    ) external;
}
