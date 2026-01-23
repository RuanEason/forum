import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 动态生成网站 Sitemap
 *
 * 本文件为搜索引擎爬虫提供站点地图，包含以下内容：
 * - 首页（最高优先级）
 * - 所有帖子页面（从中等优先级）
 * - 所有用户资料页面（较低优先级）
 *
 * Sitemap 有助于 SEO 优化，确保搜索引擎能够：
 * - 发现和索引所有动态生成的内容
 * - 了解页面的更新频率和重要性
 * - 抓取最新的内容变更
 *
 * @returns Promise<MetadataRoute.Sitemap> 符合 Next.js Sitemap 规范的站点地图数组
 *
 * @example
 * // 访问 /sitemap.xml 自动调用此函数
 * // 返回格式：
 * // [
 * //   { url: 'https://example.com', lastModified: date, changeFrequency: 'daily', priority: 1 },
 * //   { url: 'https://example.com/post/1', lastModified: date, changeFrequency: 'weekly', priority: 0.7 },
 * //   { url: 'https://example.com/user/1', lastModified: date, changeFrequency: 'weekly', priority: 0.5 },
 * // ]
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 获取网站基础 URL（优先使用环境变量，否则使用本地开发地址）
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // 获取所有帖子的 ID 和更新时间
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // 获取所有用户的 ID 和更新时间
  const users = await prisma.user.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // 构建所有帖子的 Sitemap 条目
  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/post/${post.id}`,
    lastModified: post.updatedAt,  // 使用帖子的最后更新时间
    changeFrequency: 'weekly' as const,  // 帖子内容每周可能更新
    priority: 0.7,  // 中等优先级（相比首页略低）
  }));

  // 构建所有用户资料页的 Sitemap 条目
  const userUrls = users.map((user) => ({
    url: `${baseUrl}/user/${user.id}`,
    lastModified: user.updatedAt,  // 使用用户资料的最后更新时间
    changeFrequency: 'weekly' as const,  // 用户资料每周可能更新
    priority: 0.5,  // 较低优先级（次于首页和帖子）
  }));

  // 返回完整的 Sitemap，包含首页、所有帖子和所有用户页面
  return [
    {
      url: baseUrl,  // 首页
      lastModified: new Date(),  // 使用当前时间
      changeFrequency: 'daily',  // 首页内容每日更新
      priority: 1,  // 最高优先级
    },
    ...postUrls,  // 展开所有帖子 URL
    ...userUrls,  // 展开所有用户资料 URL
  ];
}
