// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaCorePyth.sol";

/**
 * @title UpgradeArena
 * @notice Deploy new ArenaCorePyth with active agent index support
 * @dev Uses existing USDT, AgentNFT, and Pyth contracts
 */
contract UpgradeArena is Script {
    // Existing contract addresses (from previous deployment)
    address constant USDT = 0xBf383e596a8E5f21FaAFCBd88F824356A47D61f9;
    address constant AGENT_NFT = 0xA4219685E3ac14124Bf3839f74e9fB61298f4003;
    address constant PYTH = 0x5bA99db6D61a09b998409f9F1cB83449B5C2a890;
    address constant FEE_RECIPIENT = 0xCbD07EEf73E6583A9A45db65E911788FA5232bE9;
    
    // Pyth Price Feed ID for BTC/USD
    bytes32 constant BTC_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    
    function run() external {
        // Start broadcast
        vm.startBroadcast();
        
        // Deploy new ArenaCorePyth with active agent index
        ArenaCorePyth arena = new ArenaCorePyth(
            USDT,
            AGENT_NFT,
            PYTH,
            BTC_PRICE_ID,
            FEE_RECIPIENT,
            60  // pythMaxAge: 60 seconds
        );
        console.log("New ArenaCorePyth deployed at:", address(arena));
        
        // Update arena contract in AgentNFT
        // Note: This requires the current owner to execute
        // AgentNFTV2(AGENT_NFT).setArenaContract(address(arena));
        console.log("NOTE: Please update arena contract in AgentNFT manually:");
        console.log("AgentNFT.setArenaContract to:", address(arena));
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== DEPLOYMENT INFO ===");
        console.log("Network: monad-testnet");
        console.log("USDT:", USDT);
        console.log("AgentNFT:", AGENT_NFT);
        console.log("Pyth:", PYTH);
        console.log("New ArenaCorePyth:", address(arena));
        console.log("FeeRecipient:", FEE_RECIPIENT);
        console.log("=======================\n");
    }
}
