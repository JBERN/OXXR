const { ethers, upgrades } = require("hardhat");

async function main() {
  const CONTRACT_NAME_V1 = "OXXR";
  const CONTRACT_NAME_V2 = "OXXRV2";
  // Deploying
  const FACTORY_V1 = await ethers.getContractFactory(CONTRACT_NAME_V1);
  const CONTRACT_V1 = await upgrades.deployProxy(FACTORY_V1);
  await CONTRACT_V1.deployed();

  console.log("OXXR V1 deployed to:", CONTRACT_V1.address);

  // Upgrading proxy to V2
  const FACTORY_V2 = await ethers.getContractFactory(CONTRACT_NAME_V2);
  const CONTRACT_V2 = await upgrades.upgradeProxy(CONTRACT_V1.address, FACTORY_V2);

  console.log( CONTRACT_NAME_V2 + " upgraded to:", CONTRACT_V2.address);
}

main();