# 帖子列表显示模式功能实现总结

## 1. 数据库模式更新

- 修改 [`prisma/schema.prisma`](prisma/schema.prisma): 在 `User` 模型中增加了 `postViewMode` 字段。
  - 类型：`String`
  - 默认值：`"both"`
  - 备注：支持 `title` (仅标题), `content` (仅正文), `both` (两者都显示)

## 2. 身份验证系统更新

- 修改 [`src/types/next-auth.d.ts`](src/types/next-auth.d.ts): 在 `Session`、`User` 和 `JWT` 类型中增加了 `postViewMode` 字段。
- 修改 [`src/lib/auth.ts`](src/lib/auth.ts):
  - 在 `authorize` 回调中从数据库读取 `postViewMode`。
  - 在 `jwt` 回调中将 `postViewMode` 存入 token，并支持在 session 更新时同步。
  - 在 `session` 回调中将 `postViewMode` 暴露给客户端。

## 3. 设置页面更新

- 修改 [`src/app/settings/page.tsx`](src/app/settings/page.tsx):
  - 增加了 `postViewMode` 状态管理。
  - 在 UI 中增加了下拉选择框，允许用户选择“仅显示标题”、“仅预览正文”或“显示标题和正文”。
  - 保存时将设置发送到 API 并更新本地 session。

## 4. 后端 API 更新

- 修改 [`src/app/api/auth/complete-profile/route.ts`](src/app/api/auth/complete-profile/route.ts): 更新数据库逻辑以处理 `postViewMode` 字段的持久化。

## 5. 前端组件逻辑更新

- 修改 [`src/components/HomeContent.tsx`](src/components/HomeContent.tsx):
  - 从 session 中读取 `postViewMode`。
  - 根据模式条件渲染帖子的标题、正文和图片。
- 修改 [`src/components/UserPostList.tsx`](src/components/UserPostList.tsx):
  - 同样实现了根据 `postViewMode` 进行条件渲染的逻辑，确保个人主页的体验与首页一致。

## 6. 执行的命令

- `npx prisma generate`: 更新 Prisma Client。
- `npx prisma db push`: 同步数据库结构。
