import { getPosts } from "@/lib/post";
import HomeContent from "@/components/HomeContent";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();
  const session = await getServerSession(authOptions) as any;
  
  // Serialize dates to strings to pass to client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return <HomeContent initialPosts={serializedPosts} currentUserId={session?.user?.id} />;
}
