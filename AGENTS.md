# 论坛项目配置

## 项目信息
- **项目类型**: Next.js 16 + TypeScript 全栈论坛应用
- **前端框架**: React 19.2.1, Next.js 16.0.10 (App Router)
- **样式**: Tailwind CSS 4
- **数据库**: MySQL (通过 Prisma ORM)
- **认证**: NextAuth.js 4
- **对象存储**: 腾讯云 COS CDN

## 开发命令
- `npm run dev` - 启动开发服务器（默认端口 3000）
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint

## 数据库命令
- `npx prisma generate` - 生成 Prisma Client（输出到 src/generated）
- `npx prisma db push` - 推送 schema 变更到数据库
- `npx prisma studio` - 打开 Prisma Studio 数据库管理界面

## 关键目录结构
```
src/
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关 API
│   │   ├── post/          # 帖子相关 API
│   │   ├── comment/       # 评论相关 API
│   │   ├── upload/        # 文件上传 API
│   │   └── notifications/ # 通知相关 API
│   ├── auth/              # 认证页面（登录/注册/完善资料）
│   ├── post/              # 帖子页面
│   ├── user/              # 用户页面
│   ├── topic/             # 话题页面
│   └── settings/          # 设置页面
├── components/            # React 组件
│   ├── ui/                # 基础 UI 组件
│   └── [其他业务组件]
├── lib/                   # 工具函数和库
│   ├── auth.ts           # NextAuth 配置
│   ├── prisma.ts         # Prisma Client 单例
│   ├── cos.ts            # 腾讯云 COS 上传
│   ├── ffmpeg.ts         # 视频处理（FFmpeg）
│   └── [其他工具函数]
└── types/                 # TypeScript 类型定义

prisma/
└── schema.prisma         # 数据库模型定义
```

## 数据库模型
- **User** - 用户（含角色、封禁状态、头像、封面图等）
- **Post** - 帖子（含标题、内容、浏览数、置顶状态、话题关联）
- **Topic** - 话题（含创建者、关注者）
- **Comment** - 评论（支持嵌套回复）
- **PostImage / PostAttachment** - 图片和附件
- **PostLike / CommentLike** - 点赞
- **Repost** - 转发
- **Notification** - 通知（回复、点赞等）

## 代码风格约定
- 使用 TypeScript（strict 模式）
- 使用 Tailwind CSS v4
- 使用 React Server Components 优先
- 需要交互的组件使用 `"use client"` 指令
- 路径别名：`@/*` 指向 `./src/*`
- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名

## 特殊配置
- **React Compiler**: 已启用（优化 React 性能）
- **图片优化**: 配置了腾讯云 CDN 远程图片支持
- **安全头**: 配置了 CSP、HSTS、XSS 防护等安全头
- **环境变量**: 放在 `.env` 文件中（不要提交到 Git）

## 注意事项
1. Prisma Client 输出到 `src/generated` 目录，不是默认位置
2. 修改 Prisma schema 后需要运行 `npx prisma generate` 重新生成客户端
3. 文件上传支持图片和附件，会自动处理缩略图
4. 使用 bcryptjs 进行密码哈希
5. 支持 Markdown 编辑和预览
6. 有通知系统（回复、点赞通知）
7. 管理员面板位于 `/admin` 路由
8. 帖子支持置顶功能（`pinned` 和 `pinnedAt` 字段）
