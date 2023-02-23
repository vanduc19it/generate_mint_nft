const hre = require("hardhat");

async function main() {
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy("VANDUC", "VDC");

  await nft.deployed();
  
  console.log("Successfully deployed smart contract to: ", nft.address);

  await nft.mint("https://ipfs.io/ipfs/bafyreifcu7jjikupeh7h7xlyxjdqz4l3ji2xfjbi6t3w7t4y4imsyontfu/metadata.json");

  console.log("NFT successfully minted");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});