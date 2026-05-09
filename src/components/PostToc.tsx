"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListTree } from "lucide-react";
import type { MarkdownHeading } from "@/lib/markdown";

interface PostTocProps {
  headings: MarkdownHeading[];
}

const SCROLL_OFFSET = 120;

export default function PostToc({ headings }: PostTocProps) {
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>(headingIds[0] ?? "");
  const tocContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const updateActiveHeading = () => {
      const currentScroll = window.scrollY + SCROLL_OFFSET;
      let nextActiveId = headingIds[0];

      for (const id of headingIds) {
        const element = document.getElementById(id);
        if (!element) {
          continue;
        }

        if (element.offsetTop <= currentScroll) {
          nextActiveId = id;
        } else {
          break;
        }
      }

      setActiveHeadingId((previousId) =>
        previousId === nextActiveId ? previousId : nextActiveId
      );
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [headingIds]);

  useEffect(() => {
    if (!activeHeadingId) {
      return;
    }

    if (!window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const tocContainer = tocContainerRef.current;
    if (!tocContainer || tocContainer.scrollHeight <= tocContainer.clientHeight) {
      return;
    }

    const activeElement = tocContainer.querySelector<HTMLElement>(
      `[data-toc-id="${activeHeadingId}"]`
    );

    if (!activeElement || activeElement.offsetParent === null) {
      return;
    }

    const containerRect = tocContainer.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    const isAbove = activeRect.top < containerRect.top;
    const isBelow = activeRect.bottom > containerRect.bottom;

    if (!isAbove && !isBelow) {
      return;
    }

    const nextTop =
      tocContainer.scrollTop +
      (activeRect.top - containerRect.top) -
      tocContainer.clientHeight / 2 +
      activeRect.height / 2;

    tocContainer.scrollTo({
      top: Math.max(0, nextTop),
      behavior: "smooth",
    });
  }, [activeHeadingId]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="post-sidebar" aria-label="文章目录">
      <div className="sidebar-content">
        <div ref={tocContainerRef} className="toc-container sidebar-panel">
          <div className="toc-header">
            <ListTree className="w-4 h-4 toc-icon" />
            <span>文章导航</span>
          </div>

          <ol className="toc-list">
            {headings.map((heading) => {
              const level = Math.min(Math.max(heading.depth, 1), 3);
              const isActive = activeHeadingId === heading.id;

              return (
                <li
                  key={`${heading.id}-${heading.depth}`}
                  className={`toc-item toc-level-${level}`}
                >
                  <a
                    href={`#${heading.id}`}
                    data-toc-id={heading.id}
                    className={`toc-link${isActive ? " toc-link-active" : ""}`}
                    onClick={() => setActiveHeadingId(heading.id)}
                    title={heading.text}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </aside>
  );
}
