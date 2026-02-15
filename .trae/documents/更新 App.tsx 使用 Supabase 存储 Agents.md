## 计划

当前问题：App.tsx 使用本地状态 `const [agents, setAgents] = useState<Agent[]>([])` 存储 agents，导致数据不会保存到 Supabase。

### 需要做的修改：

1. **在 App.tsx 中导入 `useSupabaseAgents` hook**
2. **使用 hook 替代本地 agents 状态**
3. **更新所有使用 setAgents 的地方**
   - 创建 Agent 时调用 supabase API
   - 部署 Agent 时调用 supabase API
   - 更新 PnL 时调用 supabase API
   - 清算 Agent 时调用 supabase API
4. **确保 agents 数据从 Supabase 加载**

### 具体步骤：
1. 导入 `useSupabaseAgents` 和 `useWallet`
2. 获取 `userId` 从 `useWallet`
3. 使用 `const { agents, createAgent, deployAgent, ... } = useSupabaseAgents(userId)`
4. 替换所有 `setAgents` 调用为相应的 API 调用

这是一个较大的重构，需要修改多处代码。请确认后开始执行。