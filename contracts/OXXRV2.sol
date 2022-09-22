// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./OXXR.sol";

contract OXXRV2 is OXXR {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    mapping(uint256 => string) private diamondNames; 

    /**
     * @dev Emitted when `tokenId` token is nammed from `from` with the name `to`.
     */
    event DiamondNamed(address indexed from, uint256 indexed tokenId, string name);

    function safeMintWithName(address to, uint256 tokenId, string memory name) public virtual onlyRole(MINTER_ROLE) {
        require(bytes(name).length <= 100, "OXXR : string name is too long");
        _tokenIdCounter.increment();
        diamondNames[tokenId] = name;
        _safeMint(to, tokenId);
        emit DiamondNamed(msg.sender, tokenId, name);
    }

    function setDiamondName (uint256 tokenId, string memory name) public virtual{
        require(bytes(name).length <= 100, "OXXR : string name is too long"); 
        require(bytes(name).length > 0, "OXXR : string name is empty");
        require(bytes(diamondNames[tokenId]).length == 0, "OXXR: token already has a name");
        require(msg.sender == ownerOf(tokenId), "AccessControl: sender account is not the token owner");
        diamondNames[tokenId] = name;
        emit DiamondNamed(msg.sender, tokenId, name);
    }

    function  getDiamondName(uint256 tokenId) public view virtual returns(string memory){
        return diamondNames[tokenId];
    }

    ///@dev returns the contract version
    function version() external pure virtual override returns (uint256) {
        return 2;
    }
}