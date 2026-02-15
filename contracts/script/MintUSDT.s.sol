// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDT.sol";

/**
 * @title MintUSDT
 * @notice Mint MockUSDT to a specific address
 * @dev Run: forge script script/MintUSDT.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast --legacy
 */
contract MintUSDT is Script {
    // Contract address
    address constant USDT_CONTRACT = 0xBf383e596a8E5f21FaAFCBd88F824356A47D61f9;
    
    // Target address (deployer wallet) - checksummed
    address constant TARGET = 0x2AdA9f18330985935E0839E8643C5E3AD56c03BD;
    
    // Amount to mint (in USDT, 6 decimals)
    uint256 constant MINT_AMOUNT = 100000 * 10**6; // 100,000 USDT
    
    function run() external {
        // Start broadcast
        vm.startBroadcast();
        
        // Get USDT contract
        MockUSDT usdt = MockUSDT(USDT_CONTRACT);
        
        // Mint USDT
        usdt.mint(TARGET, MINT_AMOUNT);
        
        console.log("Minted", MINT_AMOUNT / 1e6, "USDT to", TARGET);
        
        vm.stopBroadcast();
    }
}
