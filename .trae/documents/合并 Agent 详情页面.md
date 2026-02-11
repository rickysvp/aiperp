## 优化方案：合并 SCENARIO C 和 SCENARIO D

### 当前问题
- SCENARIO C (ACTIVE) 和 SCENARIO D (EXITED) 是两个独立的页面
- 大量重复代码（Header、Stats、Configuration）
- 维护困难，用户体验不一致

### 优化方案
合并成一个统一的 Agent Detail 页面，根据 Agent.status 动态显示不同内容：

**统一页面结构：**
1. **Header**: Agent 头像、名称、Twitter、Bio、Status 标签
2. **Financial Stats**: 
   - ACTIVE: 显示 Live PnL + Balance
   - EXITED: 显示 Final PnL + Returned
3. **Performance Stats**: Wins / Losses / Win Rate（共用）
4. **Configuration**: Strategy / Risk Level / Direction / Leverage（共用）
5. **Actions**:
   - ACTIVE: Share Status + Withdraw
   - EXITED: Share Results + Back to List

**代码优化：**
- 删除 SCENARIO C 和 SCENARIO D 两个独立区块
- 创建统一的 Agent Detail 组件
- 使用条件渲染显示不同状态的内容
- 减少约 150 行重复代码

### 预期效果
- 代码更简洁，易于维护
- 用户体验一致
- 页面切换更流畅