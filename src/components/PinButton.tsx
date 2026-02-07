"use client";

import { useState } from "react";
import { Pin, PinOff } from "lucide-react";

interface PinButtonProps {
  postId: string;
  isPinned: boolean;
}

/**
 * 置顶按钮组件
 * 仅管理员可见和使用
 *
 * @param {PinButtonProps} props - 组件属性
 * @param {string} props.postId - 帖子 ID
 * @param {boolean} props.isPinned - 当前是否置顶
 *
 * @example
 * <PinButton postId="post123" isPinned={false} />
 */
export default function PinButton({ postId, isPinned }: PinButtonProps) {
  const [pinned, setPinned] = useState(isPinned);
  const [loading, setLoading] = useState(false);

  /**
   * 切换置顶状态
   */
  const handleTogglePin = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, pinned: !pinned }),
      });

      if (response.ok) {
        setPinned(!pinned);
      } else {
        const data = await response.json();
        alert(data.error || "置顶操作失败");
      }
    } catch {
      alert("网络错误，置顶操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePin}
      disabled={loading}
      className={`text-xs sm:text-sm p-1 sm:p-2 rounded-full transition-colors ${
        pinned
          ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50"
          : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={pinned ? "取消置顶" : "置顶帖子"}
    >
      <span className="hidden sm:inline">{loading ? "..." : pinned ? "取消置顶" : "置顶"}</span>
      {loading ? (
        <svg className="w-4 h-4 sm:hidden animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : pinned ? (
        <PinOff className="w-4 h-4 sm:hidden" />
      ) : (
        <Pin className="w-4 h-4 sm:hidden" />
      )}
    </button>
  );
}
