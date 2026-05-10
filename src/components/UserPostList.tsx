"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Avatar from "@/components/Avatar";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import PinButton from "@/components/PinButton";
import PostImages from "@/components/PostImages";
import { Eye, Lock } from "lucide-react";

interface PostProps {
  id: string;
  title: string | null;
  content: string;
  visibility?: "PUBLIC" | "UNLISTED";
  viewCount?: number;
  pinned?: boolean;
  pinnedAt?: Date | null;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  likes: { userId: string }[];
  reposts: { userId: string }[];
  comments: { id: string }[];
  images?: { url: string }[];
  topic?: { id: string; name: string } | null;
}

export default function UserPostList({
  initialPosts,
}: {
  initialPosts: PostProps[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const viewMode = (session?.user as any)?.postViewMode || "both"; // title, content, both
  useEffect(() => {
    console.log("组件挂载 - 视图模式:", viewMode);
  }, []);

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
    } catch {
      alert("网络错误，删除失败");
    }
  };

  if (posts.length === 0) {
    return <p className="text-gray-500">该用户还没有发布过帖子。</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100 hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <Avatar
                  src={post.author.avatar}
                  name={post.author.name}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 truncate">
                      {post.author.name || "匿名用户"}{post.visibility === "UNLISTED" && (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700"
                          title="仅链接可见"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </span>
                    {post.topic && (
                      <Link
                        href={`/topic/${post.topic.id}`}
                        className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        #{post.topic.name}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {mounted
                      ? format(new Date(post.createdAt), "yyyy年MM月dd日 HH:mm")
                      : ""}
                  </span>
                </div>
                {/* 置顶标识 */}
                {post.pinned && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M7 20v-2h10v2zm4-4V7.825L8.4 10.4L7 9l5-5l5 5l-1.4 1.4L13 7.825V16z"/>
                    </svg>
                    <span>已置顶</span>
                  </div>
                )}
                {/* 标题显示逻辑 */}
                {(viewMode === "title" ||
                  viewMode === "titleAndContent" ||
                  (viewMode === "both" && post.title)) && (
                  <div className="mt-2 mb-2">
                    <Link href={`/post/${post.id}`} className="block group">
                      <h3
                        className={`text-lg font-bold group-hover:text-indigo-600 transition-colors ${
                          post.title ? "text-gray-900" : "text-gray-400 italic"
                        }`}
                      >
                        {post.title || "无标题"}
                      </h3>
                    </Link>
                  </div>
                )}
                <div className="mt-2 text-sm text-gray-800">
                  <div
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) return;
                      router.push(`/post/${post.id}`);
                    }}
                    className="cursor-pointer block hover:bg-gray-50 rounded-md -mx-2 p-2 transition duration-150 ease-in-out"
                  >
                    {/* 内容显示逻辑 */}
                    {(viewMode === "content" ||
                      viewMode === "titleAndContent" ||
                      (viewMode === "both" && !post.title)) && (
                      <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {post.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {/* 图片显示逻辑 */}
                  {(viewMode === "content" ||
                    viewMode === "titleAndContent" ||
                    (viewMode === "both" && !post.title)) &&
                    post.images &&
                    post.images.length > 0 && (
                      <PostImages images={post.images.map((img) => img.url)} />
                    )}
                </div>
                <div className="mt-3 flex items-center justify-between sm:justify-start sm:space-x-8 pt-2 border-t border-gray-50">
                  <div className="flex items-center space-x-1 text-gray-400 p-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{post.viewCount ?? 0}</span>
                  </div>
                  <LikeButton
                    targetType="post"
                    targetId={post.id}
                    initialLikesCount={post.likes.length}
                    initialLikedByUser={
                      (session?.user as any)?.id
                        ? post.likes.some(
                            (like) => like.userId === (session?.user as any)?.id
                          )
                        : false
                    }
                  />
                  <Link
                    href={`/post/${post.id}`}
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-50 transition-colors"
                  >
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
                    <span className="text-sm font-medium">
                      {post.comments.length > 0 ? post.comments.length : "评论"}
                    </span>
                  </Link>
                  <RepostButton
                    postId={post.id}
                    title={post.title}
                    authorName={post.author.name}
                    content={post.content}
                    createdAt={post.createdAt}
                  />
                  {/* 置顶按钮 - 仅管理员可见 */}
                  {(session?.user as any)?.role === "admin" && (
                    <PinButton postId={post.id} isPinned={post.pinned || false} />
                  )}
                  {(session?.user as any)?.id && (session?.user as any).id === post.author.id && (
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
      ))}
    </div>
  );
}
