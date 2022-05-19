// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

import './HashERC20.sol';
import '../../utils/Multicall.sol';

/// @notice Factory to deploy Hash ERC20.
contract HashERC20factory is Multicall {
    event ERC20deployed(
        HashERC20 indexed hashERC20, 
        string name, 
        string symbol, 
        string details, 
        address[] accounts,
        uint256[] amounts,
        bool paused,
        address indexed owner
    );

    error NullDeploy();

    address private immutable erc20Master;

    constructor(address erc20Master_) {
        erc20Master = erc20Master_;
    }
    
    function deployHashERC20(
        string calldata name_,
        string memory symbol_,
        string calldata details_,
        address[] calldata accounts_,
        uint256[] calldata amounts_,
        bool paused_,
        address owner_
    ) public virtual returns (HashERC20 hashERC20) {
        hashERC20 = HashERC20(_cloneAsMinimalProxy(erc20Master, name_));
        
        hashERC20.init(
            name_,
            symbol_,
            details_,
            accounts_,
            amounts_,
            paused_,
            owner_
        );

        emit ERC20deployed(hashERC20, name_, symbol_, details_, accounts_, amounts_, paused_, owner_);
    }

    /// @dev modified from Aelin (https://github.com/AelinXYZ/aelin/blob/main/contracts/MinimalProxyFactory.sol)
    function _cloneAsMinimalProxy(address base, string memory name_) internal virtual returns (address clone) {
        bytes memory createData = abi.encodePacked(
            // constructor
            bytes10(0x3d602d80600a3d3981f3),
            // proxy code
            bytes10(0x363d3d373d3d3d363d73),
            base,
            bytes15(0x5af43d82803e903d91602b57fd5bf3)
        );

        bytes32 salt = keccak256(bytes(name_));

        assembly {
            clone := create2(
                0, // no value
                add(createData, 0x20), // data
                mload(createData),
                salt
            )
        }
        // if CREATE2 fails for some reason, address(0) is returned
        if (clone == address(0)) revert NullDeploy();
    }
}
