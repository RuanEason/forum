"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import HomeContent, { type PostProps } from "@/components/HomeContent";
import { getUserLevel } from "@/lib/experience";

type UserSearchResult = {
  id: string;
  name: string | null;
  avatar: string | null;
  experience: number;
  _count: { posts: number };
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type SearchPageResponse<T> = {
  items?: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  error?: string;
};

type ActiveTab = "users" | "posts";

async function fetchSearchPage<T>(query: string, type: ActiveTab, page: number) {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&pageSize=20`,
    { cache: "no-store" },
  );
  const data = await response.json() as SearchPageResponse<T>;
  const pagination =
    typeof data.page === "number" &&
    typeof data.pageSize === "number" &&
    typeof data.total === "number" &&
    typeof data.totalPages === "number" &&
    typeof data.hasMore === "boolean"
      ? {
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
          hasMore: data.hasMore,
        }
      : null;

  if (!response.ok || !pagination) {
    throw new Error(data.error || "Search failed");
  }
  return { items: data.items ?? [], pagination };
}

export default function SearchResultSwitcher({ query }: { query: string }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [postsPagination, setPostsPagination] = useState<Pagination | null>(null);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadInitialResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postResult, userResult] = await Promise.all([
        fetchSearchPage<PostProps>(query, "posts", 1),
        fetchSearchPage<UserSearchResult>(query, "users", 1),
      ]);
      setPosts(postResult.items);
      setPostsPagination(postResult.pagination);
      setUsers(userResult.items);
      setUsersPagination(userResult.pagination);
      setActiveTab(postResult.pagination.total > 0 ? "posts" : "users");
    } catch (loadError) {
      console.error("Failed to load search results:", loadError);
      setError("获取搜索结果失败");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadInitialResults();
  }, [loadInitialResults]);

  const loadMorePosts = async () => {
    const nextPage = (postsPagination?.page ?? 1) + 1;
    const result = await fetchSearchPage<PostProps>(query, "posts", nextPage);
    setPosts((current) => {
      const existingIds = new Set(current.map((post) => post.id));
      return [...current, ...result.items.filter((post) => !existingIds.has(post.id))];
    });
    setPostsPagination(result.pagination);
    return {
      items: result.items,
      nextCursor: null,
      hasMore: result.pagination.hasMore,
    };
  };

  const loadMoreUsers = async () => {
    if (loadingUsers || !usersPagination?.hasMore) return;
    setLoadingUsers(true);
    try {
      const result = await fetchSearchPage<UserSearchResult>(
        query,
        "users",
        usersPagination.page + 1,
      );
      setUsers((current) => {
        const existingIds = new Set(current.map((user) => user.id));
        return [...current, ...result.items.filter((user) => !existingIds.has(user.id))];
      });
      setUsersPagination(result.pagination);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg bg-white py-12 text-center text-gray-500">加载中...</div>;
  }
  if (error) {
    return <div className="rounded-lg bg-white py-12 text-center text-red-500">{error}</div>;
  }

  const isPostsActive = activeTab === "posts";
  const hasResults = (postsPagination?.total ?? 0) > 0 || (usersPagination?.total ?? 0) > 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${isPostsActive ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          帖子 ({postsPagination?.total ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${!isPostsActive ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          用户 ({usersPagination?.total ?? 0})
        </button>
      </div>

      {!hasResults ? (
        <div className="rounded-lg bg-white py-12 text-center text-gray-500">暂无相关内容</div>
      ) : isPostsActive ? (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">相关帖子</h2>
          {posts.length > 0 ? (
            <HomeContent
              initialPosts={posts}
              initialPostsHasMore={Boolean(postsPagination?.hasMore)}
              hideCreateButton
              showAuthorLevel
              embedded
              loadMorePosts={loadMorePosts}
            />
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">暂无相关帖子</div>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">相关用户</h2>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/user/${user.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50"
                >
                  <Avatar src={user.avatar} name={user.name} size="md" />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate font-medium text-gray-900">{user.name || "未命名用户"}</span>
                      <span className="shrink-0 text-xs font-medium text-indigo-600">lv.{getUserLevel(user.experience ?? 0)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{user._count.posts} 篇帖子</span>
                  </div>
                </Link>
              ))}
              {usersPagination?.hasMore && (
                <button
                  type="button"
                  onClick={() => void loadMoreUsers()}
                  disabled={loadingUsers}
                  className="mx-auto block rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60"
                >
                  {loadingUsers ? "加载中..." : "加载更多"}
                </button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">暂无相关用户</div>
          )}
        </section>
      )}
    </div>
  );
}
