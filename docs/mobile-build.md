# Expo 论坛 App 构建说明（TPNS 548 方案）

## 1) 当前已落地的移动端能力

基于 `docs/app-handover.md` 已实现一版最小可用闭环：

- 登录/注册（NextAuth Credentials 流程）
- 帖子流（读取 `/api/post`）
- 帖子点赞（`/api/like`）
- 帖子详情与评论（`/api/comment`）
- 发帖（含图片上传 `/api/upload`、附件上传 `/api/upload/attachment`）
- 通知列表、未读数、标记已读、删除通知
- 个人页与设置页
- TPNS 基础封装（注册、反注册、前台 channel、RegistrationID 读取）

## 2) 应用包名（TPNS 配置用）

当前项目已配置为：

- Android package：`com.forumapp.mobile`
- iOS bundle identifier：`com.forumapp.mobile`

配置位置：
- `app.json` 中 `expo.android.package`
- `app.json` 中 `expo.ios.bundleIdentifier`

## 3) TPNS 接入参数口径（按 548 文档）

按你的官方文档口径，客户端以 `AccessID` / `AccessKey` 为主：

- `EXPO_PUBLIC_TPNS_ACCESS_ID`
- `EXPO_PUBLIC_TPNS_ACCESS_KEY`

代码位置：
- 读取配置：`src/config/appConfig.ts`
- 推送注册：`src/services/pushService.ts`

> 说明：当前 `@tencentcloud/react-native-push` 的 JS 方法参数名仍叫 `SDKAppID`/`appKey`，但这里已统一用 `AccessID`/`AccessKey` 填入。

## 4) TPNS 文件与原生侧手动步骤

你仍需手动完成（必须）：

1. 在腾讯云控制台创建 Push 应用并绑定包名 `com.forumapp.mobile`。
2. 依据官方快速集成配置 Android Gradle（`tpnsplugin`、`mavenCentral` 等）。
3. 准备 `tpns-configs.json`（含 `access_id/access_key` 和包名节点）。
4. 执行原生构建（Development Build / EAS Build）验证；Expo Go 不支持 TPNS 原生模块。

## 5) 环境变量

复制 `.env.example` 为 `.env` 并填写：

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_TPNS_ENABLED`
- `EXPO_PUBLIC_TPNS_ACCESS_ID`
- `EXPO_PUBLIC_TPNS_ACCESS_KEY`

## 6) 后端必须做什么（推送联动）

要真正实现“评论/点赞/关注实时通知”，后端至少要补这 5 件事：

1. 建设备绑定表（建议名：`push_devices`）
   - 字段：`id`, `userId`, `registrationId`, `platform`, `appPackage`, `isActive`, `lastSeenAt`
2. 建立设备注册接口
   - `POST /api/app/push/register`
   - 入参：`registrationId`, `platform`, `appPackage`, `appVersion`
   - 行为：绑定当前登录用户与设备，重复注册时 upsert
3. 建立设备反注册接口
   - `POST /api/app/push/unregister`
   - 入参：`registrationId`
   - 行为：退出登录或切账号时置为 inactive
4. 在现有通知创建点异步下发 TPNS
   - 触发点：`REPLY_POST` / `REPLY_COMMENT` / `LIKE_POST` / `LIKE_COMMENT` / `FOLLOW_USER`
   - 行为：先写站内通知，再通过队列异步发 TPNS（失败重试，不阻塞主流程）
5. 推送回执与幂等
   - 建议记录 `push_logs`：`notificationId`, `registrationId`, `requestId`, `status`, `error`, `sentAt`
   - 避免同通知对同设备重复推送

### 推荐后端事件流

- 业务事件（评论/点赞/关注）
- 创建站内通知（DB）
- 投递异步任务（queue）
- 拉取目标用户活跃设备
- 调 TPNS REST 接口下发
- 记录结果并重试失败任务

## 7) 安全建议

- `access_key` 仅用于受控配置文件和后端，不应提交到公开仓库。
- 已在 `.gitignore` 增加 `src/tpns-configs.json` 忽略规则。
- 若密钥曾泄露，建议在腾讯云控制台轮换。

## 8) 启动与校验

```bash
npm install
npm run typecheck
npm run doctor
npm run start
```

## 9) 后端 TPNS 已落地项（website）

当前 `website` 后端已补齐以下能力：

1. 设备绑定表
   - `push_devices`（Prisma 模型：`PushDevice`）
   - 字段包含：`id`, `userId`, `registrationId`, `platform`, `appPackage`, `appVersion`, `isActive`, `lastSeenAt`
2. 推送日志表（幂等 + 重试）
   - `push_logs`（Prisma 模型：`PushLog`）
   - 唯一键：`(notificationId, registrationId)`，保证同通知同设备不会重复下发
3. 设备注册接口
   - `POST /api/app/push/register`
   - 需要登录；入参：`registrationId`, `platform`, `appPackage`, `appVersion`
   - 行为：按 `registrationId` upsert，绑定当前登录用户并激活设备
4. 设备反注册接口
   - `POST /api/app/push/unregister`
   - 需要登录；入参：`registrationId`
   - 行为：将当前用户下该设备置为 `isActive=false`
5. 异步 TPNS 下发
   - 通知触发点：`/api/comment`、`/api/like`、`/api/follow`
   - 创建站内通知后异步投递 TPNS（不阻塞主请求）
6. 失败重试
   - 自动记录 `attemptCount`, `status`, `error`, `nextRetryAt`
   - 重试策略：30 秒 -> 2 分钟 -> 10 分钟（默认最多 3 次）
7. 管理员手动重试入口
   - `POST /api/app/push/retry`
   - 仅 `admin` 可调用，用于批处理 `PENDING/RETRYING` 日志

### 关键实现文件

- Prisma schema：`prisma/schema.prisma`
- 迁移 SQL：`prisma/migrations/20260209130000_add_push_device_and_logs/migration.sql`
- TPNS 服务：`src/lib/push.ts`
- 注册接口：`src/app/api/app/push/register/route.ts`
- 反注册接口：`src/app/api/app/push/unregister/route.ts`
- 手动重试接口：`src/app/api/app/push/retry/route.ts`

### 服务端环境变量（可选/推荐）

- `TPNS_ENABLED`：`false` 时禁用异步 TPNS 下发
- `TPNS_ACCESS_ID`：服务端 TPNS AccessId（优先于 `EXPO_PUBLIC_TPNS_ACCESS_ID`）
- `TPNS_ACCESS_KEY`：服务端 TPNS AccessKey（优先于 `EXPO_PUBLIC_TPNS_ACCESS_KEY`）
- `TPNS_IOS_ENV`：`dev` 或 `product`（默认 `product`）
- `TPNS_MAX_RETRY`：失败最大重试次数（默认 `3`）
- `TPNS_API_HOST`：TPNS 接口域名（默认 `api.tpns.tencent.com`）
- `TPNS_ANDROID_CHANNEL_ID`：Android 推送通道 ID（可选）

> 说明：如果未配置环境变量，服务端会尝试读取项目根目录 `tpns-configs.json` 中的 `tpns.access_id/access_key`。
