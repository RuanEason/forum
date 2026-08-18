"use client";

import { useState, useEffect } from "react";
import HomeContent, { type PostProps } from "@/components/HomeContent";

export default function TopicPostList({
  topicId,
  onPostDeleted,
  currentUserId,
}: {
  topicId: string;
  onPostDeleted?: () => void;
  currentUserId?: string;
}) {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setError(null);
        const res = await fetch(`/api/post?topicId=${topicId}&limit=20`);
        if (res.ok) {
          const data = await res.json() as {
            items?: PostProps[];
            nextCursor?: string | null;
            hasMore?: boolean;
          } | PostProps[];
          if (Array.isArray(data)) {
            setPosts(data);
            setNextCursor(null);
            setHasMore(false);
          } else {
            setPosts(data.items ?? []);
            setNextCursor(data.nextCursor ?? null);
            setHasMore(Boolean(data.hasMore));
          }
        } else {
          setError("获取帖子失败");
        }
      } catch (error) {
        setError("获取帖子失败");
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [topicId]);

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">加载中...</div>
    );
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm">
          <p className="text-muted-foreground">该话题下暂无帖子。</p>
        </div>
      ) : (
        <HomeContent
          initialPosts={posts}
          initialPostsNextCursor={nextCursor}
          initialPostsHasMore={hasMore}
          topicId={topicId}
          hideCreateButton={true}
          onPostDeleted={onPostDeleted}
          currentUserId={currentUserId}
          showAuthorLevel
          embedded
        />
      )}
    </div>
  );
}
