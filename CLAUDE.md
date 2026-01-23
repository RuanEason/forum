# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个基于 **Next.js 16** (App Router) 和 **React 19** 构建的全栈论坛应用，使用 TypeScript 开发。功能包括用户认证、支持 Markdown 的发帖、评论、点赞、话题、通知和管理员功能。

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react 图标
- **后端**: Next.js API Routes, NextAuth.js 4 (credentials 提供者)
- **数据库**: MySQL + Prisma 5 ORM
- **Markdown**: react-markdown + remark-gfm + rehype-slug
- **图片处理**: sharp
- **密码加密**: bcryptjs

## 开发命令

```bash
# 开发
npm run dev          # 启动开发服务器 (http://localhost:3000)

# 构建和生产
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 数据库操作
npx prisma generate  # 生成 Prisma Client (输出到 src/generated)
npx prisma db push   # 推送 schema 变更到数据库
npx prisma studio    # 打开 Prisma Studio GUI

# 代码检查
npm run lint         # 运行 ESLint
```

## 任务完成通知

**重要**: 每次完成用户请求的任务后，必须发送桌面通知以便用户及时了解任务完成情况。

### 通知命令

```powershell
# 发送桌面通知
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('任务已完成', '✅ 任务完成')"
```

### 使用示例

```powershell
# 完成代码修复后
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('为所有 API 函数添加了详细的 JSDoc 注释', '✅ JSDoc 注释已添加')"

# 完成功能开发后
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('用户资料页面更新完成', '✅ 新功能已上线')"

# 完成测试后
powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('所有单元测试已通过', '✅ 测试通过')"
```

### 支持的表情符号

- ✅ 成功/完成
- ⚠️ 警告/注意
- ❌ 错误/失败
- ℹ️ 信息/提示
- 🚀 新功能/发布
- 🐛 Bug 修复
- 🔧 配置/工具
- 📝 文档/注释

## 架构

### 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由
│   │   ├── auth/           # 认证与用户管理
│   │   ├── post/           # 帖子 CRUD 操作
│   │   ├── comment/        # 评论与回复
│   │   ├── like/           # 点赞/取消点赞
│   │   ├── notifications/  # 通知系统
│   │   ├── upload/         # 图片上传 (sharp)
│   │   ├── repost/         # 转发功能
│   │   ├── topic/          # 话题管理
│   │   └── admin/          # 仅管理员端点
│   ├── (auth)/             # 认证相关页面组
│   ├── admin/              # 管理员面板
│   ├── post/               # 帖子创建与详情页
│   ├── profile/            # 用户资料页
│   └── settings/           # 用户设置
├── components/             # React 组件
│   └── ui/                 # 可复用 UI 组件
├── lib/                    # 核心工具与业务逻辑
│   ├── auth.ts             # NextAuth 配置
│   ├── prisma.ts           # Prisma 客户端单例
│   ├── session.ts          # Session 辅助函数
│   ├── post.ts             # 帖子业务逻辑
│   ├── markdown.ts         # Markdown 处理
│   └── utils.ts            # 通用工具函数
└── generated/              # 生成的 Prisma Client (请勿编辑)
```

### 核心架构模式

**API 路由模式**:
- 所有 API 路由使用 `getServerSession(authOptions)` 进行认证
- 通过 `session.user.id` 检查用户认证
- 通过 `session.user.role === "admin"` 检查管理员权限
- 统一错误响应格式: `{ error: "message" }` 配合适当的 HTTP 状态码
- 所有导出函数需添加 JSDoc 注释，包含 `@param`、`@returns`、`@throws` 和 `@example`

**数据库层**:
- Prisma 客户端从 `@/lib/prisma` 导入（单例模式）
- Schema 位于 `prisma/schema.prisma`
- Prisma Client 生成到 `src/generated`（非默认位置）
- 级联删除已配置（如删除帖子时同时删除相关评论）

**Session 管理**:
- NextAuth 使用 JWT 策略（非数据库 session）
- Session 数据包含: `id`, `email`, `name`, `role`, `avatar`, `postViewMode`
- 实时权限检查（如管理员状态）应使用 `/api/auth/me` 端点而非 session JWT

### 数据库模型

**User**: `id`, `email`, `password`, `name`, `role` (user/admin), `banned`, `avatar`, `bio`, `postViewMode` (title/content/both)
**Post**: `id`, `title` (可选), `content`, `authorId`, `topicId`, `viewCount`
**Comment**: `id`, `content`, `postId`, `authorId`, `parentId` (用于嵌套回复)
**Topic**: `id`, `name`, `description`, `icon`, `creatorId`
**PostLike/CommentLike**: 在 `[postId, userId]` 或 `[commentId, userId]` 上有唯一约束
**Notification**: 类型: `REPLY_POST`, `REPLY_COMMENT`, `LIKE_POST`, `LIKE_COMMENT`

## 重要约束

### 帖子验证
- **标题最大长度**: 200 字符（可选字段）
- **内容最大长度**: 10000 字符
- **最大图片数**: 每篇帖子 10 张
- 必须提供内容或图片之一

### 权限规则
- **帖子/评论编辑/删除**: 仅作者或管理员
- **管理员页面**: 仅 `role === "admin"`
- **被禁用用户**: 无法创建帖子或评论（在 API 路由中检查）
- **话题创建**: 任何用户（无需特殊权限）

### 视图模式
用户偏好 `postViewMode` 控制帖子显示方式:
- `"title"`: 仅显示标题
- `"content"`: 仅显示内容
- `"both"`: 同时显示标题和内容（默认）

## 代码风格

- 启用 **TypeScript 严格模式**
- **路径别名**: `@/*` 映射到 `src/*`
- API 函数**必须添加 JSDoc** 并包含完整文档
- **双语注释**: 代码注释和 JSDoc 使用中文（项目约定）
- **组件组织**: 可复用 UI 组件放在 `components/ui/`

## 图片处理

- 上传端点: `POST /api/upload`
- 图片本地存储在 `public/uploads/`
- 使用 sharp 库处理图片
- 浏览追踪组件增加帖子浏览计数
- 通过 `react-zoom-pan-pinch` 实现图片缩放

## 安全注意事项

- 使用 bcryptjs 哈希密码
- 所有需认证的路由检查 session
- 管理员路由额外检查 role
- 所有 API 端点进行输入验证（类型、长度、格式）
- 被禁用用户收到通用 "Invalid credentials" 错误以防用户枚举
- Prisma schema 中配置了级联删除

## 常用模式

### API 路由模板
```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { field } = await request.json();
    // 验证逻辑...

    const result = await someFunction(field);
    return NextResponse.json({ message: "Success", data: result }, { status: 200 });
  } catch (error) {
    console.error("Operation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 权限检查模式
```typescript
// 作者或管理员检查
if (resource.authorId !== session.user.id && session.user.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

## 环境变量

- `DATABASE_URL`: MySQL 连接字符串
- `NEXTAUTH_SECRET`: NextAuth JWT 签名密钥

## TypeScript 类型

核心类型从 Prisma schema 推断。如需额外类型可添加到 `src/types/`（目前较少使用，因为 Prisma 推断已足够）。
