# 添加帖子标题功能实施计划

## 1. 数据库变更 (Database Changes)

- **文件**: `prisma/schema.prisma`
- **任务**: 在 `Post` 模型中添加 `title` 字段。
- **细节**: `title String?` (可选还是必需？考虑到现有数据，先设为可选或提供默认值，但在业务逻辑上要求新帖子必需)。为了兼容性，可以先设为可选，或者设为 `String @default("")`。通常论坛帖子标题是必需的。
  - 建议：`title String?` 或者 `title String @default("")`。考虑到现有数据没有标题，使用 `String?` 更安全，或者在迁移时填充默认值。
  - **决定**: 使用 `title String?`，但在应用层逻辑中对新帖子强制要求。或者 `title String @default("")`。
  - 让我们查看 `prisma/schema.prisma` 再次确认。
  - 考虑到可能需要非空，可以使用 `title String @default("无标题")` 方便迁移，后续 enforce not empty。或者直接 nullable。
  - **方案**: `title String?`。

## 2. 后端 API 更新 (Backend API Updates)

- **文件**: `src/lib/post.ts`

  - 更新 `createPost`: 接收 `title` 参数并在 `prisma.post.create` 中包含它。
  - 更新 `updatePost`: 允许更新 `title`。
  - 更新 `getPosts` / `getPostById`: 确保查询结果包含 `title` (Prisma 默认会包含所有标量字段，所以可能不需要显式修改 `select` 除非使用了 `select`)。
    - 检查 `getPosts` 的 `include`。目前没有 `select` 字段限制在顶层，只在关联字段有 `select`。所以 `title` 会自动包含。

- **文件**: `src/app/api/post/route.ts`
  - `POST` 方法: 从 request body 解析 `title`。验证 `title` 是否存在（如果决定必填）。调用 `createPost` 时传入。
  - `PUT` 方法: 从 request body 解析 `title`。允许更新。

## 3. 前端页面更新 (Frontend Updates)

### 3.1. 发布帖子页面

- **文件**: `src/app/post/create/page.tsx`
- **任务**:
  - 添加 `title` 状态变量 (`useState`).
  - 在 UI 中添加一个输入框 (`<input type="text" ... />`) 用于输入标题，放在 Markdown 编辑器上方。
  - 更新 `handleCreatePost` 函数，将 `title` 包含在发送给 API 的数据中。
  - 添加前端验证：标题不能为空。

### 3.2. 帖子列表组件

- **文件**: `src/components/UserPostList.tsx` & `src/components/HomeContent.tsx`
- **任务**:
  - 更新 `PostProps` 接口以包含 `title`。
  - 在渲染帖子卡片时，在内容上方或显眼位置显示标题。标题应该是一个链接，指向帖子详情页。

### 3.3. 帖子详情页面

- **文件**: `src/app/post/[id]/page.tsx`
- **任务**:
  - 更新 `PostDetailProps` 接口包含 `title`。
  - 在页面顶部、作者信息或内容上方显示帖子标题 (`<h1>`).
  - 更新 `generateMetadata` 使用帖子标题作为页面 `<title>`。

## 4. 执行步骤 (Execution Steps)

1.  **修改 Schema**: 修改 `prisma/schema.prisma` 添加 `title` 字段。
2.  **数据库迁移**: 运行 `npx prisma db push` (或 `migrate dev`) 应用更改。
3.  **重新生成 Client**: `npx prisma generate` (通常包含在 migrate 中)。
4.  **更新后端逻辑**: 修改 `src/lib/post.ts` 和 `src/app/api/post/route.ts` 处理 `title`。
5.  **更新发布页面**: 修改 `src/app/post/create/page.tsx` 添加标题输入框。
6.  **更新显示组件**: 修改 `src/components/HomeContent.tsx`, `src/components/UserPostList.tsx` 显示标题。
7.  **更新详情页面**: 修改 `src/app/post/[id]/page.tsx` 显示标题和元数据。
8.  **测试**: 发布新帖子，检查数据库，检查列表页和详情页显示。

## 注意事项

- 现有帖子没有标题：显示时需要处理 `null` 或空字符串的情况，可以显示“无标题”或截取部分内容作为标题，或者直接不显示标题栏（仅显示内容）。
- 标题长度限制：建议在前端和后端限制标题长度（例如 100 字符）。
