# Monad 链上竞技场合约解决方案

## 1. 系统架构概览

### 1.1 合约架构
```
┌─────────────────────────────────────────────────────────────┐
│                    AIperp Arena Contracts                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AIperpArena  │  │ AgentNFT     │  │ USDT Token   │      │
│  │ (主合约)      │  │ (NFT合约)    │  │ (ERC20)      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│  ┌──────────────┐  ┌──────┴──────┐  ┌──────────────┐      │
│  │ PriceOracle  │  │ BattleLogic │  │ RewardPool   │      │
│  │ (价格预言机)  │  │ (战斗逻辑)   │  │ (奖励池)     │      │
│  └──────────────┘  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心功能模块
1. **AgentNFT** - 特工NFT合约 (ERC721)
2. **AIperpArena** - 主竞技场合约
3. **BattleLogic** - 战斗结算逻辑库
4. **PriceOracle** - 价格预言机接口
5. **RewardPool** - 奖励分配池

---

## 2. 智能合约设计

### 2.1 AgentNFT 合约
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentNFT is ERC721, ERC721Enumerable, Ownable {
    struct AgentAttributes {
        string name;
        string bio;
        string strategy;
        string avatarSeed;
        uint8 riskLevel; // 1-4: LOW, MEDIUM, HIGH, EXTREME
        uint256 mintTime;
        address minter;
    }
    
    mapping(uint256 => AgentAttributes) public agentAttributes;
    mapping(address => uint256[]) public userAgents;
    
    uint256 public constant MINT_COST = 100 * 10**6; // 100 USDT
    uint256 public nextTokenId = 1;
    
    address public arenaContract;
    address public usdtToken;
    
    event AgentMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string name,
        uint8 riskLevel
    );
    
    modifier onlyArena() {
        require(msg.sender == arenaContract, "Only arena can call");
        _;
    }
    
    function mintAgent(
        string memory _name,
        string memory _bio,
        string memory _strategy,
        string memory _avatarSeed,
        uint8 _riskLevel
    ) external returns (uint256) {
        // 转移 USDT
        IERC20(usdtToken).transferFrom(msg.sender, address(this), MINT_COST);
        
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        agentAttributes[tokenId] = AgentAttributes({
            name: _name,
            bio: _bio,
            strategy: _strategy,
            avatarSeed: _avatarSeed,
            riskLevel: _riskLevel,
            mintTime: block.timestamp,
            minter: msg.sender
        });
        
        userAgents[msg.sender].push(tokenId);
        
        emit AgentMinted(tokenId, msg.sender, _name, _riskLevel);
        return tokenId;
    }
    
    function updateAgentStatus(uint256 tokenId, bool isActive) external onlyArena {
        // 由竞技场合约调用更新特工状态
    }
    
    function getUserAgents(address user) external view returns (uint256[] memory) {
        return userAgents[user];
    }
}
```

### 2.2 AIperpArena 主合约
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIperpArena is ReentrancyGuard, Ownable {
    // ============ 数据结构 ============
    
    enum Direction { LONG, SHORT, AUTO }
    enum AgentStatus { IDLE, ACTIVE, LIQUIDATED }
    
    struct Agent {
        uint256 tokenId;
        address owner;
        Direction direction;
        uint256 leverage; // 1-100x
        uint256 collateral;
        int256 pnl;
        uint256 entryPrice;
        uint256 lastUpdateTime;
        AgentStatus status;
        uint256 takeProfit; // %
        uint256 stopLoss;   // %
    }
    
    struct BattleRound {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        uint256 longTotal;
        uint256 shortTotal;
        uint256 winningDirection; // 0 = LONG, 1 = SHORT
        uint256 priceChange; // % with 4 decimals
        bool settled;
    }
    
    struct LootEvent {
        uint256 roundId;
        address winner;
        address victim;
        uint256 amount;
        uint256 timestamp;
    }
    
    // ============ 状态变量 ============
    
    IERC20 public usdtToken;
    AgentNFT public agentNFT;
    IPriceOracle public priceOracle;
    
    mapping(uint256 => Agent) public agents;
    mapping(uint256 => BattleRound) public battleRounds;
    mapping(uint256 => LootEvent[]) public roundLoots;
    mapping(address => uint256) public userBalances;
    mapping(string => uint256) public assetPrices;
    
    uint256 public currentRoundId = 1;
    uint256 public constant ROUND_DURATION = 1 minutes; // 每轮1分钟
    uint256 public constant MIN_COLLATERAL = 100 * 10**6; // 100 USDT
    uint256 public constant MAX_COLLATERAL = 10000 * 10**6; // 10000 USDT
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% 爆仓
    
    uint256 public totalStaked;
    uint256 public protocolFee = 25; // 2.5%
    address public feeRecipient;
    
    // ============ 事件 ============
    
    event AgentDeployed(
        uint256 indexed tokenId,
        address indexed owner,
        Direction direction,
        uint256 leverage,
        uint256 collateral
    );
    
    event BattleSettled(
        uint256 indexed roundId,
        uint256 winningDirection,
        uint256 priceChange,
        uint256 totalLoot
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
    
    // ============ 核心功能 ============
    
    function deployAgent(
        uint256 tokenId,
        Direction direction,
        uint256 leverage,
        uint256 collateral,
        uint256 takeProfit,
        uint256 stopLoss
    ) external nonReentrant {
        require(agentNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(agents[tokenId].status == AgentStatus.IDLE, "Already deployed");
        require(collateral >= MIN_COLLATERAL, "Below min collateral");
        require(collateral <= MAX_COLLATERAL, "Above max collateral");
        require(leverage >= 1 && leverage <= 100, "Invalid leverage");
        
        // 转移 USDT 作为抵押
        usdtToken.transferFrom(msg.sender, address(this), collateral);
        
        // 获取当前价格
        uint256 entryPrice = priceOracle.getPrice("BTC");
        
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
            stopLoss: stopLoss
        });
        
        totalStaked += collateral;
        
        emit AgentDeployed(tokenId, msg.sender, direction, leverage, collateral);
    }
    
    function settleBattleRound(
        string memory asset,
        uint256 newPrice
    ) external onlyOwner {
        BattleRound storage round = battleRounds[currentRoundId];
        require(!round.settled, "Already settled");
        require(block.timestamp >= round.startTime + ROUND_DURATION, "Round not ended");
        
        uint256 oldPrice = assetPrices[asset];
        assetPrices[asset] = newPrice;
        
        // 计算价格变化方向
        uint256 priceChange = ((newPrice * 10000) / oldPrice) - 10000;
        uint256 winningDir = priceChange > 0 ? 0 : 1; // 0 = LONG, 1 = SHORT
        
        round.winningDirection = winningDir;
        round.priceChange = priceChange > 0 ? priceChange : uint256(-int256(priceChange));
        round.endTime = block.timestamp;
        round.settled = true;
        
        // 计算总奖池
        uint256 totalLoot = _calculateLootPool(winningDir);
        
        // 分配奖励
        _distributeRewards(currentRoundId, winningDir, totalLoot);
        
        // 检查爆仓
        _checkLiquidations(asset, newPrice);
        
        emit BattleSettled(currentRoundId, winningDir, round.priceChange, totalLoot);
        
        // 开始新一轮
        currentRoundId++;
        battleRounds[currentRoundId] = BattleRound({
            roundId: currentRoundId,
            startTime: block.timestamp,
            endTime: 0,
            longTotal: 0,
            shortTotal: 0,
            winningDirection: 0,
            priceChange: 0,
            settled: false
        });
    }
    
    function exitAgent(uint256 tokenId) external nonReentrant {
        Agent storage agent = agents[tokenId];
        require(agent.owner == msg.sender, "Not owner");
        require(agent.status == AgentStatus.ACTIVE, "Not active");
        
        // 计算最终 PnL
        uint256 currentPrice = priceOracle.getPrice("BTC");
        int256 finalPnl = _calculatePnL(agent, currentPrice);
        
        uint256 returnAmount;
        if (finalPnl > 0) {
            returnAmount = agent.collateral + uint256(finalPnl);
        } else {
            returnAmount = agent.collateral - uint256(-finalPnl);
        }
        
        // 扣除协议费
        uint256 fee = (returnAmount * protocolFee) / 1000;
        returnAmount -= fee;
        
        // 更新状态
        agent.status = AgentStatus.IDLE;
        agent.pnl = finalPnl;
        totalStaked -= agent.collateral;
        
        // 转移 USDT
        usdtToken.transfer(feeRecipient, fee);
        usdtToken.transfer(msg.sender, returnAmount);
        
        emit AgentExited(tokenId, msg.sender, returnAmount, finalPnl);
    }
    
    // ============ 内部函数 ============
    
    function _calculateLootPool(uint256 winningDir) internal view returns (uint256) {
        // 计算失败方的总抵押作为奖池
        uint256 total = 0;
        // 遍历所有活跃特工计算
        return total;
    }
    
    function _distributeRewards(
        uint256 roundId,
        uint256 winningDir,
        uint256 totalLoot
    ) internal {
        // 按比例分配给获胜方
    }
    
    function _checkLiquidations(string memory asset, uint256 currentPrice) internal {
        // 检查并执行爆仓
    }
    
    function _calculatePnL(Agent memory agent, uint256 currentPrice) internal pure returns (int256) {
        // PnL 计算逻辑
        int256 priceDiff = int256(currentPrice) - int256(agent.entryPrice);
        int256 direction = agent.direction == Direction.LONG ? int256(1) : int256(-1);
        return (priceDiff * int256(agent.collateral) * int256(agent.leverage) * direction) / int256(agent.entryPrice);
    }
    
    // ============ 查询函数 ============
    
    function getAgentInfo(uint256 tokenId) external view returns (Agent memory) {
        return agents[tokenId];
    }
    
    function getUserActiveAgents(address user) external view returns (uint256[] memory) {
        // 返回用户所有活跃特工
    }
    
    function getRoundInfo(uint256 roundId) external view returns (BattleRound memory) {
        return battleRounds[roundId];
    }
}
```

### 2.3 PriceOracle 价格预言机
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracle {
    function getPrice(string memory asset) external view returns (uint256);
    function updatePrice(string memory asset, uint256 price) external;
    function getPriceChange(string memory asset, uint256 timeframe) external view returns (int256);
}

contract PriceOracle is IPriceOracle, Ownable {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    mapping(string => PriceData) public latestPrices;
    mapping(string => PriceData[]) public priceHistory;
    
    address public updater;
    uint256 public constant MAX_PRICE_AGE = 5 minutes;
    
    modifier onlyUpdater() {
        require(msg.sender == updater || msg.sender == owner(), "Not authorized");
        _;
    }
    
    function updatePrice(string memory asset, uint256 price) external onlyUpdater {
        latestPrices[asset] = PriceData({
            price: price,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        priceHistory[asset].push(latestPrices[asset]);
    }
    
    function getPrice(string memory asset) external view override returns (uint256) {
        PriceData memory data = latestPrices[asset];
        require(data.timestamp > 0, "Price not available");
        require(block.timestamp - data.timestamp <= MAX_PRICE_AGE, "Price too old");
        return data.price;
    }
    
    function getPriceChange(string memory asset, uint256 timeframe) external view returns (int256) {
        // 计算价格变化百分比
    }
}
```

### 2.4 BattleLogic 库
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library BattleLogic {
    struct BattleResult {
        uint256 winnerSide; // 0 = LONG, 1 = SHORT
        uint256 totalLoot;
        uint256 longPnL;
        uint256 shortPnL;
    }
    
    function calculateBattleOutcome(
        uint256 longCollateral,
        uint256 shortCollateral,
        int256 priceChangePercent // 4 decimals
    ) internal pure returns (BattleResult memory) {
        // 战斗结果计算
        bool longWins = priceChangePercent > 0;
        
        uint256 winnerCollateral = longWins ? longCollateral : shortCollateral;
        uint256 loserCollateral = longWins ? shortCollateral : longCollateral;
        
        // 计算奖池 (失败方的损失)
        uint256 loot = (loserCollateral * uint256(priceChangePercent > 0 ? priceChangePercent : -priceChangePercent)) / 10000;
        
        return BattleResult({
            winnerSide: longWins ? 0 : 1,
            totalLoot: loot,
            longPnL: longWins ? loot : 0,
            shortPnL: longWins ? 0 : loot
        });
    }
    
    function calculateAgentPnL(
        uint256 collateral,
        uint256 leverage,
        bool isLong,
        uint256 entryPrice,
        uint256 exitPrice
    ) internal pure returns (int256) {
        int256 priceDiff = int256(exitPrice) - int256(entryPrice);
        int256 direction = isLong ? int256(1) : int256(-1);
        return (priceDiff * int256(collateral) * int256(leverage) * direction) / int256(entryPrice) / int256(100);
    }
    
    function shouldLiquidate(
        int256 pnl,
        uint256 collateral
    ) internal pure returns (bool) {
        return pnl < 0 && uint256(-pnl) >= (collateral * 80) / 100;
    }
}
```

---

## 3. 前端集成方案

### 3.1 Web3 配置
```typescript
// services/web3Config.ts
import { createConfig, http } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});

// Contract Addresses (Testnet)
export const CONTRACTS = {
  AGENT_NFT: '0x...',
  ARENA: '0x...',
  PRICE_ORACLE: '0x...',
  USDT: '0x...',
};

// ABIs
export const ARENA_ABI = [...];
export const AGENT_NFT_ABI = [...];
export const ERC20_ABI = [...];
```

### 3.2 合约交互 Hook
```typescript
// hooks/useArena.ts
import { useContractRead, useContractWrite, useAccount } from 'wagmi';
import { CONTRACTS, ARENA_ABI, AGENT_NFT_ABI } from '../services/web3Config';

export function useArena() {
  const { address } = useAccount();
  
  // 读取用户特工
  const { data: userAgents } = useContractRead({
    address: CONTRACTS.AGENT_NFT,
    abi: AGENT_NFT_ABI,
    functionName: 'getUserAgents',
    args: [address],
  });
  
  // 部署特工
  const { write: deployAgent } = useContractWrite({
    address: CONTRACTS.ARENA,
    abi: ARENA_ABI,
    functionName: 'deployAgent',
  });
  
  // 退出特工
  const { write: exitAgent } = useContractWrite({
    address: CONTRACTS.ARENA,
    abi: ARENA_ABI,
    functionName: 'exitAgent',
  });
  
  return {
    userAgents,
    deployAgent,
    exitAgent,
  };
}
```

### 3.3 监听合约事件
```typescript
// hooks/useArenaEvents.ts
import { useContractEvent } from 'wagmi';
import { CONTRACTS, ARENA_ABI } from '../services/web3Config';

export function useArenaEvents(onBattleSettled: (data: any) => void) {
  // 监听战斗结算事件
  useContractEvent({
    address: CONTRACTS.ARENA,
    abi: ARENA_ABI,
    eventName: 'BattleSettled',
    listener: (log) => {
      onBattleSettled(log);
    },
  });
  
  // 监听战利品分配
  useContractEvent({
    address: CONTRACTS.ARENA,
    abi: ARENA_ABI,
    eventName: 'LootDistributed',
    listener: (log) => {
      console.log('Loot distributed:', log);
    },
  });
}
```

---

## 4. 部署计划

### 4.1 部署顺序
1. **USDT Mock Token** (测试网)
2. **PriceOracle** 
3. **AgentNFT**
4. **AIperpArena** (设置合约地址)
5. **配置权限** (设置 arenaContract 等)

### 4.2 测试网配置
```javascript
// hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    monadTestnet: {
      url: 'https://testnet-rpc.monad.xyz',
      chainId: 10143,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: 'your-api-key',
    },
  },
};
```

### 4.3 部署脚本
```typescript
// scripts/deploy.ts
async function main() {
  // 1. 部署 USDT
  const USDT = await ethers.getContractFactory('MockUSDT');
  const usdt = await USDT.deploy();
  console.log('USDT deployed:', usdt.address);
  
  // 2. 部署 PriceOracle
  const Oracle = await ethers.getContractFactory('PriceOracle');
  const oracle = await Oracle.deploy();
  console.log('PriceOracle deployed:', oracle.address);
  
  // 3. 部署 AgentNFT
  const NFT = await ethers.getContractFactory('AgentNFT');
  const nft = await NFT.deploy();
  console.log('AgentNFT deployed:', nft.address);
  
  // 4. 部署 Arena
  const Arena = await ethers.getContractFactory('AIperpArena');
  const arena = await Arena.deploy(usdt.address, nft.address, oracle.address);
  console.log('AIperpArena deployed:', arena.address);
  
  // 5. 配置权限
  await nft.setArenaContract(arena.address);
  await oracle.setUpdater(arena.address);
}
```

---

## 5. 实施步骤

### Phase 1: 基础合约 (1-2周)
1. 实现 AgentNFT 合约
2. 实现 AIperpArena 核心功能
3. 编写单元测试
4. 测试网部署

### Phase 2: 前端集成 (1-2周)
1. 配置 wagmi/viem
2. 实现合约交互 hooks
3. 更新 UI 组件
4. 事件监听和状态同步

### Phase 3: 测试与优化 (1周)
1. 集成测试
2. 安全审计
3. 性能优化
4. 主网部署准备

---

请确认这个方案后，我将开始实施具体的合约开发。