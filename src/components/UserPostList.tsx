"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Avatar from "@/components/Avatar";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";

interface PostProps {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  likes: { userId: string }[];
  reposts: { userId: string }[];
  comments: { id: string }[];
}

export default function UserPostList({ initialPosts }: { initialPosts: PostProps[] }) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("确定要删除这条帖子吗？")) return;

    try {
      const response = await fetch("/api/post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: postId }),
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (err) {
      alert("网络错误，删除失败");
    }
  };

  if (posts.length === 0) {
    return <p className="text-gray-500">该用户还没有发布过帖子。</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {post.author.name || "匿名用户"}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {format(new Date(post.createdAt), "yyyy年MM月dd日 HH:mm")}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-800">
                  <Link href={`/post/${post.id}`} className="block hover:bg-gray-50 rounded-md -mx-2 p-2 transition duration-150 ease-in-out">
                    <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {post.content}
                      </ReactMarkdown>
                    </div>
                  </Link>
                </div>
                
                <div className="mt-3 flex items-center justify-between sm:justify-start sm:space-x-8 pt-2 border-t border-gray-50">
                  <LikeButton
                    targetType="post"
                    targetId={post.id}
                    initialLikesCount={post.likes.length}
                    initialLikedByUser={
                      session?.user?.id
                        ? post.likes.some((like) => like.userId === session.user.id)
                        : false
                    }
                  />
                  <Link href={`/post/${post.id}`} className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-hover:scale-110 transition-transform duration-200"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span className="text-sm font-medium">{post.comments.length > 0 ? post.comments.length : "评论"}</span>
                  </Link>
                  <RepostButton
                    postId={post.id}
                    initialRepostsCount={post.reposts.length}
                    initialRepostedByUser={
                      session?.user?.id
                        ? post.reposts.some((repost) => repost.userId === session.user.id)
                        : false
                    }
                  />
                  {session?.user?.id && session.user.id === post.author.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}