// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

import '../../libraries/SafeTransferLib.sol';
import '../../interfaces/IHashAccessManager.sol';
import '../../interfaces/IHashShareManager.sol';
import '../../interfaces/IERC20Permit.sol';
import '../../utils/Multicall.sol';
import '../../utils/ReentrancyGuard.sol';

/// @notice Crowdsale contract that receives ETH or ERC-20 to mint registered DAO tokens, including merkle access lists.
contract HashDAOcrowdsale is Multicall, ReentrancyGuard {
    using SafeTransferLib for address;

    event ExtensionSet(
        address indexed dao, 
        uint256 listId, 
        address purchaseToken, 
        uint8 purchaseMultiplier, 
        uint96 purchaseLimit, 
        uint32 saleEnds, 
        string details
    );

    event ExtensionCalled(address indexed dao, address indexed purchaser, uint256 amountOut);

    error NullMultiplier();

    error SaleEnded();

    error NotListed();

    error PurchaseLimit();
    
    IHashAccessManager private immutable accessManager;

    address private immutable wETH;

    mapping(address => Crowdsale) public crowdsales;

    struct Crowdsale {
        uint256 listId;
        address purchaseToken;
        uint8 purchaseMultiplier;
        uint96 purchaseLimit;
        uint96 amountPurchased;
        uint32 saleEnds;
        string details;
    }

    constructor(IHashAccessManager accessManager_, address wETH_) {
        accessManager = accessManager_;

        wETH = wETH_;
    }

    function setExtension(bytes calldata extensionData) public nonReentrant virtual {
        (uint256 listId, address purchaseToken, uint8 purchaseMultiplier, uint96 purchaseLimit, uint32 saleEnds, string memory details) 
            = abi.decode(extensionData, (uint256, address, uint8, uint96, uint32, string));
        
        if (purchaseMultiplier == 0) revert NullMultiplier();

        crowdsales[msg.sender] = Crowdsale({
            listId: listId,
            purchaseToken: purchaseToken,
            purchaseMultiplier: purchaseMultiplier,
            purchaseLimit: purchaseLimit,
            amountPurchased: 0,
            saleEnds: saleEnds,
            details: details
        });

        emit ExtensionSet(msg.sender, listId, purchaseToken, purchaseMultiplier, purchaseLimit, saleEnds, details);
    }

    function joinList(uint256 listId, bytes32[] calldata merkleProof) public virtual {
        accessManager.joinList(
            listId,
            msg.sender,
            merkleProof
        );
    }

    function setPermit(
        IERC20Permit token, 
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r, 
        bytes32 s
    ) public virtual {
        token.permit(
            msg.sender,
            address(this),
            value,
            deadline,
            v,
            r,
            s
        );
    }

    function callExtension(address dao, uint256 amount) public payable nonReentrant virtual returns (uint256 amountOut) {
        Crowdsale storage sale = crowdsales[dao];

        if (block.timestamp > sale.saleEnds) revert SaleEnded();

        if (sale.listId != 0) 
            if (!accessManager.listedAccounts(sale.listId, msg.sender)) revert NotListed();

        if (sale.purchaseToken == address(0)) {
            amountOut = msg.value * sale.purchaseMultiplier;

            if (sale.amountPurchased + amountOut > sale.purchaseLimit) revert PurchaseLimit();

            // send ETH to DAO
            dao._safeTransferETH(msg.value);

            sale.amountPurchased += uint96(amountOut);

            IHashShareManager(dao).mintShares(msg.sender, amountOut);
        } else if (sale.purchaseToken == address(0xDead)) {
            amountOut = msg.value * sale.purchaseMultiplier;

            if (sale.amountPurchased + amountOut > sale.purchaseLimit) revert PurchaseLimit();

            // send ETH to wETH
            wETH._safeTransferETH(msg.value);

            // send wETH to DAO
            wETH._safeTransfer(dao, msg.value);

            sale.amountPurchased += uint96(amountOut);

            IHashShareManager(dao).mintShares(msg.sender, amountOut);
        } else {
            // send tokens to DAO
            sale.purchaseToken._safeTransferFrom(msg.sender, dao, amount);

            amountOut = amount * sale.purchaseMultiplier;

            if (sale.amountPurchased + amountOut > sale.purchaseLimit) revert PurchaseLimit();

            sale.amountPurchased += uint96(amountOut);
            
            IHashShareManager(dao).mintShares(msg.sender, amountOut);
        }

        emit ExtensionCalled(dao, msg.sender, amountOut);
    }
}
