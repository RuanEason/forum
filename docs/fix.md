# 论坛项目 BUG 修复计划（交接版）

创建日期：2026-05-16  
项目目录：`e:\website`

---

## 目标

将当前确认的核心问题交给其他开发者修复，重点包括：

1. 页面与操作加载反馈不足（体验问题）
2. 登录/注册/初始化资料串号（高危逻辑问题）
3. 分享链接线上出现 localhost（环境与链接生成问题）
4. 你新增的强制需求：全站“先全屏加载页（三点动画）再显示页面”

---

## 必做需求（新增）

### 全站全屏加载页（三点动画）

需求描述：

- 首次进入网站时，页面内容先不显示，只显示全屏“加载动画”。（参考SVG：
```
<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<path d="M0 0h24v24H0z" fill="none" />
	<rect width="7.33" height="7.33" x="1" y="1" fill="currentColor">
		<animate id="SVGzjrPLenI" attributeName="x" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s" values="1;4;1" />
		<animate attributeName="y" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s" values="1;4;1" />
		<animate attributeName="width" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="0;SVGXAURnSRI.end+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="8.33" y="1" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="1;4;1" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="1" y="8.33" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="1;4;1" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.1s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="15.66" y="1" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="1;4;1" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="8.33" y="8.33" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="1" y="15.66" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="1;4;1" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.2s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="15.66" y="8.33" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="8.33" y="15.66" fill="currentColor">
		<animate attributeName="x" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="8.33;11.33;8.33" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.3s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
	<rect width="7.33" height="7.33" x="15.66" y="15.66" fill="currentColor">
		<animate id="SVGXAURnSRI" attributeName="x" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="y" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s" values="15.66;18.66;15.66" />
		<animate attributeName="width" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s" values="7.33;1.33;7.33" />
		<animate attributeName="height" begin="SVGzjrPLenI.begin+0.4s" dur="0.6s" values="7.33;1.33;7.33" />
	</rect>
</svg>
```
）
- 每次路由切换都一样：先显示全屏加载页，目标页面准备完成后再展示完整内容。
- 效果参考 linux.do：简洁、明确、不会误判为“卡住”。

验收标准：

1. 首次访问任意页面，先看到全屏加载动画，再出现页面内容。
2. 任意页面间跳转，都先出现全屏加载动画。
3. 慢网下（如 3G Slow）不出现“点击后毫无反馈”的情况。
4. 不出现加载层无法关闭、闪烁过快、页面滚动锁死等副作用。

---

## BUG 1：加载反馈不足（现有问题）

现象：

- 页面切换、登录、评论、注册、发帖等有 2~4 秒等待时，用户感知为“按钮没反应”。

建议修复：

1. 保留现有顶部进度条（可弱化或并存）。
2. 对关键按钮动作统一加 `loading + disabled`。
3. 与“全屏三点加载页”配合：  
   - 路由切换用全屏加载页  
   - 表单提交用按钮局部 loading

涉及文件（建议）：

- `src/components/PageLoadProgressProvider.tsx`
- `src/app/layout.tsx`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/complete-profile/page.tsx`
- `src/components/PostComments.tsx`
- `src/app/post/create/page.tsx`
- `src/components/EditPost.tsx`

---

## BUG 2：登录状态与注册初始化串号（高危）

现象：

- 已登录用户还能进入登录/注册页。
- 注册后进入完善资料，可能把资料写到旧账号上。

根因：

1. 缺少统一路由守卫（无完整 middleware 鉴权拦截）。
2. 注册成功后未强制切换为新注册账号会话。
3. 完善资料接口按当前 session 用户更新，导致串写。

建议修复：

1. 新增 `middleware.ts`：
   - 已登录禁止访问 `/auth/signin` 和 `/auth/signup`
   - 未登录禁止访问 `/auth/complete-profile`
2. 注册成功后自动登录新账号，再进入完善资料页。
3. auth 页面增加服务端重定向保护，避免客户端状态窗口期穿透。
4. Navbar 对 `status === "loading"` 增加中间态，避免闪现错误按钮。

关键文件：

- `src/app/api/auth/register/route.ts`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/complete-profile/page.tsx`
- `src/app/api/auth/complete-profile/route.ts`
- `src/components/Navbar.tsx`
- `src/components/ProfileCompletionCheck.tsx`

---

## BUG 3：分享链接线上出现 localhost

现象：

- 生产环境分享链接仍可能是 localhost。

根因线索：

1. API 依赖 `request.nextUrl.origin`，在代理/隧道场景可能拿到错误 origin。
2. 前端 fallback 里有 localhost 硬编码。
3. 项目内 base URL 来源不统一（share/sitemap/robots 各写各的）。

建议修复：

1. 新增统一站点 URL 工具（如 `src/lib/site-url.ts`）。
2. share/sitemap/robots 全部改为统一来源。
3. 生产环境禁用 localhost fallback。

关键文件：

- `src/app/api/share/route.ts`
- `src/components/RepostButton.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

---

## NEXTAUTH_SECRET 变更后的旧 Cookie 处理（附加要求）

需求：

- 当 `NEXTAUTH_SECRET` 更换后，旧 cookie 无法解密时，不要让用户看到异常流程。
- 自动清理无效会话 cookie，直接回到重新登录。

建议实现：

- 在 middleware 或认证入口检测无效 token 会话并清理 cookie 后重定向。
- 兼容 `__Secure-` 前缀与非前缀 cookie 名称。

---

## 实施顺序（建议）

1. 先修 BUG 2（高危串号）
2. 再修 BUG 3（线上链接正确性）
3. 再做 BUG 1 + 全屏加载统一体验
4. 最后做 NEXTAUTH_SECRET 旧会话清理完善

---

## 回归测试清单

1. 已登录访问 `/auth/signin`、`/auth/signup` 必须被重定向。
2. 未登录访问 `/auth/complete-profile` 必须被重定向。
3. 完整走“注册 -> 自动登录 -> 完善资料”，确认写入账号正确。
4. 全站首次进入与路由切换都先显示全屏加载页。
5. 登录/注册/评论/发帖/编辑帖在提交时有按钮 loading 且不可重复提交。
6. 线上分享链接、海报二维码、复制链接均为正式域名。
7. `robots.txt` 与 `sitemap.xml` 域名正确。
8. 更换 `NEXTAUTH_SECRET` 后旧会话自动失效并进入登录流程。

---

## 交接要求

修复完成后需提交：

1. 修改文件清单
2. 每个问题的修复说明
3. 回归测试结果（截图或测试记录）

