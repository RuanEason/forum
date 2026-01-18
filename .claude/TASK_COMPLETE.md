# 任务完成通知

当完成任何任务时，使用以下命令发送桌面通知：

```bash
# 发送成功通知（绿色）
/media/ruan/Files/forum/.claude/task-notify.sh "✅ 任务完成" "具体任务描述" "normal"

# 发送警告通知（黄色）
/media/ruan/Files/forum/.claude/task-notify.sh "⚠️ 注意" "警告信息" "normal"

# 发送错误通知（红色）
/media/ruan/Files/forum/.claude/task-notify.sh "❌ 错误" "错误信息" "critical"
```

## 示例用法

```bash
# 完成代码修复后
/media/ruan/Files/forum/.claude/task-notify.sh "✅ JSDoc 注释已添加" "为所有 API 函数添加了详细的 JSDoc 注释" "normal"

# 完成功能开发后
/media/ruan/Files/forum/.claude/task-notify.sh "✅ 新功能已上线" "用户资料页面更新完成" "normal"

# 完成测试后
/media/ruan/Files/forum/.claude/task-notify.sh "✅ 测试通过" "所有单元测试已通过" "normal"
```

## 通知图标

通知系统使用桌面环境的默认信息图标。支持的表情符号：
- ✅ 成功/完成
- ⚠️ 警告/注意
- ❌ 错误/失败
- ℹ️ 信息/提示
- 🚀 新功能/发布
- 🐛 Bug 修复
- 🔧 配置/工具
- 📝 文档/注释
