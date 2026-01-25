"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  initialLikesCount: number;
  initialLikedByUser: boolean;
}

export default function LikeButton({
  targetType,
  targetId,
  initialLikesCount,
  initialLikedByUser,
}: LikeButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByUser, setLikedByUser] = useState(initialLikedByUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLikeToggle = async () => {
    setError("");
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetType, targetId }),
      });

      const data = await response.json();

      if (response.ok) {
        setLikedByUser(data.liked);
        setLikesCount((prevCount) => (data.liked ? prevCount + 1 : prevCount - 1));
      } else {
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      className={`flex items-center group ${
        likedByUser ? "text-pink-500" : "text-gray-500 hover:text-pink-500"
      } disabled:opacity-50 p-1 sm:p-2 rounded-full hover:bg-pink-50 transition-colors`}
      disabled={loading || status === "loading"}
      title={likedByUser ? "取消点赞" : "点赞"}
      suppressHydrationWarning
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-200 ${likedByUser ? "scale-110" : "group-hover:scale-110"}`}
        fill={likedByUser ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={likedByUser ? "0" : "2.5"}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.77234 30.8573V11.7471H7.54573C5.50932 11.7471 3.85742 13.3931 3.85742 15.425V27.1794C3.85742 29.2112 5.50932 30.8573 7.54573 30.8573H9.77234ZM11.9902 30.8573V11.7054C14.9897 10.627 16.6942 7.8853 17.1055 3.33591C17.2666 1.55463 18.9633 0.814421 20.5803 1.59505C22.1847 2.36964 23.243 4.32583 23.243 6.93947C23.243 8.50265 23.0478 10.1054 22.6582 11.7471H29.7324C31.7739 11.7471 33.4289 13.402 33.4289 15.4435C33.4289 15.7416 33.3928 16.0386 33.3215 16.328L30.9883 25.7957C30.2558 28.7683 27.5894 30.8573 24.528 30.8573H11.9911H11.9902Z"
        ></path>
      </svg>
      <span className="text-xs sm:text-sm font-medium ml-1 tabular-nums" suppressHydrationWarning>
        {likesCount > 0 ? likesCount : null}
      </span>
      <span className="hidden sm:inline text-xs sm:text-sm font-medium ml-0.5" suppressHydrationWarning>
        {likesCount > 0 ? null : "点赞"}
      </span>
      {error && <span className="text-red-500 text-xs sm:text-sm ml-2">{error}</span>}
    </button>
  );
}