"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import AdminBadge from "@/components/AdminBadge";
import FollowButton from "@/components/FollowButton";
import ProfileBio from "@/components/ProfileBio";

interface User {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  isAdmin: boolean;
}

interface FollowConnectionsProps {
  user: User;
  type: "following" | "followers";
  isCurrentUser: boolean;
}

interface Connection {
  user: User;
  followedAt: string;
  isFollowing?: boolean;
}

export default function FollowConnections({
  user,
  type,
  isCurrentUser,
}: FollowConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConnections(pageToLoad = 1, append = false) {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/follow/connections?userId=${user.id}&type=${type}&page=${pageToLoad}&pageSize=20`
        );

        if (!res.ok) {
          throw new Error("获取关注列表失败");
        }

        const data = await res.json() as {
          connections?: Connection[];
          pagination?: { hasMore?: boolean };
        };
        setConnections((current) => {
          if (!append) return data.connections || [];
          const existingIds = new Set(current.map((connection) => connection.user.id));
          return [
            ...current,
            ...(data.connections || []).filter((connection) => !existingIds.has(connection.user.id)),
          ];
        });
        setPage(pageToLoad);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (err) {
        setError("获取关注列表失败");
        console.error("获取关注列表失败:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    void fetchConnections();
  }, [user.id, type]);

  const handleFollowChange = (index: number, isFollowing: boolean) => {
    setConnections((prev) =>
      prev.map((conn, i) =>
        i === index ? { ...conn, isFollowing } : conn
      )
    );
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-200">
      {/* 头部 */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href={`/user/${user.id}`}>
            <Avatar src={user.avatar} name={user.name} size="lg" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/user/${user.id}`}>
                <h1 className="text-xl font-bold text-gray-900 transition-colors hover:text-indigo-600">
                  {user.name || "匿名用户"}
                </h1>
              </Link>
              {user.isAdmin && <AdminBadge size="md" />}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <Link
                href={`/user/${user.id}/connections?tab=following`}
                className={`text-sm ${
                  type === "following"
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-indigo-600"
                }`}
              >
                关注
              </Link>
              <span className="text-gray-300">·</span>
              <Link
                href={`/user/${user.id}/connections?tab=followers`}
                className={`text-sm ${
                  type === "followers"
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-indigo-600"
                }`}
              >
                粉丝
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : connections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {type === "following" ? "还没有关注任何人" : "还没有粉丝"}
          </div>
        ) : (
          connections.map((conn, index) => (
            <div
              key={conn.user.id}
              className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Link href={`/user/${conn.user.id}`}>
                    <Avatar src={conn.user.avatar} name={conn.user.name} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/user/${conn.user.id}`}
                        className="min-w-0"
                      >
                        <h3 className="truncate text-base font-semibold text-gray-900 transition-colors hover:text-indigo-600">
                          {conn.user.name || "匿名用户"}
                        </h3>
                      </Link>
                      {conn.user.isAdmin && <AdminBadge size="sm" />}
                    </div>
                    {conn.user.bio && (
                      <ProfileBio bio={conn.user.bio} className="mt-1 truncate text-sm text-gray-500" />
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {type === "following" ? "关注于" : "成为粉丝于"}{" "}
                      {new Date(conn.followedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
                {/* 关注按钮 - 仅在查看别人页面时显示 */}
                {!isCurrentUser && (
                  <div className="flex-shrink-0 ml-4">
                    <FollowButton
                      userId={conn.user.id}
                      userName={conn.user.name}
                      initialFollowing={conn.isFollowing || false}
                      onFollowChange={(isFollowing) =>
                        handleFollowChange(index, isFollowing)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 返回链接 */}
      {(hasMore || error) && (
        <div className="flex flex-col items-center gap-2 border-t border-gray-100 p-4 sm:p-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={() => {
              // The effect owns the initial request; subsequent pages use the same endpoint.
              void (async () => {
                try {
                  setLoadingMore(true);
                  setError(null);
                  const res = await fetch(
                    `/api/follow/connections?userId=${user.id}&type=${type}&page=${error ? page : page + 1}&pageSize=20`,
                  );
                  const data = await res.json() as {
                    connections?: Connection[];
                    pagination?: { hasMore?: boolean };
                  };
                  if (!res.ok) throw new Error("failed");
                  setConnections((current) => {
                    const existingIds = new Set(current.map((connection) => connection.user.id));
                    return [...current, ...(data.connections || []).filter((connection) => !existingIds.has(connection.user.id))];
                  });
                  setPage(error ? page : page + 1);
                  setHasMore(Boolean(data.pagination?.hasMore));
                } catch {
                  setError("获取关注列表失败");
                } finally {
                  setLoadingMore(false);
                }
              })();
            }}
            disabled={loadingMore}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60"
          >
            {loadingMore ? "加载中..." : error ? "重试" : "加载更多"}
          </button>
        </div>
      )}

      {/* 返回链接 */}
      <div className="p-4 sm:p-6 border-t border-gray-100">
        <Link
          href={`/user/${user.id}`}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← 返回 {user.name || "用户"} 的主页
        </Link>
      </div>
    </div>
  );
}
