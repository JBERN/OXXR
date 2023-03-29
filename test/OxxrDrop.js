const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");

describe("OXXRDrop", function () {
  let oxxr;
  let oxxrDrop;
  let owner;
  let minter;
  let other;
  let allowListed;
  let waitListed;
  let notListed;

  beforeEach(async function () {
    [owner, minter, other, allowListed, waitListed, notListed, badGuy] = await ethers.getSigners();

    const OXXR = await ethers.getContractFactory("OXXR");
    oxxr = await upgrades.deployProxy(OXXR, [], { initializer: 'initialize' });
    await oxxr.deployed();

    await oxxr.grantRole(await oxxr.DEFAULT_ADMIN_ROLE(), owner.address);

    const MyNftDrop = await ethers.getContractFactory("OXXRDrop");
    oxxrDrop = await upgrades.deployProxy(MyNftDrop, [oxxr.address]);
    await oxxrDrop.deployed();

    // Grant MINTER_ROLE to the oxxrDrop smartcontract
    await oxxr.grantRole(await oxxr.MINTER_ROLE(), oxxrDrop.address);

    const currentDrop = 0;

  });

  describe("addDrop", function () {
    it("adds a new drop with correct parameters", async function () {
      const _name = "New Drop";
      const _maxMintsPerAddress = 3;
      const _startTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      const _waitListEndTime = _startTime + 300; // 5 minutes after start time
      const _endTime = _waitListEndTime + 3600; // 1 hour after waitlist end time
      const currentDrop = 0;
    
      const tx = await oxxrDrop.addDrop(_name, _maxMintsPerAddress, _startTime, _waitListEndTime, _endTime);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DropAdded");

      //thisEvent = addDrop();
      expect(event.args.id).to.equal(currentDrop);
      expect(event.args.name).to.equal(_name);
      expect(event.args.maxMintsPerAddress).to.equal(_maxMintsPerAddress);
      expect(event.args.startTime).to.equal(_startTime);
      expect(event.args.waitListEndTime).to.equal(_waitListEndTime);
      expect(event.args.endTime).to.equal(_endTime);
    });
    
    it("reverts if called by a non-admin account", async function () {
      const _name = "New Drop";
      const _maxMintsPerAddress = 3;
      const _startTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      const _waitListEndTime = _startTime + 300; // 5 minutes after start time
      const _endTime = _waitListEndTime + 3600; // 1 hour after waitlist end time
    

      // Revert Message expected
      let errorMessage = "AccessControl: account " + other.address.toLowerCase() + " is missing role ";
      let minterRole = await oxxrDrop.ADMIN_ROLE();
      errorMessage = errorMessage + minterRole.toLowerCase();

      await expect(oxxrDrop.connect(other).addDrop(_name, _maxMintsPerAddress, _startTime, _waitListEndTime, _endTime)).to.be.revertedWith(errorMessage);
    });

  });

  describe("updateDrop", () => {
    it("should update an existing drop with the new details", async () => {
      // Add a drop to the contract
      await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);

      // Call the updateDrop function with the new details for the drop
      await oxxrDrop.updateDrop(0, "New Drop Name", 3, 4000000000, 5000000000, 6000000000);

      // Retrieve the drop details to check if they have been updated correctly
      const drop = await oxxrDrop.drops(0);

      // Verify that the details have been updated correctly
      expect(drop.name).to.equal("New Drop Name");
      expect(drop.maxMintsPerAddress).to.equal(3);
      expect(drop.waitListStartTime).to.equal(4000000000);
      expect(drop.waitListEndTime).to.equal(5000000000);
      expect(drop.allowListEndTime).to.equal(6000000000);
    });

    it("should revert if an invalid drop ID is provided", async () => {
      // Attempt to update a drop that does not exist
      await expect(oxxrDrop.updateDrop(0, "New Drop Name", 3, 4000000000, 5000000000, 6000000000)).to.be.revertedWith("Drop does not exist");
    });

    it("should revert if the caller is not an admin", async () => {
      // Add a drop to the contract
      await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);

      // expected errorMessage 
      let errorMessage = "AccessControl: account " + other.address.toLowerCase() + " is missing role ";
      let adminRole = await oxxrDrop.ADMIN_ROLE();
      errorMessage = errorMessage + adminRole.toLowerCase();

      // Attempt to update the drop as a non-admin user
      await expect(oxxrDrop.connect(other).updateDrop(0, "New Drop Name", 3, 4000000000, 5000000000, 6000000000)).to.be.revertedWith(errorMessage);
    });
  });

  describe("addWaitListAddress", function () {
    it("adds an address to the waitlist", async function () {
      const _name = "First";
      const _maxMintsPerAddress = 3;
      const _startTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
      const _waitListEndTime = _startTime + 300; // 5 minutes after start time
      const _endTime = _waitListEndTime + 3600; // 1 hour after waitlist end time
      const currentDrop = 0;
    
      const tx = await oxxrDrop.addDrop(_name, _maxMintsPerAddress, _startTime, _waitListEndTime, _endTime);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "DropAdded");

      const addresses = [minter.address, other.address, owner.address];
      
      await oxxrDrop.addWaitListAddress(0, addresses);
      expect(await oxxrDrop.isWaitListed(0, minter.address)).to.equal(true);
    });

    describe("removeWaitListAddress", () => {
      it("should remove addresses from the waitlist", async () => {
        // Add a drop to the contract
        await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);
    
        // Add some addresses to the waitlist
        await oxxrDrop.addWaitListAddress(0, [waitListed.address, other.address, badGuy.address]);
    
        // Remove an address from the waitlist
        await oxxrDrop.removeWaitListAddress(0, [badGuy.address]);
    
        // Verify that the address has been removed from the waitlist
        expect(await oxxrDrop.isWaitListed(0, badGuy.address)).to.be.false;
    
        // Verify that the other addresses are still on the waitlist
        expect(await oxxrDrop.isWaitListed(0, waitListed.address)).to.be.true;
        expect(await oxxrDrop.isWaitListed(0, other.address)).to.be.true;
      });
    
      it("should revert if the caller is not an admin", async () => {
        // Add a drop to the contract
        await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);
    
        // Add some addresses to the waitlist
        await oxxrDrop.addWaitListAddress(0, [waitListed.address, other.address, badGuy.address]);
    
        // expected errorMessage 
        let errorMessage = "AccessControl: account " + badGuy.address.toLowerCase() + " is missing role ";
        let adminRole = await oxxrDrop.ADMIN_ROLE();
        errorMessage = errorMessage + adminRole.toLowerCase();
    
        // Attempt to remove an address from the waitlist as a non-admin user
        await expect(oxxrDrop.connect(badGuy).removeWaitListAddress(0, [waitListed.address])).to.be.revertedWith(errorMessage);
    
        // Verify that the address is still on the waitlist
        expect(await oxxrDrop.isWaitListed(0, waitListed.address)).to.be.true;
      });
    });

    it("reverts if not called by admin", async function () {
      const currentDrop = 0;
      // Revert Message expected
      let errorMessage = "AccessControl: account " + other.address.toLowerCase() + " is missing role ";
      let adminRole = await oxxrDrop.ADMIN_ROLE();
      errorMessage = errorMessage + adminRole.toLowerCase();

      const addresses = [minter.address, other.address, owner.address];

      await expect(oxxrDrop.connect(other).addWaitListAddress(currentDrop, addresses)).to.be.revertedWith(errorMessage);
    });
  });
  
  describe("addAllowListAddress", function () {
    const currentDrop = 0;
    it("adds an address to the allowlist", async function () {
      await oxxrDrop.addAllowListAddress(currentDrop, [other.address]);
      expect(await oxxrDrop.isAllowListed(currentDrop, other.address)).to.equal(true);
    });
  
    it("reverts if not called by admin", async function () {
      // Revert Message expected
      let errorMessage = "AccessControl: account " + other.address.toLowerCase() + " is missing role ";
      let adminRole = await oxxrDrop.ADMIN_ROLE();
      errorMessage = errorMessage + adminRole.toLowerCase();

      await expect(oxxrDrop.connect(other).addAllowListAddress(currentDrop, [other.address])).to.be.revertedWith(errorMessage);
    });
  });

  describe("removeAllowListAddress", () => {
    it("should remove addresses from the waitlist", async () => {
      // Add a drop to the contract
      await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);
  
      // Add some addresses to the waitlist
      await oxxrDrop.addAllowListAddress(0, [allowListed.address, other.address, badGuy.address]);
  
      // Remove an address from the waitlist
      await oxxrDrop.removeAllowListAddress(0, [badGuy.address]);
  
      // Verify that the address has been removed from the waitlist
      expect(await oxxrDrop.isAllowListed(0, badGuy.address)).to.be.false;
  
      // Verify that the other addresses are still on the waitlist
      expect(await oxxrDrop.isAllowListed(0, allowListed.address)).to.be.true;
      expect(await oxxrDrop.isAllowListed(0, other.address)).to.be.true;
    });
  
    it("should revert if the caller is not an admin", async () => {
      // Add a drop to the contract
      await oxxrDrop.addDrop("Drop 1", 2, 1000000000, 2000000000, 3000000000);
  
      // Add some addresses to the waitlist
      await oxxrDrop.addAllowListAddress(0, [allowListed.address, other.address, badGuy.address]);
  
      // expected errorMessage 
      let errorMessage = "AccessControl: account " + badGuy.address.toLowerCase() + " is missing role ";
      let adminRole = await oxxrDrop.ADMIN_ROLE();
      errorMessage = errorMessage + adminRole.toLowerCase();
  
      // Attempt to remove an address from the waitlist as a non-admin user
      await expect(oxxrDrop.connect(badGuy).removeAllowListAddress(0, [allowListed.address])).to.be.revertedWith(errorMessage);
  
      // Verify that the address is still on the waitlist
      expect(await oxxrDrop.isAllowListed(0, allowListed.address)).to.be.true;
    });
  });


  describe("setLevels", function () {
    it("sets the prices for each level of a drop", async function () {
        const dropId = 0;
        const levelPrices = [100, 200, 300];
        
        await oxxrDrop.addDrop("Test Drop", 3, Math.floor(Date.now() / 1000) + 60, Math.floor(Date.now() / 1000) + 300, Math.floor(Date.now() / 1000) + 3600);
        await oxxrDrop.setLevels(dropId, levelPrices);

        for (let i = 1; i <= levelPrices.length; i++) {
            expect(await oxxrDrop.getPriceByLevel(dropId, i)).to.equal(levelPrices[i-1]);
        }
    });

    it("reverts if called by non-admin", async function () {
        const dropId = 0;
        const levelPrices = [100, 200, 300];

        await oxxrDrop.addDrop("Test Drop", 3, Math.floor(Date.now() / 1000) + 60, Math.floor(Date.now() / 1000) + 300, Math.floor(Date.now() / 1000) + 3600);
        
         // Revert Message expected
        let errorMessage = "AccessControl: account " + other.address.toLowerCase() + " is missing role ";
        let adminRole = await oxxrDrop.ADMIN_ROLE();
        errorMessage = errorMessage + adminRole.toLowerCase();

        await expect(oxxrDrop.connect(other).setLevels(dropId, levelPrices)).to.be.revertedWith(errorMessage);
    });
  });

  describe("addTokens", function () {
    it("adds tokens to the specified level of a drop", async function () {
      const currentDrop = 0;
      const currentLevel = [1, 1, 1];
      const tokensToAdd = [1, 2, 3];
  
      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );
  
      const tokensIds = await oxxrDrop.getTokenListByLevel(currentDrop, 1);
      expect(tokensIds.length).to.equal(3);
    });
  });

  
  describe("mints", function () {
    it("BEFORE THE DROP PERIOD: Nobody can mint nft's drop", async function () {
      // Set up a drop and level with available tokens
      const dropId = 0;
      const levelId = 1;
      const levelPrice = 100;
      const maxMintsPerAddress = 5;
      const tokensToMint = 2;
      const totalCost = levelPrice * tokensToMint;

      await oxxrDrop.addDrop("Test Drop", maxMintsPerAddress, Math.floor(Date.now() / 1000)+100, Math.floor(Date.now() / 1000) + 300, Math.floor(Date.now() / 1000) + 3600);
      await oxxrDrop.setLevels(dropId, [levelPrice]);
      
      const currentDrop = 0;
      const currentLevel = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const tokensToAdd = [1, 2, 3, 4, 5 , 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      // add tokens to levels
      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );

      // Add waitList
      await oxxrDrop.addWaitListAddress(dropId, [waitListed.address.toLowerCase()]);
      // Add allowList
      await oxxrDrop.addAllowListAddress(dropId, [allowListed.address.toLowerCase()]);

      // waitListed not expected to mint
      await expect(oxxrDrop.connect(waitListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("Minting is not yet allowed.");

      // allowListed not expected to mint
      await expect(oxxrDrop.connect(allowListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("Minting is not yet allowed.");

      // notListed not expected to mint
      await expect(oxxrDrop.connect(notListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("Minting is not yet allowed.");
    });

    it("WAITLISTED DROP PERIOD: Only waitListed addresses are able to mint to the caller's address. ", async function () {
      // Set up a drop and level with available tokens
      const dropId = 0;
      const levelId = 1;
      const levelPrice = 100;
      const maxMintsPerAddress = 5;
      const tokensToMint = 2;
      const totalCost = levelPrice * tokensToMint;

      await oxxrDrop.addDrop("Test Drop", maxMintsPerAddress, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 300, Math.floor(Date.now() / 1000) + 3600);
      await oxxrDrop.setLevels(dropId, [levelPrice]);
      
      const currentDrop = 0;
      const currentLevel = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const tokensToAdd = [1, 2, 3, 4, 5 , 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      // add tokens to levels
      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );

      // Add waitList
      await oxxrDrop.addWaitListAddress(dropId, [waitListed.address.toLowerCase()]);
      // Add allowList
      await oxxrDrop.addAllowListAddress(dropId, [allowListed.address.toLowerCase()]);

      // Mint NFTs
      const tx = await oxxrDrop.connect(waitListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      const receipt = await tx.wait();
      const mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");

      // Verify that the NFTs were minted and sent to the caller's address
      const tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(waitListed.address);
      }

      // allowListed not expected to mint
      await expect(oxxrDrop.connect(allowListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("You are not allowed to mint.");

      // notListed not expected to mint
      await expect(oxxrDrop.connect(notListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("You are not allowed to mint.");
    });

    it("ALLOWLISTED DROP PREDIOD: Only waitListed and allowListed addresses are able to mint to the caller's address.", async function () {
      // Set up a drop and level with available tokens
      const dropId = 0;
      const levelId = 1;
      const levelPrice = 100;
      const maxMintsPerAddress = 5;
      const tokensToMint = 2;
      const totalCost = levelPrice * tokensToMint;

      await oxxrDrop.addDrop("Test Drop", maxMintsPerAddress, Math.floor(Date.now() / 1000)-300, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 3600);
      await oxxrDrop.setLevels(dropId, [levelPrice]);
      
      const currentDrop = 0;
      const currentLevel = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const tokensToAdd = [1, 2, 3, 4, 5 , 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      // add tokens to levels
      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );

      // Add waitList
      await oxxrDrop.addWaitListAddress(dropId, [waitListed.address.toLowerCase()]);
      // Add allowList
      await oxxrDrop.addAllowListAddress(dropId, [allowListed.address.toLowerCase()]);

      // Mint NFTs
      let tx = await oxxrDrop.connect(waitListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      let receipt = await tx.wait();
      let mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");

      // Verify that the NFTs were minted and sent to the caller's address
      let tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(waitListed.address);
      }

      // allowListed not expected to mint
      tx = await oxxrDrop.connect(allowListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      receipt = await tx.wait();
      mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");

      // Verify that the NFTs were minted and sent to the caller's address
      tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(allowListed.address);
      }

      // notListed not expected to mint
      await expect(oxxrDrop.connect(notListed).mint(dropId, levelId, tokensToMint, { value: totalCost })).to.be.revertedWith("You are not allowed to mint.");
    });

    it("AFTER DROP PERIOD: Every wallet address are able to mint to itself", async function () {
      // Set up a drop and level with available tokens
      const dropId = 0;
      const levelId = 1;
      const levelPrice = 100;
      const maxMintsPerAddress = 5;
      const tokensToMint = 2;
      const totalCost = levelPrice * tokensToMint;

      await oxxrDrop.addDrop("Test Drop", maxMintsPerAddress, Math.floor(Date.now() / 1000)-600, Math.floor(Date.now() / 1000)-300, Math.floor(Date.now() / 1000) -100);
      await oxxrDrop.setLevels(dropId, [levelPrice]);
      
      const currentDrop = 0;
      const currentLevel = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const tokensToAdd = [1, 2, 3, 4, 5 , 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

      // add tokens to levels
      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );

      // Add waitList
      await oxxrDrop.addWaitListAddress(dropId, [waitListed.address.toLowerCase()]);
      // Add allowList
      await oxxrDrop.addAllowListAddress(dropId, [allowListed.address.toLowerCase()]);

      // Mint NFTs
      let tx = await oxxrDrop.connect(waitListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      let receipt = await tx.wait();
      let mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");

      // Verify that the NFTs were minted and sent to the caller's address
      let tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(waitListed.address);
      }

      // allowListed not expected to mint
      tx = await oxxrDrop.connect(allowListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      receipt = await tx.wait();
      mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");

      // Verify that the NFTs were minted and sent to the caller's address
      tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(allowListed.address);
      }

      // notListed exected to mint
      tx = await oxxrDrop.connect(notListed).mint(dropId, levelId, tokensToMint, { value: totalCost });
      receipt = await tx.wait();
      mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");
 
      // Verify that the NFTs were minted and sent to the caller's address
      tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      for (let i = 0; i < tokenIds.length; i++) {
          expect(await oxxr.ownerOf(tokenIds[i])).to.equal(notListed.address);
      }
    });

    it("mints and sends NFTs to the caller's address and refunds excess cost", async function () {
      const provider = ethers.provider;
      // Set up a drop and level with available tokens
      const dropId = 0;
      const levelId = 1;
      const levelPrice = 100;
      const maxMintsPerAddress = 5;
      const tokensToMint = 3; // minting more tokens than available
      const totalCost = levelPrice * tokensToMint;
    
      await oxxrDrop.addDrop("Test Drop", maxMintsPerAddress, Math.floor(Date.now() / 1000)-1000, Math.floor(Date.now() / 1000) - 300, Math.floor(Date.now() / 1000) );
      await oxxrDrop.setLevels(dropId, [levelPrice]);
    
      const currentDrop = 0;
      const currentLevel = [1, 1, 1];
      const tokensToAdd = [1, 2, 3];

      const initialBalance = await other.getBalance();

      await oxxrDrop.addTokens(currentDrop, currentLevel, tokensToAdd );
      await oxxrDrop.addWaitListAddress(dropId, [minter.address.toLowerCase()]);
    
      // Mint one NFT for owner first
      await oxxrDrop.connect(owner).mint(dropId, levelId, 1, { value: levelPrice });

      // After try to mint more than existing NFT at this level.
      tx = await oxxrDrop.connect(other).mint(dropId, levelId, tokensToMint, { value: totalCost });
      const receipt = await tx.wait();
      const mintedTokenEvents = receipt.events.filter((event) => event.event === "MintedToken");
      
      // Gas Cost calculation
      const gasUsed = receipt.gasUsed;
      const gasPrice = (await provider.getTransaction(tx.hash)).gasPrice;
      const gasCost = gasUsed.mul(gasPrice);

      // Verify that only the available tokens were minted and sent to the caller's address
      const tokenIds = mintedTokenEvents.map((event) => event.args[0]);
      expect(tokenIds.length).to.equal(tokensToMint-1);
    
      // Verify that the excess cost was refunded to the caller's address
      const finalBalance = await other.getBalance();
      expect(finalBalance).to.equal(initialBalance.sub(totalCost).sub(gasCost));
    });
  });

  describe("Reentrancy", function () {
    it("should prevent reentrancy attacks on mint function", async function () {
      // Set up a malicious contract that tries to perform a reentrancy attack
      const MaliciousContract = await ethers.getContractFactory("MaliciousContract");
      const maliciousContract = await MaliciousContract.deploy(oxxrDrop.address);
      await maliciousContract.deployed();

      // Set up the drop and add tokens
      await oxxrDrop.addDrop("Test Drop", 5, 0, 0, 1000000000);
      await oxxrDrop.setLevels(0, [100]);
      await oxxrDrop.addTokens(0, [1], [1]);

      // Add the malicious contract to the waitlist
      await oxxrDrop.addWaitListAddress(0, [maliciousContract.address]);

      // Set up the malicious contract with the necessary data
      await maliciousContract.setAttackData(0, 1, 1);
      
      // Transfer ETH to MaliciousContract
      await owner.sendTransaction({
        to: maliciousContract.address,
        value: ethers.utils.parseEther("1.0")
      });

      // Try to execute the reentrancy attack
      await expect(maliciousContract.attack(
        {
          value: ethers.utils.parseEther("0.1"),
        }
      )).to.be.revertedWith("ReentrancyGuard: reentrant call");
    });
  });
});
  