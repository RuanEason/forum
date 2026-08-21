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
import PostListMoreMenu from "@/components/PostListMoreMenu";
import PostImages from "@/components/PostImages";
import { useToast } from "@/components/ui/Toast";
import type { Components } from "react-markdown";
import { CUSTOM_EMOJI_RENDER_SIZE, isCustomEmojiUrl } from "@/lib/emoji";
import { isInternalUserLink } from "@/lib/markdown";
import { Eye, Lock } from "lucide-react";

interface PostProps {
  id: string;
  title: string | null;
  content: string;
  contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
  visibility?: "PUBLIC" | "UNLISTED";
  viewCount?: number;
  pinned?: boolean;
  pinnedAt?: Date | null;
  createdAt: Date | string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  likes?: { userId: string }[];
  reposts?: { userId: string }[];
  comments?: { id: string }[];
  likeCount?: number;
  repostCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  images?: { url: string }[];
  topic?: { id: string; name: string } | null;
}

export default function UserPostList({
  initialPosts,
  currentUserId,
  userId,
  initialHasMore = false,
}: {
  initialPosts: PostProps[];
  currentUserId?: string;
  userId: string;
  initialHasMore?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const activeUserId = currentUserId ?? session?.user?.id;
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(Boolean(initialHasMore));
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const viewMode = session?.user?.postViewMode || "both"; // title, content, both

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/app/user/posts?userId=${userId}&page=${page + 1}&pageSize=20`,
        { cache: "no-store" },
      );
      const data = await response.json() as {
        list?: PostProps[];
        pagination?: { hasMore?: boolean };
      };
      if (!response.ok) throw new Error("Failed to load posts");
      setPosts((current) => {
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...(data.list ?? []).filter((post) => !existingIds.has(post.id))];
      });
      setPage(page + 1);
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (error) {
      console.error("Failed to load user posts:", error);
      setLoadError("加载更多帖子失败，请重试");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeletePost = async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: postId }),
      });

      if (response.ok) {
        setPosts((currentPosts) =>
          currentPosts.filter((post) => post.id !== postId)
        );
        toast.success("帖子已删除");
        return true;
      } else {
        const data = await response.json();
        toast.error(data.error || "删除失败");
      }
    } catch {
      toast.error("网络错误，删除失败");
    }

    return false;
  };

  const handlePinnedChange = (postId: string, pinned: boolean) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, pinned } : post
      )
    );
  };

  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
      const isAnchorLink = typeof href === "string" && href.startsWith("#");

      if (isAnchorLink || isInternalUserLink(href)) {
        return <a href={href} {...props}>{children}</a>;
      }

      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
    img: ({ src, alt, title, className, ...props }) => {
      if (typeof src !== "string" || !src) return null;

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...props}
          src={src}
          alt={alt || (isCustomEmojiUrl(src) ? "自定义表情" : "")}
          title={title}
          data-custom-emoji={isCustomEmojiUrl(src) ? "true" : undefined}
          className={isCustomEmojiUrl(src) ? `custom-emoji inline-block align-middle object-contain ${className || ""}` : className}
          style={isCustomEmojiUrl(src) ? { width: CUSTOM_EMOJI_RENDER_SIZE, height: CUSTOM_EMOJI_RENDER_SIZE } : undefined}
          loading="lazy"
        />
      );
    },
  };

  if (posts.length === 0) {
    return <p className="text-gray-500">该用户还没有发布过帖子。</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative overflow-hidden border-b border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md sm:rounded-lg sm:border-0 lg:rounded-lg"
        >
          <div className="p-4 sm:p-6 lg:p-5">
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
                  <div className="flex min-w-0 items-center gap-2">
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
                        className="hidden shrink-0 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors sm:inline-flex sm:items-center"
                      >
                        #{post.topic.name}
                      </Link>
                    )}
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    <span className="whitespace-nowrap text-xs text-gray-400">
                      {mounted
                        ? format(new Date(post.createdAt), "yyyy年MM月dd日 HH:mm")
                        : ""}
                    </span>
                    <PostListMoreMenu
                      postId={post.id}
                      pinned={post.pinned || false}
                      canDelete={activeUserId === post.author.id}
                      canPin={session?.user?.role === "admin"}
                      onDelete={handleDeletePost}
                      onPinnedChange={handlePinnedChange}
                    />
                  </div>
                </div>
                {/* 置顶标识 */}
                {post.topic && (
                  <div className="mt-1.5 sm:hidden">
                    <Link
                      href={`/topic/${post.topic.id}`}
                      className="inline-flex max-w-full text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <span className="whitespace-nowrap">#{post.topic.name}</span>
                    </Link>
                  </div>
                )}
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
                      post.contentFormat === "RICH_TEXT" ? (
                        <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {post.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {post.content}
                          </ReactMarkdown>
                        </div>
                      )
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
                    initialLikesCount={post.likeCount ?? post.likes?.length ?? 0}
                    initialLikedByUser={post.likedByMe ?? (
                      activeUserId
                        ? Boolean(post.likes?.some((like) => like.userId === activeUserId))
                        : false
                    )}
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
                      {post.commentCount ?? post.comments?.length ?? "评论"}
                    </span>
                  </Link>
                  <RepostButton
                    postId={post.id}
                    title={post.title}
                    authorName={post.author.name}
                    content={post.content}
                    createdAt={post.createdAt}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      {(hasMore || loadError) && (
        <div className="flex flex-col items-center gap-2 py-4">
          {loadError && <p className="text-sm text-red-500">{loadError}</p>}
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60"
          >
            {loadingMore ? "加载中..." : loadError ? "重试" : "加载更多"}
          </button>
        </div>
      )}
    </div>
  );
}
