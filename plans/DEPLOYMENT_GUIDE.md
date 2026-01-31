# 同学论坛 - 部署和测试指南

本文档提供完整的部署流程和测试指南，涵盖数据库迁移、安全响应头配置和 API 端点验证。

---

## 前提条件

### 系统要求

- **服务器**: Linux (Ubuntu 20.04+ 推荐)
- **Node.js**: v18.17.0 或更高版本
- **MySQL**: 5.7+ 或 8.0+
- **PM2**: 最新版本 (`npm install -g pm2`)
- **Git**: 用于代码部署

### 必需的工具

- SSH 访问服务器权限
- MySQL 数据库管理员权限
- GitHub 仓库访问权限

### 环境变量确认

确保以下环境变量已正确配置（`.env` 文件）：

```env
DATABASE_URL="mysql://user:password@host:3306/database"
NEXTAUTH_URL="http://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
```

### 数据库授权

使用以下 SQL 命令配置数据库用户（用户名：ryx，密码：780429ryx）：

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, FILE, INDEX, ALTER, CREATE TEMPORARY TABLES, EXECUTE, CREATE VIEW, SHOW VIEW, CREATE ROUTINE, ALTER ROUTINE, EVENT, TRIGGER ON *.* TO 'ryx'@'%';
```

---

## 第 1 部分: 数据库迁移

### 1.1 迁移前准备

#### 步骤 1: 备份数据库

在生产环境执行迁移前，**务必**先备份数据库：

```bash
# 方法 1: 使用 mysqldump
mysqldump -h 8.138.41.254 -u your_user -p your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 方法 2: 使用 mysqldump 压缩备份
mysqldump -h 8.138.41.254 -u your_user -p your_database | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 验证备份文件
ls -lh backup_*.sql
```

#### 步骤 2: 检查环境变量

```bash
# 在项目目录下检查 .env 文件
cat .env | grep DATABASE_URL
```

确保 `DATABASE_URL` 指向正确的数据库。

#### 步骤 3: 验证数据库连接

```bash
# 使用 Prisma 验证连接
npx prisma db push --accept-data-loss
# 或者仅验证不执行
npx prisma db pull
```

---

### 1.2 开发环境迁移

在本地开发环境测试迁移：

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 生成 Prisma Client
npx prisma generate

# 4. 应用数据库迁移（开发环境）
npx prisma db push

# 5. 验证迁移成功
npx prisma studio
```

---

### 1.3 生产环境迁移

#### 方法 A: 通过 GitHub Actions 自动部署

修改 `.github/workflows/main.yml` 添加迁移步骤：

```yaml
# 在 npm run build 之前添加
- name: Run Database Migration
  run: |
    npx prisma generate
    npx prisma db push
```

#### 方法 B: 手动执行迁移（推荐首次迁移）

```bash
# 1. SSH 连接到服务器
ssh user@your-server-ip

# 2. 进入项目目录
cd /www/wwwroot/forum

# 3. 拉取最新代码
git fetch --all
git reset --hard origin/main

# 4. 安装依赖
npm install

# 5. 生成 Prisma Client
npx prisma generate

# 6. 应用数据库迁移
npx prisma db push

# 7. 验证迁移
npx prisma migrate status

# 8. 重新构建项目
npm run build

# 9. 重启 PM2 服务
pm2 reload start
```

---

### 1.4 验证迁移结果

检查新增的索引是否创建成功：

```bash
# 连接到 MySQL
mysql -h 8.138.41.254 -u your_user -p your_database

# 查看 Post 表索引
SHOW INDEX FROM Post;

# 查看 Comment 表索引
SHOW INDEX FROM Comment;

# 查看 Notification 表索引
SHOW INDEX FROM Notification;
```

预期应该看到以下索引：

**Post 表:**

- `authorId` 索引
- `createdAt` 索引
- `topicId` 索引

**Comment 表:**

- `postId` 索引
- `authorId` 索引
- `parentId` 索引

**Notification 表:**

- `receiverId` 索引
- `receiverId_isRead_createdAt` 复合索引
- `senderId_receiverId_type_postId_isRead` 复合索引
- `senderId_receiverId_type_commentId_isRead` 复合索引

---

### 1.5 回滚计划

如果迁移出现问题，按以下步骤回滚：

#### 步骤 1: 立即停止服务

```bash
pm2 stop start
```

#### 步骤 2: 回滚代码

```bash
git reset --hard HEAD~1  # 回滚到上一个 commit
# 或指定 commit
git reset --hard <commit-hash>
```

#### 步骤 3: 恢复数据库

```bash
# 如果有 SQL 备份
mysql -h 8.138.41.254 -u your_user -p your_database < backup_YYYYMMDD_HHMMSS.sql

# 如果是压缩备份
gunzip < backup_YYYYMMDD_HHMMSS.sql.gz | mysql -h 8.138.41.254 -u your_user -p your_database
```

#### 步骤 4: 重新部署

```bash
npm install
npm run build
pm2 reload start
```

---

## 第 2 部分: 安全响应头部署

### 2.1 本地测试

验证 `next.config.ts` 中的安全响应头配置：

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在另一个终端检查响应头
curl -I http://localhost:3000
```

预期输出应包含以下响应头：

```
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

---

### 2.2 生产部署

安全响应头已配置在 `next.config.ts` 中，会随项目自动部署。

确认步骤：

```bash
# 1. 确保 next.config.ts 已提交
git add next.config.ts
git commit -m "配置安全响应头"
git push origin main

# 2. 等待 GitHub Actions 自动部署完成

# 3. 验证生产环境响应头
curl -I https://your-domain.com
```

---

### 2.3 使用在线工具验证

使用以下工具验证安全配置：

1. **Security Headers**: https://securityheaders.com/
2. **Mozilla Observatory**: https://observatory.mozilla.org/

输入您的域名，检查评分（目标：A+ 或 A）

---

## 第 3 部分: API 端点测试

### 3.1 准备工作

#### 获取认证 Token

```bash
# 登录获取 session cookie
curl -X POST https://your-domain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -c cookies.txt
```

#### 创建测试文件

创建一个临时测试图片：

```bash
# 创建一个小测试图片 (1MB)
dd if=/dev/zero of=test_image.jpg bs=1024 count=1024
```

---

### 3.2 手动测试步骤

#### 1. 文件上传测试 (`/api/upload`)

**测试 1.1: 正常上传**

```bash
curl -X POST https://your-domain.com/api/upload \
  -b cookies.txt \
  -F "file=@test_image.jpg" \
  -i
```

预期: 返回 200 状态码和图片 URL

**测试 1.2: 超过 10MB 限制**

```bash
# 创建 11MB 文件
dd if=/dev/zero of=large_file.jpg bs=1024 count=11264

curl -X POST https://your-domain.com/api/upload \
  -b cookies.txt \
  -F "file=@large_file.jpg" \
  -i
```

预期: 返回 400 状态码，错误信息 "File size exceeds 10MB limit"

**测试 1.3: 无效文件类型**

```bash
echo "not an image" > fake.jpg

curl -X POST https://your-domain.com/api/upload \
  -b cookies.txt \
  -F "file=@fake.jpg" \
  -i
```

预期: 返回 400 状态码，错误信息 "Invalid file type"

**测试 1.4: 未认证上传**

```bash
curl -X POST https://your-domain.com/api/upload \
  -F "file=@test_image.jpg" \
  -i
```

预期: 返回 401 状态码

---

#### 2. 帖子 API 测试 (`/api/post`)

**测试 2.1: 创建帖子 - 正常**

```bash
curl -X POST https://your-domain.com/api/post \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"测试标题","content":"这是一个测试帖子的内容","images":[]}' \
  -i
```

预期: 返回 201 状态码

**测试 2.2: 标题超过 200 字符**

```bash
curl -X POST https://your-domain.com/api/post \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title":"'"$(printf 'A%.0s' {1..201})"'","content":"测试内容"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Title must be less than 200 characters"

**测试 2.3: 内容超过 10000 字符**

```bash
curl -X POST https://your-domain.com/api/post \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"'"$(printf 'A%.0s' {1..10001})"'"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Content must be less than 10000 characters"

**测试 2.4: 图片超过 10 张**

```bash
curl -X POST https://your-domain.com/api/post \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"测试","images":["url1","url2","url3","url4","url5","url6","url7","url8","url9","url10","url11"]}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Maximum 10 images allowed"

---

#### 3. 话题 API 测试 (`/api/topic`)

**测试 3.1: 创建话题 - 正常**

```bash
curl -X POST https://your-domain.com/api/topic \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"测试话题","description":"这是一个测试话题"}' \
  -i
```

预期: 返回 201 状态码

**测试 3.2: 名称超过 50 字符**

```bash
curl -X POST https://your-domain.com/api/topic \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"'"$(printf 'A%.0s' {1..51})"'"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Topic name must be less than 50 characters"

**测试 3.3: 描述超过 500 字符**

```bash
curl -X POST https://your-domain.com/api/topic \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","description":"'"$(printf 'A%.0s' {1..501})"'"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Description must be less than 500 characters"

---

#### 4. 个人资料 API 测试 (`/api/auth/complete-profile`)

**测试 4.1: 更新资料 - 正常**

```bash
curl -X POST https://your-domain.com/api/auth/complete-profile \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","bio":"这是我的个人简介"}' \
  -i
```

预期: 返回 200 状态码

**测试 4.2: 名称超过 50 字符**

```bash
curl -X POST https://your-domain.com/api/auth/complete-profile \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"'"$(printf 'A%.0s' {1..51})"'"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Name must be less than 50 characters"

**测试 4.3: 无效的 postViewMode**

```bash
curl -X POST https://your-domain.com/api/auth/complete-profile \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"测试","postViewMode":"invalid"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "postViewMode must be either 'card' or 'compact'"

---

#### 5. 评论 API 测试 (`/api/comment`)

**测试 5.1: 创建评论 - 正常**

```bash
curl -X POST https://your-domain.com/api/comment \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"这是一条测试评论","postId":"<post-id>"}' \
  -i
```

预期: 返回 201 状态码

**测试 5.2: 缺少必需字段**

```bash
curl -X POST https://your-domain.com/api/comment \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"测试"}' \
  -i
```

预期: 返回 400 状态码，错误信息 "Content and postId are required"

---

### 3.3 自动化测试脚本

使用提供的 `test-api-validation.sh` 脚本进行自动化测试：

```bash
# 1. 给脚本执行权限
chmod +x test-api-validation.sh

# 2. 运行测试
./test-api-validation.sh
```

脚本会自动测试所有端点并生成测试报告。

---

### 3.4 验证清单

完成以下检查项确认所有 API 验证正常：

#### 文件上传验证

- [ ] 拒绝超过 10MB 的文件
- [ ] 只允许图片类型 (jpeg, png, webp, gif)
- [ ] 需要用户认证
- [ ] 成功上传返回有效 URL

#### 帖子 API 验证

- [ ] 标题限制 200 字符
- [ ] 内容限制 10000 字符
- [ ] 图片最多 10 张
- [ ] 需要内容或图片
- [ ] 需要用户认证

#### 话题 API 验证

- [ ] 名称限制 50 字符
- [ ] 描述限制 500 字符
- [ ] 图标限制 100 字符
- [ ] 名称不能为空
- [ ] 需要用户认证

#### 个人资料 API 验证

- [ ] 名称限制 50 字符
- [ ] 头像 URL 限制 500 字符
- [ ] 个人简介限制 500 字符
- [ ] postViewMode 只能是 'card' 或 'compact'
- [ ] 需要用户认证

#### 评论 API 验证

- [ ] 内容和 postId 不能为空
- [ ] 需要用户认证
- [ ] 只能删除自己的评论（除非是管理员）

---

## 第 4 部分: 部署清单

### 4.1 部署前检查

在部署到生产环境前，确认以下项目：

#### 代码检查

- [ ] 所有代码更改已提交
- [ ] `.env` 文件已正确配置
- [ ] 没有调试代码 (`console.log`, `debugger`)
- [ ] 没有包含敏感信息

#### 数据库检查

- [ ] 已创建数据库备份
- [ ] 验证数据库连接正常
- [ ] 在开发环境测试迁移成功

#### 测试检查

- [ ] 所有 API 测试通过
- [ ] 安全响应头配置正确
- [ ] 文件上传验证正常

---

### 4.2 部署步骤

#### 通过 GitHub Actions 自动部署

```bash
# 1. 确保在 main 分支
git checkout main

# 2. 拉取最新代码
git pull origin main

# 3. 推送代码触发部署
git push origin main

# 4. 监控部署状态
# 访问: https://github.com/your-repo/actions
```

#### 手动部署

```bash
# 1. SSH 连接到服务器
ssh user@your-server

# 2. 进入项目目录
cd /www/wwwroot/forum

# 3. 拉取代码
git fetch --all
git reset --hard origin/main

# 4. 安装依赖
npm install

# 5. 数据库迁移
npx prisma generate
npx prisma db push

# 6. 构建
npm run build

# 7. 重启服务
pm2 reload start

# 8. 检查服务状态
pm2 status
pm2 logs start --lines 50
```

---

### 4.3 部署后验证

#### 服务状态检查

```bash
# 检查 PM2 进程
pm2 status

# 查看日志
pm2 logs start --lines 100

# 检查端口占用
netstat -tlnp | grep :3000
```

#### 功能验证

```bash
# 1. 访问网站
curl -I https://your-domain.com

# 2. 检查响应头
curl -I https://your-domain.com | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"

# 3. 测试 API
curl https://your-domain.com/api/topic
```

#### 数据库验证

```bash
# 检查表结构
mysql -h 8.138.41.254 -u your_user -p your_database -e "SHOW TABLES;"

# 检查索引
mysql -h 8.138.41.254 -u your_user -p your_database -e "SHOW INDEX FROM Post;"
```

#### 性能检查

```bash
# 查看资源使用
pm2 monit

# 检查内存
free -h

# 检查磁盘
df -h
```

---

### 4.4 监控和日志

#### PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs start

# 保存日志
pm2 logs start --lines 1000 > deployment_$(date +%Y%m%d).log
```

#### 应用日志

```bash
# 查看最新日志
tail -f /www/wwwroot/forum/.next/server/app-paths-manifest.json

# 搜索错误
grep -r "ERROR" /www/wwwroot/forum/.next/
```

---

## 第 5 部分: 常见问题排查

### 问题 1: 迁移失败

**症状**: `npx prisma db push` 报错

**解决方案**:

```bash
# 检查数据库连接
npx prisma db pull

# 查看详细错误
npx prisma db push --debug

# 回滚到之前的 schema
git checkout prisma/schema.prisma
npx prisma db push
```

---

### 问题 2: 安全响应头未生效

**症状**: `curl -I` 看不到安全响应头

**解决方案**:

```bash
# 1. 确认 next.config.ts 配置正确
cat next.config.ts

# 2. 重新构建
npm run build

# 3. 清除缓存
rm -rf .next
npm run build

# 4. 重启服务
pm2 reload start
```

---

### 问题 3: PM2 服务无法启动

**症状**: `pm2 reload start` 失败

**解决方案**:

```bash
# 1. 查看错误日志
pm2 logs start --err

# 2. 检查端口占用
lsof -i :3000

# 3. 杀死占用端口的进程
kill -9 <PID>

# 4. 重新启动
pm2 delete start
pm2 start npm --name "start" -- start

# 5. 或使用 ecosystem.config.js
pm2 start ecosystem.config.js
```

---

### 问题 4: API 返回 500 错误

**症状**: API 调用返回内部服务器错误

**解决方案**:

```bash
# 1. 查看详细日志
pm2 logs start

# 2. 检查环境变量
cat .env

# 3. 验证数据库连接
npx prisma db pull

# 4. 检查 Prisma Client
npx prisma generate

# 5. 重启服务
pm2 reload start
```

---

## 第 6 部分: 联系和支持

### 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [PM2 文档](https://pm2.keymetrics.io/docs)

### 关键文件位置

- 配置文件: `next.config.ts`
- 数据库 Schema: `prisma/schema.prisma`
- CI/CD 配置: `.github/workflows/main.yml`
- API 路由: `src/app/api/`

### 备份位置

- 数据库备份: 自定义位置
- 代码备份: Git 历史

---

**文档版本**: 1.0
**最后更新**: 2025-01-17
**维护者**: 开发团队
