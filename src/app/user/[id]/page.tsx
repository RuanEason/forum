import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";
import { getUserLevel } from "@/lib/experience";

interface UserProfileProps {
  params: Promise<{ id: string }>;
}

interface UserStats {
  daysJoined: number;
  postsPublished: number;
  totalViews: number;
  likesReceived: number;
  likes: number;
  likesGiven: number;
  followersCount: number;
  followingCount: number;
}

// 获取用户基本信息（用于 metadata 和页面）
async function getUserBasicInfo(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { name: true, bio: true, avatar: true, coverImage: true },
  });
}

// 获取用户完整资料和统计数据（一次性查询优化）
async function getUserProfileWithStats(id: string, includeUnlistedPosts: boolean) {
  const postVisibilityWhere = includeUnlistedPosts
    ? undefined
    : {
        visibility: "PUBLIC" as const,
      };

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      coverImage: true,
      experience: true,
      createdAt: true,
      showUserData: true,
      posts: {
        where: postVisibilityWhere,
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

  if (!user) return null;

  // 计算加入天数
  const daysJoined = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 从 posts 中直接计算统计数据，避免额外查询
  const postsPublished = user.posts.length;
  const totalViews = user.posts.reduce((sum, post) => sum + post.viewCount, 0);
  const likesReceived = user.posts.reduce((sum, post) => sum + post.likes.length, 0);

  // 获取用户送出的点赞数（这个无法从 posts 中直接获取）
  const likesGiven = await prisma.postLike.count({
    where: { userId: id },
  });

  // 获取关注和粉丝数
  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
  ]);

  const stats = {
    daysJoined: Math.max(daysJoined, 1),
    postsPublished: postsPublished ?? 0,
    totalViews: totalViews ?? 0,
    likesReceived: likesReceived ?? 0,
    likesGiven: likesGiven ?? 0,
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
    experience: user.experience ?? 0,
    level: getUserLevel(user.experience ?? 0),
  };

  return { user, stats };
}

export async function generateMetadata({
  params,
}: UserProfileProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserBasicInfo(id);

  if (!user) {
    return {
      title: "用户未找到",
    };
  }

  const title = `${user.name || "匿名用户"} 的个人主页`;
  const description =
    user.bio || `查看 ${user.name || "匿名用户"} 在 Slept论坛网发布的帖子和动态。`;

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
  const isCurrentUser = session?.user?.id === userId;

  // 一次性获取用户数据和统计数据
  const result = await getUserProfileWithStats(userId, isCurrentUser);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">用户未找到</h1>
      </div>
    );
  }

  const { user, stats } = result;
  const currentUserId = session?.user?.id;

  // 检查当前用户是否已关注该用户
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  return (
    <UserProfileClient
      user={user as any}
      isCurrentUser={isCurrentUser}
      stats={stats}
      isFollowing={isFollowing}
      currentUserId={currentUserId}
    />
  );
}
