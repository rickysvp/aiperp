# AIperp Arena Contracts

AIperp Arena 智能合约 - 基于 Foundry 构建，部署于 Monad 链。

## 项目结构

```
contracts/
├── src/                    # 合约源代码
│   ├── AIperpArena.sol    # 主竞技场合约
│   ├── AgentNFT.sol       # AI Agent NFT 合约
│   ├── PriceOracle.sol    # 价格预言机
│   ├── BattleLogic.sol    # 战斗逻辑库
│   └── MockUSDT.sol       # 测试 USDT
├── script/                 # 部署脚本
│   ├── Deploy.s.sol       # 主部署脚本
│   └── export-abis.js     # ABI 导出脚本
├── test/                   # 测试文件
├── lib/                    # 依赖库 (OpenZeppelin, forge-std)
├── foundry.toml           # Foundry 配置
└── .env.example           # 环境变量模板
```

## 快速开始

### 1. 安装 Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. 安装依赖

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std --no-commit
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 添加你的私钥
```

### 4. 编译合约

```bash
forge build
```

### 5. 运行测试

```bash
forge test
forge test -vv  # 详细输出
forge coverage  # 覆盖率报告
```

## 部署

### 本地测试网 (Anvil)

```bash
# 启动本地节点
anvil

# 部署 (使用 Anvil 默认私钥)
forge script script/Deploy.s.sol --rpc-url anvil --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Monad 测试网

```bash
# 确保 .env 中配置了 PRIVATE_KEY
source .env

# 部署到测试网
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast

# 部署并验证
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast --verify
```

## ABI 导出

编译后导出 ABI 供前端使用：

```bash
# 编译合约
forge build

# 导出 ABI
npm run abi:export
# 或
node script/export-abis.js
```

导出后的 ABI 位于 `abis/` 目录：
- `abis/AIperpArena.json` / `.ts`
- `abis/AgentNFT.json` / `.ts`
- `abis/PriceOracle.json` / `.ts`
- `abis/MockUSDT.json` / `.ts`

## 合约架构

### AIperpArena (主合约)
- 用户资金存取
- AI Agent 部署与平仓
- PnL 计算与结算
- Loot 机制

### AgentNFT
- ERC721 NFT 标准
- Agent 属性存储
- 用户 Agent 管理

### PriceOracle
- 资产价格喂价
- 价格历史记录
- 多签授权更新

### BattleLogic (库)
- PnL 计算逻辑
- 清算判断
- 杠杆计算

## 常用命令

```bash
# 编译
forge build

# 测试
forge test
forge test -vvv  # 最详细输出
forge test --match-test testDeposit  # 运行特定测试

# 格式化代码
forge fmt

# Gas 报告
forge snapshot

# 验证合约
forge verify-contract <address> <contract_name> --chain monad_testnet
```

## 网络配置

### Monad Testnet
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- Explorer: https://testnet-explorer.monad.xyz
- Faucet: https://testnet.monad.xyz/

## 安全注意事项

⚠️ **永远不要将包含真实私钥的 .env 文件提交到 Git！**

`.env` 已添加到 `.gitignore`，但请再次确认：
```bash
git check-ignore -v .env
```

## 许可证

MIT
