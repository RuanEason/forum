"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import PostListMoreMenu from "@/components/PostListMoreMenu";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import Card from "@/components/ui/Card";
import HomeTopicSidebar from "@/components/HomeTopicSidebar";
import HomeAnnouncementSidebar from "@/components/HomeAnnouncementSidebar";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { usePageLoadProgress } from "@/components/PageLoadProgressProvider";
import type { HomeTopic } from "@/types/topic";
import { Eye, MessageCircle, Play, Plus } from "lucide-react";

const LEVEL_THRESHOLDS = [50, 200, 800, 1500, 3000, 6666] as const;
const HOME_TOPIC_SIDEBAR_COLLAPSED_KEY = "forum:home-topic-sidebar-collapsed";
const HOME_ANNOUNCEMENT_SIDEBAR_COLLAPSED_KEY =
  "forum:home-announcement-sidebar-collapsed";

const getUserLevel = (experience: number) =>
  LEVEL_THRESHOLDS.reduce((level, requiredExperience) => {
    if (experience >= requiredExperience) {
      return level + 1;
    }
    return level;
  }, 0);

interface PostProps {
  id: string;
  title: string | null;
  content: string;
  contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
  postType?: "TEXT" | "VIDEO";
  viewCount?: number;
  pinned?: boolean;
  pinnedAt?: string | null;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
    experience?: number | null;
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
  video?: {
    coverUrl?: string | null;
  } | null;
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
  showAuthorLevel = false,
  embedded = false,
  initialTopics = [],
  initialTopicsHasMore = false,
}: {
  initialPosts: PostProps[];
  hideCreateButton?: boolean;
  onPostDeleted?: () => void;
  currentUserId?: string;
  showAuthorLevel?: boolean;
  embedded?: boolean;
  initialTopics?: HomeTopic[];
  initialTopicsHasMore?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const toast = useToast();
  const { startTask } = usePageLoadProgress();
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [mounted, setMounted] = useState(false);
  const [topicSidebarCollapsed, setTopicSidebarCollapsed] = useState(false);
  const [topicSidebarPreferenceReady, setTopicSidebarPreferenceReady] =
    useState(false);
  const [announcementSidebarCollapsed, setAnnouncementSidebarCollapsed] =
    useState(false);
  const [announcementSidebarPreferenceReady, setAnnouncementSidebarPreferenceReady] =
    useState(false);
  const pendingNavigationTaskRef = useRef<(() => void) | null>(null);
  const navigationTaskTimeoutRef = useRef<number | null>(null);
  const prefetchedPostIdsRef = useRef<Set<string>>(new Set());

  const finishPendingNavigationTask = useCallback(() => {
    if (navigationTaskTimeoutRef.current !== null) {
      window.clearTimeout(navigationTaskTimeoutRef.current);
      navigationTaskTimeoutRef.current = null;
    }

    if (pendingNavigationTaskRef.current) {
      const finishTask = pendingNavigationTaskRef.current;
      pendingNavigationTaskRef.current = null;
      finishTask();
    }
  }, []);

  const prefetchPostDetail = useCallback(
    (postId: string) => {
      if (prefetchedPostIdsRef.current.has(postId)) {
        return;
      }
      prefetchedPostIdsRef.current.add(postId);
      router.prefetch(`/post/${postId}`);
    },
    [router]
  );

  const navigateToPostDetail = useCallback(
    (postId: string) => {
      finishPendingNavigationTask();
      pendingNavigationTaskRef.current = startTask("navigation");
      navigationTaskTimeoutRef.current = window.setTimeout(() => {
        finishPendingNavigationTask();
      }, 10000);
      router.push(`/post/${postId}`);
    },
    [finishPendingNavigationTask, router, startTask]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (embedded) return;

    try {
      const storedValue = window.localStorage.getItem(
        HOME_TOPIC_SIDEBAR_COLLAPSED_KEY
      );

      if (storedValue === "true" || storedValue === "false") {
        setTopicSidebarCollapsed(storedValue === "true");
      }
    } catch {
      // localStorage may be unavailable in private browsing or restricted contexts.
    } finally {
      setTopicSidebarPreferenceReady(true);
    }
  }, [embedded]);

  useEffect(() => {
    if (embedded || !topicSidebarPreferenceReady) return;

    try {
      window.localStorage.setItem(
        HOME_TOPIC_SIDEBAR_COLLAPSED_KEY,
        String(topicSidebarCollapsed)
      );
    } catch {
      // Ignore storage failures so the sidebar remains usable.
    }
  }, [embedded, topicSidebarCollapsed, topicSidebarPreferenceReady]);

  useEffect(() => {
    if (embedded) return;

    try {
      const storedValue = window.localStorage.getItem(
        HOME_ANNOUNCEMENT_SIDEBAR_COLLAPSED_KEY
      );

      if (storedValue === "true" || storedValue === "false") {
        setAnnouncementSidebarCollapsed(storedValue === "true");
      }
    } catch {
      // localStorage may be unavailable in private browsing or restricted contexts.
    } finally {
      setAnnouncementSidebarPreferenceReady(true);
    }
  }, [embedded]);

  useEffect(() => {
    if (embedded || !announcementSidebarPreferenceReady) return;

    try {
      window.localStorage.setItem(
        HOME_ANNOUNCEMENT_SIDEBAR_COLLAPSED_KEY,
        String(announcementSidebarCollapsed)
      );
    } catch {
      // Ignore storage failures so the sidebar remains usable.
    }
  }, [
    announcementSidebarCollapsed,
    announcementSidebarPreferenceReady,
    embedded,
  ]);

  useEffect(() => {
    if (embedded) return;

    document.documentElement.classList.add("home-feed-route");
    document.body.classList.add("home-feed-route");

    return () => {
      document.documentElement.classList.remove("home-feed-route");
      document.body.classList.remove("home-feed-route");
    };
  }, [embedded]);

  useEffect(() => {
    finishPendingNavigationTask();
  }, [finishPendingNavigationTask, pathname]);

  useEffect(() => {
    return () => {
      finishPendingNavigationTask();
    };
  }, [finishPendingNavigationTask]);

  const viewMode = session?.user?.postViewMode || "both"; // title, content, both
  useEffect(() => {
    console.log("组件挂载 - 视图模式:", viewMode);
  }, [viewMode]);

  /**
   * 处理删除帖子
   * 发送删除请求到 API，成功后从列表中移除帖子并触发回调
   *
   * @param {string} postId - 要删除的帖子 ID
   * @returns {Promise<boolean>}
   *
   * @example
   * await handleDeletePost("post123");
   */
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
        if (onPostDeleted) {
          onPostDeleted();
        }
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

      if (isAnchorLink) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className={embedded ? undefined : "h-full overflow-hidden bg-gray-50"}>
      <main className={embedded ? undefined : "h-full min-h-0 w-full sm:px-6 lg:px-8 md:py-6"}>
        <div
          className={
            embedded
              ? "px-0 sm:px-0"
              : "home-feed-layout relative h-full min-h-0"
          }
        >
          {!embedded && (
            <HomeTopicSidebar
              initialTopics={initialTopics}
              initialHasMore={initialTopicsHasMore}
              collapsed={topicSidebarCollapsed}
              onToggleCollapsed={() =>
                setTopicSidebarCollapsed((current) => !current)
              }
            />
          )}

          {!embedded && (
            <HomeAnnouncementSidebar
              collapsed={announcementSidebarCollapsed}
              onToggleCollapsed={() =>
                setAnnouncementSidebarCollapsed((current) => !current)
              }
            />
          )}

          <section className={embedded ? undefined : "home-feed-column flex h-full min-h-0 min-w-0 flex-col overflow-hidden"}>
          {session && !hideCreateButton && (
            <div className="mb-6 bg-white p-4 sm:rounded-lg shadow-sm border-b sm:border-0 border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={session.user.avatar}
                  name={session.user.name}
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

          <div className={embedded ? "space-y-4 sm:space-y-6" : "scrollbar-pretty min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-4 pr-1 sm:space-y-6"}>
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
                            {showAuthorLevel && (
                              <span className="text-xs font-medium text-indigo-600">
                                lv.{getUserLevel(post.author.experience ?? 0)}
                              </span>
                            )}
                            {post.topic && (
                              <Link href={`/topic/${post.topic.id}`}>
                                <Badge variant="primary" size="sm">
                                  #{post.topic.name}
                                </Badge>
                              </Link>
                            )}
                          </div>
                          <div className="ml-2 flex items-center gap-1">
                            <span className="whitespace-nowrap text-xs text-gray-400">
                              {mounted
                                ? new Date(post.createdAt).toLocaleString()
                                : ""}
                            </span>
                            <PostListMoreMenu
                              postId={post.id}
                              pinned={post.pinned || false}
                              canDelete={session?.user?.id === post.author.id}
                              canPin={session?.user?.role === "admin"}
                              onDelete={handleDeletePost}
                              onPinnedChange={handlePinnedChange}
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-800">
                          {/* 置顶标识 */}
                          {post.pinned && (
                            <div className="flex items-center gap-1 text-gray-200 text-xs font-medium mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M7 20v-2h10v2zm4-4V7.825L8.4 10.4L7 9l5-5l5 5l-1.4 1.4L13 7.825V16z"/>
                              </svg>
                              <span>已全站置顶</span>
                            </div>
                          )}
                          <div
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("a"))
                                return;
                              navigateToPostDetail(post.id);
                            }}
                            onMouseEnter={() => prefetchPostDetail(post.id)}
                            onTouchStart={() => prefetchPostDetail(post.id)}
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
                              post.contentFormat === "RICH_TEXT" ? (
                                <p className="line-clamp-4 whitespace-pre-wrap break-words">
                                  {post.content}
                                </p>
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

                          {/* 媒体显示逻辑：视频帖封面点击进详情，图片帖保留放大预览 */}
                          {(viewMode === "content" ||
                            viewMode === "titleAndContent" ||
                            (viewMode === "both" && !post.title)) && (
                            <>
                              {post.postType === "VIDEO" && post.video?.coverUrl && (
                                <button
                                  type="button"
                                  onClick={() => navigateToPostDetail(post.id)}
                                  onMouseEnter={() => prefetchPostDetail(post.id)}
                                  onTouchStart={() => prefetchPostDetail(post.id)}
                                  className="group relative mt-3 block w-full aspect-video overflow-hidden rounded-lg border border-gray-200 bg-black"
                                  aria-label="查看视频详情"
                                >
                                  <Image
                                    src={post.video.coverUrl}
                                    alt={post.title ? `${post.title} 视频封面` : "视频封面"}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                                      <Play className="h-3.5 w-3.5" />
                                      播放视频
                                    </span>
                                  </div>
                                </button>
                              )}
                              {post.postType !== "VIDEO" &&
                                post.images &&
                                post.images.length > 0 && (
                                  <PostImages images={post.images.map((img) => img.url)} />
                                )}
                            </>
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
                                currentUserId || session?.user?.id
                                  ? post.likes.some(
                                      (like) =>
                                        like.userId ===
                                        (currentUserId || session?.user?.id)
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
                          </Link>
                          {/* 分享按钮 */}
                          <div className="flex items-center">
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
                </div>
              ))
            )}
          </div>
          </section>
        </div>
      </main>
    </div>
  );
}
