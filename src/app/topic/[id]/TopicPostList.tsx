"use client";

import { useState, useEffect } from "react";
import HomeContent from "@/components/HomeContent";

interface PostProps {
  id: string;
  title: string | null;
  content: string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  likes: {
    userId: string;
  }[];
  reposts: {
    userId: string;
  }[];
  comments: {
    id: string;
  }[];
  images: {
    url: string;
  }[];
  topic?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export default function TopicPostList({
  topicId,
  onPostDeleted,
}: {
  topicId: string;
  onPostDeleted?: () => void;
}) {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/post?topicId=${topicId}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [topicId]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">加载中...</div>;
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
              hideCreateButton={true}
              onPostDeleted={onPostDeleted}
            />
        )}
    </div>
  );
}
