# App 端用户主页/关注/设置 API 汇总

本文档仅覆盖新增的 `api/app` 用户相关接口，用于移动端对接。

## 鉴权说明

- 复用现有 NextAuth 登录态（Cookie Session）。
- 未登录访问需要登录的接口会返回 `401 Unauthorized`。

## 1) 用户主页信息

### `GET /api/app/user/profile`

获取个人主页/他人主页头部信息、关注关系、统计数据与可见性。

#### Query

- `userId?: string`
  - 不传时：取当前登录用户（个人主页）。
  - 传入时：取指定用户（他人主页）。

#### Response

```json
{
  "user": {
    "id": "...",
    "name": "...",
    "avatar": "...",
    "bio": "...",
    "coverImage": "...",
    "joinedAt": "2026-02-10T12:34:56.000Z"
  },
  "relationship": {
    "isSelf": false,
    "isFollowing": true
  },
  "social": {
    "followersCount": 12,
    "followingCount": 20
  },
  "statsVisibility": {
    "showUserData": true,
    "canViewStats": true
  },
  "stats": {
    "daysJoined": 100,
    "postsPublished": 30,
    "totalViews": 2000,
    "likesReceived": 500,
    "likesGiven": 200,
    "experience": 880,
    "level": 3
  }
}
```

#### 说明

- 若对方关闭 `showUserData`，且不是本人，则 `stats` 返回 `null`，但 `social`（关注/粉丝数）仍返回。

---

## 2) 指定用户帖子列表

### `GET /api/app/user/posts`

获取某个用户发布的帖子列表（按置顶和时间排序）。

#### Query

- `userId?: string`（不传默认当前用户）
- `page?: number`（默认 `1`）
- `pageSize?: number`（默认 `20`，最大 `50`）

#### Response

```json
{
  "userId": "...",
  "list": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "viewCount": 10,
      "pinned": false,
      "pinnedAt": null,
      "createdAt": "2026-02-10T12:00:00.000Z",
      "topic": { "id": "...", "name": "..." },
      "images": [{ "url": "..." }],
      "attachments": [
        {
          "id": "...",
          "url": "...",
          "fileName": "...",
          "fileSize": 123,
          "mimeType": "...",
          "downloadCount": 1
        }
      ],
      "likes": [{ "userId": "..." }],
      "reposts": [{ "userId": "..." }],
      "comments": [{ "id": "..." }]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 88,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

## 3) 关注关系操作

### `GET /api/app/user/follow?targetUserId=...`

查询当前用户是否已关注某人。

#### Response

```json
{ "isFollowing": true }
```

### `POST /api/app/user/follow`

关注用户。

#### Body

```json
{ "targetUserId": "..." }
```

#### Response

```json
{
  "success": true,
  "isFollowing": true,
  "message": "Followed xxx"
}
```

### `DELETE /api/app/user/follow`

取消关注用户。

#### Body

```json
{ "targetUserId": "..." }
```

#### Response

```json
{
  "success": true,
  "isFollowing": false,
  "deleted": true
}
```

---

## 4) 关注/粉丝列表

### `GET /api/app/user/follows`

获取关注列表或粉丝列表，支持分页。

#### Query

- `userId?: string`（不传默认当前用户）
- `type?: "following" | "followers"`（默认 `following`）
- `page?: number`（默认 `1`）
- `pageSize?: number`（默认 `20`，最大 `50`）

#### Response

```json
{
  "userId": "...",
  "type": "followers",
  "list": [
    {
      "user": {
        "id": "...",
        "name": "...",
        "avatar": "...",
        "bio": "..."
      },
      "followedAt": "2026-02-10T12:00:00.000Z",
      "isFollowingByMe": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 99,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

## 5) 用户设置

### `GET /api/app/user/settings`

获取当前用户设置页所需基础信息。

#### Response

```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "avatar": "...",
  "bio": "...",
  "coverImage": "...",
  "postViewMode": "both",
  "showUserData": true,
  "experience": 100,
  "level": 1
}
```

### `PATCH /api/app/user/settings`

更新用户设置（部分更新）。

#### Body（可选字段，至少传一个）

```json
{
  "name": "新昵称",
  "avatar": "https://...",
  "bio": "...",
  "coverImage": "https://...",
  "postViewMode": "both",
  "showUserData": true
}
```

#### Response

```json
{
  "message": "Settings updated successfully",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "avatar": "...",
    "bio": "...",
    "coverImage": "...",
    "postViewMode": "both",
    "showUserData": true,
    "experience": 100,
    "level": 1
  }
}
```

---

## 6) 设置页头像/背景上传（重点）

> 设置页的头像和背景图，推荐走“先上传文件，再保存设置”两步流程。

### 6.1 头像上传

#### `POST /api/upload`

- 鉴权：是（必须登录）
- 请求：`multipart/form-data`
- 文件字段：`file`
- 允许类型：`image/jpeg`、`image/jpg`、`image/png`、`image/webp`、`image/gif`
- 大小限制：最大 `10MB`

#### 成功返回

```json
{
  "url": "https://cdn.xxx.com/images/xxx.webp"
}
```

> 兼容说明：历史逻辑里可能出现 `thumbnailUrl` 字段，前端可忽略，仅使用 `url` 即可。

---

### 6.2 背景图/背景视频上传

#### `POST /api/upload/background`

- 鉴权：是（必须登录）
- 请求：`multipart/form-data`
- 文件字段：`file`
- 图片类型：`image/jpeg`、`image/jpg`、`image/png`、`image/webp`、`image/gif`
- 视频类型：`video/mp4`、`video/quicktime`（MOV）、`video/x-msvideo`（AVI）
- 视频大小限制：最大 `100MB`

#### 成功返回（图片）

```json
{
  "url": "https://cdn.xxx.com/backgrounds/xxx_compressed.webp",
  "type": "image"
}
```

#### 成功返回（视频）

```json
{
  "url": "https://cdn.xxx.com/backgrounds/xxx.mp4",
  "previewUrl": "https://cdn.xxx.com/backgrounds/xxx_preview.webp",
  "type": "video"
}
```

---

### 6.3 上传后如何真正“保存到设置”

上传接口只负责把文件传到 COS，并返回可访问 URL，不会自动写入用户资料。

上传成功后，请再调用：`PATCH /api/app/user/settings`

- 保存头像：传 `avatar`
- 保存背景：传 `coverImage`

示例：

```json
{
  "avatar": "https://cdn.xxx.com/images/xxx.webp",
  "coverImage": "https://cdn.xxx.com/backgrounds/xxx.mp4"
}
```

删除背景可传：

```json
{
  "coverImage": null
}
```

---

### 6.4 App 前端注意事项

- 上传时不要手动设置 `Content-Type`，让 `fetch`/`axios` 自动带 `multipart/form-data` boundary。
- 上传按钮建议做防重复提交（loading 状态），视频上传与转码可能耗时更长。
- 如果是视频背景，列表/详情页优先使用上传返回的 `previewUrl` 做首屏占位图。
- 只有 `PATCH /api/app/user/settings` 成功后，才算用户资料真正更新完成。
- 当 `coverImage` 是 `.mp4` 且没有缓存 `previewUrl` 时，可按规则推导：`xxx.mp4 -> xxx_preview.webp`。

---

## 推荐调用流程（App 个人主页/他人主页）

1. 页面初始化调用 `GET /api/app/user/profile?userId=xxx`。
2. 调用 `GET /api/app/user/posts?userId=xxx&page=1&pageSize=20` 拉首屏帖子。
3. 进入关注/粉丝页时调用 `GET /api/app/user/follows?...`。
4. 关注按钮点击调用 `POST /api/app/user/follow`；取关调用 `DELETE /api/app/user/follow`。
5. 设置页进入调用 `GET /api/app/user/settings`；保存调用 `PATCH /api/app/user/settings`。

---

## 7) App 评论接口（支持评论/回复带图）

你问的这个点现在已补：`api/app` 下有评论接口了，评论和回复都支持图片。

### 7.1 获取某帖子评论树

#### `GET /api/app/comment?postId=...`

- 返回结构与网站端详情页一致：顶层评论 + 每条评论下的 `replies`
- 评论正文在 `content`，图片采用 Markdown 图片语法存储（和网站端一致）

---

### 7.2 发表评论 / 回复（可带图）

#### `POST /api/app/comment`

#### Body

```json
{
  "postId": "帖子ID",
  "content": "文字内容，可空",
  "parentId": "父评论ID，可选，传了就是回复",
  "images": [
    "https://cdn.xxx.com/images/1.webp",
    "https://cdn.xxx.com/images/2.webp"
  ]
}
```

#### 规则

- `postId` 必填
- `content` 和 `images` 至少要有一个（纯图片评论可 `content` 为空）
- `images` 最多 9 张
- 回复时 `parentId` 要属于同一个 `postId`

#### 说明

- 后端会把 `images` 自动转成 Markdown 图片块并拼到 `content` 中，和网站端渲染逻辑保持一致。

---

### 7.3 删除评论

#### `DELETE /api/app/comment`

```json
{ "id": "评论ID" }
```

- 权限：评论作者或管理员

---

### 7.4 评论图片上传（App 专用入口）

#### `POST /api/app/comment/upload`

- 这是 `/api/upload` 的 App 别名入口，能力一致
- `multipart/form-data`，字段 `file`
- 允许图片类型：`jpeg/jpg/png/webp/gif`
- 最大 `10MB`

#### 返回

```json
{ "url": "https://cdn.xxx.com/images/xxx.webp" }
```

---

### 7.5 评论带图推荐调用顺序

1. 先调用 `POST /api/app/comment/upload` 上传每张图片，拿到 `url`。
2. 再调用 `POST /api/app/comment`，把 `content + images[]` 一起提交。
3. 刷新评论列表：`GET /api/app/comment?postId=...`。
