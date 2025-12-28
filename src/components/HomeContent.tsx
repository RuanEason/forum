"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import Image from "next/image";

interface PostProps {
  id: string;
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
  createdAt: string;
}

export default function HomeContent({ initialPosts }: { initialPosts: PostProps[] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
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

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <main className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-0 sm:px-0">
          {session && (
            <div className="mb-6 bg-white p-4 sm:rounded-lg shadow-sm border-b sm:border-0 border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar src={session.user.avatar} name={session.user.name} size="md" />
                <span className="text-gray-500 text-sm sm:text-base">分享你的新鲜事...</span>
              </div>
              <Link
                href="/post/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                发布帖子
              </Link>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white sm:rounded-lg shadow-sm">
                <p className="text-gray-500">还没有帖子，快来发布第一个帖子吧！</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <Avatar src={post.author.avatar} name={post.author.name} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/user/${post.author.id}`} className="text-sm font-bold text-gray-900 hover:underline truncate">
                            {post.author.name || "匿名用户"}
                          </Link>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {new Date(post.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-800">
                          <div
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("a")) return;
                              router.push(`/post/${post.id}`);
                            }}
                            className="cursor-pointer block hover:bg-gray-50 rounded-md -mx-2 p-2 transition duration-150 ease-in-out"
                          >
                            <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {post.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          {post.images && post.images.length > 0 && (
                            <PostImages images={post.images.map((img) => img.url)} />
                          )}
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
                      <Link href={`/post/${post.id}`} className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-50 transition-colors">
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
                      <RepostButton postId={post.id} />
                      {session?.user?.id && session.user.id === post.author.id && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-500 hover:text-red-700 text-sm p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}