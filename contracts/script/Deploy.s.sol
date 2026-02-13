// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDT.sol";
import "../src/PriceOracle.sol";
import "../src/AgentNFT.sol";
import "../src/AIperpArena.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("MockUSDT deployed at:", address(usdt));

        // 2. Deploy Price Oracle
        PriceOracle oracle = new PriceOracle();
        console.log("PriceOracle deployed at:", address(oracle));

        // 3. Add authorized updaters for oracle
        oracle.addAuthorized(deployer);
        console.log("Added deployer as oracle authorized updater");

        // 4. Deploy Agent NFT
        AgentNFT agentNFT = new AgentNFT();
        console.log("AgentNFT deployed at:", address(agentNFT));

        // 5. Deploy AIperp Arena
        AIperpArena arena = new AIperpArena(
            address(usdt),
            address(oracle),
            address(agentNFT)
        );
        console.log("AIperpArena deployed at:", address(arena));

        // 6. Configure contracts
        // Add supported assets
        oracle.addSupportedAsset("BTC");
        oracle.addSupportedAsset("ETH");
        oracle.addSupportedAsset("SOL");
        console.log("Added supported assets: BTC, ETH, SOL");

        // Set initial prices (8 decimals)
        oracle.updatePrice("BTC", 6500000000000); // $65,000
        oracle.updatePrice("ETH", 350000000000);  // $3,500
        oracle.updatePrice("SOL", 150000000);     // $150
        console.log("Set initial prices for assets");

        // Mint some USDT to deployer for testing
        usdt.mint(deployer, 1000000 * 10**6); // 1M USDT
        console.log("Minted 1M USDT to deployer");

        vm.stopBroadcast();

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
