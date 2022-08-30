const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");

describe("OXXR V1 TESTS: ", function () {
    let contract, owner, addr1;
    const ContractNameV1 = "OXXR";

    // BEFORE EACH ASYNC FUNCTION : Get Wallets and deploy contract
    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners(2);
        const factoryV1 = await ethers.getContractFactory(ContractNameV1);
        contract = await upgrades.deployProxy(factoryV1, [], { initializer: 'initialize', kind: 'uups' });
        await contract.deployed();
    });

    it("Contract V1 can mint NFTs", async function () {
        try {
            await contract.safeMint(owner.address, 123456);
            expect(await contract.balanceOf(owner.address)).to.equal(1);
            expect(await contract.ownerOf(123456)).to.equal(owner.address);
            expect(await contract.totalSupply()).to.equal(1);
        } catch (error) {
            console.log(error.message);
        }
    });

    it("Only Minter can mint NFTs", async function () {
        try {
            // Revert Message expected
            let errorMessage = "AccessControl: account " + addr1.address.toLowerCase() + " is missing role ";
            let minterRole = await contract.MINTER_ROLE();
            errorMessage = errorMessage + minterRole.toLowerCase();
            // expect to revert
            await expect(contract.connect(addr1).safeMint(addr1.address, 654321))
                .to.be.revertedWith(errorMessage);
        } catch (error) {
            console.log(error.message);
        }
    });

    it("UPGRATABLERS can set BaseTokenURI", async function () {
        await contract.connect(owner).setBaseTokenURI("www.server.com/");
        expect(await contract.baseTokenURI()).to.equal("www.server.com/");
        expect(await contract.tokenURI(123456)).to.equal("www.server.com/123456");
    });

    it("Only UPGRATABLERS can set BaseTokenURI", async function () {
        try {
            let errorMessage = "AccessControl: account " + addr1.address.toLowerCase() + " is missing role ";
            let role = await contract.UPGRADER_ROLE();
            errorMessage = errorMessage + role.toLowerCase();

            // expect to revert
            await expect(contract.connect(addr1).setBaseTokenURI("www.server.com/"))
                .to.be.revertedWith(errorMessage);
        } catch (error) {
            console.log(error.message);
        }
    });

    it("Contract version is equal 1", async function () {
        expect(await contract.version()).to.equal(1);
    });

});






