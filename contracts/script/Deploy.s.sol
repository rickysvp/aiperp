// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDT.sol";
import "../src/PriceOracle.sol";
import "../src/AgentNFT.sol";
import "../src/AIperpArena.sol";

contract DeployScript is Script {
    function run() external {
        // Use Anvil's default private key for local testing
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        // Start prank as deployer
        vm.startPrank(deployer);

        // 1. Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("MockUSDT deployed at:", address(usdt));

        // 2. Deploy Price Oracle
        PriceOracle oracle = new PriceOracle();
        console.log("PriceOracle deployed at:", address(oracle));

        // 3. Add authorized updaters for oracle
        oracle.addUpdater(deployer);
        console.log("Added deployer as oracle authorized updater");

        // 4. Deploy Agent NFT (requires USDT address and base URI)
        AgentNFT agentNFT = new AgentNFT(address(usdt), "https://api.aiperp.fun/metadata/");
        console.log("AgentNFT deployed at:", address(agentNFT));

        // 5. Deploy AIperp Arena (requires USDT, NFT, Oracle, FeeRecipient)
        AIperpArena arena = new AIperpArena(
            address(usdt),
            address(agentNFT),
            address(oracle),
            deployer  // fee recipient
        );
        console.log("AIperpArena deployed at:", address(arena));

        // 6. Configure contracts
        // Add supported assets
        oracle.addAsset("BTC");
        oracle.addAsset("ETH");
        oracle.addAsset("SOL");
        console.log("Added supported assets: BTC, ETH, SOL");

        // Set initial prices (8 decimals)
        oracle.updatePrice("BTC", 6500000000000); // $65,000
        oracle.updatePrice("ETH", 350000000000);  // $3,500
        oracle.updatePrice("SOL", 150000000);     // $150
        console.log("Set initial prices for assets");

        // Mint some USDT to deployer for testing
        usdt.mint(deployer, 1000000 * 10**6); // 1M USDT
        console.log("Minted 1M USDT to deployer");

        vm.stopPrank();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid == 10143 ? "Monad Testnet" : "Local");
        console.log("Deployer:", deployer);
        console.log("MockUSDT:", address(usdt));
        console.log("PriceOracle:", address(oracle));
        console.log("AgentNFT:", address(agentNFT));
        console.log("AIperpArena:", address(arena));
        console.log("==========================\n");
    }
}
