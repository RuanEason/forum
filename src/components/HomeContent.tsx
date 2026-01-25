"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Eye, MessageCircle, Plus } from "lucide-react";

interface PostProps {
  id: string;
  title: string | null;
  content: string;
  viewCount?: number;
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

/**
 * 首页内容展示组件
 * 展示帖子列表，支持创建按钮、删除功能和查看模式切换
 *
 * @param {Object} props - 组件属性
 * @param {PostProps[]} props.initialPosts - 初始帖子列表
 * @param {boolean} [props.hideCreateButton] - 是否隐藏创建按钮，默认为 false
 * @param {() => void} [props.onPostDeleted] - 帖子删除回调函数
 * @param {string} [props.currentUserId] - 当前用户 ID，用于显示删除按钮
 * @returns {JSX.Element} 首页内容组件
 *
 * @example
 * // 基本使用
 * <HomeContent initialPosts={posts} />
 *
 * // 隐藏创建按钮
 * <HomeContent initialPosts={posts} hideCreateButton={true} />
 *
 * // 监听删除事件
 * <HomeContent initialPosts={posts} onPostDeleted={() => router.refresh()} />
 */
export default function HomeContent({
  initialPosts,
  hideCreateButton = false,
  onPostDeleted,
  currentUserId,
}: {
  initialPosts: PostProps[];
  hideCreateButton?: boolean;
  onPostDeleted?: () => void;
  currentUserId?: string;
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

  /**
   * 处理删除帖子
   * 发送删除请求到 API，成功后从列表中移除帖子并触发回调
   *
   * @param {string} postId - 要删除的帖子 ID
   * @returns {Promise<void>}
   *
   * @example
   * await handleDeletePost("post123");
   */
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
        if (onPostDeleted) {
          onPostDeleted();
        }
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误，删除失败");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <main className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-0 sm:px-0">
          {session && !hideCreateButton && (
            <div className="mb-6 bg-white p-4 sm:rounded-lg shadow-sm border-b sm:border-0 border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={(session.user as any).avatar}
                  name={(session.user as any).name}
                  size="md"
                />
              </div>
              <Link
                href="/post/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-1" />
                发布帖子
              </Link>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {posts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500">
                  还没有帖子，快来发布第一个帖子吧！
                </p>
              </Card>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100 hover:shadow-md transition-shadow duration-200"
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
                            <Link
                              href={`/user/${post.author.id}`}
                              className="text-sm font-bold text-gray-900 hover:underline truncate"
                            >
                              {post.author.name || "匿名用户"}
                            </Link>
                            {post.topic && (
                              <Link href={`/topic/${post.topic.id}`}>
                                <Badge variant="primary" size="sm">
                                  #{post.topic.name}
                                </Badge>
                              </Link>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {mounted
                              ? new Date(post.createdAt).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-800">
                          <div
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("a"))
                                return;
                              router.push(`/post/${post.id}`);
                            }}
                            className="cursor-pointer block hover:bg-gray-50 rounded-md -mx-2 p-2 transition duration-150 ease-in-out"
                          >
                            {/* 标题显示逻辑 */}
                            {(viewMode === "title" ||
                              viewMode === "titleAndContent" ||
                              (viewMode === "both" && post.title)) &&
                               (
                                <h3 className={`text-lg font-bold ${post.title ? "text-gray-900" : "text-gray-400 italic"} mb-2 line-clamp-2`}>
                                  {post.title || "无标题"}
                                </h3>
                              )}

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
                              <PostImages
                                images={post.images.map((img) => img.url)}
                              />
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between sm:justify-start sm:space-x-6 pt-2 border-t border-gray-50">
                          {/* 浏览量 */}
                          <div className="flex items-center text-gray-400 p-1 sm:p-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs sm:text-sm ml-1 tabular-nums">
                              {post.viewCount ?? 0}
                            </span>
                          </div>
                          {/* 点赞按钮 */}
                          <div className="flex items-center">
                            <LikeButton
                              targetType="post"
                              targetId={post.id}
                              initialLikesCount={post.likes.length}
                              initialLikedByUser={
                                currentUserId || (session?.user as any)?.id
                                  ? post.likes.some(
                                      (like) =>
                                        like.userId ===
                                        (currentUserId || (session?.user as any)?.id)
                                    )
                                  : false
                              }
                            />
                          </div>
                          {/* 评论按钮 */}
                          <Link
                            href={`/post/${post.id}`}
                            className="flex items-center text-gray-500 hover:text-blue-500 group p-1 sm:p-2 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-xs sm:text-sm font-medium ml-1 tabular-nums">
                              {post.comments.length > 0 ? post.comments.length : null}
                            </span>
                            <span className="hidden sm:inline text-xs sm:text-sm font-medium ml-0.5">
                              {post.comments.length > 0 ? "评论" : "评论"}
                            </span>
                          </Link>
                          {/* 分享按钮 */}
                          <div className="flex items-center">
                            <RepostButton postId={post.id} />
                          </div>
                          {/* 删除按钮 */}
                          {(session?.user as any)?.id &&
                            (session?.user as any)?.id === post.author.id && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-500 hover:text-red-700 text-xs sm:text-sm p-1 sm:p-2 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <span className="hidden sm:inline">删除</span>
                                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
