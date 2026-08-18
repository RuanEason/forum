import { getForumAnnouncements, getPostsPage } from "@/lib/post";
import HomeContent from "@/components/HomeContent";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomeTopics } from "@/lib/topic";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions) as Session | null;
  const [postsPage, homeTopics, announcements] = await Promise.all([
    getPostsPage({ viewerId: session?.user?.id }),
    getHomeTopics(),
    getForumAnnouncements(),
  ]);
  
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
