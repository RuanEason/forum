# 腾讯云 COS + CDN 图片存储迁移计划

## 📋 概述

将网站的图片存储从本地文件系统迁移到腾讯云对象存储（COS）+ CDN，实现高可用、低延迟的图片服务。

---

## 🎯 目标

1. **图片上传至腾讯云 COS**：替换本地 `public/uploads/` 存储
2. **启用 CDN 加速**：通过 CDN 分发图片，提升访问速度
3. **保持向后兼容**：已有的本地图片继续可用
4. **渐进式迁移**：分阶段实施，降低风险

---

## 📊 当前实现分析

### 现有上传流程

```
用户上传图片 → /api/upload → sharp处理 → 保存到 public/uploads/ → 返回 /api/uploads/filename
```

### 现有问题

| 问题 | 影响 |
|------|------|
| 本地存储 | 无法跨服务器共享，部署困难 |
| 无 CDN | 图片加载慢，尤其移动端 |
| 无备份 | 服务器故障可能丢失图片 |
| 开发环境 404 | 本地无法访问生产图片 |

---

## 🏗️ 新架构设计

### 上传流程（目标）

```
用户上传图片 → /api/upload → sharp处理 → 上传到腾讯云COS → 返回 CDN URL
```

### 图片访问方式

| 图片类型 | 访问方式 | URL 格式 |
|---------|---------|----------|
| 新上传图片 | CDN 加速 | `https://cdn.example.com/images/xxx.webp` |
| 历史本地图片 | API 路由 | `/api/uploads/xxx.webp`（保持兼容） |

---

## 🔧 技术方案

### 1. 腾讯云 COS 配置

| 配置项 | 说明 |
|-------|------|
| **存储桶名称** | 例如：`forum-images-{region}` |
| **地域** | 选择离用户最近的地域（如广州/ap-guangzhou） |
| **访问权限** |私有读写（通过临时密钥或签名 URL 访问） |
| **静态网站** | 不启用（使用 CDN 回源） |

### 2. CDN 配置

| 配置项 | 说明 |
|-------|------|
| **加速域名** | 例如：`img.yourdomain.com` 或 CDN 提供的域名 |
| **源站类型** | COS 域名 |
| **回源协议** | HTTPS |
| **缓存规则** | 图片文件缓存 30 天 |

### 3. SDK 选择

使用 **腾讯云 COS Node.js SDK**：

```bash
npm install cos-nodejs-sdk-v5
```

---

## 📝 实施步骤

### 阶段一：环境准备

#### 1.1 腾讯云控制台配置

- [ ] 创建 COS 存储桶
- [ ] 记录存储桶信息：Bucket 名称、Region
- [ ] 创建访问密钥（SecretId、SecretKey）
- [ ] 配置存储桶权限策略
- [ ] 开通 CDN 服务并配置加速域名
- [ ] 配置 CDN 回源到 COS

#### 1.2 本地开发环境

- [ ] 安装 SDK：`npm install cos-nodejs-sdk-v5`
- [ ] 在 `.env` 添加配置：

```env
# 腾讯云 COS 配置
TENCENT_COS_SECRET_ID=your_secret_id
TENCENT_COS_SECRET_KEY=your_secret_key
TENCENT_COS_BUCKET=forum-images-ap-guangzhou
TENCENT_COS_REGION=ap-guangzhou
# CDN 域名（可选，不配置则使用 COS 域名）
CDN_DOMAIN=https://img.yourdomain.com
```

---

### 阶段二：代码实现

#### 2.1 创建 COS 客户端工具

**文件**：`src/lib/cos.ts`

```typescript
/**
 * 腾讯云 COS 客户端配置
 * 封装上传、删除等操作
 */
import COS from 'cos-nodejs-sdk-v5';

// 单例模式
const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY,
});

export { cos };
```

#### 2.2 修改上传 API 路由

**文件**：`src/app/api/upload/route.ts`

**修改点**：

| 现有逻辑 | 新逻辑 |
|---------|--------|
| sharp 处理后写入本地文件 | sharp 处理后得到 Buffer |
| `fs.writeFile` 保存 | `cos.putObject` 上传 |
| 返回 `/api/uploads/xxx` | 返回 `https://cdn.xxx.com/images/xxx` |

**新增功能**：

- 错误重试机制（上传失败自动重试 3 次）
- 文件名校验（防止路径遍历攻击）
- 上传进度日志

#### 2.3 更新图片访问逻辑

| 场景 | 处理方式 |
|------|---------|
| 前端展示图片 | 直接使用 CDN URL（`<img src={url} />`） |
| 历史数据兼容 | 判断 URL 是否以 `http` 开头，是则直接使用，否则走 API 路由 |
| 删除图片 | 调用 COS `deleteObject` API |

#### 2.4 新增图片删除功能（可选）

如果需要支持用户删除图片：

**文件**：`src/app/api/upload/route.ts`（新增 DELETE 方法）

```typescript
export async function DELETE(request: Request) {
  // 从 URL 中提取文件 key
  // 调用 cos.deleteObject()
}
```

---

### 阶段三：数据库兼容

#### 3.1 PostImage 表

**无需修改**：`url` 字段继续存储完整 URL

| 数据示例 | 说明 |
|---------|------|
| `/api/uploads/old-xxx.webp` | 历史本地图片 |
| `https://cdn.example.com/images/new-xxx.webp` | 新上传到 COS 的图片 |

#### 3.2 前端渲染组件

**文件**：`src/components/PostImage.tsx`（或相关组件）

```typescript
// 自动判断图片来源
const imageUrl = post.image.url.startsWith('http')
  ? post.image.url  // CDN URL
  : `${API_BASE_URL}${post.image.url}`;  // 本地 API 路由
```

---

### 阶段四：测试验证

#### 4.1 功能测试清单

| 测试项 | 预期结果 |
|-------|---------|
| 上传 JPEG 图片 | 成功上传，返回 CDN URL |
| 上传 PNG 图片 | 成功转换 WebP，返回 CDN URL |
| 上传超大图片（>10MB） | 拒绝上传，返回错误 |
| 网络中断重试 | 自动重试 3 次 |
| 前端展示图片 | 正常显示，加载速度快 |
| 历史帖子图片 | 继续正常显示 |

#### 4.2 性能测试

- [ ] 对比本地存储 vs CDN 的加载时间
- [ ] 测试 CDN 缓存命中率
- [ ] 验证图片压缩效果

#### 4.3 安全测试

- [ ] 测试文件类型验证（禁止上传恶意文件）
- [ ] 测试文件大小限制
- [ ] 测试权限控制（未登录用户无法上传）

---

### 阶段五：历史数据迁移（可选）

如果需要将历史图片迁移到 COS：

#### 5.1 迁移脚本

**文件**：`scripts/migrate-images-to-cos.ts`

```typescript
/**
 * 将本地 public/uploads/ 中的图片批量上传到 COS
 */
import fs from 'fs';
import path from 'path';
import { cos } from '../src/lib/cos';
import { prisma } from '../src/lib/prisma';

async function migrateImages() {
  // 1. 读取 public/uploads/ 目录
  // 2. 逐个上传到 COS
  // 3. 更新数据库中的 URL
}
```

#### 5.2 迁移策略

| 策略 | 适用场景 |
|------|---------|
| **按需迁移** | 用户访问历史图片时，后台上传到 COS 并更新 URL |
| **批量迁移** | 低峰期批量处理，一次性迁移所有历史图片 |
| **双写模式** | 新上传同时写本地和 COS，逐步切换 |

---

## ⚠️ 注意事项

### 1. 成本控制

| 费用类型 | 说明 | 优化建议 |
|---------|------|---------|
| 存储费用 | 按容量计费 | 启用生命周期策略，过期图片自动删除 |
| 流量费用 | CDN 流量 | 配置合理的缓存策略 |
| 请求费用 | API 调用次数 | 减少不必要的 HEAD 请求 |

### 2. 安全配置

- ✅ 环境变量提交到 `.gitignore`
- ✅ 使用临时密钥（推荐：通过 STS 获取临时密钥）
- ✅ 限制存储桶访问权限
- ✅ 启用 CDN HTTPS

### 3. 错误处理

```typescript
// 常见错误处理
try {
  await cos.putObject(...);
} catch (error) {
  if (error.code === 'NoSuchBucket') {
    // 存储桶不存在
  } else if (error.code === 'AccessDenied') {
    // 密钥权限不足
  }
}
```

---

## 📅 时间估算

| 阶段 | 预计时间 |
|------|---------|
| 环境准备 | 1-2 小时 |
| 代码实现 | 2-3 小时 |
| 测试验证 | 1-2 小时 |
| 历史数据迁移（可选） | 2-4 小时 |
| **总计** | **6-11 小时** |

---

## 🚀 部署流程

### 开发环境验证

1. 更新本地 `.env` 配置
2. 运行 `npm run dev`
3. 测试图片上传功能

### 生产环境部署

1. 在云服务器配置环境变量
2. 重新构建应用：`npm run build`
3. 重启服务：`npm run start`
4. 验证图片上传 CDN 加速

### 回滚方案

如果上线后出现问题：

1. 修改 `.env`，移除 COS 配置
2. 在 `src/lib/cos.ts` 中添加开关，回退到本地存储
3. 重新部署

---

## 📚 参考文档

- [腾讯云 COS Node.js SDK](https://cloud.tencent.com/document/product/436/8629)
- [腾讯云 CDN 配置指南](https://cloud.tencent.com/document/product/228/6297)
- [COS 存储桶权限管理](https://cloud.tencent.com/document/product/436/13315)

---

## ✅ 完成标准

- [ ] 图片成功上传到 COS
- [ ] 返回 CDN 可访问的 URL
- [ ] 前端图片正常显示
- [ ] 历史图片继续可用
- [ ] 错误处理完善
- [ ] 环境变量已配置
- [ ] 代码已提交到 Git

---

**创建日期**：2026-01-26
**状态**：待实施
