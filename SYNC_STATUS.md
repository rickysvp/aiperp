# Supabase 数据同步状态检查

## 已同步 ✅

### 1. Users 表 ✅
- **文件**: `contexts/WalletContext.tsx`
- **操作**: 连接钱包时自动创建/获取用户
- **API**: `getOrCreateUser()`, `updateUserBalance()`, `updateUserPnL()`

### 2. Agents 表 ✅
- **文件**: `App.tsx` (handleMintAgent)
- **操作**: 创建 Agent 时同步到 Supabase
- **API**: `createAgent()`

### 3. User Liquidity Stakes 表 ✅
- **文件**: `components/Liquidity.tsx`
- **操作**: 质押时同步到 Supabase
- **API**: `upsertUserStake()`, `getUserLiquidityStakes()`

---

## 未同步 ❌

### 1. Agent PnL History 表 ❌
- **当前**: 只存储在本地 state (`agent.pnlHistory`)
- **位置**: `App.tsx` 游戏循环中更新
- **需要**: 定期同步到 `agent_pnl_history` 表
- **优先级**: 中

### 2. Battle Logs 表 ❌
- **当前**: 只存储在本地 state (`logs`)
- **位置**: `App.tsx` 的 `addLog()` 函数
- **需要**: 每次添加日志时同步到 `battle_logs` 表
- **优先级**: 低

### 3. Loot Events 表 ❌
- **当前**: 只存储在本地 state (`lastLootEvent`)
- **位置**: `App.tsx` 的游戏循环中
- **需要**: 发生掠夺事件时同步到 `loot_events` 表
- **优先级**: 低

### 4. Market Data 表 ❌
- **当前**: 只存储在本地 state (`market`)
- **位置**: `App.tsx` 的游戏循环中更新价格
- **需要**: 更新价格时同步到 `market_data` 表
- **优先级**: 中

### 5. Market Price History 表 ❌
- **当前**: 只存储在本地 state (`market.history`)
- **位置**: `App.tsx` 的游戏循环中
- **需要**: 定期记录价格历史到 `market_price_history` 表
- **优先级**: 低

### 6. Liquidity Pools 表 ❌
- **当前**: 只存储在本地 state (`pool`)
- **位置**: `components/Liquidity.tsx`
- **需要**: 更新池数据时同步到 `liquidity_pools` 表
- **优先级**: 中

---

## 建议同步顺序

1. **Agent PnL History** - 用于图表显示历史数据
2. **Market Data** - 用于多用户共享市场状态
3. **Liquidity Pools** - 用于共享流动性池状态
4. **Battle Logs** - 用于历史记录查询
5. **Loot Events** - 用于掠夺历史记录
6. **Market Price History** - 用于价格历史图表

---

## 实施建议

### 高频数据（每 tick 更新）
- Agent PnL - 批量同步，每 10-30 秒一次
- Market Price - 批量同步，每 10-30 秒一次

### 中频数据（每次操作）
- Battle Logs - 每次 addLog 时同步
- Loot Events - 每次发生时同步

### 低频数据（状态变更）
- Liquidity Pools - 质押/解押时同步
- Agent 状态变更 - 部署/清算时同步
