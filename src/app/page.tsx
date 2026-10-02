import { getForumAnnouncements, getPostsPage } from "@/lib/post";
import HomeContent from "@/components/HomeContent";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomeTopics } from "@/lib/topic";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 会话解析与其他两项查询之间没有数据依赖：
  // getHomeTopics / getForumAnnouncements 只读取公开数据，不需要 viewerId。
  // 因此把它们和 getServerSession 一起并行发起，把原本的
  // 「会话 → 帖子」串行链路压成一轮，减少一次完整的数据库往返。
  const [session, homeTopics, announcements] = await Promise.all([
    getServerSession(authOptions) as Promise<Session | null>,
    getHomeTopics(),
    getForumAnnouncements(),
  ]);

  // 只有帖子列表需要 viewerId 来判断 likedByMe / repostedByMe，
  // 必须在会话就绪之后再查询。
  const postsPage = await getPostsPage({ viewerId: session?.user?.id });

  // Serialize dates to strings to pass to client component
  const serializedPosts = postsPage.items.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    pinnedAt: post.pinnedAt ? post.pinnedAt.toISOString() : null,
  }));
  const serializedAnnouncements = announcements.map((announcement) => ({
    ...announcement,
    announcementAt: announcement.announcementAt.toISOString(),
  }));

  return (
    <HomeContent
      initialPosts={serializedPosts}
      initialPostsNextCursor={postsPage.nextCursor}
      initialPostsHasMore={postsPage.hasMore}
      initialAnnouncements={serializedAnnouncements}
      initialTopics={homeTopics.topics}
      initialTopicsHasMore={homeTopics.hasMore}
      currentUserId={session?.user?.id}
      showAuthorLevel
    />
  );
}
