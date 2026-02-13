# AIperp Arena Smart Contracts

AIperp Arena 的 Monad 链上智能合约，支持 Agent NFT 铸造、战斗竞技和 USDT 奖励分配。

## 合约架构

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
│  │ PriceOracle  │  │ BattleLogic │  │ MockUSDT     │      │
│  │ (价格预言机)  │  │ (战斗逻辑)   │  │ (测试代币)   │      │
│  └──────────────┘  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 合约说明

### 1. AgentNFT.sol
- **功能**: ERC721 NFT 合约，代表 AI 交易特工
- **特点**:
  - 铸造费用: 100 USDT
  - 存储特工属性 (名称、策略、风险等级等)
  - 支持 NFT 转移和枚举

### 2. AIperpArena.sol
- **功能**: 主竞技场合约
- **核心功能**:
  - 用户 USDT 存取
  - 特工部署 (选择方向、杠杆、抵押)
  - 战斗轮次结算
  - 奖励分配
  - 爆仓清算

### 3. PriceOracle.sol
- **功能**: 价格预言机
- **特点**:
  - 支持多资产价格更新
  - 价格历史记录
  - 授权更新机制

### 4. BattleLogic.sol
- **功能**: 战斗计算库
- **计算**:
  - PnL 计算
  - 爆仓检查
  - 奖励分配
  - 止盈止损检查

### 5. MockUSDT.sol
- **功能**: 测试用 USDT 代币
- **特点**: 6 位小数，支持铸造和销毁

## 快速开始

### 安装依赖

```bash
cd contracts
npm install
```

### 配置环境变量

创建 `.env` 文件:

```env
PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
MONAD_API_KEY=your_api_key_here
```

### 编译合约

```bash
npm run compile
```

### 运行测试

```bash
npm test
```

### 部署到测试网

```bash
npm run deploy:testnet
```

## 部署流程

1. **部署 MockUSDT** - 测试代币
2. **部署 PriceOracle** - 价格预言机
3. **部署 AgentNFT** - NFT 合约
4. **部署 AIperpArena** - 主合约
5. **配置权限**:
   - 设置 Arena 合约地址到 NFT
   - 添加 Arena 为预言机更新者
6. **设置初始价格** - BTC, ETH, SOL, MON

## 核心功能

### 用户流程

1. **存款**: 用户将 USDT 存入 Arena 合约
2. **铸造 Agent**: 支付 100 USDT 铸造 NFT
3. **部署 Agent**: 选择方向 (Long/Short)、杠杆、抵押金额
4. **战斗**: 每轮战斗根据价格变化结算
5. **退出**: 退出战斗并领取奖励

### 战斗机制

- **轮次时长**: 1 分钟
- **价格变化**: 根据预言机价格计算
- **胜负判定**: 价格上涨 = Long 赢，价格下跌 = Short 赢
- **奖励分配**: 失败方的损失按比例分配给获胜方
- **爆仓**: 损失达到 80% 时自动清算

## 前端集成

### 安装 wagmi

```bash
npm install wagmi viem
```

### 配置 Provider

```typescript
import { createConfig, http } from 'wagmi';
import { monadTestnet } from 'wagmi/chains';

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
});
```

### 使用 Hooks

```typescript
import { useArenaContract, useNFTContract, useUSDTContract } from './hooks/useContracts';

function App() {
  const { userBalance, deposit, withdraw } = useArenaContract();
  const { userAgents, mintAgent } = useNFTContract();
  const { balance, approve } = useUSDTContract();

  // ...
}
```

## 合约地址 (Monad Testnet)

部署后更新:

```typescript
export const CONTRACT_ADDRESSES = {
  monadTestnet: {
    ARENA: '0x...',
    AGENT_NFT: '0x...',
    PRICE_ORACLE: '0x...',
    USDT: '0x...',
  }
};
```

## 安全考虑

1. **ReentrancyGuard**: 所有涉及转账的函数都使用重入保护
2. **Access Control**: 关键函数仅限授权地址调用
3. **Input Validation**: 所有输入参数都经过验证
4. **Overflow Protection**: 使用 Solidity 0.8+ 内置溢出检查

## 测试覆盖

- 合约部署测试
- 存取款测试
- Agent 铸造测试
- Agent 部署测试
- 战斗结算测试
- Agent 退出测试

## 许可

MIT License
