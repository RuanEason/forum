import { getForumAnnouncements, getPosts } from "@/lib/post";
import HomeContent from "@/components/HomeContent";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomeTopics } from "@/lib/topic";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, homeTopics, announcements] = await Promise.all([
    getPosts(),
    getHomeTopics(),
    getForumAnnouncements(),
  ]);
  const session = await getServerSession(authOptions) as Session | null;
  
  // Serialize dates to strings to pass to client component
  const serializedPosts = posts.map(post => ({
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
      initialAnnouncements={serializedAnnouncements}
      initialTopics={homeTopics.topics}
      initialTopicsHasMore={homeTopics.hasMore}
      currentUserId={session?.user?.id}
      showAuthorLevel
    />
  );
}
