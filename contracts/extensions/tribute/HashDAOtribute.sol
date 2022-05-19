// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.4;

import '../../libraries/SafeTransferLib.sol';
import '../../interfaces/IHashDAOtribute.sol';
import '../../utils/Multicall.sol';
import '../../utils/ReentrancyGuard.sol';

/// @notice Tribute contract that escrows ETH, ERC-20 or NFT for Hash DAO proposals.
contract HashDAOtribute is Multicall, ReentrancyGuard {
    using SafeTransferLib for address;

    event NewTributeProposal(
        IHashDAOtribute indexed dao,
        address indexed proposer, 
        uint256 indexed proposal, 
        address asset, 
        bool nft,
        uint256 value
    );

    event TributeProposalCancelled(IHashDAOtribute indexed dao, uint256 indexed proposal);

    event TributeProposalReleased(IHashDAOtribute indexed dao, uint256 indexed proposal);
    
    error NotProposer();

    error Sponsored(); 

    error NotProposal();

    error NotProcessed();

    mapping(IHashDAOtribute => mapping(uint256 => Tribute)) public tributes;

    struct Tribute {
        address proposer;
        address asset;
        bool nft;
        uint256 value;
    }

    function submitTributeProposal(
        IHashDAOtribute dao,
        IHashDAOtribute.ProposalType proposalType, 
        string memory description,
        address[] calldata accounts,
        uint256[] calldata amounts,
        bytes[] calldata payloads,
        bool nft,
        address asset, 
        uint256 value
    ) public payable nonReentrant virtual {
        // escrow tribute
        if (msg.value != 0) {
            asset = address(0);
            value = msg.value;
            if (nft) nft = false;
        } else {
            asset._safeTransferFrom(msg.sender, address(this), value);
        }

        uint256 proposal = dao.propose(
            proposalType,
            description,
            accounts,
            amounts,
            payloads
        );

        tributes[dao][proposal] = Tribute({
            proposer: msg.sender,
            asset: asset,
            nft: nft,
            value: value
        });

        emit NewTributeProposal(dao, msg.sender, proposal, asset, nft, value);
    }

    function cancelTributeProposal(IHashDAOtribute dao, uint256 proposal) public nonReentrant virtual {
        Tribute storage trib = tributes[dao][proposal];

        if (msg.sender != trib.proposer) revert NotProposer();

        dao.cancelProposal(proposal);

        // return tribute from escrow
        if (trib.asset == address(0)) {
            trib.proposer._safeTransferETH(trib.value);
        } else if (!trib.nft) {
            trib.asset._safeTransfer(trib.proposer, trib.value);
        } else {
            trib.asset._safeTransferFrom(address(this), trib.proposer, trib.value);
        }
        
        delete tributes[dao][proposal];

        emit TributeProposalCancelled(dao, proposal);
    }

    function releaseTributeProposalAndProcess(IHashDAOtribute dao, uint256 proposal) public virtual {
        dao.processProposal(proposal);

        releaseTributeProposal(dao, proposal);
    }

    function releaseTributeProposal(IHashDAOtribute dao, uint256 proposal) public nonReentrant virtual {
        Tribute storage trib = tributes[dao][proposal];

        if (trib.proposer == address(0)) revert NotProposal();
        
        IHashDAOtribute.ProposalState memory prop = dao.proposalStates(proposal);

        if (!prop.processed) revert NotProcessed();

        // release tribute from escrow based on proposal outcome
        if (prop.passed) {
            if (trib.asset == address(0)) {
                address(dao)._safeTransferETH(trib.value);
            } else if (!trib.nft) {
                trib.asset._safeTransfer(address(dao), trib.value);
            } else {
                trib.asset._safeTransferFrom(address(this), address(dao), trib.value);
            }
        } else {
            if (trib.asset == address(0)) {
                trib.proposer._safeTransferETH(trib.value);
            } else if (!trib.nft) {
                trib.asset._safeTransfer(trib.proposer, trib.value);
            } else {
                trib.asset._safeTransferFrom(address(this), trib.proposer, trib.value);
            }
        }

        delete tributes[dao][proposal];

        emit TributeProposalReleased(dao, proposal);
    }
}
