// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BattleLogic.sol";

interface IAgentNFT {
    struct AgentAttributes {
        string name;
        string bio;
        string strategy;
        string avatarSeed;
        uint8 riskLevel;
        uint256 mintTime;
        address minter;
        bool isActive;
    }

    function ownerOf(uint256 tokenId) external view returns (address);
    function updateAgentStatus(uint256 tokenId, bool isActive) external;
    function getUserAgents(address user) external view returns (uint256[] memory);
    function agentAttributes(uint256 tokenId) external view returns (AgentAttributes memory);
    function exists(uint256 tokenId) external view returns (bool);
    function nextTokenId() external view returns (uint256);
}

interface IPriceOracle {
    function getPrice(string memory asset) external view returns (uint256);
    function updatePrice(string memory asset, uint256 price) external;
}

/**
 * @title AIperpArena
 * @notice Main arena contract for AIperp trading battles
 * @dev Handles agent deployment, battle settlement, and reward distribution
 */
contract AIperpArena is ReentrancyGuard, Ownable, Pausable {
    using BattleLogic for *;
    
    // ============ Enums ============
    
    enum Direction { LONG, SHORT, AUTO }
    enum AgentStatus { IDLE, ACTIVE, LIQUIDATED }
    
    // ============ Structs ============
    
    struct Agent {
        uint256 tokenId;
        address owner;
        Direction direction;
        uint256 leverage;        // 1-100x
        uint256 collateral;      // USDT amount (6 decimals)
        int256 pnl;             // Can be negative
        uint256 entryPrice;     // Price at deployment (8 decimals)
        uint256 lastUpdateTime;
        AgentStatus status;
        uint256 takeProfit;     // Percentage (0 if not set)
        uint256 stopLoss;       // Percentage (0 if not set)
        string asset;           // Trading asset (e.g., "BTC")
    }
    
    struct BattleRound {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 longTotal;      // Total long collateral
        uint256 shortTotal;     // Total short collateral
        uint256 winningSide;    // 0 = LONG, 1 = SHORT
        int256 priceChange;     // Price change % (4 decimals)
        bool settled;
    }
    
    struct LootEvent {
        uint256 roundId;
        address winner;
        address victim;
        uint256 amount;
        uint256 timestamp;
    }
    
    // ============ State Variables ============
    
    IERC20 public usdtToken;
    IAgentNFT public agentNFT;
    IPriceOracle public priceOracle;
    
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => BattleRound) public battleRounds;
    mapping(uint256 => LootEvent[]) public roundLoots;
    mapping(address => uint256) public userBalances;
    mapping(string => uint256) public assetPrices;
    
    uint256 public currentRoundId = 1;
    uint256 public constant ROUND_DURATION = 1 minutes;
    uint256 public constant MIN_COLLATERAL = 100 * 10**6;    // 100 USDT
    uint256 public constant MAX_COLLATERAL = 10000 * 10**6;  // 10,000 USDT
    uint256 public constant LIQUIDATION_THRESHOLD = 8000;    // 80%
    
    uint256 public totalStaked;
    uint256 public protocolFee = 250; // 2.5% (250/10000)
    address public feeRecipient;
    
    string[] public supportedAssets;
    
    // ============ Events ============
    
    event AgentDeployed(
        uint256 indexed tokenId,
        address indexed owner,
        Direction direction,
        uint256 leverage,
        uint256 collateral,
        string asset,
        uint256 entryPrice
    );
    
    event BattleSettled(
        uint256 indexed roundId,
        uint256 winningSide,
        int256 priceChange,
        uint256 totalLoot,
        uint256 longTotal,
        uint256 shortTotal
    );
    
    event LootDistributed(
        uint256 indexed roundId,
        address indexed winner,
        uint256 amount
    );
    
    event AgentLiquidated(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 collateralLost
    );
    
    event AgentExited(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 returnedCollateral,
        int256 finalPnl
    );
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    // ============ Constructor ============
    
    constructor(
        address _usdtToken,
        address _agentNFT,
        address _priceOracle,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Arena: Invalid USDT");
        require(_agentNFT != address(0), "Arena: Invalid NFT");
        require(_priceOracle != address(0), "Arena: Invalid Oracle");
        require(_feeRecipient != address(0), "Arena: Invalid fee recipient");
        
        usdtToken = IERC20(_usdtToken);
        agentNFT = IAgentNFT(_agentNFT);
        priceOracle = IPriceOracle(_priceOracle);
        feeRecipient = _feeRecipient;
        
        // Initialize first round
        battleRounds[1] = BattleRound({
            roundId: 1,
            startTime: block.timestamp,
            endTime: 0,
            longTotal: 0,
            shortTotal: 0,
            winningSide: 0,
            priceChange: 0,
            settled: false
        });
        
        // Add default assets
        supportedAssets.push("BTC");
        supportedAssets.push("ETH");
        supportedAssets.push("SOL");
        supportedAssets.push("MON");
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Deposit USDT into arena
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Arena: Invalid amount");
        usdtToken.transferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice Withdraw USDT from arena
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Arena: Invalid amount");
        require(userBalances[msg.sender] >= amount, "Arena: Insufficient balance");
        
        userBalances[msg.sender] -= amount;
        usdtToken.transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @notice Deploy an agent into battle
     * @param tokenId Agent NFT token ID
     * @param direction Trading direction
     * @param leverage Leverage (1-100)
     * @param collateral Collateral amount (USDT)
     * @param takeProfit Take profit percentage (0 if not set)
     * @param stopLoss Stop loss percentage (0 if not set)
     * @param asset Asset to trade
     */
    function deployAgent(
        uint256 tokenId,
        Direction direction,
        uint256 leverage,
        uint256 collateral,
        uint256 takeProfit,
        uint256 stopLoss,
        string memory asset
    ) external nonReentrant whenNotPaused {
        // Validation
        require(agentNFT.ownerOf(tokenId) == msg.sender, "Arena: Not owner");
        require(agents[tokenId].status == AgentStatus.IDLE, "Arena: Already deployed");
        require(collateral >= MIN_COLLATERAL, "Arena: Below min collateral");
        require(collateral <= MAX_COLLATERAL, "Arena: Above max collateral");
        require(leverage >= 1 && leverage <= 100, "Arena: Invalid leverage");
        require(_isAssetSupported(asset), "Arena: Asset not supported");
        require(userBalances[msg.sender] >= collateral, "Arena: Insufficient balance");
        
        // Get current price
        uint256 entryPrice = priceOracle.getPrice(asset);
        
        // Deduct collateral from user balance
        userBalances[msg.sender] -= collateral;
        
        // Create agent
        agents[tokenId] = Agent({
            tokenId: tokenId,
            owner: msg.sender,
            direction: direction,
            leverage: leverage,
            collateral: collateral,
            pnl: 0,
            entryPrice: entryPrice,
            lastUpdateTime: block.timestamp,
            status: AgentStatus.ACTIVE,
            takeProfit: takeProfit,
            stopLoss: stopLoss,
            asset: asset
        });
        
        // Update totals
        totalStaked += collateral;
        
        // Update round totals
        if (direction == Direction.LONG) {
            battleRounds[currentRoundId].longTotal += collateral;
        } else {
            battleRounds[currentRoundId].shortTotal += collateral;
        }
        
        // Update NFT status
        agentNFT.updateAgentStatus(tokenId, true);
        
        emit AgentDeployed(
            tokenId,
            msg.sender,
            direction,
            leverage,
            collateral,
            asset,
            entryPrice
        );
    }
    
    /**
     * @notice Exit an agent and claim rewards
     * @param tokenId Agent NFT token ID
     */
    function exitAgent(uint256 tokenId) external nonReentrant whenNotPaused {
        Agent storage agent = agents[tokenId];
        require(agent.owner == msg.sender, "Arena: Not owner");
        require(agent.status == AgentStatus.ACTIVE, "Arena: Not active");
        
        // Get current price
        uint256 currentPrice = priceOracle.getPrice(agent.asset);
        
        // Calculate final PnL
        int256 finalPnl = BattleLogic.calculateAgentPnL(
            agent.collateral,
            agent.leverage,
            agent.direction == Direction.LONG,
            agent.entryPrice,
            currentPrice
        );
        
        // Calculate return amount
        uint256 returnAmount;
        if (finalPnl > 0) {
            returnAmount = agent.collateral + uint256(finalPnl);
        } else {
            uint256 loss = uint256(-finalPnl);
            returnAmount = loss >= agent.collateral ? 0 : agent.collateral - loss;
        }
        
        // Deduct protocol fee
        if (returnAmount > 0) {
            (uint256 fee, uint256 netAmount) = BattleLogic.calculateProtocolFee(returnAmount);
            usdtToken.transfer(feeRecipient, fee);
            userBalances[msg.sender] += netAmount;
            returnAmount = netAmount;
        }
        
        // Update round totals
        if (agent.direction == Direction.LONG) {
            battleRounds[currentRoundId].longTotal -= agent.collateral;
        } else {
            battleRounds[currentRoundId].shortTotal -= agent.collateral;
        }
        
        // Update state
        agent.status = AgentStatus.IDLE;
        agent.pnl = finalPnl;
        totalStaked -= agent.collateral;
        
        // Update NFT status
        agentNFT.updateAgentStatus(tokenId, false);
        
        emit AgentExited(tokenId, msg.sender, returnAmount, finalPnl);
    }
    
    /**
     * @notice Settle current battle round
     * @param asset Asset to settle
     * @param newPrice New price (8 decimals)
     */
    function settleBattleRound(string memory asset, uint256 newPrice) external onlyOwner {
        BattleRound storage round = battleRounds[currentRoundId];
        require(!round.settled, "Arena: Already settled");
        require(block.timestamp >= round.startTime + ROUND_DURATION, "Arena: Round not ended");
        
        uint256 oldPrice = assetPrices[asset];
        if (oldPrice == 0) {
            oldPrice = priceOracle.getPrice(asset);
        }
        assetPrices[asset] = newPrice;
        
        // Calculate price change
        int256 priceChange;
        if (newPrice >= oldPrice) {
            priceChange = int256(((newPrice - oldPrice) * 10000) / oldPrice);
        } else {
            priceChange = -int256(((oldPrice - newPrice) * 10000) / oldPrice);
        }
        
        // Determine winner
        uint256 winningSide = priceChange > 0 ? 0 : 1;
        
        round.winningSide = winningSide;
        round.priceChange = priceChange;
        round.endTime = block.timestamp;
        round.settled = true;
        
        // Calculate battle result
        BattleLogic.BattleResult memory result = BattleLogic.calculateBattleOutcome(
            round.longTotal,
            round.shortTotal,
            priceChange
        );
        
        // Distribute rewards
        _distributeRewards(currentRoundId, winningSide, result.totalLoot);
        
        // Check liquidations
        _checkLiquidations(asset, newPrice);
        
        emit BattleSettled(
            currentRoundId,
            winningSide,
            priceChange,
            result.totalLoot,
            round.longTotal,
            round.shortTotal
        );
        
        // Start new round
        currentRoundId++;
        battleRounds[currentRoundId] = BattleRound({
            roundId: currentRoundId,
            startTime: block.timestamp,
            endTime: 0,
            longTotal: 0,
            shortTotal: 0,
            winningSide: 0,
            priceChange: 0,
            settled: false
        });
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Distribute rewards to winning agents
     * @param roundId Current round ID
     * @param winningSide 0 = LONG, 1 = SHORT
     * @param totalLoot Total amount to distribute
     */
    function _distributeRewards(uint256 roundId, uint256 winningSide, uint256 totalLoot) internal {
        if (totalLoot == 0) return;
        
        // Get all active agents for this round
        uint256[] memory activeAgentIds = _getAllActiveAgents();
        if (activeAgentIds.length == 0) return;
        
        // Calculate total collateral of winners
        uint256 totalWinnerCollateral = 0;
        uint256[] memory winnerIds = new uint256[](activeAgentIds.length);
        uint256 winnerCount = 0;
        
        for (uint i = 0; i < activeAgentIds.length; i++) {
            Agent storage agent = agents[activeAgentIds[i]];
            bool isWinner = (winningSide == 0 && agent.direction == Direction.LONG) || 
                           (winningSide == 1 && agent.direction == Direction.SHORT);
            
            if (isWinner) {
                totalWinnerCollateral += agent.collateral;
                winnerIds[winnerCount] = activeAgentIds[i];
                winnerCount++;
            }
        }
        
        if (totalWinnerCollateral == 0) return;
        
        // Distribute rewards proportionally
        for (uint i = 0; i < winnerCount; i++) {
            Agent storage agent = agents[winnerIds[i]];
            uint256 reward = BattleLogic.calculateReward(
                agent.collateral,
                totalWinnerCollateral,
                totalLoot
            );
            
            // Add reward to agent's PnL
            agent.pnl += int256(reward);
            
            // Record loot event
            roundLoots[roundId].push(LootEvent({
                roundId: roundId,
                winner: agent.owner,
                victim: address(0), // Multiple victims
                amount: reward,
                timestamp: block.timestamp
            }));
            
            emit LootDistributed(roundId, agent.owner, reward);
        }
    }
    
    /**
     * @notice Check and execute liquidations
     * @param asset Asset symbol
     * @param currentPrice Current asset price
     */
    function _checkLiquidations(string memory asset, uint256 currentPrice) internal {
        uint256[] memory activeAgentIds = _getAllActiveAgents();
        
        for (uint i = 0; i < activeAgentIds.length; i++) {
            Agent storage agent = agents[activeAgentIds[i]];
            
            // Only check agents trading this asset
            if (keccak256(bytes(agent.asset)) != keccak256(bytes(asset))) continue;
            
            // Calculate current PnL
            int256 currentPnL = BattleLogic.calculateAgentPnL(
                agent.collateral,
                agent.leverage,
                agent.direction == Direction.LONG,
                agent.entryPrice,
                currentPrice
            );
            
            // Check if should liquidate
            if (BattleLogic.shouldLiquidate(currentPnL, agent.collateral)) {
                _liquidateAgent(activeAgentIds[i], agent, currentPnL);
            }
        }
    }
    
    /**
     * @notice Liquidate an agent
     * @param tokenId Agent token ID
     * @param agent Agent storage reference
     * @param pnl Current PnL (negative)
     */
    function _liquidateAgent(uint256 tokenId, Agent storage agent, int256 pnl) internal {
        require(agent.status == AgentStatus.ACTIVE, "Arena: Not active");
        
        uint256 collateralLost = agent.collateral;
        
        // Update round totals
        if (agent.direction == Direction.LONG) {
            battleRounds[currentRoundId].longTotal -= agent.collateral;
        } else {
            battleRounds[currentRoundId].shortTotal -= agent.collateral;
        }
        
        // Update agent status
        agent.status = AgentStatus.LIQUIDATED;
        agent.pnl = pnl;
        totalStaked -= agent.collateral;
        
        // Update NFT status
        agentNFT.updateAgentStatus(tokenId, false);
        
        emit AgentLiquidated(tokenId, agent.owner, collateralLost);
    }
    
    /**
     * @notice Get all active agent token IDs
     * @return Array of active agent token IDs
     */
    function _getAllActiveAgents() internal view returns (uint256[] memory) {
        // This is a simplified approach - in production, maintain an active agents list
        // For now, we iterate through a reasonable range
        uint256 maxTokenId = agentNFT.nextTokenId();
        uint256[] memory activeAgents = new uint256[](maxTokenId);
        uint256 count = 0;
        
        for (uint256 i = 1; i < maxTokenId; i++) {
            if (agents[i].status == AgentStatus.ACTIVE) {
                activeAgents[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = activeAgents[i];
        }
        return result;
    }
    
    function _isAssetSupported(string memory asset) internal view returns (bool) {
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (keccak256(bytes(supportedAssets[i])) == keccak256(bytes(asset))) {
                return true;
            }
        }
        return false;
    }
    
    // ============ View Functions ============

    function getAgentInfo(uint256 tokenId) external view returns (Agent memory) {
        return agents[tokenId];
    }

    function getRoundInfo(uint256 roundId) external view returns (BattleRound memory) {
        return battleRounds[roundId];
    }

    function getUserActiveAgents(address user) external view returns (uint256[] memory) {
        uint256[] memory userNfts = agentNFT.getUserAgents(user);
        uint256[] memory activeAgents = new uint256[](userNfts.length);
        uint256 count = 0;

        for (uint i = 0; i < userNfts.length; i++) {
            if (agents[userNfts[i]].status == AgentStatus.ACTIVE) {
                activeAgents[count] = userNfts[i];
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = activeAgents[i];
        }
        return result;
    }

    /**
     * @notice Get all active agents in the arena
     * @return Array of active agent token IDs
     */
    function getAllActiveAgents() external view returns (uint256[] memory) {
        return _getAllActiveAgents();
    }

    /**
     * @notice Get battle statistics for current round
     * @return longTotal Total long collateral
     * @return shortTotal Total short collateral
     * @return timeRemaining Seconds until round ends
     * @return canSettle Whether round can be settled
     */
    function getCurrentRoundStats() external view returns (
        uint256 longTotal,
        uint256 shortTotal,
        uint256 timeRemaining,
        bool canSettle
    ) {
        BattleRound storage round = battleRounds[currentRoundId];
        longTotal = round.longTotal;
        shortTotal = round.shortTotal;

        if (block.timestamp >= round.startTime + ROUND_DURATION) {
            timeRemaining = 0;
            canSettle = !round.settled;
        } else {
            timeRemaining = round.startTime + ROUND_DURATION - block.timestamp;
            canSettle = false;
        }
    }

    /**
     * @notice Calculate current PnL for an agent
     * @param tokenId Agent token ID
     * @return currentPnL Current PnL (can be negative)
     * @return shouldLiquidate Whether agent should be liquidated
     */
    function calculateAgentCurrentPnL(uint256 tokenId) external view returns (int256 currentPnL, bool shouldLiquidate) {
        Agent storage agent = agents[tokenId];
        if (agent.status != AgentStatus.ACTIVE) {
            return (0, false);
        }

        uint256 currentPrice = priceOracle.getPrice(agent.asset);
        currentPnL = BattleLogic.calculateAgentPnL(
            agent.collateral,
            agent.leverage,
            agent.direction == Direction.LONG,
            agent.entryPrice,
            currentPrice
        );

        shouldLiquidate = BattleLogic.shouldLiquidate(currentPnL, agent.collateral);
        return (currentPnL, shouldLiquidate);
    }

    /**
     * @notice Get loot events for a round
     * @param roundId Round ID
     * @return Array of loot events
     */
    function getRoundLoots(uint256 roundId) external view returns (LootEvent[] memory) {
        return roundLoots[roundId];
    }

    /**
     * @notice Check if an asset is supported
     * @param asset Asset symbol
     * @return isSupported True if supported
     */
    function isAssetSupported(string memory asset) external view returns (bool) {
        return _isAssetSupported(asset);
    }

    /**
     * @notice Get all supported assets
     * @return Array of asset symbols
     */
    function getSupportedAssets() external view returns (string[] memory) {
        return supportedAssets;
    }
    
    // ============ Admin Functions ============
    
    function setProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Arena: Fee too high"); // Max 10%
        protocolFee = newFee;
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Arena: Invalid address");
        feeRecipient = newRecipient;
    }
    
    function addAsset(string memory asset) external onlyOwner {
        supportedAssets.push(asset);
    }
    
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        usdtToken.transfer(owner(), amount);
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
