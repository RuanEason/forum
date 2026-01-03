"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Heading } from "@/lib/markdown";
import TableOfContents from "./TableOfContents";
import TimelineNavigation from "./TimelineNavigation";

// 评论项的简化类型，用于时间轴
interface CommentForTimeline {
  id: string;
  authorName: string;
  createdAt: Date;
  isReply?: boolean;
}

interface PostSidebarProps {
  headings: Heading[];
  comments: CommentForTimeline[];
  contentEndRef?: React.RefObject<HTMLDivElement | null>;
  commentsStartRef?: React.RefObject<HTMLDivElement | null>;
}

type SidebarMode = "toc" | "timeline";

export default function PostSidebar({ headings, comments }: PostSidebarProps) {
  // 当前显示模式
  const [mode, setMode] = useState<SidebarMode>("toc");
  // 是否为手动切换（手动切换后暂时禁用自动切换）
  const [isManualOverride, setIsManualOverride] = useState(false);
  // 当前激活的评论 ID
  const [activeCommentId, setActiveCommentId] = useState<string>("");
  // 用于追踪自动切换的锁定计时器
  const manualOverrideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 时间轴悬停展开状态（仅桌面端）
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  // 检测是否为移动端（无悬停能力）
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // 将评论转换为时间轴格式（添加楼层号）
  const timelineComments = comments.map((comment, index) => ({
    ...comment,
    floor: index + 1,
  }));

  // 检测是否为触摸设备
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia("(pointer: coarse)").matches
      );
    };
    checkTouchDevice();
    // 监听窗口变化（例如模拟器切换）
    window.addEventListener("resize", checkTouchDevice);
    return () => window.removeEventListener("resize", checkTouchDevice);
  }, []);

  // 设置 IntersectionObserver 监听评论区
  useEffect(() => {
    // 找到评论区容器
    const commentsSection = document.getElementById("comments-section");
    if (!commentsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 如果是手动切换状态，不自动切换
        if (isManualOverride) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 评论区进入视口，切换到时间轴
            setMode("timeline");
          } else {
            // 评论区离开视口，切换回目录
            setMode("toc");
          }
        });
      },
      {
        // 当评论区顶部进入视口下方 20% 时触发
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    observer.observe(commentsSection);

    return () => {
      observer.disconnect();
    };
  }, [isManualOverride]);

  // 监听评论可见性，更新激活的评论
  useEffect(() => {
    if (comments.length === 0) return;

    const commentElements = comments
      .map((c) => document.getElementById(`comment-${c.id}`))
      .filter(Boolean) as HTMLElement[];

    if (commentElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到当前可见的评论
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // 选择最靠近顶部的评论
          const sorted = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          const targetId = sorted[0].target.id.replace("comment-", "");
          setActiveCommentId(targetId);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    commentElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [comments]);

  // 手动切换模式
  const handleManualSwitch = useCallback(() => {
    const newMode = mode === "toc" ? "timeline" : "toc";
    setMode(newMode);
    setIsManualOverride(true);

    // 清除之前的计时器
    if (manualOverrideTimeoutRef.current) {
      clearTimeout(manualOverrideTimeoutRef.current);
    }

    // 5秒后恢复自动切换
    manualOverrideTimeoutRef.current = setTimeout(() => {
      setIsManualOverride(false);
    }, 5000);
  }, [mode]);

  // 导航到评论
  const handleNavigateToComment = useCallback((commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      setActiveCommentId(commentId);
    }
  }, []);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (manualOverrideTimeoutRef.current) {
        clearTimeout(manualOverrideTimeoutRef.current);
      }
    };
  }, []);

  const hasToc = headings.length > 0;
  const hasComments = comments.length > 0;

  // 如果既没有目录也没有评论，不显示侧边栏
  if (!hasToc && !hasComments) {
    return null;
  }

  // 判断时间轴是否应该展开（桌面端悬停展开，移动端始终展开）
  const shouldTimelineExpand = isTouchDevice || isTimelineExpanded;

  // 悬停事件处理
  const handleMouseEnter = useCallback(() => {
    if (!isTouchDevice && mode === "timeline") {
      setIsTimelineExpanded(true);
    }
  }, [isTouchDevice, mode]);

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setIsTimelineExpanded(false);
    }
  }, [isTouchDevice]);

  return (
    <div
      className={`post-sidebar ${
        mode === "timeline" && !shouldTimelineExpand && hasComments
          ? "post-sidebar-collapsed"
          : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 侧边栏内容区域 */}
      <div className="sidebar-content">
        {/* TOC 目录视图 */}
        <div
          className={`sidebar-panel ${
            mode === "toc" ? "sidebar-panel-active" : "sidebar-panel-hidden"
          }`}
        >
          {hasToc ? (
            <TableOfContents headings={headings} />
          ) : (
            <div className="sidebar-empty">
              <p className="text-gray-500 text-sm">本文暂无目录</p>
            </div>
          )}
        </div>

        {/* Timeline 时间轴视图 */}
        <div
          className={`sidebar-panel ${
            mode === "timeline"
              ? "sidebar-panel-active"
              : "sidebar-panel-hidden"
          }`}
        >
          {hasComments ? (
            <TimelineNavigation
              comments={timelineComments}
              activeCommentId={activeCommentId}
              onNavigate={handleNavigateToComment}
              isExpanded={shouldTimelineExpand}
            />
          ) : (
            <div className="sidebar-empty">
              <p className="text-gray-500 text-sm">暂无评论</p>
            </div>
          )}
        </div>
      </div>

      {/* 切换控制区域 */}
      <div
        className={`sidebar-controls ${
          mode === "timeline" && !shouldTimelineExpand && hasComments
            ? "sidebar-controls-collapsed"
            : ""
        }`}
      >
        {/* 模式切换按钮 */}
        <button
          onClick={handleManualSwitch}
          className="sidebar-toggle-btn"
          title={mode === "toc" ? "切换到评论时间轴" : "切换到文章目录"}
        >
          {mode === "toc" ? (
            <>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="sidebar-toggle-text">评论</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span className="sidebar-toggle-text">目录</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
