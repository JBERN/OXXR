// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./OXXR.sol";

contract OXXRV2 is OXXR {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    mapping(uint256 => string) private diamondNames; 

    function safeMintWithName(address to, uint256 tokenId, string memory name) public virtual onlyRole(MINTER_ROLE) {
        if(bytes(name).length > 0 ){
            diamondNames[tokenId] = name;
        }
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function setDiamondName (uint256 tokenId, string memory name) public virtual{
        require(bytes(name).length <= 100);
        require(bytes(name).length > 0);
        require(bytes(diamondNames[tokenId]).length == 0);
        require(msg.sender == ownerOf(tokenId));
        diamondNames[tokenId] = name;
    }

    function  getDiamondName(uint256 tokenId) public view virtual returns(string memory){
        return diamondNames[tokenId];
    }

    ///@dev returns the contract version
    function version() external pure virtual override returns (uint256) {
        return 2;
    }
}