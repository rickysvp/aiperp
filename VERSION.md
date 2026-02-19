# AIperp.fun 版本管理

## 当前版本
**v2.2.0** - 2026-02-16

## 版本历史

### v2.2.0 (2026-02-16)
#### 变更
- 🗑️ 删除钱包页面 Header 组件
- 🔄 统一版本号机制
- 🔗 提供本地和线上访问链接

#### 链接
- 🌐 外网: https://aiperp.fun
- 🔗 内网: http://localhost:3000

---

### v2.1.1 (2026-02-14)
#### 变更
- 更新 Supabase 集成

---

### v2.1.0 (2026-02-14)
#### 新增功能
- ✨ 全新的神经网络风格Logo设计
- 🎨 NFT风格的Agent卡片展示
- 📊 24小时PnL历史图表
- 🔄 Agent收回/退出功能（余额耗尽自动退出，非死亡机制）
- 🔗 Minted By推特链接（可点击跳转）
- 🚀 优化的铸造页面（步骤指示器、视觉增强）
- 🎯 优化的部署页面（卡片式布局、汇总面板）

#### 改进
- 改进Agent状态管理（IDLE/ACTIVE，移除LIQUIDATED）
- 优化Collateral用词为Margin（更符合perp术语）
- 改进移动端响应式布局
- 添加加载动画和过渡效果

#### 链接
- 🌐 外网: https://aiperp.fun
- 🔗 内网: http://localhost:3000

---

### v2.0.0 (2026-02-14)
#### 变更
- 替换 Dynamic wallet 为本地 Mock wallet 系统
- 简化依赖项，移除 @dynamic-labs 包

#### 新增
- 创建 WalletContext 用于本地钱包管理
- 连接时自动生成随机钱包地址
- 初始余额: 10,000 USDT 用于测试
- 钱包状态持久化到 localStorage

---

### v1.3.0 (2025-02-14)
#### 变更
- Bumped version to 1.3.0
- Updated header subtitle to display version number (v1.3.0)
- Updated build date to 2025-02-14

#### Smart Contract Development
- Following AIperps Trae Vibe Prompt document for contract development
- Implementing 7-step Vibe development process
- Target: Monad Testnet deployment

---

### v1.2.0 (2025-02-14)
#### 变更
- Replaced Dynamic wallet with local Mock wallet system
- Simplified dependencies by removing @dynamic-labs packages

#### 新增
- Created WalletContext for local wallet management
- Auto-generate random wallet address on connect
- Initial balance: 10,000 USDT for testing
- Wallet state persistence in localStorage

---

### v1.1.0 (2025-02-11)
#### 新增功能
- ✨ 全新的神经网络风格Logo设计
- 🎨 NFT风格的Agent卡片展示
- 📊 24小时PnL历史图表
- 🔄 Agent收回/退出功能（余额耗尽自动退出，非死亡机制）
- 🔗 Minted By推特链接（可点击跳转）
- 🚀 优化的铸造页面（步骤指示器、视觉增强）
- 🎯 优化的部署页面（卡片式布局、汇总面板）

#### 改进
- 改进Agent状态管理（IDLE/ACTIVE，移除LIQUIDATED）
- 优化Collateral用词为Margin（更符合perp术语）
- 改进移动端响应式布局
- 添加加载动画和过渡效果

#### 链接
- 🌐 外网: https://aiperp.fun
- 🔗 内网: http://localhost:3000

---

### v1.0.0 (2025-02-10)
#### 初始版本
- 🎮 基础AI交易竞技场功能
- 🤖 Agent铸造和部署系统
- 💰 钱包和余额管理
- 📈 实时价格图表
- 🏆 排行榜系统
- 💬 Agent聊天功能

#### 链接
- 🌐 外网: https://aiperp.fun
- 🔗 内网: http://localhost:3000

---

## 版本号规则

采用 [语义化版本控制 2.0.0](https://semver.org/lang/zh-CN/)

格式：`主版本号.次版本号.修订号`

- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能新增
- **修订号 (PATCH)**: 向下兼容的问题修复

## 版本发布流程

1. 更新 `VERSION.md` 中的版本号和更新日志
2. 更新 `package.json` 中的版本号
3. 更新 `components/VersionInfo.tsx` 中的版本号和构建日期
4. 更新 `CHANGELOG.md` 记录本次变更
5. 提交代码: `git add . && git commit -m "release: vX.X.X"`
6. 创建标签: `git tag -a vX.X.X -m "版本 X.X.X 发布"`
7. 推送代码: `git push origin main`
8. 推送标签: `git push origin vX.X.X`

## 回滚指南

### 回滚到特定版本
```bash
# 查看所有版本标签
git tag

# 回滚到特定版本（创建新分支）
git checkout -b rollback-vX.X.X vX.X.X

# 或者强制回滚主分支（谨慎使用）
git reset --hard vX.X.X
git push -f origin main
```

### 查看版本差异
```bash
# 比较两个版本
git diff v1.0.0 v1.1.0

# 查看特定版本的文件
git show v1.1.0:App.tsx
```

## 部署信息

- **生产环境**: https://aiperp.fun
- **开发环境**: http://localhost:3000
- **GitHub仓库**: https://github.com/rickysvp/aiperp
