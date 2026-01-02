"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import UserPostList from "@/components/UserPostList";
import UserStats from "@/components/UserStats";
import { signOut } from "next-auth/react";
import BackButton from "@/components/BackButton";

interface UserStatsData {
  daysJoined: number;
  postsPublished: number;
  totalViews: number;
  likesReceived: number;
  likesGiven: number;
}

interface UserProfileClientProps {
  user: any;
  isCurrentUser: boolean;
  stats: UserStatsData;
}

export default function UserProfileClient({
  user,
  isCurrentUser,
  stats,
}: UserProfileClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close on click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-4 sm:px-0">
          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="sm:hidden mb-4">
                <BackButton />
              </div>
              <div className="flex items-center relative">
                <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 pr-6">
                  <BackButton />
                </div>
                <Avatar src={user.avatar} name={user.name} size="xl" />
                <div className="ml-4 sm:ml-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {user.name || "匿名用户"}
                  </h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    加入于 {format(new Date(user.createdAt), "yyyy年MM月dd日")}
                  </p>
                  {user.bio && (
                    <p className="mt-2 sm:mt-4 text-sm sm:text-base text-gray-700">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
              {isCurrentUser && (
                <div className="mt-4 sm:mt-0 flex justify-end gap-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    编辑资料
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-danger"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Stats Grid */}
          <UserStats
            daysJoined={stats.daysJoined}
            postsPublished={stats.postsPublished}
            totalViews={stats.totalViews}
            likesReceived={stats.likesReceived}
            likesGiven={stats.likesGiven}
          />

          {/* User Posts */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 px-2 sm:px-0">
            发布的帖子 ({user.posts.length})
          </h2>
          <UserPostList initialPosts={user.posts as any} />
        </div>
      </div>

      {/* Logout Modal */}
      <div
        className={`modal-overlay ${isModalOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      >
        <div className="modal">
          <div className="modal-header">
            <div className="modal-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="modal-title-group">
              <h3 className="modal-title">确认退出账号？</h3>
              <p className="modal-desc">
                退出后您将无法发送帖子，且需要重新登录才能继续使用系统。
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-outline"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.href = "/auth/signin";
              }}
            >
              确定退出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
