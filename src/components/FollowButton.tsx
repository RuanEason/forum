"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, Check } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  userName?: string | null;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

/**
 * 关注按钮组件
 *
 * @param {FollowButtonProps} props - 组件属性
 * @param {string} props.userId - 目标用户 ID
 * @param {string} [props.userName] - 目标用户名称（用于提示）
 * @param {boolean} [props.initialFollowing] - 初始关注状态
 * @param {(isFollowing: boolean) => void} [props.onFollowChange] - 关注状态变化回调
 *
 * @example
 * <FollowButton userId="user123" userName="张三" initialFollowing={false} />
 */
export default function FollowButton({
  userId,
  userName,
  initialFollowing = false,
  onFollowChange,
}: FollowButtonProps) {
  const { data: session, status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const currentUserId = session?.user?.id;
  const isCurrentUser = currentUserId === userId;

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  /**
   * 切换关注状态
   */
  const handleToggleFollow = async () => {
    if (loading || !currentUserId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followingId: userId,
          follow: !following,
        }),
      });

      if (response.ok) {
        const newFollowing = !following;
        setFollowing(newFollowing);
        if (onFollowChange) {
          onFollowChange(newFollowing);
        }
      } else {
        const data = await response.json();
        alert(data.error || "关注操作失败");
      }
    } catch {
      alert("网络错误，关注操作失败");
    } finally {
      setLoading(false);
    }
  };

  // 如果没有登录，不显示关注按钮
  if (status !== "authenticated") {
    return null;
  }

  // 如果是当前用户，不显示关注按钮
  if (isCurrentUser) {
    return null;
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      title={userName ? `${following ? "取消关注" : "关注"} ${userName}` : undefined}
      className={`inline-flex items-center px-4 py-2 rounded-full font-medium transition-all duration-200 ${
        following
          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>处理中...</span>
        </>
      ) : following ? (
        <>
          <Check className="w-4 h-4 mr-1.5" />
          <span>已关注</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>关注</span>
        </>
      )}
    </button>
  );
}
