# 生产环境部署检查清单

## ViewTracker 500 错误排查步骤

### 关键修复：trustHost 配置

**问题**：Nginx 反向代理导致 Server Actions 失败
```
`x-forwarded-host` header with value `zyg2024.top:443` does not match `origin` header with value `zyg2024.top`
```

**解决方案**：已在 `next.config.ts` 中添加 `trustHost: true`

### 0. 快速诊断 - 数据库连接测试

首先访问测试端点检查数据库连接：
```
https://你的域名.com/api/test-db
```

**预期结果**：
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": {
    "postCount": 100,
    "userCount": 10,
    "responseTime": "50ms"
  }
}
```

**如果返回 500 错误**，说明数据库连接有问题，请先解决数据库问题。

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

### 11. 反向代理配置（Nginx 示例） - 重要！

如果使用 Nginx，必须正确配置以支持 Server Actions：

```nginx
server {
    listen 80;
    server_name zyg2024.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zyg2024.top;

    # SSL 证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # 反向代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # 关键配置：正确传递代理头
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;  # 不要包含端口
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;  # 重要：不包含端口

        # 缓存配置
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 处理 Next.js 静态文件
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**关键点**：
- `X-Forwarded-Host` 必须设置为 `$host`（不包含端口）
- `X-Forwarded-Proto` 必须设置为 `$scheme`（https）
- `Host` 必须设置为 `$host`（不包含端口）
- 不要设置 `X-Forwarded-Port`，避免端口冲突

**重启 Nginx**：
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 或重启
sudo systemctl restart nginx
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
