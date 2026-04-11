# Slept 论坛

感谢 [LINUX DO 社区](https://linux.do) 的支持。

一个基于 Next.js 16、React 19、TypeScript、Prisma 和 MySQL 构建的全栈论坛项目。  
当前代码库已经不是初始模板，而是一套具备完整业务能力的社区系统，支持图文帖子、视频帖子、弹幕、评论楼中楼、点赞/转发、关注关系、通知系统、附件上传、个人主页、后台管理，以及面向 App 的部分接口。

## 功能概览

- 用户注册、登录、资料补全、个人设置、账号注销
- 用户主页、关注/粉丝关系、用户统计展示开关
- 图文帖子发布，支持标题、Markdown 正文、图片、附件、话题
- 视频帖子发布，支持腾讯云 COS STS 直传、转码回调、封面、HLS 播放
- 视频弹幕系统，支持密度、区域、颜色等前端偏好设置
- 评论与回复、评论点赞、评论置顶
- 帖子点赞、转发、帖子置顶、浏览量统计
- 站内通知系统，支持回复、点赞、关注等通知
- 搜索帖子和用户
- 管理员后台，支持用户封禁与帖子管理
- Android 安装包下载页 `/release`
- 面向原生 App 的用户、帖子、评论、推送设备注册等 API

## 技术栈

- 前端：Next.js 16（App Router）、React 19、TypeScript
- 样式：Tailwind CSS 4
- 认证：NextAuth.js 4（Credentials 登录）
- 数据库：MySQL + Prisma ORM
- 文件存储：腾讯云 COS + CDN
- 视频处理：腾讯云 COS STS、CI 回调、HLS、FFmpeg、HLS.js
- 文本能力：Markdown 编辑与渲染、文章目录提取
- 其他：bcryptjs、date-fns、sharp、lucide-react

## 主要业务特性

### 1. 内容系统

- 首页按“置顶优先 + 发布时间倒序”展示帖子
- 支持纯文本帖和视频帖两种内容形态
- 帖子正文支持 Markdown
- 帖子可绑定话题
- 附件下载会记录下载次数

### 2. 视频能力

- 视频通过腾讯云临时凭证直传 COS
- 服务端通过回调更新转码状态、HLS 地址、封面和视频元数据
- 视频详情页支持 HLS 播放
- 内置弹幕系统，支持游客发送白色滚动弹幕

### 3. 社区互动

- 帖子点赞、评论点赞、转发
- 评论支持嵌套回复
- 帖子作者可以置顶评论
- 用户之间可互相关注
- 通知中心支持未读数展示

### 4. 用户与后台

- 用户支持头像、简介、封面图/封面视频
- 可配置帖子列表显示模式
- 可控制个人统计数据是否公开
- 管理员可查看用户、帖子并执行封禁/删除操作

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

建议先复制示例文件：

```bash
cp .env.example .env
```

然后按你的实际环境修改 `.env`，可参考下面示例：

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/forum"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-random-secret"

TENCENT_COS_SECRET_ID="your-secret-id"
TENCENT_COS_SECRET_KEY="your-secret-key"
TENCENT_COS_BUCKET="your-bucket-1250000000"
TENCENT_COS_REGION="ap-guangzhou"
NEXT_PUBLIC_CDN_DOMAIN="https://cdn.example.com"

TENCENT_VIDEO_RAW_PREFIX="videos/raw/"
TENCENT_STS_DURATION_SECONDS="1800"
TENCENT_VIDEO_MAX_SIZE_BYTES="2147483648"
TENCENT_CI_CALLBACK_TOKEN="replace-with-callback-token"

TPNS_ENABLED="true"
TPNS_ACCESS_ID=""
TPNS_ACCESS_KEY=""
TPNS_IOS_ENV="product"
TPNS_MAX_RETRY="3"
TPNS_ANDROID_CHANNEL_ID=""
TPNS_API_HOST="api.tpns.tencent.com"
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 部署流程

下面是一套适合 Linux 服务器的常见生产部署流程，适合开源项目使用者快速落地。

### 1. 准备服务器环境

建议准备以下基础环境：

- Node.js 20+
- npm 10+
- MySQL 8+
- Nginx
- PM2（可选，但推荐）
- FFmpeg（可选；未安装时项目会回退到 `@ffmpeg-installer/ffmpeg`）

### 2. 克隆项目并安装依赖

```bash
git clone <your-repo-url>
cd website
npm install
```

### 3. 配置数据库与环境变量

先创建 MySQL 数据库，例如：

```sql
CREATE DATABASE forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后在项目根目录创建 `.env`，至少补齐以下变量：

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/forum"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="replace-with-a-random-secret"

TENCENT_COS_SECRET_ID="your-secret-id"
TENCENT_COS_SECRET_KEY="your-secret-key"
TENCENT_COS_BUCKET="your-bucket-1250000000"
TENCENT_COS_REGION="ap-guangzhou"
NEXT_PUBLIC_CDN_DOMAIN="https://cdn.your-domain.com"

TENCENT_CI_CALLBACK_TOKEN="replace-with-callback-token"
```

如果你暂时不需要推送功能，可以先不配置 TPNS。

### 4. 初始化 Prisma

```bash
npx prisma generate
npx prisma db push
```

如果后续你修改了 `prisma/schema.prisma`，记得重新执行一次 `npx prisma generate`。

### 5. 构建生产版本

```bash
npm run build
```

如果构建成功，可以先本地验证：

```bash
npm run start
```

默认会在 `3000` 端口启动生产服务。

### 6. 使用 PM2 托管进程

```bash
npm install -g pm2
pm2 start npm --name slept-forum -- start
pm2 save
pm2 startup
```

常用命令：

```bash
pm2 status
pm2 logs slept-forum
pm2 restart slept-forum
```

### 7. 配置 Nginx 反向代理

可参考如下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

完成后重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 配置 HTTPS

推荐使用 Certbot 申请证书：

```bash
sudo certbot --nginx -d your-domain.com
```

部署完成后，记得将 `.env` 里的 `NEXTAUTH_URL` 改为正式 HTTPS 域名。

### 9. 配置对象存储与视频能力

如果你要启用完整媒体能力，还需要额外完成这些配置：

- 配置腾讯云 COS Bucket 与 CDN 域名
- 确保 `NEXT_PUBLIC_CDN_DOMAIN` 为实际可访问的 CDN 地址
- 如果域名或 CDN 变更，需要同步更新 `next.config.ts` 里的：
  - `images.remotePatterns`
  - CSP 中的 CDN 域名
  - `/video-proxy` 的目标地址
- 配置腾讯云视频工作流/转码回调，并让回调地址带上正确的 `token`

回调地址示例：

```text
https://your-domain.com/api/video/callback?token=your-callback-token
```

### 10. 上线后检查项

- 首页、帖子详情、登录注册页面是否可正常访问
- 图片上传、附件上传是否成功
- Prisma 是否能正常连接数据库
- 视频上传、转码回调、播放链路是否正常
- `NEXTAUTH_URL`、CDN 域名、回调域名是否全部使用正式地址
- 反向代理后登录态和上传接口是否正常

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务
npm run lint         # 运行 ESLint

npx prisma generate  # 生成 Prisma Client（输出到 src/generated）
npx prisma db push   # 推送 schema 到数据库
npx prisma studio    # 打开 Prisma Studio
```

## 环境变量说明

### 必需

| 变量名 | 说明 |
| --- | --- |
| `DATABASE_URL` | MySQL 连接串 |
| `NEXTAUTH_URL` | 网站访问地址 |
| `NEXTAUTH_SECRET` | NextAuth 密钥，生产环境必须配置 |
| `TENCENT_COS_SECRET_ID` | 腾讯云 COS 密钥 ID |
| `TENCENT_COS_SECRET_KEY` | 腾讯云 COS 密钥 Key |
| `TENCENT_COS_BUCKET` | COS Bucket |
| `TENCENT_COS_REGION` | COS 地域 |
| `NEXT_PUBLIC_CDN_DOMAIN` | COS 对外访问的 CDN 域名 |

### 视频相关

| 变量名 | 说明 |
| --- | --- |
| `TENCENT_SECRET_ID` | 视频上传/STS 使用的密钥，未设置时回退到 `TENCENT_COS_SECRET_ID` |
| `TENCENT_SECRET_KEY` | 视频上传/STS 使用的密钥，未设置时回退到 `TENCENT_COS_SECRET_KEY` |
| `TENCENT_VIDEO_RAW_PREFIX` | 视频原始文件前缀，默认 `videos/raw/` |
| `TENCENT_STS_DURATION_SECONDS` | 临时凭证有效期，默认 `1800` 秒 |
| `TENCENT_VIDEO_MAX_SIZE_BYTES` | 视频最大体积，默认 `2147483648`（2GB） |
| `TENCENT_CI_CALLBACK_TOKEN` | 腾讯云 CI 转码回调校验令牌 |

### 推送相关

| 变量名 | 说明 |
| --- | --- |
| `TPNS_ENABLED` | 是否启用腾讯推送，设为 `false` 时关闭 |
| `TPNS_ACCESS_ID` | 腾讯推送 AccessId |
| `TPNS_ACCESS_KEY` | 腾讯推送 AccessKey |
| `TPNS_IOS_ENV` | iOS 推送环境，`dev` 或 `product` |
| `TPNS_MAX_RETRY` | 推送失败后的最大重试次数 |
| `TPNS_ANDROID_CHANNEL_ID` | Android 通知渠道 ID |
| `TPNS_API_HOST` | 推送接口域名，默认 `api.tpns.tencent.com` |
| `EXPO_PUBLIC_TPNS_ACCESS_ID` | App 侧可复用的推送 AccessId |
| `EXPO_PUBLIC_TPNS_ACCESS_KEY` | App 侧可复用的推送 AccessKey |

说明：

- 若未配置 TPNS 环境变量，服务端还会尝试读取项目根目录下的 `tpns-configs.json`
- 仅开发网页基础功能时，不配置 TPNS 也可以运行

## 上传与媒体限制

- 普通图片上传：支持 `jpeg/png/webp/gif`，最大 `10MB`
- 普通附件上传：最大 `1GB`，默认禁止可执行文件类型
- 视频帖子上传：默认最大 `2GB`
- 个人封面图：大图会压缩处理
- 个人封面视频：最大 `100MB`，通过 FFmpeg 转为 MP4 并生成预览图

## 项目结构

```text
src/
├── app/                    # 页面与 API 路由（App Router）
│   ├── admin/              # 管理后台
│   ├── api/                # Web / App API
│   ├── auth/               # 登录、注册、资料补全
│   ├── notifications/      # 通知页面
│   ├── post/               # 帖子详情、发帖页
│   ├── settings/           # 用户设置
│   ├── topic/              # 话题页面
│   ├── user/               # 用户主页
│   └── release/            # Android 安装包下载页
├── components/             # 业务组件与基础 UI 组件
├── lib/                    # 认证、Prisma、COS、视频、推送等工具
├── generated/              # Prisma Client 输出目录
├── release/                # App 发布信息
└── types/                  # 类型声明

prisma/
└── schema.prisma           # 数据模型定义
```

## 数据模型

核心模型如下：

- `User`：用户、角色、封禁状态、头像、封面、经验值、展示偏好
- `Post`：帖子、标题、正文、浏览数、置顶状态、话题、视频关联
- `VideoAsset`：视频源文件、转码状态、HLS 地址、封面、时长与分辨率
- `Danmaku`：视频弹幕
- `Comment`：评论与回复
- `Topic`：话题
- `PostImage` / `PostAttachment`：帖子图片与附件
- `PostLike` / `CommentLike`：点赞记录
- `Repost`：转发记录
- `Follow`：关注关系
- `Notification`：站内通知
- `PushDevice` / `PushLog`：移动端推送设备与推送日志

## 开发注意事项

- Prisma Client 输出目录不是默认值，而是 `src/generated`
- 修改 `prisma/schema.prisma` 后，需要重新执行 `npx prisma generate`
- 当前图片白名单、CSP 和视频代理规则写在 `next.config.ts`
- 如果更换 CDN 域名，需要同步修改：
  - `NEXT_PUBLIC_CDN_DOMAIN`
  - `next.config.ts` 中的 `images.remotePatterns`
  - `next.config.ts` 中的 CSP 与 `/video-proxy` rewrite
- 项目启用了 React Compiler
- 默认使用 Credentials 登录，密码通过 `bcryptjs` 哈希存储

## 部署建议

- 生产环境建议使用独立 MySQL 实例
- 上传、图片、附件、视频功能依赖腾讯云 COS/CDN
- 视频帖完整可用依赖：
  - COS STS 临时凭证
  - 腾讯云工作流/转码回调
  - `TENCENT_CI_CALLBACK_TOKEN`
- 如果部署机器没有系统级 FFmpeg，项目会自动回退到 `@ffmpeg-installer/ffmpeg`
