import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";
import { getUserLevel } from "@/lib/experience";
import { getRichTextSummaryWithMentions, parseRichTextDocument } from "@/lib/rich-text/content";
import { DEFAULT_LIST_PAGE_SIZE, getPageResult } from "@/lib/pagination";

interface UserProfileProps {
  params: Promise<{ id: string }>;
}

async function getUserBasicInfo(id: string) {
  return prisma.user.findFirst({
    where: { id, deletionRequestedAt: null },
    select: { name: true, bio: true, avatar: true, coverImage: true },
  });
}

async function getPagedUserProfile(
  id: string,
  includeUnlistedPosts: boolean,
  viewerId?: string,
) {
  const postWhere = includeUnlistedPosts
    ? { authorId: id, deletedAt: null }
    : { authorId: id, visibility: "PUBLIC" as const, deletedAt: null };

  const user = await prisma.user.findFirst({
    where: {
      id,
      ...(includeUnlistedPosts ? {} : { deletionRequestedAt: null }),
    },
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
        where: { ...postWhere, author: { deletionRequestedAt: null } },
        orderBy: [
          { pinned: "desc" },
          { pinnedAt: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        take: DEFAULT_LIST_PAGE_SIZE,
        select: {
          id: true,
          title: true,
          content: true,
          contentJson: true,
          contentFormat: true,
          visibility: true,
          viewCount: true,
          pinned: true,
          pinnedAt: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { likes: true, reposts: true, comments: true },
          },
          images: {
            select: { url: true },
          },
          topic: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  const [postsTotal, aggregate, likesGiven, likesReceived, followersCount, followingCount] =
    await Promise.all([
      prisma.post.count({ where: postWhere }),
      prisma.post.aggregate({ where: postWhere, _sum: { viewCount: true } }),
      prisma.postLike.count({ where: { userId: id } }),
      prisma.postLike.count({ where: { post: postWhere } }),
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

  const postIds = user.posts.map((post) => post.id);
  const likedIds = viewerId && postIds.length > 0
    ? new Set((await prisma.postLike.findMany({
        where: { userId: viewerId, postId: { in: postIds } },
        select: { postId: true },
      })).map((like) => like.postId))
    : new Set<string>();

  const serializedPosts = user.posts.map(({ contentJson, contentFormat, _count, ...post }) => {
    const document = contentFormat === "RICH_TEXT" ? parseRichTextDocument(contentJson) : null;
    return {
      ...post,
      contentFormat,
      content: document ? getRichTextSummaryWithMentions(document, 300) : post.content,
      likeCount: _count.likes,
      repostCount: _count.reposts,
      commentCount: _count.comments,
      likedByMe: likedIds.has(post.id),
      repostedByMe: false,
    };
  });

  const daysJoined = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const stats = {
    daysJoined: Math.max(daysJoined, 1),
    postsPublished: postsTotal,
    totalViews: aggregate._sum.viewCount ?? 0,
    likesReceived,
    likesGiven,
    followersCount,
    followingCount,
    experience: user.experience ?? 0,
    level: getUserLevel(user.experience ?? 0),
  };

  return {
    user: {
      ...user,
      email: user.email ?? "",
      createdAt: user.createdAt.toISOString(),
      posts: serializedPosts.map((post) => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        pinnedAt: post.pinnedAt?.toISOString() ?? null,
      })),
    },
    stats,
    postsPagination: getPageResult(serializedPosts, 1, DEFAULT_LIST_PAGE_SIZE, postsTotal),
  };
}

export async function generateMetadata({ params }: UserProfileProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserBasicInfo(id);

  if (!user) {
    return { title: "用户未找到" };
  }

  const title = `${user.name || "匿名用户"} 的个人主页`;
  const description = user.bio || `查看 ${user.name || "匿名用户"} 在 Slept论坛网发布的帖子和动态。`;

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
  const session = await getServerSession(authOptions) as Session | null;
  const isCurrentUser = session?.user?.id === id;
  const result = await getPagedUserProfile(id, isCurrentUser, session?.user?.id);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">用户未找到</h1>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  let isFollowing = false;
  if (currentUserId && currentUserId !== result.user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: result.user.id,
        },
      },
    });
    isFollowing = Boolean(follow);
  }

  return (
    <UserProfileClient
      user={result.user}
      isCurrentUser={isCurrentUser}
      stats={result.stats}
      postsPagination={result.postsPagination}
      isFollowing={isFollowing}
      currentUserId={currentUserId}
    />
  );
}
