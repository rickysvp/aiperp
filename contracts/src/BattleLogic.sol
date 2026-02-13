// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BattleLogic
 * @notice Library for battle calculations and PnL computation
 * @dev Pure functions for calculating battle outcomes
 */
library BattleLogic {
    
    // ============ Structs ============
    
    struct BattleResult {
        uint256 winnerSide;      // 0 = LONG, 1 = SHORT
        uint256 totalLoot;       // Total amount to distribute
        uint256 longPnL;         // Total PnL for long side
        uint256 shortPnL;        // Total PnL for short side
        int256 priceChange;      // Price change percentage (4 decimals)
    }
    
    struct AgentPnL {
        uint256 tokenId;
        int256 pnl;              // Can be negative
        bool liquidated;         // Whether agent was liquidated
        uint256 reward;          // Reward amount (if winner)
    }
    
    // ============ Constants ============
    
    uint256 public constant PRECISION = 10000;        // 4 decimal precision
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% loss = liquidation
    uint256 public constant MAX_LEVERAGE = 100;       // Max 100x leverage
    uint256 public constant PROTOCOL_FEE = 250;       // 2.5% fee (250 / 10000)
    
    // ============ Battle Calculation Functions ============
    
    /**
     * @notice Calculate battle outcome based on price change
     * @param longCollateral Total collateral on long side
     * @param shortCollateral Total collateral on short side
     * @param priceChangePercent Price change with 4 decimal precision (e.g., 500 = 5%)
     * @return result BattleResult struct with outcome details
     */
    function calculateBattleOutcome(
        uint256 longCollateral,
        uint256 shortCollateral,
        int256 priceChangePercent
    ) internal pure returns (BattleResult memory result) {
        require(longCollateral > 0 || shortCollateral > 0, "BattleLogic: No collateral");
        
        // Determine winner based on price direction
        bool longWins = priceChangePercent > 0;
        result.winnerSide = longWins ? 0 : 1;
        result.priceChange = priceChangePercent;
        
        // Calculate total PnL for each side
        uint256 absPriceChange = priceChangePercent > 0 
            ? uint256(priceChangePercent) 
            : uint256(-priceChangePercent);
        
        // PnL = Collateral * Leverage * PriceChange
        // For simplicity, we use average leverage of 10x in calculation
        uint256 leverage = 10;
        
        if (longWins) {
            // Long side wins
            result.longPnL = (longCollateral * leverage * absPriceChange) / PRECISION;
            result.shortPnL = (shortCollateral * leverage * absPriceChange) / PRECISION;
            
            // Cap short PnL at their collateral (can't lose more than deposited)
            if (result.shortPnL > shortCollateral) {
                result.shortPnL = shortCollateral;
            }
            
            // Loot is what the losing side loses
            result.totalLoot = result.shortPnL;
        } else {
            // Short side wins
            result.longPnL = (longCollateral * leverage * absPriceChange) / PRECISION;
            result.shortPnL = (shortCollateral * leverage * absPriceChange) / PRECISION;
            
            // Cap long PnL at their collateral
            if (result.longPnL > longCollateral) {
                result.longPnL = longCollateral;
            }
            
            result.totalLoot = result.longPnL;
        }
        
        return result;
    }
    
    /**
     * @notice Calculate individual agent PnL
     * @param collateral Agent's collateral
     * @param leverage Agent's leverage (1-100)
     * @param isLong Whether agent is long
     * @param entryPrice Entry price
     * @param exitPrice Current/exit price
     * @return pnl Profit or loss (can be negative)
     */
    function calculateAgentPnL(
        uint256 collateral,
        uint256 leverage,
        bool isLong,
        uint256 entryPrice,
        uint256 exitPrice
    ) internal pure returns (int256 pnl) {
        require(entryPrice > 0, "BattleLogic: Invalid entry price");
        require(leverage > 0 && leverage <= MAX_LEVERAGE, "BattleLogic: Invalid leverage");
        
        // Price difference percentage
        int256 priceDiff;
        if (exitPrice >= entryPrice) {
            priceDiff = int256((exitPrice - entryPrice) * PRECISION / entryPrice);
        } else {
            priceDiff = -int256((entryPrice - exitPrice) * PRECISION / entryPrice);
        }
        
        // Apply direction
        if (!isLong) {
            priceDiff = -priceDiff;
        }
        
        // PnL = Collateral * Leverage * PriceChange%
        pnl = (int256(collateral) * int256(leverage) * priceDiff) / int256(PRECISION);
        
        return pnl;
    }
    
    /**
     * @notice Check if agent should be liquidated
     * @param pnl Current PnL (can be negative)
     * @param collateral Agent's collateral
     * @return willLiquidate True if agent should be liquidated
     */
    function shouldLiquidate(
        int256 pnl,
        uint256 collateral
    ) internal pure returns (bool willLiquidate) {
        if (pnl >= 0) return false;
        
        uint256 loss = uint256(-pnl);
        uint256 maxLoss = (collateral * LIQUIDATION_THRESHOLD) / PRECISION;
        
        return loss >= maxLoss;
    }
    
    /**
     * @notice Calculate reward distribution for winning agents
     * @param agentCollateral Agent's collateral
     * @param totalWinnerCollateral Total collateral of all winners
     * @param totalLoot Total loot pool
     * @return reward Agent's reward amount
     */
    function calculateReward(
        uint256 agentCollateral,
        uint256 totalWinnerCollateral,
        uint256 totalLoot
    ) internal pure returns (uint256 reward) {
        require(totalWinnerCollateral > 0, "BattleLogic: No winners");
        
        // Reward proportional to collateral share
        reward = (agentCollateral * totalLoot) / totalWinnerCollateral;
        
        return reward;
    }
    
    /**
     * @notice Calculate protocol fee
     * @param amount Amount to charge fee on
     * @return feeAmount Fee amount
     * @return netAmount Amount after fee
     */
    function calculateProtocolFee(
        uint256 amount
    ) internal pure returns (uint256 feeAmount, uint256 netAmount) {
        feeAmount = (amount * PROTOCOL_FEE) / PRECISION;
        netAmount = amount - feeAmount;
        
        return (feeAmount, netAmount);
    }
    
    /**
     * @notice Check if take profit or stop loss should trigger
     * @param entryPrice Entry price
     * @param currentPrice Current price
     * @param isLong Long or short
     * @param takeProfit Take profit percentage (0 if not set)
     * @param stopLoss Stop loss percentage (0 if not set)
     * @return shouldExit Whether agent should exit
     * @return exitReason 0 = None, 1 = Take Profit, 2 = Stop Loss
     */
    function checkExitConditions(
        uint256 entryPrice,
        uint256 currentPrice,
        bool isLong,
        uint256 takeProfit,
        uint256 stopLoss
    ) internal pure returns (bool shouldExit, uint256 exitReason) {
        if (entryPrice == 0) return (false, 0);
        
        int256 priceChange;
        if (currentPrice >= entryPrice) {
            priceChange = int256((currentPrice - entryPrice) * PRECISION / entryPrice);
        } else {
            priceChange = -int256((entryPrice - currentPrice) * PRECISION / entryPrice);
        }
        
        if (!isLong) {
            priceChange = -priceChange;
        }
        
        // Check take profit
        if (takeProfit > 0 && priceChange >= int256(takeProfit * PRECISION / 100)) {
            return (true, 1);
        }
        
        // Check stop loss (negative price change)
        if (stopLoss > 0 && priceChange <= -int256(stopLoss * PRECISION / 100)) {
            return (true, 2);
        }
        
        return (false, 0);
    }
    
    /**
     * @notice Calculate total collateral for a set of agents
     * @param collaterals Array of collateral amounts
     * @return total Total collateral
     */
    function calculateTotalCollateral(
        uint256[] memory collaterals
    ) internal pure returns (uint256 total) {
        for (uint i = 0; i < collaterals.length; i++) {
            total += collaterals[i];
        }
        return total;
    }
    
    /**
     * @notice Calculate weighted average leverage
     * @param collaterals Array of collateral amounts
     * @param leverages Array of leverage values
     * @return avgLeverage Weighted average leverage
     */
    function calculateAverageLeverage(
        uint256[] memory collaterals,
        uint256[] memory leverages
    ) internal pure returns (uint256 avgLeverage) {
        require(collaterals.length == leverages.length, "BattleLogic: Array length mismatch");
        
        uint256 totalCollateral = 0;
        uint256 weightedLeverage = 0;
        
        for (uint i = 0; i < collaterals.length; i++) {
            totalCollateral += collaterals[i];
            weightedLeverage += collaterals[i] * leverages[i];
        }
        
        if (totalCollateral == 0) return 0;
        
        avgLeverage = weightedLeverage / totalCollateral;
        return avgLeverage;
    }
}
