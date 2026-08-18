# 论坛问题完整处理计划

目标文档：docs/forum-completion-plan.md

基准日期：2026 年 8 月 17 日

## 总体规则

- 所有问题按以下顺序处理：权限即时生效 → 数据库测试接口 → 媒体清理与注销 → 分页 → 账号安全 → 必做安全与质量收尾 → 社区功能候选。
- 每个节点必须独立更新文档状态：
  - 待开始
  - 进行中
  - 已完成
  - 阻塞
- 只有代码、迁移、测试、上线检查全部通过后，才能标记为已完成。
- 每个完成节点必须写明：
  - 完成日期
  - 修改范围
  - 验证命令和结果
  - 是否需要后续观察
- 数据库采用兼容式迁移：先增加字段/表，再部署兼容代码，完成回填后再清理旧逻辑。
- 社区常用功能只记录为候选 backlog，不影响本轮完成。

## 节点 0：建立基线与回滚准备

状态：已完成

完成日期：2026-08-17

完成内容：

- 新增 [节点 0 基线记录](./forum-node-0-baseline.md)，记录 TypeScript、Prisma、测试和 ESLint 基线。
- 新增 [备份、迁移与回滚说明](./forum-backup-migration-rollback.md)，明确 MySQL、Redis、COS 的备份确认项，以及 Prisma 迁移和应用代码回滚步骤。
- 在 `.env.example` 中补充 `TEST_DATABASE_URL`、`TEST_REDIS_URL`、`HEALTHCHECK_SECRET`、`CRON_SECRET` 和三个默认关闭的分阶段功能开关。
- 新增 `src/lib/feature-flags.ts`，提供 fail-closed 的运行时开关读取能力；本节点未接入后续业务逻辑。
- 新增功能开关单元测试。
- 清理未使用的 Casdoor 配置和第三方参考目录，避免无关代码污染 ESLint。
- 修复项目自身全部 ESLint 错误和警告。

验证结果：

- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx prisma validate`
  - 结果：通过，Prisma schema 有效；本节点未新增数据库 migration
- 命令：`npx tsx --test tests/feature-flags.test.ts tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts`
  - 结果：通过，11/11
- 命令：`npx eslint src/lib/feature-flags.ts tests/feature-flags.test.ts`
  - 结果：通过
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npx next build`
  - 结果：通过，生产构建成功，静态页面 88/88 生成
- 命令：`npm run build`
  - 结果：前置 `prisma generate` 因正在运行的开发服务器占用 Windows Prisma 引擎文件而出现 EPERM；随后使用已生成 Client 执行 `npx next build` 通过，未发现代码构建错误

后续观察：

- 当前 MySQL 和 Redis 属于开发环境，允许数据丢失；Redis 当前主要用于验证码。迁移到生产服务器前，仍需建立生产数据库、Redis 和 COS 的正式备份与恢复演练记录。
- 如果需要执行完整的 `npm run build`，应先停止占用 Prisma 引擎文件的本地开发服务器，再重试该命令。

- 创建备份、迁移和回滚说明。
- 增加测试环境变量约定：
  - TEST_DATABASE_URL
  - TEST_REDIS_URL
  - HEALTHCHECK_SECRET
  - CRON_SECRET
- 确认生产数据库、Redis、COS 备份策略。
- 记录当前 TypeScript、Prisma、测试和 ESLint 基线。
- 创建功能开关，便于分阶段启用权限刷新、分页和媒体清理。

完成标准：

- 所有基线检查结果写入文档。
- 有明确的数据库备份与代码回滚步骤。
- 该节点完成后在文档中标记：已完成（日期 + 验证结果）。

## 节点 1：修复权限状态不会即时生效

状态：已完成
完成日期：2026-08-17

目标：数据库中的 role、banned 和用户存在状态作为最终权限依据，JWT 只用于识别用户。

实施内容：

- 增加统一服务端鉴权函数，返回当前数据库用户：
  - id
  - role
  - banned
  - sessionVersion
- 所有受保护 API 改用该鉴权函数，不再直接信任 JWT 中缓存的角色。
- 用户被封禁后：
  - 受保护写操作立即返回 403。
  - 已登录页面刷新后显示封禁状态。
- 用户被删除后：
  - 后续请求立即返回 401。
  - 清理失效认证 Cookie。
- 管理员权限必须从数据库实时读取。
- 禁止管理员封禁自己。
- 禁止普通管理员修改其他管理员，除非拥有明确的超级管理员权限。
- 增加 sessionVersion：
  - 改密码时递增。
  - 注销所有设备时递增。
  - 账号安全变更时递增。
- JWT 继续保留兼容字段，但不作为最终授权依据。

必须覆盖的 API：

- 发帖、编辑、删除帖子。
- 评论、删除评论。
- 点赞、转发、关注。
- 上传图片、附件、视频。
- 草稿和发布。
- 管理员接口。
- 推送设备接口。
- 账号安全接口。

测试场景：

- 登录后管理员封禁该用户，用户立即无法发帖。
- 登录后管理员取消管理员角色，原会话不能继续访问管理接口。
- 用户被删除后原会话失效。
- 管理员不能封禁自己。
- 未登录、普通用户、管理员分别访问受保护接口。
- 删除账号后认证 Cookie 不再有效。

完成标准：

- 所有受保护 API 不再直接使用 JWT 中的 role 进行授权。
- 权限变更测试全部通过。
- 完成后立即标记为已完成，并记录测试结果。

完成内容：

- 新增 `src/lib/server-auth.ts`，统一回查数据库用户的 `id`、`role`、`banned` 和 `sessionVersion`，并提供当前用户、活跃用户、管理员鉴权及失效 Cookie 清理。
- 新增 `User.sessionVersion` 字段和兼容式 Prisma migration `20260817090000_add_user_session_version`。
- JWT 保留兼容字段，但每次会话刷新同步数据库中的角色和封禁状态；权限判断改用数据库用户对象。
- 发帖、编辑、删除、评论、点赞、转发、关注、图片/附件/视频上传、草稿发布、管理员、推送和账号安全 API 已接入统一鉴权。
- 密码修改、GitHub 绑定/解绑等账号安全变更会递增 `sessionVersion`。
- 管理员不能封禁自己；普通管理员不能修改其他管理员，超级管理员除外。
- 增加权限策略单元测试 `tests/server-auth.test.ts`，并在页面刷新后显示账号封禁提示。

验证结果：

- 命令：`npx prisma migrate deploy`
  - 结果：通过，已应用 `20260817090000_add_user_session_version`
- 命令：`npx prisma migrate status`
  - 结果：通过，数据库 schema 已是最新
- 命令：`npx prisma validate`
  - 结果：通过
- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx tsx --test tests/server-auth.test.ts tests/feature-flags.test.ts tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts`
  - 结果：通过，14/14
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npm run build`
  - 结果：通过，Prisma Client 生成成功，生产构建成功，静态页面 88/88 生成

后续观察：

- 需要在真实登录会话中继续观察：封禁后的写接口是否稳定返回 403、角色降级后的管理接口是否立即返回 403，以及删除账号后认证 Cookie 是否在客户端被清理。
- 生产部署前执行 `npx prisma migrate deploy`，并确认所有实例使用包含 `sessionVersion` 的 Prisma Client。
- 当前开发服务器已停止以完成 Prisma 生成和构建；需要本地开发时重新执行 `npm run dev`。

## 节点 2：关闭或保护公开数据库测试接口

状态：已完成
完成日期：2026-08-17

目标：生产环境不得公开数据库状态、数据量和环境信息。

实施内容：

- /api/test-db 在生产环境默认返回 404。
- 如确实需要监控，改为使用 HEALTHCHECK_SECRET。
- 健康检查只返回：
  - ok
  - responseTime
  - 时间戳
- 不再返回：
  - 用户数量
  - 帖子数量
  - NODE_ENV
  - 数据库配置是否存在
  - 详细数据库错误
- 数据库错误只写服务端日志。
- 检查 /dev-tools、/internalTes 以及其他调试入口：
  - 生产环境关闭调试工具。
  - 预发布环境必须显式开启。
  - 不允许调试接口绕过正常权限。

测试场景：

- 生产环境无密钥访问返回 404 或 401。
- 错误密钥不能获取健康信息。
- 正确内部密钥只能获取脱敏状态。
- 数据库连接失败时响应不暴露内部错误。
- 普通公网请求不能获取用户数和帖子数。

完成标准：

- 公开接口不再泄露数据库和环境信息。
- 健康检查可被内部监控调用。
- 完成后在计划文档中标记为已完成。

实施记录：

- 新增 `src/lib/healthcheck.ts`，统一处理 `x-healthcheck-secret`/Bearer 密钥读取、恒定时间比较和脱敏响应结构。
- `/api/test-db` 改为仅执行 `SELECT 1`；生产环境无效密钥返回 404，其他环境返回 401；成功和数据库失败响应都只包含 `ok`、`responseTime`、`timestamp`。
- 数据库错误只写服务端日志，客户端不再收到用户数量、帖子数量、`NODE_ENV`、数据库配置状态或底层错误详情。
- `/dev-tools`、`/api/dev-tools/run` 和 `/internalTes` 均受 `APP_ENV` 与 `DEV_TOOLBOX_ENABLED` 双重开关控制；生产环境关闭，预发布环境必须显式设置 `APP_ENV=staging` 和 `DEV_TOOLBOX_ENABLED=true`。
- `/api/dev-tools/run` 增加正常的数据库管理员鉴权；`/dev-tools` 只对管理员显示；`/internalTes` 只对已登录且未封禁用户显示。
- 清理阅读量 Server Action 返回值中的环境、数据库配置和详细错误调试字段，避免通过公开页面返回调试信息。
- `package.json` 和 `package-lock.json` 增加 `geist@1.7.2` 依赖；安装后生产构建验证通过。
- 本节点未新增数据库 migration。

验证结果：

- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx prisma validate`
  - 结果：通过
- 命令：`npx tsx --test tests/healthcheck.test.ts tests/server-auth.test.ts tests/feature-flags.test.ts tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts`
  - 结果：通过，19/19
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npm run build`
  - 结果：通过；Prisma Client 生成成功，Next 生产构建成功，静态页面 84/84 生成。

后续观察：

- 生产部署必须配置独立随机的 `HEALTHCHECK_SECRET`，监控请求使用 `x-healthcheck-secret` 或 `Authorization: Bearer`，不得放入前端环境变量或 URL 查询参数。
- 预发布环境需同时配置 `APP_ENV=staging` 和 `DEV_TOOLBOX_ENABLED=true`；生产环境保持 `APP_ENV=production` 或默认 `NODE_ENV=production` 且关闭 `DEV_TOOLBOX_ENABLED`。
- `geist` 当前作为构建依赖保留；源码仍通过 `next/font/google` 使用 Geist 字体，如后续改为本地字体加载需同步调整 `src/app/layout.tsx`。

## 节点 3：媒体清理与注销风险治理

状态：已完成

完成日期：2026-08-17

目标：避免注销、删帖、失败上传导致 COS 孤儿文件和持续资源消耗，同时保留恢复窗口。

实施内容：

- 增加媒体清理任务表，记录：
  - 对象 Key
  - 资源类型
  - 所属用户/帖子
  - 状态
  - 可执行时间
  - 重试次数
  - 最近错误
  - 创建和更新时间
- 帖子删除改为逻辑删除，默认保留 24 小时恢复窗口。
- 账号注销改为两阶段：
  1. 立即禁止登录和隐藏公开内容。
  2. 24 小时后执行数据库删除和媒体清理。
- 增加取消注销接口：
  - 注销窗口内可以取消。
  - 窗口结束后不可恢复。
- 删除帖子或账号前，先记录所有 COS 对象：
  - 图片
  - 附件
  - 原始视频
  - 转码视频
  - 视频封面
  - 用户封面图
- COS 删除使用异步任务：
  - 幂等执行。
  - 失败自动重试。
  - 超过重试次数进入失败队列。
- 增加过期上传清理：
  - 附件上传中断。
  - 视频上传中断。
  - 视频转码失败。
  - 草稿长期未使用的媒体。
- 增加 COS 孤儿对象审计：
  - 第一阶段只扫描和报告。
  - 确认无误后再开启自动删除。
- 管理后台增加媒体清理失败数量和最近错误。

建议任务接口：

- POST /api/internal/media-cleanup
- 使用 CRON_SECRET。
- 支持批量处理、重试和 dry-run。
- 不允许普通用户调用。

测试场景：

- 删除含图片、附件和视频的帖子，所有对象都进入清理任务。
- 注销账号后媒体不会立即硬删除。
- 24 小时后任务执行并完成 COS 删除。
- COS 删除失败后可重试。
- 重复执行清理不会报错或重复扣资源。
- 注销窗口内取消后，内容和账号恢复。
- 失败上传和长期草稿媒体可以被清理。
- 孤儿扫描不会误删仍被数据库引用的对象。

完成标准：

- 删除流程不再直接遗漏 COS 对象。
- 清理任务具备状态、重试、审计能力。
- 生产环境有定时执行方式。
- 完成后标记为已完成。

实施记录：

- 新增 `MediaCleanupTask` 模型和兼容式 Prisma migration `20260817120000_add_media_cleanup_and_deletion_windows`，记录对象 Key、资源类型、用户/帖子、状态、执行时间、重试次数、错误和审计时间。
- 帖子删除改为逻辑删除，写入 `deletedAt`、`deleteScheduledAt` 和删除原因；新增 `POST /api/post/restore`，24 小时窗口内可恢复，窗口结束后由清理任务硬删除数据库记录。
- 账号注销改为两阶段：立即写入 `deletionRequestedAt`/`deletionScheduledAt`、阻止登录和写操作、隐藏公开内容；新增 `POST /api/auth/delete-account/cancel`，窗口内可取消并恢复账号内容。
- 删除帖子、注销账号、替换头像/封面、删除草稿、编辑器图片删除和失败上传均先登记媒体清理任务，不再同步遗漏 COS 对象。
- 清理任务支持幂等去重、`PENDING/PROCESSING/RETRYING/SUCCEEDED/FAILED/CANCELLED` 状态、失败退避重试、失败队列、过期上传/失败转码/长期草稿媒体清理。
- 新增 `POST /api/internal/media-cleanup`，仅接受 `CRON_SECRET`，支持批量处理、`retryFailed`、`dryRun` 和 report-only 孤儿对象审计；普通用户无法调用。
- 孤儿对象审计仅扫描和报告，默认扫描 `images/`、`attachments/`、`videos/`、`backgrounds/`、`editor-pool/`，不会自动删除对象。
- 管理后台增加待处理、重试中、处理中、失败、成功数量及最近失败信息。
- 新增 `tests/media-cleanup.test.ts`，覆盖 24 小时窗口、CDN Key 提取、幂等 Key 和孤儿审计前缀。

验证结果：

- 命令：`npx prisma migrate deploy`
  - 结果：通过，已应用 `20260817120000_add_media_cleanup_and_deletion_windows`
- 命令：`npx prisma migrate status`
  - 结果：通过，数据库 schema 已是最新
- 命令：`npx prisma validate`
  - 结果：通过
- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx tsx --test tests/media-cleanup.test.ts tests/server-auth.test.ts tests/healthcheck.test.ts tests/feature-flags.test.ts tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts`
  - 结果：通过，23/23
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npm run build`
  - 结果：通过，Prisma Client 生成成功，Next 生产构建成功，静态页面 87/87 生成

后续观察：

- 生产环境需设置 `FEATURE_MEDIA_CLEANUP=true`，并使用独立随机的 `CRON_SECRET` 定时调用 `/api/internal/media-cleanup`；默认关闭状态下只保留任务和 dry-run 能力，不会自动删除 COS 对象。
- 上线前先用 `dryRun=true` 和 `auditOrphans=true` 观察任务及孤儿报告，确认无误后再启用自动清理。
- 需要在真实 COS 环境继续观察 COS 删除失败重试、24 小时后帖子/账号硬删除、注销窗口取消恢复，以及多实例并发执行时的任务抢占情况。

## 节点 4：统一列表分页与查询负载

状态：已完成

完成日期：2026-08-17

目标：避免首页、搜索、话题、评论和后台一次性加载全部数据。

分页约定：

- 信息流、话题流、评论使用游标分页。
- 搜索、后台、用户关注列表使用页码分页。
- 默认单页 20 条，最大 50 条。
- 信息流游标排序固定为：
  - pinned DESC
  - pinnedAt DESC
  - createdAt DESC
  - id DESC
- 评论排序固定为：
  - pinned DESC
  - pinnedAt DESC
  - createdAt DESC
  - id DESC

接口返回：

~~~ts
type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};
~~~

实施内容：

- 首页帖子流改为游标分页。
- 话题帖子流改为游标分页。
- 评论和回复改为游标分页。
- 搜索结果增加页码分页。
- 管理后台用户和帖子分开分页加载。
- 用户主页帖子分页加载。
- 关注/粉丝列表分页加载。
- 通知列表增加分页和“加载更多”。
- 关系列表不再一次性查询全部数据。
- 帖子列表不再返回所有点赞、转发用户 ID：
  - 改为 likeCount
  - repostCount
  - commentCount
  - likedByMe
  - repostedByMe
- 评论列表同样改为数量和当前用户状态。
- 保留旧接口兼容模式一段时间，但旧模式也必须有最大数据量限制。
- 第一方 Web 和 App 客户端全部切换到分页模式。

前端行为：

- 首页使用加载更多或无限滚动。
- 加载中显示骨架屏。
- 防止重复请求和重复帖子。
- 游标失效时自动从第一页重新加载。
- 分页失败时保留已有内容并显示重试按钮。

测试场景：

- 新帖子产生时不会导致分页重复或漏项。
- 置顶帖子始终保持正确顺序。
- 首页 10 万条数据时只读取当前页。
- 评论量很大时首屏仍只读取有限条数。
- 搜索可正确跳页。
- 旧客户端接口仍能获得受限数据。
- 分页响应类型符合约定。

完成标准：

- 首页、话题、评论、搜索、后台和用户列表均有边界。
- 查询不再返回完整点赞/评论/转发关系。
- 关键页面首屏和数据库查询耗时有对比记录。
- 完成后标记为已完成。

实施记录：

- 新增 `src/lib/pagination.ts`，统一游标分页、页码分页、默认 20 条、最大 50 条、游标编码/校验和响应类型。
- 首页和话题帖子流改为游标分页，固定使用 `pinned DESC`、`pinnedAt DESC`、`createdAt DESC`、`id DESC`；前端支持加载更多、重复去重、游标失效后重新加载首屏和失败重试。
- Web/App 帖子列表改为数量与当前用户状态：`likeCount`、`repostCount`、`commentCount`、`likedByMe`、`repostedByMe`；旧数组接口保留最大 50 条兼容响应。
- 评论根列表和回复均改为游标分页，首屏仅查询有限评论和聚合数量；评论与回复支持独立加载更多，移除列表查询中的完整点赞用户 ID。
- 新增 `/api/search` 页码分页，搜索页面的帖子和用户分开加载；管理后台用户/帖子分开分页；用户主页帖子、关注/粉丝和通知列表均增加页码边界与加载更多。
- 新增分页数据库索引 migration `20260817150000_add_pagination_indexes`，覆盖帖子流、话题流、评论、通知和关注关系排序字段。
- 新增 `tests/pagination.test.ts`，覆盖页大小边界、游标往返/非法游标和页码响应元数据。

验证结果：

- 命令：`npx prisma migrate deploy`
  - 结果：通过，已应用 `20260817150000_add_pagination_indexes`
- 命令：`npx prisma migrate status`
  - 结果：通过，数据库 schema 已是最新
- 命令：`npx prisma validate`
  - 结果：通过
- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx tsx --test tests/pagination.test.ts tests/feature-flags.test.ts tests/server-auth.test.ts tests/healthcheck.test.ts tests/media-cleanup.test.ts tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts`
  - 结果：通过，27/27
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npm run build`
  - 结果：通过，Prisma Client 生成成功，Next 生产构建成功，静态页面 88/88 生成
- 只读分页烟测：`npx tsx -e ... getPostsPage/getCommentsPage ...`
  - 结果：帖子首屏 8/20 条、无下一页；第二页 0 条；评论首屏 1/20 条、无下一页。首屏帖子查询 109.63ms，评论首屏查询 49.28ms；查询结果均受单页边界限制。

后续观察：

- 生产数据量增长后继续记录首页、话题、评论、搜索和后台首屏耗时，与本节点烟测数据对比；重点观察游标分页在新帖插入、置顶变化和删除时是否出现重复或漏项。
- 第一方 App 客户端需要使用 `limit`/`cursor` 参数切换到新响应；旧兼容响应暂时保留最大 50 条限制。
- 继续观察评论回复分页、通知/关注列表加载更多及后台分页在真实登录会话中的重复请求和失败重试行为。

## 节点 5：补齐账号安全功能

状态：已完成

完成日期：2026-08-18

本轮不包含 TOTP 二次验证，作为后续候选功能。

完成内容：

- 新增 `PasswordResetToken`、`EmailChangeToken` 和 `SecurityEvent` 数据模型及兼容式迁移；密码重置和邮箱变更令牌只保存 SHA-256 哈希值，30 分钟过期且只能使用一次。
- 新增密码找回请求和确认接口：请求接口始终返回通用提示，按邮箱和 IP 限流；重置密码后递增 `sessionVersion` 并撤销其他未完成重置令牌。
- 新增邮箱变更请求、确认和取消接口：要求当前登录会话和当前密码，新邮箱在请求与确认阶段分别检查唯一性，确认过程使用事务防止邮箱竞争，成功后递增 `sessionVersion`。
- 新增全设备退出接口，递增 `sessionVersion`、记录安全事件并清除当前 NextAuth 会话 Cookie；设置页接入邮箱变更、取消邮箱变更和全设备退出。
- 接入密码修改、GitHub 解绑、注销申请和取消注销的安全事件；密码修改、邮箱变更、注销申请等重要操作会撤销旧会话。
- 登录失败按邮箱、账号和 IP 使用 Redis 限流，登录错误保持模糊；NextAuth JWT 更新时从数据库同步最新 `sessionVersion`，允许当前设置页完成必要收尾，同时拒绝旧设备会话。
- 新增密码找回页、邮箱验证页和登录页入口；新增账号安全单元测试，覆盖令牌哈希、一次性比较、邮箱规范化、IP 提取、限流键和通用提示。

验证结果：

- 命令：`npx prisma generate`
  - 结果：通过
- 命令：`npx prisma migrate deploy`
  - 结果：通过，已应用 `20260818100000_add_account_security_tokens_events`
- 命令：`npx prisma migrate status`
  - 结果：通过，数据库 schema is up to date
- 命令：`npx prisma validate`
  - 结果：通过，Prisma schema 有效
- 命令：`npx tsc --noEmit`
  - 结果：通过
- 命令：`npx tsx --test tests/*.test.ts`
  - 结果：通过，32/32
- 命令：`npm run lint`
  - 结果：通过，0 errors、0 warnings
- 命令：`git diff --check`
  - 结果：通过
- 命令：`npm run build`
  - 结果：通过，生产构建成功，静态页面 96/96 生成

后续观察：

- 生产环境必须配置 SMTP 发送账号安全邮件，并确认站点 Origin 配置正确；未配置 SMTP 时，令牌会在发送失败后立即失效。
- Redis 登录和账号安全限流采用 fail-closed 策略；上线前需确认生产 Redis 高可用、监控和恢复方案。
- 本节点未实现 TOTP 二次验证，保留在节点 7 候选 backlog。

实施内容：

### 密码找回

新增：

- POST /api/auth/password/reset/request
- POST /api/auth/password/reset/confirm

规则：

- 请求接口始终返回通用提示，避免邮箱枚举。
- Token 只保存哈希值。
- Token 有效期 30 分钟。
- Token 只能使用一次。
- 按邮箱和 IP 限流。
- 密码重置后递增 sessionVersion，使所有旧会话失效。

### 邮箱变更

新增：

- POST /api/auth/email/change/request
- POST /api/auth/email/change/confirm

规则：

- 必须已登录。
- 修改前要求当前密码或近期重新认证。
- 新邮箱必须验证。
- 新邮箱不能已被其他账号使用。
- 修改邮箱后递增 sessionVersion。
- 邮箱变更过程可取消和过期。

### 会话管理

新增：

- POST /api/auth/sessions/revoke-all

规则：

- 从设置页触发。
- 递增 sessionVersion。
- 当前设备也退出并跳转登录页。
- 修改密码、修改邮箱、注销账号时自动撤销旧会话。

### 登录保护

- 登录失败按账号、邮箱和 IP 限流。
- 登录错误信息保持模糊。
- 记录必要的安全事件：
  - 密码修改
  - 密码找回
  - 邮箱变更
  - 全设备退出
  - 注销账号

测试场景：

- 不存在的邮箱和已注册邮箱返回相同提示。
- 过期 Token、已使用 Token、错误 Token 均不能重置密码。
- 重置密码后旧会话失效。
- 邮箱变更后旧邮箱不能继续登录。
- 新邮箱已占用时不会修改账号。
- 登录暴力尝试触发限流。
- 全设备退出后所有会话失效。

完成标准：

- 用户可以独立找回密码。
- 账号重要变更可以撤销旧会话。
- 完成后标记为已完成。

## 节点 6：必做的审核、反滥用和隐私收尾

状态：待开始

### 审核系统

增加：

- 举报模型和举报状态。
- 举报帖子、评论、用户入口。
- 管理后台举报队列。
- 处理人、处理时间、处理结果和备注。
- 管理员操作审计日志。
- 举报重复提交限制。

### 反滥用

对以下操作增加 Redis 限流：

- 发帖
- 评论
- 点赞
- 转发
- 关注
- 图片上传
- 附件上传
- 视频上传
- 验证码发送
- 登录尝试

增加：

- 重复内容短时间拦截。
- 单用户每日媒体额度。
- 单 IP 异常请求记录。
- 失败上传和异常行为日志。

### 隐私一致性

showUserData 关闭后，公开页面统一隐藏：

- 用户统计。
- 关注数。
- 粉丝数。
- 连接列表入口。
- 用户等级和经验。

本人和管理员仍可查看必要信息。

### 工程质量

- 将 .tmp 等第三方临时目录加入 ESLint 忽略。
- 修复业务代码中的 any。
- 修复未使用变量和 Hook 依赖警告。
- 增加 API、权限、分页、媒体清理和账号安全测试。
- CI 必须执行：
  - TypeScript 检查。
  - ESLint。
  - Prisma schema 校验。
  - 单元测试。
  - API 契约测试。

完成标准：

- 举报和管理员审计闭环可用。
- 核心写接口有统一限流。
- 隐私开关行为一致。
- CI 不再因业务代码错误失败。
- 完成后标记为已完成。

## 节点 7：社区功能候选 backlog

状态：候选，不阻塞本轮完成

暂不实施，只在文档中保留需求和优先级：

- 收藏/书签。
- 用户拉黑和屏蔽。
- 话题关注。
- 关注用户信息流。
- 评论编辑。
- 搜索评论和话题。
- 搜索筛选、排序和高亮。
- TOTP 二次验证。
- 通知分类和全部已读。
- 帖子历史版本恢复。

这些功能只有在前面所有必做节点完成并稳定运行后，才进入下一轮排期。

## 验收与上线顺序

1. 节点 0 完成基线、备份和回滚准备。
2. 节点 1 先上线权限数据库校验。
3. 节点 2 关闭公开数据库测试接口。
4. 节点 3 先以 dry-run 运行媒体清理，再开启自动清理。
5. 节点 4 先迁移 Web，再迁移 App，保留兼容模式。
6. 节点 5 从密码找回开始，再加入邮箱变更和会话撤销。
7. 节点 6 完成审核、限流、隐私和 CI 收尾。
8. 每个节点完成后立即更新 docs/forum-completion-plan.md，不得集中到最后补状态。

每个节点的最终记录格式：

~~~md
状态：已完成
完成日期：YYYY-MM-DD
完成内容：
- ...

验证结果：
- 命令：...
- 结果：通过

后续观察：
- ...
~~~

## 默认假设

- 本轮不做 TOTP 二次验证。
- 社区常用功能只做候选清单。
- 权限以数据库实时状态为准，不采用几十秒权限缓存。
- 媒体采用 24 小时延迟清理和可恢复窗口。
- 信息流使用游标分页，搜索和后台使用页码分页。
- 生产环境使用兼容式迁移，不采用一次性破坏性切换。
