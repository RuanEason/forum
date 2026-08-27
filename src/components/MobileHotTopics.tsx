"use client";

import Link from "next/link";
import { Hash, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HomeTopic } from "@/types/topic";

const MOBILE_TOPIC_ROW_HEIGHT = 44;
const MOBILE_TOPIC_ROW_GAP = 2;

export type MobileHotTopicsStatus = "idle" | "loading" | "success" | "error";

export default function MobileHotTopics({
  topics,
  status,
  onRetry,
  onTopicClick,
}: {
  topics: HomeTopic[];
  status: MobileHotTopicsStatus;
  onRetry: () => void;
  onTopicClick: () => void;
}) {
  const topicListRef = useRef<HTMLDivElement>(null);
  const [visibleTopicCount, setVisibleTopicCount] = useState(0);

  useEffect(() => {
    const topicList = topicListRef.current;

    if (!topicList) {
      return;
    }

    const updateVisibleTopicCount = () => {
      const availableHeight = topicList.clientHeight;
      const rowPitch = MOBILE_TOPIC_ROW_HEIGHT + MOBILE_TOPIC_ROW_GAP;
      const count = Math.floor(
        (availableHeight + MOBILE_TOPIC_ROW_GAP) / rowPitch,
      );

      setVisibleTopicCount(Math.max(0, count));
    };

    updateVisibleTopicCount();

    const resizeObserver = new ResizeObserver(updateVisibleTopicCount);
    resizeObserver.observe(topicList);

    return () => resizeObserver.disconnect();
  }, []);

  const isLoading = status === "idle" || status === "loading";
  const visibleTopics = topics.slice(0, visibleTopicCount);

  return (
    <section
      className="mt-4 flex min-h-0 flex-1 flex-col border-t border-gray-100 pb-2 pt-4"
      aria-labelledby="mobile-hot-topics-heading"
    >
      <div className="flex shrink-0 items-center justify-between px-1 pb-2">
        <h2
          id="mobile-hot-topics-heading"
          className="text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          热门话题
        </h2>

        {isLoading && (
          <LoaderCircle
            className="h-4 w-4 animate-spin text-gray-300"
            aria-label="正在加载热门话题"
          />
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600"
            aria-label="重新加载热门话题"
            title="重新加载热门话题"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={topicListRef} className="min-h-0 flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: Math.min(visibleTopicCount, 3) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-xl bg-gray-100"
                />
              ),
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex h-11 items-center rounded-xl px-3 text-sm text-gray-400">
            暂时无法加载话题
          </div>
        )}

        {status === "success" && topics.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-400">暂时还没有话题</p>
        )}

        {status === "success" && visibleTopics.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                onClick={onTopicClick}
                className="flex h-11 shrink-0 items-center justify-between gap-2 rounded-xl px-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600"
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
        )}
      </div>
    </section>
  );
}
