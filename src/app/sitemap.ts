import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Get all posts
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/post/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const userUrls = users.map((user) => ({
    url: `${baseUrl}/user/${user.id}`,
    lastModified: user.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postUrls,
    ...userUrls,
  ];
}
