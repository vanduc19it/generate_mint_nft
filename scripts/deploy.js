const hre = require("hardhat");
const ipfs = require("../src/ipfs.json");

async function main() {
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy("VANDUC", "VDC");

  await nft.deployed();
  
  console.log("Successfully deployed smart contract to: ", nft.address);

  await nft.mint(ipfs.url);

  console.log("NFT successfully minted");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});