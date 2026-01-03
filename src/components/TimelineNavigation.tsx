"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";

interface CommentTimelineItem {
  id: string;
  floor: number;
  authorName: string;
  createdAt: Date;
  isReply?: boolean;
}

interface TimelineNavigationProps {
  comments: CommentTimelineItem[];
  activeCommentId: string;
  onNavigate: (commentId: string) => void;
  /** 是否展开显示详细信息（桌面端悬停时展开，移动端始终展开） */
  isExpanded?: boolean;
}

export default function TimelineNavigation({
  comments,
  activeCommentId,
  onNavigate,
  isExpanded = true,
}: TimelineNavigationProps) {
  // 容器 ref 用于自动滚动
  const containerRef = useRef<HTMLElement>(null);

  // 自动跟随：当 activeCommentId 变化时，滚动到对应节点的垂直居中位置
  useEffect(() => {
    if (!activeCommentId || !containerRef.current) return;

    // 查找当前激活的节点元素
    const activeNode = document.getElementById(
      `timeline-node-${activeCommentId}`
    );
    if (!activeNode) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const nodeRect = activeNode.getBoundingClientRect();

    // 计算节点相对于容器的偏移量
    const nodeOffsetTop = activeNode.offsetTop;
    // 计算需要滚动到的位置，使节点垂直居中
    const scrollTarget =
      nodeOffsetTop - containerRect.height / 2 + nodeRect.height / 2;

    // 平滑滚动到目标位置
    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: "smooth",
    });
  }, [activeCommentId]);

  // 点击楼层时平滑滚动
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, commentId: string) => {
      e.preventDefault();
      onNavigate(commentId);
    },
    [onNavigate]
  );

  // 根据评论时间分组（按日期）
  const groupedComments = useMemo(() => {
    const groups: Map<string, CommentTimelineItem[]> = new Map();

    comments.forEach((comment) => {
      const dateKey = format(new Date(comment.createdAt), "yyyy-MM-dd");
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(comment);
    });

    return groups;
  }, [comments]);

  // 收起/展开状态的类名
  const containerClass = `timeline-container ${
    isExpanded ? "timeline-expanded" : "timeline-collapsed"
  }`;

  if (comments.length === 0) {
    return (
      <nav
        ref={containerRef}
        className={containerClass}
        aria-label="评论时间轴"
      >
        <div className="timeline-header">
          <svg
            className="timeline-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="timeline-header-text">评论时间轴</span>
        </div>
        <p className="timeline-empty">暂无评论</p>
      </nav>
    );
  }

  return (
    <nav ref={containerRef} className={containerClass} aria-label="评论时间轴">
      {/* Header - 收起时隐藏 */}
      <div className="timeline-header">
        <svg
          className="timeline-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="timeline-header-text">评论时间轴</span>
        <span className="timeline-count timeline-expandable-text">
          ({comments.length})
        </span>
      </div>

      <div className="timeline-list">
        {Array.from(groupedComments.entries()).map(
          ([dateKey, dateComments]) => (
            <div key={dateKey} className="timeline-date-group">
              {/* 日期标签 - 收起时隐藏 */}
              <div className="timeline-date-label timeline-expandable-text">
                {format(new Date(dateKey), "MM月dd日")}
              </div>
              <div className="timeline-items">
                {dateComments.map((comment) => (
                  <button
                    key={comment.id}
                    id={`timeline-node-${comment.id}`}
                    onClick={(e) => handleClick(e, comment.id)}
                    className={`timeline-item ${
                      activeCommentId === comment.id
                        ? "timeline-item-active"
                        : ""
                    } ${comment.isReply ? "timeline-item-reply" : ""}`}
                    title={`${comment.authorName} · ${format(
                      new Date(comment.createdAt),
                      "HH:mm"
                    )}`}
                  >
                    {/* 节点圆点 - 展开时显示 */}
                    <span className="timeline-node" />
                    {/* 楼层数字 - 始终显示 */}
                    <span className="timeline-floor">#{comment.floor}</span>
                    {/* 作者名 - 收起时隐藏 */}
                    <span className="timeline-author timeline-expandable-text">
                      {comment.authorName}
                    </span>
                    {/* 时间 - 收起时隐藏 */}
                    <span className="timeline-time timeline-expandable-text">
                      {format(new Date(comment.createdAt), "HH:mm")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* 快速跳转按钮 - 收起时隐藏 */}
      <div className="timeline-actions">
        <button
          onClick={(e) => handleClick(e, comments[0].id)}
          className="timeline-action-btn"
          title="跳到第一条评论"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="timeline-expandable-text">首楼</span>
        </button>
        <button
          onClick={(e) => handleClick(e, comments[comments.length - 1].id)}
          className="timeline-action-btn"
          title="跳到最新评论"
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <span className="timeline-expandable-text">末楼</span>
        </button>
      </div>
    </nav>
  );
}
