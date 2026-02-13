import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // 1. Deploy Mock USDT (for testnet)
  console.log("\n1. Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // 2. Deploy PriceOracle
  console.log("\n2. Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("PriceOracle deployed to:", oracleAddress);

  // 3. Deploy AgentNFT
  console.log("\n3. Deploying AgentNFT...");
  const AgentNFT = await ethers.getContractFactory("AgentNFT");
  const nft = await AgentNFT.deploy(usdtAddress, "https://api.aiperp.fun/nft/");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("AgentNFT deployed to:", nftAddress);

  // 4. Deploy AIperpArena
  console.log("\n4. Deploying AIperpArena...");
  const AIperpArena = await ethers.getContractFactory("AIperpArena");
  const arena = await AIperpArena.deploy(
    usdtAddress,
    nftAddress,
    oracleAddress,
    deployer.address // fee recipient
  );
  await arena.waitForDeployment();
  const arenaAddress = await arena.getAddress();
  console.log("AIperpArena deployed to:", arenaAddress);

  // 5. Configure contracts
  console.log("\n5. Configuring contracts...");
  
  // Set arena contract in NFT
  await (await nft.setArenaContract(arenaAddress)).wait();
  console.log("✓ AgentNFT arena contract set");

  // Add arena as oracle updater
  await (await oracle.addUpdater(arenaAddress)).wait();
  console.log("✓ PriceOracle updater added");

  // Add arena as oracle updater (for price updates)
  await (await oracle.addUpdater(deployer.address)).wait();
  console.log("✓ Deployer added as oracle updater");

  // 6. Set initial prices
  console.log("\n6. Setting initial prices...");
  const pricePrecision = 10n ** 8n; // 8 decimals
  
  await (await oracle.updatePrice("BTC", 65000n * pricePrecision)).wait();
  await (await oracle.updatePrice("ETH", 3500n * pricePrecision)).wait();
  await (await oracle.updatePrice("SOL", 150n * pricePrecision)).wait();
  await (await oracle.updatePrice("MON", 15n * pricePrecision)).wait();
  console.log("✓ Initial prices set");

  // 7. Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDT: usdtAddress,
      PriceOracle: oracleAddress,
      AgentNFT: nftAddress,
      AIperpArena: arenaAddress,
    },
  };

  const deploymentPath = join(__dirname, "../deployments");
  writeFileSync(
    join(deploymentPath, `${deploymentInfo.network}-${Date.now()}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  writeFileSync(
    join(deploymentPath, "latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment completed!");
  console.log("\nContract Addresses:");
  console.log("===================");
  console.log(`MockUSDT:     ${usdtAddress}`);
  console.log(`PriceOracle:  ${oracleAddress}`);
  console.log(`AgentNFT:     ${nftAddress}`);
  console.log(`AIperpArena:  ${arenaAddress}`);
  console.log("\nDeployment info saved to deployments/latest.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
