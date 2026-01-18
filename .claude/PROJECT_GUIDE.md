# Forum 项目指南

> 每次开始任务前请仔细阅读此文件，了解项目基本信息和开发规范。

## 重要行为规范

**任务完成后必须执行通知**：
- 每次完成用户请求的任务后，必须执行 `/media/ruan/Files/forum/.claude/task-notify.sh` 发送桌面通知
- 通知格式：`/media/ruan/Files/forum/.claude/task-notify.sh "标题" "任务描述" "normal"`
- 这能让用户及时知道任务已完成

## 项目概述

这是一个基于 **Next.js 16** + **React 19** 的全栈论坛网站，支持用户发帖、评论、点赞、话题等功能。

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript
- **样式**: Tailwind CSS 4 + @tailwindcss/typography
- **Markdown**: react-markdown + remark-gfm + rehype-slug
- **图标**: lucide-react

### 后端
- **API**: Next.js API Routes
- **认证**: NextAuth.js 4
- **数据库**: MySQL
- **ORM**: Prisma 5

### 其他依赖
- **密码加密**: bcryptjs
- **日期处理**: date-fns
- **图片处理**: sharp
- **Markdown 编辑器**: @uiw/react-md-editor
- **图片缩放**: react-zoom-pan-pinch

## 目录结构

```
forum/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API 路由
│   │   │   ├── auth/           # 认证相关 API
│   │   │   ├── comment/        # 评论 API
│   │   │   ├── like/           # 点赞 API
│   │   │   ├── post/           # 帖子 API
│   │   │   ├── notifications/  # 通知 API
│   │   │   ├── upload/         # 图片上传 API
│   │   │   └── admin/          # 管理员 API
│   │   ├── (auth)/             # 认证相关页面组
│   │   ├── admin/              # 管理员页面
│   │   ├── post/               # 帖子相关页面
│   │   ├── profile/            # 个人资料页面
│   │   └── user/               # 用户页面
│   ├── components/             # React 组件
│   ├── lib/                    # 工具库
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── prisma.ts           # Prisma 客户端
│   │   ├── post.ts             # 帖子业务逻辑
│   │   └── markdown.ts         # Markdown 处理
│   └── types/                  # TypeScript 类型定义
├── prisma/
│   └── schema.prisma           # 数据库模型定义
└── plans/                      # 项目规划文档
```

## 数据库模型

### User (用户)
- id, email, password, name, role (user/admin)
- banned, avatar, bio, postViewMode
- 关联: posts, comments, likes, reposts, notifications

### Post (帖子)
- id, title?, content, authorId, topicId?
- 关联: comments, likes, reposts, images, notifications

### Topic (话题)
- id, name, description, icon, creatorId
- 关联: posts, followers

### Comment (评论)
- id, content, postId, authorId, parentId? (用于回复)
- 关联: likes, replies

### PostLike / CommentLike (点赞)
- 唯一约束: [postId, userId] 或 [commentId, userId]

### Notification (通知)
- type: REPLY_POST, REPLY_COMMENT, LIKE_POST, LIKE_COMMENT
- isRead: boolean

## 开发规范

### 代码风格
- 使用 TypeScript 类型注解
- API 函数必须添加详细的 JSDoc 注释
  - 功能描述
  - @param 参数说明
  - @returns 返回值
  - @throws 错误码及说明
  - @example 使用示例

### 错误处理
- API 统一错误响应格式: `{ error: "message" }`
- HTTP 状态码:
  - 200: 成功
  - 201: 创建成功
  - 400: 请求参数错误
  - 401: 未授权
  - 403: 禁止访问
  - 404: 资源不存在
  - 500: 服务器内部错误

### 安全规范
- 密码使用 bcryptjs 加密
- 所有 API 需要认证的检查 session
- 管理员操作需检查 role === "admin"
- 输入验证：检查必填字段、数据类型、长度限制

### 权限控制
- 帖子/评论：只有作者和管理员可以编辑/删除
- 管理员页面：只有 role === "admin" 可访问
- 禁言用户：banned === true 的用户无法发帖/评论

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器 (http://localhost:3000)

# 构建
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 数据库
npx prisma generate  # 生成 Prisma Client
npx prisma db push   # 推送 schema 到数据库
npx prisma studio    # 打开 Prisma Studio

# 代码检查
npm run lint         # 运行 ESLint
```

## API 端点

### 认证
- POST `/api/auth/register` - 注册
- POST `/api/auth/[...nextauth]` - NextAuth

### 帖子
- GET `/api/post?topicId=xxx` - 获取帖子列表
- POST `/api/post` - 创建帖子
- PUT `/api/post` - 更新帖子
- DELETE `/api/post` - 删除帖子

### 评论
- POST `/api/comment` - 创建评论/回复
- DELETE `/api/comment` - 删除评论

### 点赞
- POST `/api/like` - 点赞/取消点赞（帖子或评论）

### 通知
- GET `/api/notifications` - 获取通知列表
- PATCH `/api/notifications/[id]` - 标记通知已读
- GET `/api/notifications/unread-count` - 获取未读数量

### 上传
- POST `/api/upload` - 上传图片

## 重要常量

### 帖子字段限制
- 标题最大长度: 200 字符
- 内容最大长度: 10000 字符
- 图片最大数量: 10 张

## 注意事项

1. **Prisma Client 生成路径**: `src/generated`
2. **NextAuth 配置**: `src/lib/auth.ts`
3. **环境变量**: 需要 `DATABASE_URL` 和 `NEXTAUTH_SECRET`
4. **图片存储**: 本地上传到 `public/uploads/`
5. **用户视图模式**: `postViewMode` 可为 "title", "content", "both"

## 测试账号

- 管理员: 需要手动在数据库设置 role = "admin"
- 普通用户: 注册后 role 默认为 "user"
