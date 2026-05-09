"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import UserPostList from "@/components/UserPostList";
import UserStats from "@/components/UserStats";
import FollowButton from "@/components/FollowButton";
import { signOut } from "next-auth/react";
import BackButton from "@/components/BackButton";

interface UserStatsData {
  daysJoined: number;
  postsPublished: number;
  totalViews: number;
  likesReceived: number;
  likesGiven: number;
  followersCount: number;
  followingCount: number;
  experience: number;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  coverImage: string | null;
  createdAt: string;
  posts: Post[];
  showUserData?: boolean;
}

const DEFAULT_COVER_IMAGE = "/Default-user-background-image.png";

const LEVEL_THRESHOLDS = [50, 200, 800, 1500, 3000, 6666] as const;

const getLevelProgress = (experience: number) => {
  const safeExperience =
    Number.isFinite(experience) && experience > 0 ? Math.floor(experience) : 0;

  const displayLevel = LEVEL_THRESHOLDS.reduce((level, requiredExperience) => {
    if (safeExperience >= requiredExperience) {
      return level + 1;
    }
    return level;
  }, 0);

  const currentLevelBase = displayLevel === 0 ? 0 : LEVEL_THRESHOLDS[displayLevel - 1];
  const nextLevelRequired = LEVEL_THRESHOLDS[displayLevel] ?? currentLevelBase;

  if (nextLevelRequired === currentLevelBase) {
    const maxLevelProgress = Math.max(safeExperience - currentLevelBase, 1);
    return {
      displayLevel,
      progressCurrent: maxLevelProgress,
      progressTarget: maxLevelProgress,
      progressPercent: 100,
    };
  }

  const progressTarget = nextLevelRequired - currentLevelBase;
  const progressCurrent = Math.max(safeExperience - currentLevelBase, 0);

  return {
    displayLevel,
    progressCurrent,
    progressTarget,
    progressPercent: Math.min((progressCurrent / progressTarget) * 100, 100),
  };
};

interface UserProfileClientProps {
  user: User;
  isCurrentUser: boolean;
  stats: UserStatsData;
  isFollowing?: boolean;
}

type UserPostListProps = Parameters<typeof UserPostList>[0]["initialPosts"];

export default function UserProfileClient({
  user,
  isCurrentUser,
  stats,
  isFollowing = false,
}: UserProfileClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const levelProgress = getLevelProgress(stats.experience);

  const coverUrl = user.coverImage || DEFAULT_COVER_IMAGE;
  const hasCover = !!coverUrl;
  // 隐藏用户数据只隐藏统计和等级，关注/粉丝始终显示
  const shouldShowUserStatsAndLevel = isCurrentUser || user.showUserData !== false;
  const isVideo = /\.(mp4|mov|avi|webm)(\?.*)?$/i.test(coverUrl || "");
  const previewUrl = isVideo
    ? (coverUrl || "").replace(/\.(mp4|mov|avi|webm)(\?.*)?$/i, "_preview.webp$2")
    : coverUrl;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isVideo && !videoLoaded && !videoError) {
      const timeout = setTimeout(() => {
        console.log('Video load timeout, force showing');
        setVideoLoaded(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isVideo, videoLoaded, videoError]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-4 sm:px-0">
          {hasCover && (
            <div className="w-full h-48 sm:h-64 rounded-t-lg relative overflow-hidden">
              {isVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={coverUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedData={() => {
                      console.log('Video loaded data');
                      setVideoLoaded(true);
                    }}
                    onCanPlay={() => {
                      console.log('Video can play');
                      setVideoLoaded(true);
                      const video = videoRef.current;
                      if (video) {
                        video.play().catch(err => {
                          console.warn('Video play error:', err);
                        });
                      }
                    }}
                    onPlay={() => {
                      console.log('Video play event fired');
                    }}
                    onPlaying={() => {
                      console.log('Video is now playing');
                    }}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      setVideoError(true);
                      setTimeout(() => setVideoLoaded(true), 1000);
                    }}
                    onLoadStart={() => console.log('Video load started')}
                    onWaiting={() => console.log('Video waiting')}
                    onStalled={() => console.log('Video stalled')}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      videoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <img
                    src={previewUrl}
                    alt="背景预览"
                    onError={() => setVideoLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      videoLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
            </div>
          )}
          <div
            className={`bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-200 ${hasCover ? "rounded-t-none" : ""}`}
          >
            <div className="p-4 sm:p-6 relative">
              <div className="sm:hidden mb-4">
                <BackButton />
              </div>
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                {!isCurrentUser && (
                  <FollowButton
                    userId={user.id}
                    userName={user.name}
                    initialFollowing={isFollowing}
                  />
                )}
                {isCurrentUser && (
                  <>
                    <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 18v-8v.325V6zM4 8h16V6H4zm7.575 12H2V4h20v7.325q-.875-.625-1.912-.975T17.9 10q-1.425 0-2.687.538T13 12H4v6h6.975q.075.525.225 1.025t.375.975m5.325 2l-.3-1.5q-.3-.125-.562-.262T15.5 19.9l-1.45.45l-1-1.7l1.15-1q-.05-.325-.05-.65t.05-.65l-1.15-1l1-1.7l1.45.45q.275-.2.538-.337t.562-.263l.3-1.5h2l.3 1.5q.3.125.563.263t.537.337l1.45-.45l1 1.7l-1.15 1q.05.325.05.65t-.05.65l1.15 1l-1 1.7l-1.45-.45q-.275.2-.537.338t-.563.262l-.3 1.5zm1-3q.825 0 1.413-.587T19.9 17t-.587-1.412T17.9 15t-1.412.588TRE.9 17t.588 1.413T17.9 19"/></svg>
                    </Link>
                    <button onClick={() => setIsModalOpen(true)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <div className="hidden sm:block absolute left-4 top-4 z-10">
                <BackButton />
              </div>
              {hasCover && (
                <div className="h-16 sm:h-20"></div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className={`${hasCover ? "-mt-16 sm:-mt-20" : ""} flex-shrink-0`}>
                  <Avatar src={user.avatar} name={user.name} size="xl" />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <h1 className="mb-2 text-xl sm:text-2xl font-bold text-gray-900">
                    {user.name || "匿名用户"}
                  </h1>
                  {/* 关注、粉丝、等级始终显示，不受 showUserData 影响 */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <Link
                      href={`/user/${user.id}/connections?tab=following`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <span className="font-semibold">{stats.followingCount || 0}</span> 关注
                    </Link>
                    <span>·</span>
                    <Link
                      href={`/user/${user.id}/connections?tab=followers`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <span className="font-semibold">{stats.followersCount || 0}</span> 粉丝
                    </Link>
                    <span>·</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">lv.{levelProgress.displayLevel}</span>
                      <div className="w-32 sm:w-36 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${levelProgress.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] leading-none text-gray-500 whitespace-nowrap">
                          {levelProgress.progressCurrent}/{levelProgress.progressTarget}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    加入于 {format(new Date(user.createdAt), "yyyy年MM月dd日")}
                  </p>
                  {user.bio && (
                    <p className="mt-2 text-sm sm:text-base text-gray-700">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 用户统计卡片只有允许显示统计数据时才显示 */}
          {shouldShowUserStatsAndLevel && (
            <>
              <div
                className={`-mt-8 sm:-mt-8 mb-6 sm:mb-8  z-10 relative ${
                  hasCover ? "" : "hidden"
                }`}
              >
                <UserStats
                  daysJoined={stats.daysJoined}
                  postsPublished={stats.postsPublished}
                  totalViews={stats.totalViews}
                  likesReceived={stats.likesReceived}
                  likesGiven={stats.likesGiven}
                />
              </div>

              {!hasCover && (
                <div className="mb-6">
                  <UserStats
                    daysJoined={stats.daysJoined}
                    postsPublished={stats.postsPublished}
                    totalViews={stats.totalViews}
                    likesReceived={stats.likesReceived}
                    likesGiven={stats.likesGiven}
                  />
                </div>
              )}
            </>
          )}

          <h2
            className={`text-lg sm:text-xl font-bold text-gray-900 mb-4 px-2 sm:px-0 ${
              shouldShowUserStatsAndLevel ? "" : "mt-6 sm:mt-8"
            }`}
          >
            发布的帖子 ({user.posts.length})
          </h2>
          <UserPostList initialPosts={user.posts as unknown as UserPostListProps} />
        </div>
      </div>

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
