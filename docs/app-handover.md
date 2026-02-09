# 论坛 Web 后端与功能交接文档（Expo App 对接版）

> 生成日期：2026-02-08  
> 代码基线：当前仓库 `website`（Next.js 16 + Prisma + NextAuth）

---

## 1. 文档目的

这份文档用于把当前 Web 论坛项目的**完整功能、后端 API、数据模型、认证机制、技术实现**交接给 Expo React Native App 开发同事。  
内容全部基于现有代码实现，不是规划稿。

---

## 2. 技术架构总览

### 2.1 核心技术栈

- 前端框架：Next.js `16.0.10`（App Router）
- React：`19.2.1`
- 语言：TypeScript（严格模式）
- 样式：Tailwind CSS `v4`
- 鉴权：NextAuth.js `v4`（Credentials 登录）
- ORM：Prisma `v5`
- 数据库：MySQL
- 媒体处理：`sharp`（图片）、`fluent-ffmpeg`（视频转码）
- 对象存储：腾讯云 COS（通过 CDN 域名访问）

### 2.2 运行架构

- 这是一个 **Next.js 全栈项目**：
  - 页面渲染（RSC + Client Components）
  - API 路由（`src/app/api/**`）
  - Server Action（阅读量统计）
  - 数据访问（Prisma）
- App 对接时，后端基地址默认即 Web 域名（例如 `https://xxx.com`）。

### 2.3 安全与平台配置

- 已启用 React Compiler（`next.config.ts`）
- 配置了安全响应头：CSP、HSTS、X-Frame-Options、XSS 等
- Next Image 允许腾讯云 CDN 远程图片域名

---

## 3. 功能模块总览（给 App 的功能清单）

### 3.1 用户与认证

- 邮箱+密码注册
- 账号密码登录（NextAuth Credentials）
- 首次登录后完善资料（昵称/头像/简介）
- 获取当前登录用户资料
- 修改个人资料（头像、封面、帖子展示模式、隐私开关等）
- 注销账号（级联删除关联数据）
- 封禁用户（管理员）

### 3.2 帖子系统

- 发帖（纯文本 / Markdown / 图片 / 附件 / 话题）
- 帖子列表（全站、按话题）
- 帖子详情（Markdown 渲染、目录、图片查看器、附件下载）
- 编辑帖子
- 删除帖子（含 COS 文件清理）
- 帖子置顶（管理员）
- 浏览量统计（带防刷冷却）

### 3.3 评论互动

- 发表评论
- 回复评论（二级结构）
- 删除评论
- 评论置顶（仅帖子作者）

### 3.4 点赞与转发

- 帖子点赞 / 取消点赞（toggle）
- 评论点赞 / 取消点赞（toggle）
- 帖子转发 / 取消转发（toggle，接口已实现）

### 3.5 关注关系

- 关注用户 / 取消关注
- 查询是否关注某用户
- 获取关注列表 / 粉丝列表 / 关系列表

### 3.6 通知系统

- 通知类型：
  - 回复我的帖子
  - 回复我的评论
  - 点赞我的帖子
  - 点赞我的评论
  - 关注我
- 通知列表
- 未读数量
- 标记已读
- 删除通知

### 3.7 话题系统

- 话题搜索（按名称模糊匹配）
- 创建话题
- 话题详情页 + 话题内帖子流

### 3.8 上传系统

- 图片上传（帖子图片 / 头像）
- 附件上传（限制可执行文件）
- 个人背景上传（图片/视频，视频自动转码）

### 3.9 用户中心

- 个人主页
- 关注/粉丝页
- 用户统计（可配置隐藏）
- 等级与经验展示

### 3.10 后台管理

- 用户列表
- 帖子列表
- 封禁/解封用户
- 删除帖子

---

## 4. 页面路由清单（Web 现状）

- `/` 首页帖子流
- `/post/create` 发帖
- `/post/[id]` 帖子详情
- `/search?q=...` 搜索（用户+帖子）
- `/topic/[id]` 话题详情
- `/notifications` 通知
- `/user/[id]` 用户主页
- `/user/[id]/connections?tab=following|followers` 关注/粉丝
- `/profile` 跳转到当前用户主页
- `/settings` 设置页
- `/auth/signin` 登录
- `/auth/signup` 注册
- `/auth/complete-profile` 完善资料
- `/admin` 管理后台（仅 admin）

---

## 5. 数据模型（Prisma）

### 5.1 User

关键字段：

- `id`, `email`, `password`
- `name`, `avatar`, `bio`, `coverImage`
- `role`（`user`/`admin`）
- `banned`（封禁）
- `postViewMode`（`both` / `title` / `content` / `titleAndContent`）
- `showUserData`（是否公开统计数据）
- `experience`（经验值）
- `lastLoginRewardAt`（每日登录奖励）
- `dailyLikeRewardCount`, `lastLikeRewardAt`（点赞经验奖励计数）

### 5.2 Post

- `id`, `title?`, `content`
- `authorId`, `topicId?`
- `viewCount`
- `pinned`, `pinnedAt`
- 关联：`comments`, `likes`, `reposts`, `images`, `attachments`

### 5.3 Comment

- `id`, `content`, `postId`, `authorId`
- `parentId?`（支持回复）
- `pinned`, `pinnedAt`
- 关联：`replies`, `likes`

### 5.4 Topic

- `id`, `name`（唯一）, `description?`, `icon?`
- `creatorId?`
- 关联：`posts`, `followers`

### 5.5 媒体与附件

- `PostImage`: `url`, `postId`
- `PostAttachment`: `url`, `fileName`, `fileSize`, `mimeType`, `downloadCount`, `postId`

### 5.6 互动

- `PostLike`：`postId + userId` 唯一
- `CommentLike`：`commentId + userId` 唯一
- `Repost`：`postId + userId` 唯一
- `Follow`：`followerId + followingId` 唯一

### 5.7 通知

- `Notification.type` 枚举：
  - `REPLY_POST`
  - `REPLY_COMMENT`
  - `LIKE_POST`
  - `LIKE_COMMENT`
  - `FOLLOW_USER`
- 字段：`senderId`, `receiverId`, `postId?`, `commentId?`, `isRead`

---

## 6. 等级与经验体系

### 6.1 经验奖励

- 每日登录：`+5`
- 发帖：`+10`
- 评论：`+7`
- 点赞：`+5`

### 6.2 每日上限

- 发帖奖励：每天最多 3 次
- 评论奖励：每天最多 3 次
- 点赞奖励：每天最多 3 次

### 6.3 等级阈值

- Lv1: 50
- Lv2: 200
- Lv3: 800
- Lv4: 1500
- Lv5: 3000
- Lv6: 6666

---

## 7. 认证与会话机制（App 对接重点）

### 7.1 当前实现

- 使用 NextAuth v4 + Credentials Provider
- 会话策略：JWT（30 天）
- 鉴权依赖 `getServerSession(authOptions)`
- 绝大多数业务 API 需要已登录 session（Cookie）

### 7.2 Session 中可用用户字段

- `id`, `email`, `name`, `role`
- `avatar`, `postViewMode`, `showUserData`, `coverImage`
- `experience`, `level`

### 7.3 App 端注意事项

- 这套后端是“Web Cookie 会话优先”设计，不是纯 token API。
- Expo App 若直接复用现有鉴权，需要处理：
  - NextAuth 的登录流程（含 CSRF + callback）
  - Cookie 持久化与自动携带
- 建议后续补充“移动端专用 token 登录接口（JWT access token）”，减少 App 对 NextAuth 内部流程的耦合。

---

## 8. API 统一约定

- Base：`/api`
- 受保护接口：未登录统一返回 `401`（少数接口返回 200+默认值）
- JSON 接口：`Content-Type: application/json`
- 上传接口：`multipart/form-data`
- 错误响应常见格式：`{ "error": "..." }`
- 成功响应格式不完全统一（按模块分别定义）
- 日期字段返回 JSON 时为字符串（ISO）

---

## 9. API 详细清单

## 9.1 Auth 模块

### `GET/POST /api/auth/[...nextauth]`

- 说明：NextAuth 内部路由（登录、回调、session、csrf、signout 等）
- App 不建议直接“硬编码内部子路径”，除非严格按 NextAuth 文档实现

### `POST /api/auth/register`

- 鉴权：否
- Body：
  - `email: string`（自动 trim+lowercase，需合法邮箱）
  - `password: string`（长度 8~128）
- 成功：`201`
  - `{ message, userId }`
- 失败：`400/500`

### `POST /api/auth/complete-profile`

- 鉴权：是
- Body：
  - `name`（必填，<=50）
  - `avatar?`（string，<=500）
  - `bio?`（string，<=500）
  - `postViewMode?`（`both|title|content|titleAndContent`）
  - `coverImage?`（string，<=500）
  - `showUserData?`（boolean）
- 成功：`200`
  - `{ message, user }`

### `GET /api/auth/me`

- 鉴权：是
- 成功：`200`
  - 返回当前用户核心资料 + `level`
- 失败：`401/404/500`

### `DELETE /api/auth/delete-account`

- 鉴权：是
- 成功：`200` `{ message }`
- 行为：删除用户，依赖 Prisma 级联删除帖子/评论/点赞/关注等关联数据

---

## 9.2 帖子模块

### `GET /api/post?topicId=...`

- 鉴权：否
- Query：`topicId?`
- 返回：帖子数组（已含作者、点赞列表、评论数、图片、附件、话题、置顶信息）

### `POST /api/post`

- 鉴权：是
- Body：
  - `title?: string`（<=200）
  - `content?: string`（<=10000）
  - `images?: string[]`（最多 10）
  - `attachments?: { url,fileName,fileSize,mimeType }[]`（最多 5）
  - `topicId?: string|null`
- 业务校验：`content/images/attachments` 至少有一个非空
- 成功：`201` `{ message, post }`
- 额外行为：发帖经验奖励

### `PUT /api/post`

- 鉴权：是（作者或管理员）
- Body：`id`, `content`, `title?`
- 成功：`200` `{ message, post }`

### `DELETE /api/post`

- 鉴权：是（作者或管理员）
- Body：`id`
- 行为：
  - 删除帖子前先尝试删除 COS 上对应图片/附件
  - 再删除数据库帖子
- 成功：`200` `{ message }`

### 浏览量统计（非 REST）

- 通过 Server Action `incrementViewCount(postId)` 调用
- 冷却：同一客户端 1 小时内同帖只计一次（Cookie: `viewed_post_${postId}`）

---

## 9.3 评论模块

### `POST /api/comment`

- 鉴权：是
- Body：
  - `content: string`
  - `postId: string`
  - `parentId?: string|null`（有则为回复）
- 成功：`201` `{ message, comment }`
- 额外行为：
  - 评论经验奖励
  - 通知创建：
    - 回复评论 -> `REPLY_COMMENT`
    - 评论帖子 -> `REPLY_POST`

### `DELETE /api/comment`

- 鉴权：是（评论作者或管理员）
- Body：`id`
- 成功：`200` `{ message }`

---

## 9.4 点赞与转发模块

### `POST /api/like`

- 鉴权：是
- Body：
  - `targetType: "post" | "comment"`
  - `targetId: string`
- 行为：toggle（已点赞则取消，否则点赞）
- 成功响应：
  - 点赞：`201` `{ message, liked: true, like }`
  - 取消：`200` `{ message, liked: false }`
- 额外行为：
  - 点赞经验奖励
  - 通知去重（未读同类通知不重复创建）

### `POST /api/repost`

- 鉴权：是
- Body：`postId`
- 行为：toggle 转发
- 成功：`201/200`（根据新增/取消）

---

## 9.5 话题模块

### `GET /api/topic?q=关键词`

- 鉴权：否
- Query：`q?`
- 返回：按发帖数降序的最多 20 条话题

### `POST /api/topic`

- 鉴权：是
- Body：
  - `name`（必填，<=50）
  - `description?`（<=500）
  - `icon?`（<=100）
- 逻辑：
  - 若同名话题已存在，直接返回该话题（`200`）
  - 否则创建新话题（`201`）

---

## 9.6 关注模块

### `POST /api/follow`

- 鉴权：是
- Body：
  - `followingId: string`
  - `follow: boolean`（true=关注，false=取消）
- 规则：
  - 不能关注自己
  - 不能关注被封禁用户
- 成功：`{ success, following, message }`
- 额外行为：
  - 关注时创建 `FOLLOW_USER` 通知
  - 取消关注时清理对应通知

### `GET /api/follow?followingId=...`

- 鉴权：是
- 返回：`{ following: boolean }`

### `GET /api/follow/check?followingId=...`

- 等价于 `/api/follow` 的 GET 封装

### `GET /api/follow/connections?userId=...&type=following|followers`

- 鉴权：是
- 返回：
  - `user`
  - `type`
  - `connections: [{ user, followedAt, isFollowing }]`
  - `total`
  - `isOwnProfile`

### `GET /api/follow/following`

- 等价于 `/api/follow/connections?type=following`

### `GET /api/follow/followers`

- 等价于 `/api/follow/connections?type=followers`

---

## 9.7 置顶模块

### `POST /api/pin`

- 鉴权：是（管理员）
- Body：`postId`, `pinned`
- 行为：更新帖子 `pinned` + `pinnedAt`

### `POST /api/pin/comment`

- 鉴权：是（该帖子作者）
- Body：`commentId`, `pinned`
- 行为：更新评论 `pinned` + `pinnedAt`

---

## 9.8 通知模块

### `GET /api/notifications`

- 鉴权：是
- 返回最近 20 条通知（按时间倒序）
- 包含：`sender`、`post`，并额外拼接 `comment` 简要内容

### `GET /api/notifications/unread-count`

- 鉴权：可选
- 未登录返回：`200 { count: 0 }`
- 登录返回：未读数

### `PATCH /api/notifications/[id]`

- 鉴权：是（接收者本人）
- 行为：标记已读（`isRead=true`）

### `DELETE /api/notifications/[id]`

- 鉴权：是（接收者本人）
- 行为：删除通知

---

## 9.9 上传与附件模块

### `POST /api/upload`（图片上传）

- 鉴权：是
- FormData：`file`
- 允许类型：`image/jpeg|jpg|png|webp|gif`
- 大小限制：`<=10MB`
- 成功：`{ url }`

> 代码中有“>10MB 时生成缩略图”的分支，但前面已做 `>10MB` 拒绝，当前线上行为实际是超限直接 `400`。

### `POST /api/upload/attachment`（附件上传）

- 鉴权：是
- FormData：`file`
- 大小限制：`<=1GB`
- 安全策略：屏蔽可执行扩展名和危险 MIME
- 成功：`{ url, fileName, fileSize, mimeType }`

### `POST /api/upload/background`（背景图/视频）

- 鉴权：是
- FormData：`file`
- 支持：
  - 图片：jpeg/jpg/png/webp/gif
  - 视频：mp4/mov/avi/gif(video)
- 限制：视频最大 `100MB`
- 处理：
  - 图片：小图直传，大图压缩
  - 视频：转码 MP4 + 生成 WebP 预览图
- 成功：
  - 图片：`{ url, type: "image" }`
  - 视频：`{ url, previewUrl, type: "video" }`

### `DELETE /api/attachment`

- 鉴权：是（帖子作者或管理员）
- Body：`id`
- 行为：删除 COS 文件 + 删除附件记录

### `POST /api/attachment/download`

- 鉴权：否
- Body：`id`
- 行为：下载次数 +1
- 返回：`{ url, updatedCount }`

### `GET /api/uploads/[filename]`

- 鉴权：否
- 说明：读取本地 `public/uploads` 文件（偏历史兼容接口）

---

## 9.10 管理与运维模块

### `GET /api/admin/data`

- 鉴权：是（管理员）
- 返回：
  - `users`（用户列表）
  - `posts`（帖子列表+作者信息）

### `POST /api/admin/user/ban`

- 鉴权：是（管理员）
- Body：`userId`, `banned`
- 行为：封禁/解封用户

### `GET /api/test-db`

- 鉴权：否
- 说明：数据库连通性检查（生产排障用）

---

## 10. 媒体与 Markdown 能力（App 端体验对齐）

- Markdown 支持：GFM + 换行增强（`remark-gfm` + `remark-breaks`）
- 帖子详情支持自动目录（根据标题层级生成）
- 图片宫格展示 + 全屏预览 + 左右切换 + 缩放
- 附件展示下载数、文件大小、类型图标

---

## 11. 环境变量清单（从代码可见）

- `DATABASE_URL`（MySQL 连接串）
- `NEXTAUTH_URL`（站点 URL）
- `NEXTAUTH_SECRET`（NextAuth 标准必需项，建议强制配置）
- `TENCENT_COS_SECRET_ID`
- `TENCENT_COS_SECRET_KEY`
- `TENCENT_COS_BUCKET`
- `TENCENT_COS_REGION`
- `NEXT_PUBLIC_CDN_DOMAIN`
- `VERCEL_URL`（可选，用于某些回退逻辑）

---

## 12. 给 Expo App 开发的对接建议

### 12.1 先做的最小闭环

1. 登录态建立（复用 NextAuth Cookie 或新增移动端 token）
2. 帖子流 + 帖子详情 + 评论
3. 点赞 / 关注 / 通知
4. 发帖（图片+附件上传）
5. 用户主页 + 设置

### 12.2 强烈建议补充的移动端专用 API

当前有些页面逻辑是“服务端直查 DB（RSC）”，并没有 REST API，例如：

- 搜索页聚合数据
- 用户主页聚合统计
- 帖子详情聚合（包含评论树）

建议后端再补一层 App API（例如 `/api/app/*`），把这些聚合逻辑标准化输出，避免 App 端拼装复杂数据。

---

## 13. 已知实现差异/注意点

- 注册页前端提示密码最少 6 位，但后端实际要求最少 8 位。
- `POST /api/upload` 中“>10MB 生成缩略图”分支当前不会触发（前置已拒绝 >10MB）。
- `GET /api/topic?id=...` 在代码中有调用尝试，但后端并未实现该 query 参数能力。
- `POST /api/repost` 已实现，但当前 Web 组件主要做“分享链接”，未实际调用此接口。
- 关注关系接口错误信息存在中英文混合，App 端建议按状态码+兜底文案处理。

---

## 14. 快速示例（供 App 联调）

### 14.1 发帖

```http
POST /api/post
Content-Type: application/json

{
  "title": "这是标题",
  "content": "这是正文（支持 Markdown）",
  "images": ["https://cdn.xxx.com/images/a.webp"],
  "attachments": [
    {
      "url": "https://cdn.xxx.com/attachments/xxx.zip",
      "fileName": "资料包.zip",
      "fileSize": 102400,
      "mimeType": "application/zip"
    }
  ],
  "topicId": "cmxxxxx"
}
```

### 14.2 点赞（帖子/评论通用）

```http
POST /api/like
Content-Type: application/json

{
  "targetType": "post",
  "targetId": "cmxxxxx"
}
```

### 14.3 上传附件

```http
POST /api/upload/attachment
Content-Type: multipart/form-data

file=<binary>
```

---

如果你希望，我可以继续给你补一份**“移动端专用 API 设计草案（OpenAPI 3.1）”**，把目前服务端直查数据的页面全部抽象成可直接给 Expo 调用的标准接口。

