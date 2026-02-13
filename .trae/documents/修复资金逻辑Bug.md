## 发现的问题及修复方案

### 1. 最严重：用户钱包重复加款（第374-376行 + 第564/586行）
**问题：** Base PnL Update 时记录 userBalanceChange，TP/SL/Exit 时又加 remainingBalance，导致重复计算。
**修复：** 删除 Base PnL Update 中的 userBalanceChange 累积，只在 Agent 退出时返还余额。

### 2. Looting PnL 不平衡（第503-504行）
**问题：** 受害者扣100，获胜者得90，PnL统计中10块手续费"消失"。
**修复：** 受害者 pnl 也应扣除 netLoot 而不是 lootAmount，保持 PnL 平衡。

### 3. wins/losses 统计错误（第370-371行）
**问题：** 按 tick PnL 正负统计，不是按实际交易结果。
**修复：** 改为在 Agent 退出时根据总 PnL 统计输赢。

### 4. totalPnl 计算错误（第619行）
**问题：** 每次 tick 都加 userBalanceChange，包含本金返还。
**修复：** totalPnl 只应统计实际盈亏，不包含本金返还。

### 5. 添加防重复提款保护
**问题：** Withdraw Agent 时异步操作可能导致重复点击。
**修复：** 添加 loading 状态防止重复操作。

请先确认这个修复计划，然后我开始执行。