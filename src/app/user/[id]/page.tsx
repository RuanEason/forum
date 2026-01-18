import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";

interface UserProfileProps {
  params: Promise<{ id: string }>;
}

interface UserStats {
  daysJoined: number;
  postsPublished: number;
  totalViews: number;
  likesReceived: number;
  likesGiven: number;
}

async function getUserProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          reposts: {
            select: {
              userId: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          images: {
            select: {
              url: true,
            },
          },
          topic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

async function getUserStats(id: string, createdAt: Date): Promise<UserStats> {
  // 并行查询所有统计数据
  const [postsPublished, totalViewsResult, likesReceived, likesGiven] =
    await Promise.all([
      // 发布的帖子数量
      prisma.post.count({ where: { authorId: id } }),
      // 总浏览量
      prisma.post.aggregate({
        _sum: { viewCount: true },
        where: { authorId: id },
      }),
      // 获得的点赞数（用户帖子收到的点赞）
      prisma.postLike.count({
        where: { post: { authorId: id } },
      }),
      // 送出的点赞数
      prisma.postLike.count({
        where: { userId: id },
      }),
    ]);

  // 计算加入天数
  const daysJoined = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    daysJoined: Math.max(daysJoined, 1), // 至少显示 1 天
    postsPublished,
    totalViews: totalViewsResult._sum.viewCount ?? 0,
    likesReceived,
    likesGiven,
  };
}

export async function generateMetadata({
  params,
}: UserProfileProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, bio: true, avatar: true },
  });

  if (!user) {
    return {
      title: "用户未找到",
    };
  }

  const title = `${user.name || "匿名用户"} 的个人主页`;
  const description =
    user.bio || `查看 ${user.name || "匿名用户"} 在同学论坛发布的帖子和动态。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: user.avatar ? [user.avatar] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.avatar ? [user.avatar] : undefined,
    },
  };
}

export default async function UserProfile({ params }: UserProfileProps) {
  const { id } = await params;
  const userId = id;
  const session = await getServerSession(authOptions) as any;
  const user = await getUserProfile(userId);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">用户未找到</h1>
      </div>
    );
  }

  // 获取用户统计数据
  const stats = await getUserStats(userId, user.createdAt);

  const isCurrentUser = session?.user?.id === user.id;

  return (
    <UserProfileClient
      user={user as any}
      isCurrentUser={isCurrentUser}
      stats={stats}
    />
  );
}
