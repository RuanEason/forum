import { getPosts } from "@/lib/post";
import HomeContent from "@/components/HomeContent";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();
  
  // Serialize dates to strings to pass to client component
  const serializedPosts = posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));

  return <HomeContent initialPosts={serializedPosts} />;
}
