// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

/// @notice Hash DAO share manager interface.
interface IHashShareManager {
    function mintShares(address to, uint256 amount) external;

    function burnShares(address from, uint256 amount) external;
}
