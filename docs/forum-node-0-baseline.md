# 节点 0 基线记录：建立基线与回滚准备

基准日期：2026-08-17  
工作区：`E:\website`  
分支：`main`  
基线提交：`b4d3d9cd1af8a8b2198ae436e399d9efd2d89e55`

## 基线检查

执行环境：Node.js `v24.12.0`，npm `11.6.2`，Prisma CLI `5.10.2`，Windows x64。

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | 通过，退出码 0 |
| Prisma schema | `npx prisma validate` | 通过，schema 有效，退出码 0 |
| 现有测试 | `npx tsx --test tests/mentions.test.ts tests/rich-text-content.test.ts tests/rich-text-paste.test.ts` | 通过，8/8，退出码 0 |
| ESLint | `npm run lint` | 基线失败：8825 个问题，其中 426 errors、8399 warnings |

### ESLint 基线说明

初始 ESLint 会扫描 `.tmp` 下的第三方生成文件，并且业务代码已有 `any`、未使用变量、Hook 依赖和 CommonJS import 等问题。该结果是节点 0 的历史基线；第三方参考目录已在 2026-08-17 移出工作区，剩余业务质量问题仍属于后续质量收尾。

节点 0 新增文件的定向检查命令：

```bash
npx eslint src/lib/feature-flags.ts tests/feature-flags.test.ts
```

## 节点 0 变更后验证

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | 通过，退出码 0 |
| Prisma schema | `npx prisma validate` | 通过，schema 有效，退出码 0 |
| 测试 | `npx tsx --test tests/*.test.ts`（实际使用明确文件列表） | 通过，11/11，退出码 0 |
| 节点 0 新增文件 ESLint | `npx eslint src/lib/feature-flags.ts tests/feature-flags.test.ts` | 通过，退出码 0 |
| 补丁格式 | `git diff --check` | 通过，退出码 0 |

全量 `npm run lint` 的 8825 个问题属于已记录的项目既有基线，不计入节点 0 新增文件回归；最终发布前仍必须由节点 6 完成清理并重新通过。

## 第三方参考目录清理后的复验

2026-08-17 已将未使用的第三方参考目录移出工作区，避免其生成代码参与论坛项目 ESLint。清理后的全量结果：

```text
npm run lint
失败：47 problems（25 errors、22 warnings）
```

这 47 条均来自项目自身文件，已不再包含第三方参考代码产生的 8778 条问题。原始目录已移至工作区外的隔离位置，便于需要时恢复。

## 节点 0 最终收尾验证

清理 Casdoor 参考目录并修复项目自身问题后，最终验证结果：

```text
npm run lint       通过，0 errors、0 warnings
npx tsc --noEmit   通过
npx prisma validate 通过
测试               11/11 通过
npx next build     通过，静态页面 88/88 生成
```

`npm run build` 的 `prisma generate` 阶段曾因本地 `next dev` 进程占用 Windows Prisma 引擎文件返回 EPERM；使用现有已生成 Client 执行的 `npx next build` 已完整通过生产编译和页面生成。

当前开发环境使用开发 MySQL 和 Redis，数据丢失可接受；Redis 当前主要用于验证码。生产迁移前仍需按备份说明建立生产资源的正式备份和恢复演练。

## 环境变量约定

`.env.example` 已补充以下约定，示例值均为占位符：

- `TEST_DATABASE_URL`：测试专用 MySQL，禁止指向生产数据库。
- `TEST_REDIS_URL`：测试专用 Redis，禁止复用生产实例。
- `HEALTHCHECK_SECRET`：内部健康检查密钥，不得返回给客户端。
- `CRON_SECRET`：内部定时任务密钥，不得暴露到前端。
- `FEATURE_PERMISSION_DB_AUTHORIZATION`：权限数据库实时校验开关，默认关闭。
- `FEATURE_CURSOR_PAGINATION`：分页迁移开关，默认关闭。
- `FEATURE_MEDIA_CLEANUP`：媒体清理任务开关，默认关闭。

生产和测试环境必须使用不同的数据库、Redis、COS 凭据和密钥。应用只读取 `TEST_*` 变量作为测试配置，不能在生产请求路径中自动回退到测试资源。

## 备份、迁移和回滚

详细步骤见：[forum-backup-migration-rollback.md](./forum-backup-migration-rollback.md)。本节点已明确：

- MySQL 使用托管快照/逻辑备份 + binlog/PITR，并在隔离库做恢复演练。
- Redis 使用托管快照或 RDB/AOF，并验证恢复后的限流、会话和通知 key。
- COS 使用版本控制、生命周期和异地/跨地域策略，并对图片、附件、视频做对象恢复验证。
- 生产只执行 `npx prisma migrate deploy`；数据库问题优先向前修复，代码使用上一已验证构建回滚。

生产实际备份开关、保留期和恢复演练结果必须由部署环境补充证据；源码检查不代替该证据。

## 功能开关

`src/lib/feature-flags.ts` 提供 fail-closed 的运行时读取函数：

- `permissionDbAuthorization` ← `FEATURE_PERMISSION_DB_AUTHORIZATION`
- `cursorPagination` ← `FEATURE_CURSOR_PAGINATION`
- `mediaCleanup` ← `FEATURE_MEDIA_CLEANUP`

所有开关在未配置或值不明确时保持关闭；本节点不把开关接入节点 1、3、4 的业务逻辑。
