# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 **Next.js 16** (App Router) 和 **React 19** 构建的全栈论坛应用，使用 TypeScript 开发。功能包括用户认证、支持 Markdown 的发帖、评论、点赞、话题、通知和管理员功能。

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react 图标
- **后端**: Next.js API Routes, NextAuth.js 4 (credentials 提供者)
- **数据库**: MySQL + Prisma 5 ORM
- **对象存储**: 腾讯云 COS (Cloud Object Storage) + CDN
- **Markdown**: react-markdown + remark-gfm + rehype-slug
- **图片处理**: sharp
- **密码加密**: bcryptjs
- **编译优化**: React Compiler (通过 `reactCompiler: true` 启用)

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

## 开发环境配置

### 环境说明

**重要**: 本项目使用 Git 进行版本控制，`.env` 文件**不会被提交到仓库**。

- **开发环境**: 本地 Next.js 开发服务器连接到**云端生产数据库**
- **生产环境**: 部署在云服务器上，具有独立的环境配置
- 两者的 `.env` 文件内容不同，但是数据库链接相同
### 开发时的已知行为

由于开发环境连接的是生产数据库，而图片存储在不同位置：

1. **图片 404 是正常现象**: 用户上传的图片存储在云端 COS + CDN，本地开发时访问历史本地图片（`/api/uploads/` 路径）会出现 404 错误
2. **数据库数据共享**: 开发和生产环境共享同一个数据库，可以直接看到生产数据
3. **COS/CDN 配置差异**: 开发和生产环境可能使用不同的 CDN 域名或 COS 存储桶
4. **不要在生产数据库上执行危险操作**: 避免在开发时执行 `DELETE`、`DROP` 或批量更新操作

### 环境变量

- `DATABASE_URL`: MySQL 连接字符串（指向云端生产数据库）
- `NEXTAUTH_SECRET`: NextAuth JWT 签名密钥
- `NEXTAUTH_URL`: 应用访问地址（如 `http://localhost:3000`）

**腾讯云 COS 配置** (用于图片存储):
- `TENCENT_COS_SECRET_ID`: 腾讯云密钥 ID（服务端变量，不要加 `NEXT_PUBLIC_` 前缀）
- `TENCENT_COS_SECRET_KEY`: 腾讯云密钥（服务端变量，不要加 `NEXT_PUBLIC_` 前缀）
- `TENCENT_COS_BUCKET`: COS 存储桶名称（如 `forum-1398498368`）
- `TENCENT_COS_REGION`: COS 区域（如 `ap-guangzhou`）
- `NEXT_PUBLIC_CDN_DOMAIN`: CDN 域名（前端需要访问，必须加 `NEXT_PUBLIC_` 前缀）

**注意**: 如需修改环境变量，请编辑本地 `.env` 文件，该文件已被 Git 忽略。

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
│   │   ├── auth/           # 认证与用户管理 (register, [...nextauth], me, delete-account)
│   │   ├── post/           # 帖子 CRUD 操作
│   │   ├── comment/        # 评论与回复
│   │   ├── like/           # 点赞/取消点赞
│   │   ├── notifications/  # 通知系统 (GET, PUT [id], unread-count)
│   │   ├── upload/         # 图片上传 (sharp)
│   │   ├── uploads/[filename]/  # 动态图片访问路由
│   │   ├── repost/         # 转发功能
│   │   ├── topic/          # 话题管理
│   │   └── admin/          # 仅管理员端点 (data, user/ban)
│   ├── (auth)/             # 认证相关页面组
│   ├── admin/              # 管理员面板
│   ├── auth/               # 登录/注册/完善资料页面
│   ├── notifications/      # 通知列表页
│   ├── post/               # 帖子创建与详情页 (create, [id])
│   ├── profile/            # 用户资料页
│   ├── search/             # 搜索页面
│   ├── settings/           # 用户设置
│   ├── topic/[id]/         # 话题详情页
│   └── user/[id]/          # 用户主页
├── components/             # React 组件
│   └── ui/                 # 可复用 UI 组件
├── lib/                    # 核心工具与业务逻辑
│   ├── auth.ts             # NextAuth 配置
│   ├── prisma.ts           # Prisma 客户端单例
│   ├── cos.ts              # 腾讯云 COS 客户端封装
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
**PostImage**: `id`, `url`, `postId` - 帖子关联图片
**Comment**: `id`, `content`, `postId`, `authorId`, `parentId` (用于嵌套回复)
**Topic**: `id`, `name`, `description`, `icon`, `creatorId`
**PostLike/CommentLike**: 在 `[postId, userId]` 或 `[commentId, userId]` 上有唯一约束
**Repost**: `id`, `postId`, `userId` - 帖子转发/ repost
**Notification**: 类型: `REPLY_POST`, `REPLY_COMMENT`, `LIKE_POST`, `LIKE_COMMENT`
  - 包含复合索引用于通知去重: `[senderId, receiverId, type, postId, isRead]` 和 `[senderId, receiverId, type, commentId, isRead]`
  - 这允许系统过滤重复通知（如同一人多次点赞同一帖子）

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
- **ESLint**: 使用 `eslint.config.mjs` 配置，忽略 `src/generated/**` 自动生成文件

## 图片处理

### 存储架构

项目支持两种图片存储方式：

| 存储方式 | URL 格式 | 说明 |
|---------|---------|------|
| **COS + CDN** | `https://cdn.example.com/images/xxx.webp` | 新上传图片，通过腾讯云 COS + CDN 加速 |
| **历史本地图片** | `/api/uploads/xxx.webp` | 迁移前的历史数据，通过 API 路由访问（可能 404） |

### 上传流程

```
用户上传图片 → /api/upload → sharp 处理（WebP 转换、压缩） → 上传到腾讯云 COS → 返回 CDN URL
```

### 配置说明

**环境变量**（参见上文"腾讯云 COS 配置"）：
- `TENCENT_COS_SECRET_ID/KEY`: COS 访问凭证（仅服务端）
- `TENCENT_COS_BUCKET/REGION`: 存储桶配置
- `NEXT_PUBLIC_CDN_DOMAIN`: CDN 域名（前端可访问）

**COS 客户端**（`src/lib/cos.ts`）：
- 使用 `cos-nodejs-sdk-v5` SDK
- 单例模式，从环境变量读取配置

### 前端图片展示

前端组件需自动判断图片来源：

```typescript
// URL 以 http 开头为 CDN 图片，否则为历史本地图片
const imageUrl = post.image.url.startsWith('http')
  ? post.image.url  // CDN URL（如 https://cdn.zyg2024.top/images/xxx.webp）
  : `${API_BASE_URL}${post.image.url}`;  // 本地 API 路由（可能 404）
```

### 其他特性

- **图片处理**: 使用 sharp 库（WebP 转换、压缩、最大宽度 1920px）
- **最大文件大小**: 10MB
- **支持格式**: JPEG, PNG, WebP, GIF
- **图片缩放**: 通过 `react-zoom-pan-pinch` 实现

## 安全注意事项

- 使用 bcryptjs 哈希密码
- 所有需认证的路由检查 session
- 管理员路由额外检查 role
- 所有 API 端点进行输入验证（类型、长度、格式）
- 被禁用用户收到通用 "Invalid credentials" 错误以防用户枚举
- Prisma schema 中配置了级联删除
- **安全响应头**: `next.config.ts` 配置了严格的安全头（HSTS, X-Frame-Options, CSP 等）

### 腾讯云密钥安全

⚠️ **重要**:
- `TENCENT_COS_SECRET_ID` 和 `TENCENT_COS_SECRET_KEY` **绝对不能**添加 `NEXT_PUBLIC_` 前缀
- 带有 `NEXT_PUBLIC_` 前缀的环境变量会被 Next.js 暴露到浏览器端
- 仅 `NEXT_PUBLIC_CDN_DOMAIN` 需要 `NEXT_PUBLIC_` 前缀，因为前端需要直接访问 CDN URL
- `.env` 文件已在 `.gitignore` 中，不会被提交到仓库

### 数据库操作警告

⚠️ **由于开发环境直接连接生产数据库**:

- 执行 `npx prisma db push` 会直接修改生产数据库 schema
- 避免在开发时运行可能导致数据丢失的操作（DELETE、DROP、批量更新）
- 建议在生产环境维护窗口期间执行 schema 变更
- 如需测试危险操作，请先在本地创建测试数据库

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

### Prisma 查询模式
```typescript
// 获取列表 - 使用 select 精确控制返回字段
export async function getPosts(topicId?: string) {
  return prisma.post.findMany({
    where: topicId ? { topicId } : undefined,
    select: {
      id: true,
      title: true,
      author: { select: { id: true, name: true, avatar: true } },
      // ...其他关联
    },
    orderBy: { createdAt: "desc" },
  });
}

// 嵌套评论查询 - 使用 include 和 where 过滤顶层评论
export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      comments: {
        where: { parentId: null }, // 只获取顶层评论
        include: {
          replies: { /* 嵌套回复 */ },
        },
      },
    },
  });
}
```

### COS 上传模式
```typescript
import { cos } from '@/lib/cos';

/**
 * 上传图片到腾讯云 COS
 * @param fileBuffer - 图片文件的 Buffer
 * @param filename - 文件名（含路径，如 images/xxx.webp）
 * @returns CDN 访问 URL
 */
async function uploadToCOS(fileBuffer: Buffer, filename: string): Promise<string> {
  const bucket = process.env.TENCENT_COS_BUCKET!;
  const region = process.env.TENCENT_COS_REGION!;
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN!;

  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: filename,
      Body: fileBuffer,
      ContentType: 'image/webp',
    }, (err, data) => {
      if (err) reject(err);
      else resolve(`${cdnDomain}/${filename}`);
    });
  });
}
```

## TypeScript 类型

核心类型从 Prisma schema 推断。如需额外类型可添加到 `src/types/`（目前较少使用，因为 Prisma 推断已足够）。
