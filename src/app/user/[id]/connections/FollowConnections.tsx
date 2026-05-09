"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { UserPlus, } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConnections() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/follow/connections?userId=${user.id}&type=${type}`
        );

        if (!res.ok) {
          throw new Error("获取关注列表失败");
        }

        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) {
        setError("获取关注列表失败");
        console.error("获取关注列表失败:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, [user.id, type]);

  const handleFollowChange = (index: number, isFollowing: boolean) => {
    setConnections((prev) =>
      prev.map((conn, i) =>
        i === index ? { ...conn, isFollowing } : conn
      )
    );
  };

  const pageTitle = type === "following" ? "关注" : "粉丝";

  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-200">
      {/* 头部 */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href={`/user/${user.id}`}>
            <Avatar src={user.avatar} name={user.name} size="lg" />
          </Link>
          <div>
            <Link href={`/user/${user.id}`}>
              <h1 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                {user.name || "匿名用户"}
              </h1>
            </Link>
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
                    <Link
                      href={`/user/${conn.user.id}`}
                      className="block"
                    >
                      <h3 className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                        {conn.user.name || "匿名用户"}
                      </h3>
                    </Link>
                    {conn.user.bio && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conn.user.bio}
                      </p>
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
