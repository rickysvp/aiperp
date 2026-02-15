## 计划概述

### 1. 更新版本号并推送GitHub
- 将 package.json 版本从 1.3.0 更新到 1.4.0
- 提交所有更改到 Git
- 推送到 GitHub

### 2. 排查 Supabase 数据为空的原因
可能的原因：
- **WalletContext 中的 Supabase 调用被跳过** - 检查 `isSupabaseConfigured()` 是否返回 false
- **API 函数中的错误处理** - 可能在调用 Supabase 时出现错误但被静默处理了
- **RLS 策略问题** - 策略可能阻止了数据插入
- **网络连接问题** - Supabase 连接可能失败

排查步骤：
- 检查浏览器控制台是否有 Supabase 相关错误
- 在 WalletContext 中添加日志输出
- 验证 `isSupabaseConfigured()` 是否正常工作
- 检查 Supabase 表是否有任何数据

### 3. 执行步骤 1/2（根据用户要求）

## 执行顺序
1. ✅ 更新版本号到 1.4.0
2. ✅ 提交并推送 GitHub
3. ✅ 添加调试日志排查数据为空问题
4. ✅ 检查并修复 Supabase 集成问题

请确认此计划后，我将开始执行。