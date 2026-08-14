"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Hash,
  LayoutList,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { HomeTopic } from "@/types/topic";

export default function HomeTopicSidebar({
  initialTopics,
  initialHasMore,
  collapsed,
  onToggleCollapsed,
}: {
  initialTopics: HomeTopic[];
  initialHasMore: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [allTopics, setAllTopics] = useState<HomeTopic[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const topics = allTopics ?? initialTopics;
  const hasMore = allTopics === null ? initialHasMore : false;

  const handleToggleMore = async () => {
    if (allTopics) {
      setAllTopics(null);
      setExpanded(false);
      return;
    }

    if (expanded) {
      setExpanded(false);
      return;
    }

    setLoadingMore(true);
    setLoadError(false);

    try {
      const response = await fetch("/api/topic?view=home&expanded=1", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load topics");
      }

      const data = (await response.json()) as { topics?: HomeTopic[] };
      setAllTopics(Array.isArray(data.topics) ? data.topics : []);
      setExpanded(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div
        className={`home-topic-sidebar-shell absolute inset-y-0 hidden h-full min-w-0 overflow-hidden transition-[opacity,transform] duration-300 ease-out xl:block ${
          collapsed
            ? "pointer-events-none -translate-x-4 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        <aside className="h-full w-full min-w-0">
          <div className="scrollbar-pretty h-full overflow-y-auto border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">漫游</h2>
                <p className="mt-0.5 text-xs text-gray-400">发现感兴趣的讨论</p>
              </div>
              {!collapsed && (
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="收起话题栏"
                  title="收起话题栏"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>

            <nav className="p-2" aria-label="首页话题导航">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700"
                aria-current="page"
              >
                <LayoutList className="h-4 w-4 shrink-0" />
                <span className="truncate">全部帖子</span>
              </Link>

              <div className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                热门话题
              </div>

              <div className="space-y-0.5">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${topic.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Hash className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="truncate">{topic.name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-400">
                      {topic.postCount}
                    </span>
                  </Link>
                ))}
              </div>

              {topics.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-400">暂时还没有话题</p>
              )}

              {(hasMore || expanded || loadError) && (
                <button
                  type="button"
                  onClick={handleToggleMore}
                  disabled={loadingMore}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {loadingMore ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>
                    {loadingMore
                      ? "加载中..."
                      : loadError
                        ? "重新加载"
                        : expanded
                          ? "收起话题"
                          : "查看更多"}
                  </span>
                </button>
              )}
            </nav>
          </div>
        </aside>
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="home-topic-sidebar-toggle fixed left-3 top-24 z-30 hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-transform duration-300 ease-out xl:inline-flex"
          aria-label="展开话题栏"
          title="展开话题栏"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
