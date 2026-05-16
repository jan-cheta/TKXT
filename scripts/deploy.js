const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const NFTTicket = await hre.ethers.getContractFactory("NFTTicket");
  const contract = await NFTTicket.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("NFTTicket deployed to:", address);

  // Write address + ABI into frontend so it can be imported directly
  const artifact = await hre.artifacts.readArtifact("NFTTicket");
  const deployInfo = {
    address,
    abi: artifact.abi,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const outPath = path.join(__dirname, "../frontend/contract.json");
  fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
  console.log("Contract info written to frontend/contract.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
