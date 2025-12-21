# 网站优化计划 (SEO & UI/CSS)

本计划旨在提升网站的搜索引擎可见性 (SEO) 并改善用户界面 (UI) 和用户体验 (UX)。

## 1. SEO 优化 (搜索引擎优化)

### 1.1 动态元数据 (Dynamic Metadata)
目前网站仅在根布局中使用了静态元数据。为了让搜索引擎更好地理解每个页面的内容，我们需要为动态路由实现动态元数据。

- **目标文件**:
  - `src/app/post/[id]/page.tsx`
  - `src/app/user/[id]/page.tsx`
- **行动**:
  - 使用 Next.js 的 `generateMetadata` 函数。
  - 在帖子详情页：设置 `title` 为帖子内容摘要，`description` 为帖子前 100 字，`openGraph` 图片为帖子第一张图片（如果有）。
  - 在用户个人页：设置 `title` 为用户昵称，`description` 为用户简介。

### 1.2 站点地图与爬虫协议 (Sitemap & Robots)
帮助搜索引擎爬虫更高效地索引网站内容。

- **目标文件**:
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
- **行动**:
  - 创建 `sitemap.ts` 动态生成站点地图，包含首页、所有帖子页和用户页的链接。
  - 创建 `robots.ts` 指导爬虫行为。

### 1.3 结构化数据 (JSON-LD)
使用 Schema.org 标准标记内容，以便在搜索结果中显示富文本摘要。

- **目标文件**:
  - `src/app/post/[id]/page.tsx`
- **行动**:
  - 在帖子详情页添加 `Article` 或 `SocialMediaPosting` 类型的 JSON-LD 数据。
  - 包含作者、发布时间、图片和互动数量等信息。

## 2. UI/CSS 优化 (界面与样式)

### 2.1 全局样式与排版
微调全局样式以提升阅读体验。

- **目标文件**: `src/app/globals.css`
- **行动**:
  - 优化字体平滑度 (`antialiased`)。
  - 确保链接颜色和交互状态的一致性。

### 2.2 组件视觉优化
提升核心组件的视觉质感。

- **帖子卡片 (`HomeContent.tsx`, `UserPostList.tsx`)**:
  - 增加卡片悬停时的微弱阴影加深效果，提升交互感。
  - 优化头像与内容的间距。
  - 优化底部操作栏（点赞、评论、转发）的图标与文字对齐和点击区域。
- **按钮与表单**:
  - 统一按钮风格（圆角、阴影、悬停态）。
  - 优化输入框 focus 状态的视觉反馈。

### 2.3 移动端适配微调
确保在移动设备上的良好体验。

- **行动**:
  - 检查 `PostImages` 在移动端的网格间距。
  - 检查导航栏在小屏幕上的布局。
  - 确保点击目标（如按钮）在移动端有足够的大小。

## 3. 执行步骤

1.  **SEO 实施**:
    - [ ] 添加 `sitemap.ts` 和 `robots.ts`。
    - [ ] 在 `post/[id]` 实现 `generateMetadata` 和 JSON-LD。
    - [ ] 在 `user/[id]` 实现 `generateMetadata`。
2.  **UI 改进**:
    - [ ] 优化帖子列表卡片样式。
    - [ ] 检查并优化移动端布局细节。

## 4. 验证
- 使用浏览器的开发者工具检查 Meta 标签。
- 使用 Google Rich Results Test 验证结构化数据。
- 视觉检查各页面的 UI 表现。
