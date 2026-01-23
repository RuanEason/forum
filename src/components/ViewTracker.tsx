"use client";

import { useEffect, useRef } from "react";
import { incrementViewCount } from "@/lib/actions/post";

interface ViewTrackerProps {
  postId: string;
}

/**
 * 阅读量追踪组件
 * 在客户端挂载时调用 Server Action 增加阅读量
 * 使用 Cookie 机制防止刷新重复计数
 */
export default function ViewTracker({ postId }: ViewTrackerProps) {
  // 使用 ref 确保只调用一次（严格模式下 useEffect 会执行两次）
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // 调用 Server Action 增加阅读量
    incrementViewCount(postId)
      .then((result) => {
        // 在开发环境显示调试信息
        if (process.env.NODE_ENV === "development") {
          console.log("View tracker result:", result);
        }
        // 生产环境也显示简单的成功信息
        if (result.success && result.debug) {
          console.log("View tracked:", result.debug);
        }
      })
      .catch((error) => {
        // 静默处理错误，不影响用户体验
        console.error("Failed to track view:", error);
      });
  }, [postId]);

  // 不渲染任何 UI
  return null;
}
