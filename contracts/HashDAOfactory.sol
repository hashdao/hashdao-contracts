// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

import './HashDAO.sol';
import './interfaces/IRicardianLLC.sol';

/// @notice Factory to deploy Hash DAO.
contract HashDAOfactory is Multicall {
    event DAOdeployed(
        HashDAO indexed hashDAO, 
        string name, 
        string symbol, 
        string docs, 
        bool paused, 
        address[] extensions, 
        bytes[] extensionsData,
        address[] voters,
        uint256[] shares,
        uint32[16] govSettings
    );

    error NullDeploy();

    address payable private immutable hashMaster;

    IRicardianLLC private immutable ricardianLLC;

    constructor(address payable hashMaster_, IRicardianLLC ricardianLLC_) {
        hashMaster = hashMaster_;

        ricardianLLC = ricardianLLC_;
    }
    
    function deployHashDAO(
        string memory name_,
        string memory symbol_,
        string memory docs_,
        bool paused_,
        address[] memory extensions_,
        bytes[] memory extensionsData_,
        address[] calldata voters_,
        uint256[] calldata shares_,
        uint32[16] memory govSettings_
    ) public payable virtual returns (HashDAO hashDAO) {
        hashDAO = HashDAO(_cloneAsMinimalProxy(hashMaster, name_));
        
        hashDAO.init(
            name_, 
            symbol_, 
            docs_,
            paused_, 
            extensions_,
            extensionsData_,
            voters_, 
            shares_,  
            govSettings_
        );

        bytes memory docs = bytes(docs_);

        if (docs.length == 0) {
            ricardianLLC.mintLLC{value: msg.value}(address(hashDAO));
        }

        emit DAOdeployed(hashDAO, name_, symbol_, docs_, paused_, extensions_, extensionsData_, voters_, shares_, govSettings_);
    }

    /// @dev modified from Aelin (https://github.com/AelinXYZ/aelin/blob/main/contracts/MinimalProxyFactory.sol)
    function _cloneAsMinimalProxy(address payable base, string memory name_) internal virtual returns (address payable clone) {
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
