# 生产环境部署检查清单

## ViewTracker 500 错误排查步骤

### 1. 环境变量检查

确保生产服务器设置了以下环境变量：

```bash
# 必需的环境变量
DATABASE_URL=完整的数据库连接字符串
NEXTAUTH_SECRET=随机生成的密钥
NEXTAUTH_URL=https://你的域名.com
NODE_ENV=production
```

检查方法：
```bash
# 在服务器上运行
echo $DATABASE_URL
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
echo $NODE_ENV
```

### 2. Prisma Client 生成

生产环境必须生成 Prisma Client：

```bash
cd /path/to/your/project
npx prisma generate
```

验证生成：
```bash
ls -la src/generated/prisma-client  # 应该看到生成的文件
```

### 3. 数据库连接测试

在服务器上测试数据库连接：

```bash
# 使用 Prisma 测试连接
npx prisma db push --accept-data-loss  # 仅测试，不要在生产环境实际运行

# 或使用 MySQL 客户端
mysql -h 你的主机 -u 用户名 -p 数据库名
```

### 4. 数据库表结构检查

确保 `viewCount` 字段存在且类型正确：

```sql
DESCRIBE Post;
-- 应该看到 viewCount 字段，类型为 INT，默认值为 0
```

### 5. Cookie 配置修复（已完成）

已修复 `src/lib/actions/post.ts` 中的 Cookie 配置：
- 生产环境自动设置 `secure: true`
- 跨域场景使用 `sameSite: "none"`

### 6. 查看生产环境日志

在服务器上查看应用日志：

```bash
# 如果使用 PM2
pm2 logs your-app-name

# 如果使用 systemd
journalctl -u your-service-name -f

# 如果使用 Docker
docker logs your-container-name
```

查找包含 "Failed to increment view count" 的错误信息。

### 7. 浏览器开发者工具检查

1. 打开浏览器开发者工具（F12）
2. 进入 Network 标签
3. 访问帖子页面
4. 查找请求失败的项（红色）

查看：
- 请求 URL
- 请求状态码
- 响应内容
- Request Headers（特别是 Cookie）
- Response Headers（特别是 Set-Cookie）

### 8. 检查 Cookie 设置

在浏览器开发者工具中：
1. 进入 Application 标签
2. 展开 Cookies
3. 选择你的域名
4. 查找 `viewed_post_xxx` Cookie

检查：
- Cookie 是否存在
- Secure 属性是否为 true（HTTPS 环境）
- SameSite 属性
- Domain 属性

### 9. 网络请求抓包

使用抓包工具查看 Server Action 请求：

```bash
# 在浏览器控制台运行
fetch('/post/帖子ID', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.text()).then(console.log)
```

### 10. 常见问题和解决方案

#### 问题 1：Prisma Client 未生成
**症状**：Error: Cannot find module '@/generated'
**解决**：
```bash
npm run build  # 构建前会自动生成
# 或手动生成
npx prisma generate
```

#### 问题 2：数据库连接失败
**症状**：Error: Can't reach database server
**解决**：
- 检查数据库服务器是否运行
- 检查防火墙设置
- 检查 DATABASE_URL 格式是否正确
- 检查数据库用户权限

#### 问题 3：环境变量未设置
**症状**：Error: DATABASE_URL is not set
**解决**：
```bash
# PM2
pm2 restart your-app --update-env

# 或在 .env 文件中设置并重启
```

#### 问题 4：Cookie 被浏览器拒绝
**症状**：Set-Cookie 头存在但浏览器未保存 Cookie
**解决**：
- 确保使用 HTTPS
- 检查 SameSite 和 Secure 属性
- 检查 Domain 属性是否匹配

#### 问题 5：跨域问题
**症状**：CORS error
**解决**：
- 确保 NEXTAUTH_URL 与访问域名一致
- 检查反向代理配置

### 11. 反向代理配置（Nginx 示例）

如果使用 Nginx，确保正确配置：

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # 重要：传递 Cookie 相关的头部
    proxy_set_header Cookie $http_cookie;
}
```

### 12. 构建和部署命令

确保使用正确的构建命令：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 构建应用
npm run build

# 4. 启动应用
npm start
# 或使用 PM2
pm2 start npm --name "your-app" -- start
```

### 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 服务器日志中的完整错误信息
2. 浏览器开发者工具中的 Network 请求详情
3. 环境变量配置（隐藏敏感信息）
4. 数据库版本和类型
5. Node.js 版本
6. Next.js 版本
