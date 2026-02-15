## 问题诊断

经过全面深度检测，发现了以下关键问题：

### 问题1: `selection` 初始值问题
- Line 51: `const [selection, setSelection] = useState<string>(hasAgents ? '' : 'FABRICATE');`
- `hasAgents` 在组件挂载时计算，但 `useState` 只执行一次
- 当第一个 agent 被创建后，`selection` 可能还是 `'FABRICATE'` 而不是 `''`

### 问题2: `handleAcceptAgent` 时序问题
- Line 172-189: `handleAcceptAgent` 使用 `setTimeout` 延迟 100ms 设置 selection
- 但 100ms 可能不够，React 的 props 更新是异步的
- 如果 `agents` 列表还没有从 App.tsx 更新下来，`selectedAgent` 会是 `undefined`
- 导致渲染 Dashboard 而不是 Agent Detail

### 问题3: `hasAgents` useEffect 干扰
- Line 54-60: 当 `hasAgents` 变化时会强制设置 selection
- 可能在 `handleAcceptAgent` 设置 selection 后被覆盖

### 问题4: 渲染条件竞争
- Line 420: `{selection !== 'FABRICATE' && !selectedAgent && (...)}` - 显示 Dashboard
- Line 434: `{selection === 'FABRICATE' && (...)}` - 显示铸造界面
- Line 526: `{selectedAgent && (...)}` - 显示 Agent Detail
- 如果 `selectedAgent` 为 null，会显示 Dashboard

## 修复方案

### 修复1: 移除有问题的 useEffect
删除 Line 54-60 的 useEffect，不再自动切换 selection

### 修复2: 修改 `handleAcceptAgent` 使用本地 agent 对象
不再依赖 `agents.find()`，直接使用 `generatedAgent` 对象传递给子组件

### 修复3: 修改渲染逻辑
当 `selection` 是 agent ID 但 `selectedAgent` 为 null 时，显示 loading 而不是 Dashboard

### 修复4: 确保铸造完成后正确更新状态
在 `handleConfirmFabrication` 中确保 `onMint` 返回的 agent 被正确保存

## 具体修改

1. **删除 hasAgents useEffect** (Line 54-60)
2. **修改 handleAcceptAgent** (Line 172-189) - 直接使用 generatedAgent，不依赖 find
3. **添加渲染保护** - 当 selection 是 ID 但 agent 未找到时显示 loading
4. **确保状态同步** - 使用 useCallback 和正确的依赖项

这些修改将彻底解决铸造后 agent 消失的问题。