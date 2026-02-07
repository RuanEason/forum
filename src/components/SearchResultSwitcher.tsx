"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import HomeContent from "@/components/HomeContent";
import { getUserLevel } from "@/lib/experience";

type SearchPost = Parameters<typeof HomeContent>[0]["initialPosts"][number];

type UserSearchResult = {
  id: string;
  name: string | null;
  avatar: string | null;
  experience: number;
  _count: {
    posts: number;
  };
};

type ActiveTab = "users" | "posts";

export default function SearchResultSwitcher({
  users,
  posts,
}: {
  users: UserSearchResult[];
  posts: SearchPost[];
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    posts.length > 0 ? "posts" : "users"
  );

  const isPostsActive = activeTab === "posts";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isPostsActive
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          帖子 ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !isPostsActive
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          用户 ({users.length})
        </button>
      </div>

      {isPostsActive ? (
        <section className="bg-white sm:rounded-lg shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">相关帖子</h2>
          {posts.length > 0 ? (
            <HomeContent
              initialPosts={posts}
              hideCreateButton={true}
              showAuthorLevel
              embedded
            />
          ) : (
            <div className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/60">
              暂无相关帖子
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white sm:rounded-lg shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">相关用户</h2>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/user/${user.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
                >
                  <Avatar src={user.avatar} name={user.name} size="md" />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-medium text-gray-900 hover:text-blue-600 truncate">
                        {user.name || "未命名用户"}
                      </span>
                      <span className="text-xs font-medium text-indigo-600 shrink-0">
                        lv.{getUserLevel(user.experience ?? 0)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {user._count.posts} 篇帖子
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50/60">
              暂无相关用户
            </div>
          )}
        </section>
      )}
    </div>
  );
}
