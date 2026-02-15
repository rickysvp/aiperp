## 问题分析

### 1. 铸造流程问题
- 铸造状态管理复杂，`fabricationStep` 和 `selection` 双重控制导致逻辑混乱
- `handleAcceptAgent` 中设置 `setSelection(generatedAgent.id)` 后，组件会尝试查找 agent，但可能还没渲染完成

### 2. 多余的 "NO AGENTS YET" 层级
- `AgentsDashboard` 组件在 `totalAgents === 0` 时显示 "No Agents Yet" 页面
- 但 `Agents.tsx` 中当没有 agents 时，应该直接显示铸造界面，不需要这个空状态页面

### 3. 修复方案

#### A. 简化铸造流程
- 移除 `fabricationStep` 状态，使用 `selection` 和本地状态控制铸造流程
- 铸造流程：`selection='FABRICATE'` → 点击铸造 → 显示 Loading → 完成后自动选择新 agent

#### B. 移除 AgentsDashboard 的空状态
- 当没有 agents 时，直接显示铸造界面，不显示 "No Agents Yet"
- 或者完全移除 `AgentsDashboard` 的空状态渲染

#### C. 修复状态更新逻辑
- `handleMintingComplete` 中设置 `generatedAgent` 后，直接调用 `handleAcceptAgent` 逻辑
- 确保 agent 被正确添加到列表并选中

#### D. 代码结构优化
- 将铸造相关逻辑提取为独立组件或 hooks
- 简化条件渲染逻辑，提高可读性

## 具体修改

1. **Agents.tsx**:
   - 简化铸造状态管理
   - 修复 `handleMintingComplete` 和 `handleAcceptAgent` 逻辑
   - 移除对 `AgentsDashboard` 空状态的依赖

2. **AgentsDashboard.tsx**:
   - 移除 `totalAgents === 0` 的空状态渲染（返回 null 或简化）
   - 保持其他统计功能不变