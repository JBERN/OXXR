const { expect, assert } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");

describe("OXXR V2 TESTS:", function () {
    let contractV1, contractV2, owner, addr1;
    const CONTRACT_NAME_V1 = "OXXR";
    const CONTRACT_NAME_V2 = "OXXRV2";

    //BEFORE EACH ASYNC FUNCTION: get wallets and deploy UUPS proxy V1 and V2
    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners(2);
        // Deploy V1
        const FACTORY_V1 = await ethers.getContractFactory(CONTRACT_NAME_V1);
        contractV1 = await upgrades.deployProxy(FACTORY_V1, [], { initializer: 'initialize', kind: 'uups' });
        await contractV1.deployed();
        // Deploy V2
        const FACTORY_V2 = await ethers.getContractFactory(CONTRACT_NAME_V2);
        contractV2 = await upgrades.upgradeProxy(contractV1, FACTORY_V2);
    });

    it("MINTERS can mint NFTs", async function () {
        const expectedValue = 1;

        await contractV2.safeMintWithName(owner.address, 123456, "Lorem Ipsum");
        expect(await contractV2.balanceOf(owner.address)).to.equal(1);
        expect(await contractV2.ownerOf(123456)).to.equal(owner.address);
        expect(await contractV2.totalSupply()).to.equal(expectedValue);
    });

    it('Only MINTER Role can mint NFTs with a name', async function () {
        // Revert Message expected
        let errorMessage = "AccessControl: account " + addr1.address.toLowerCase() + " is missing role ";
        let minterRole = await contractV2.MINTER_ROLE();
        errorMessage = errorMessage + minterRole.toLowerCase();

        // expect to revert
        await expect(contractV2.connect(addr1).safeMintWithName(addr1.address, 654321, "Lorem ipsum"))
            .to.be.revertedWith(errorMessage);
    });

    it("Owner of an NFT can set a name to an NFT", async function () {
        try {
            const expectedValue = "Lorem Ipsum";
            // contractV2["safeMint(address, uint256, string)"](owner.address, 12332511, "test");
            await contractV2.safeMintWithName(addr1.address, 123456, "");
            expect(await contractV2.balanceOf(addr1.address)).to.equal(1);
            expect(await contractV2.ownerOf(123456)).to.equal(addr1.address);
            console.log(await contractV2.getDiamondName(123456));
            await contractV2.connect(addr1).setDiamondName(123456, "Lorem Ipsum");
            expect(await contractV2.getDiamondName(123456)).to.equal(expectedValue);
        } catch (error) {
            console.log(error.message);
        }
    });

    it("Only NFT Owner of the NFT can set a name", async function () {
        await contractV2.safeMintWithName(addr1.address, 123456, "");
        expect(await contractV2.balanceOf(addr1.address)).to.equal(1);
        expect(await contractV2.ownerOf(123456)).to.equal(addr1.address);
        await expect(contractV2.connect(owner).setDiamondName(123456, "Lorem Ipsum")).to.be.reverted;
    });

    it("NFT Owner can't set an empty name", async function () {
        await contractV2.safeMintWithName(addr1.address, 123456, "");
        expect(await contractV2.balanceOf(addr1.address)).to.equal(1);
        expect(await contractV2.ownerOf(123456)).to.equal(addr1.address);
        await expect(contractV2.connect(addr1).setDiamondName(123456, "")).to.be.reverted;
    });

    it("NFT Owner can't set a name to an already named NFT", async function () {
        await contractV2.safeMintWithName(addr1.address, 123456, "Lorem Ipsum");
        expect(await contractV2.balanceOf(addr1.address)).to.equal(1);
        expect(await contractV2.ownerOf(123456)).to.equal(addr1.address);
        await expect(contractV2.connect(addr1).setDiamondName(123456, "Lorem Ipsum 2")).to.be.reverted;
    });

    it("NFT Owner can't set a name too long", async function () {
        await contractV2.safeMintWithName(addr1.address, 123456, "");
        expect(await contractV2.balanceOf(addr1.address)).to.equal(1);
        expect(await contractV2.ownerOf(123456)).to.equal(addr1.address);
        await expect(contractV2.connect(addr1).setDiamondName(123456, "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean ma")).to.be.reverted;
    });

    it("UPGRATABLE Profil can set BaseTokenURI", async function () {
        await contractV2.connect(owner).setBaseTokenURI("www.server2.com/");
        expect(await contractV2.baseTokenURI()).to.equal("www.server2.com/");
        expect(await contractV2.tokenURI(123456)).to.equal("www.server2.com/123456");
    });

    it("Only UPGRATABLE user can set BaseTokenURI", async function () {
        try {
            let errorMessage = "AccessControl: account " + addr1.address.toLowerCase() + " is missing role ";
            let role = await contractV1.UPGRADER_ROLE();
            errorMessage = errorMessage + role.toLowerCase();

            // expect to revert
            await expect(contractV2.connect(addr1).setBaseTokenURI("www.server2.com/"))
                .to.be.revertedWith(errorMessage);
        } catch (error) {
            console.log(error.message);
        }
    });

    it("Contract version is equal 2", async function () {
        expect(await contractV2.version()).to.equal(2);
    });

});