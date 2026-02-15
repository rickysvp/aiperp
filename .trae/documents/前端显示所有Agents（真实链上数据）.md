## 目标
修改前端，显示所有链上Agents（而不仅是当前用户的），自己的Agents显示在顶部。

## 现状分析
1. 当前 `useAgents.ts` 只查询当前钱包拥有的Agents（通过NFT balanceOf）
2. 合约中 `AgentNFTV2` 有 `nextTokenId` 可以知道总Agent数量
3. 合约中 `ArenaCorePyth.agents(agentId)` 可以查询任意Agent数据
4. 但合约没有提供获取所有Agent ID的函数

## 实施方案

### 方案1: 通过事件日志获取所有Agents（推荐）
修改 `useAgents.ts`：
1. 使用 `eth_getLogs` 获取 `AgentMinted` 事件，提取所有Agent ID
2. 批量查询每个Agent的数据
3. 同时获取当前用户的Agents（用于置顶显示）
4. 合并数据，标记自己的Agents

### 方案2: 遍历查询（简单但效率低）
1. 查询 `AgentNFT.nextTokenId()` 获取总数量
2. 遍历 1 到 nextTokenId-1，查询每个Agent
3. 过滤掉不存在的（被burn的）

### 具体修改文件
1. **src/hooks/useAgents.ts** - 重写获取逻辑，获取所有Agents
2. **src/utils/agentAdapter.ts** - 添加owner字段，标记是否为自己的Agent
3. **components/Agents.tsx** - 修改过滤逻辑，显示所有Agents但置顶自己的

## 技术细节

### 新增函数
```typescript
// 获取所有Agent IDs
async function fetchAllAgentIds(): Promise<number[]> {
  // 通过事件日志或遍历获取
}

// 批量获取Agent数据
async function fetchAllAgents(agentIds: number[]): Promise<ChainAgent[]> {
  // 批量RPC调用
}
```

### 数据结构设计
```typescript
interface ChainAgent {
  // ...原有字段
  owner: string;  // 添加owner字段
  isOwnAgent: boolean; // 是否为自己的Agent
}
```

### UI修改
- Agents列表显示所有Agents
- 自己的Agents排在最前面，并有特殊标记
- 其他Agents（包括流动性Agents）正常显示

## 验证步骤
1. 运行脚本创建更多Agents
2. 前端刷新，确认能看到所有Agents
3. 确认自己的Agents有置顶和标记
4. 确认数据是真实的链上数据

请确认这个方案后，我将开始实施具体的代码修改。