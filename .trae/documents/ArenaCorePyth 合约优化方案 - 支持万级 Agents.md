## 问题分析
当前架构在 Agents 数量达到上万时会遇到：
1. RPC 限流（429 Too Many Requests）
2. 前端遍历所有 tokenId 查询效率极低
3. 无法快速获取活跃 Agents 列表

## 优化方案

### 第一阶段：合约层添加活跃 Agents 索引（必需）

在 ArenaCorePyth 合约中添加：

```solidity
// ============ Active Agent Index ============

// 所有活跃（balance > 0）的 Agent IDs
uint256[] public activeAgentIds;
mapping(uint256 => uint256) public agentIdToActiveIndex;

// 添加到活跃列表（首次存款时）
function _addToActiveList(uint256 agentId) internal {
    if (agentIdToActiveIndex[agentId] == 0 && activeAgentIds.length > 0) {
        // Already in list
        return;
    }
    activeAgentIds.push(agentId);
    agentIdToActiveIndex[agentId] = activeAgentIds.length; // Store 1-based index
}

// 从活跃列表移除（余额为0时）
function _removeFromActiveList(uint256 agentId) internal {
    uint256 index = agentIdToActiveIndex[agentId];
    if (index == 0) return; // Not in list
    
    // Convert to 0-based
    index = index - 1;
    
    // Swap with last element
    uint256 lastId = activeAgentIds[activeAgentIds.length - 1];
    activeAgentIds[index] = lastId;
    agentIdToActiveIndex[lastId] = index + 1;
    
    // Remove last
    activeAgentIds.pop();
    delete agentIdToActiveIndex[agentId];
}

// 分页获取活跃 Agents（前端主接口）
function getActiveAgents(uint256 offset, uint256 limit) 
    external 
    view 
    returns (uint256[] memory agentIds) 
{
    uint256 total = activeAgentIds.length;
    if (offset >= total) return new uint256[](0);
    
    uint256 end = offset + limit;
    if (end > total) end = total;
    
    agentIds = new uint256[](end - offset);
    for (uint256 i = offset; i < end; i++) {
        agentIds[i - offset] = activeAgentIds[i];
    }
}

function getActiveAgentCount() external view returns (uint256) {
    return activeAgentIds.length;
}
```

修改 deposit/withdraw 函数：
- deposit: 如果首次存款（balance 从 0 增加），调用 `_addToActiveList`
- withdraw: 如果余额变为 0，调用 `_removeFromActiveList`

### 第二阶段：前端优化

1. **只查询活跃 Agents**
   - 调用 `getActiveAgentCount()` 获取总数
   - 分页调用 `getActiveAgents(offset, limit)` 获取数据

2. **缓存策略**
   - localStorage 缓存 Agents 元数据（name, avatar 等）
   - 只刷新动态数据（balance, pnl）

3. **实时更新**
   - 使用 WebSocket 或轮询获取最新价格
   - 结算事件触发后刷新相关 Agents 数据

### 第三阶段：索引服务（可选，万级 Agents 时）

部署 The Graph 子图：
```graphql
type Agent @entity {
  id: ID!
  owner: Bytes!
  balance: BigInt!
  effectiveStake: BigInt!
  multiplier: Int!
  currentFaction: Int!
  active: Boolean!
  totalPnl: BigInt!
  winTicks: BigInt!
  loseTicks: BigInt!
}
```

## 实施步骤

1. 修改 ArenaCorePyth 合约，添加活跃索引
2. 重新部署合约
3. 更新前端 hook，使用分页查询
4. 测试万级 Agents 场景

## 预期效果

- 首次加载：1-2 秒（查询 50 个活跃 Agents）
- 支持万级 Agents：无性能下降
- RPC 调用减少 99%（从 354 次降到 10 次）

需要我开始实施第一阶段（合约修改）吗？