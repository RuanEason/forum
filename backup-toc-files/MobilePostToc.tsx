"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListTree, X } from "lucide-react";
import type { MarkdownHeading } from "@/lib/markdown";

interface MobilePostTocProps {
  headings: MarkdownHeading[];
}

const SCROLL_OFFSET = 120;

export default function MobilePostToc({ headings }: MobilePostTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>(headingIds[0] ?? "");
  const tocContainerRef = useRef<HTMLOListElement>(null);

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
    if (!activeHeadingId || !isOpen) {
      return;
    }

    const tocContainer = tocContainerRef.current;
    if (!tocContainer || tocContainer.scrollHeight <= tocContainer.clientHeight) {
      return;
    }

    const activeElement = tocContainer.querySelector<HTMLElement>(
      `[data-mobile-toc-id="${activeHeadingId}"]`
    );
    if (!activeElement) {
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
  }, [activeHeadingId, isOpen]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed right-4 bottom-20 z-40 rounded-full shadow-lg bg-blue-600 text-white px-4 py-3 flex items-center gap-2"
        onClick={() => setIsOpen(true)}
        aria-label="打开文章目录"
      >
        <ListTree className="w-4 h-4" />
        <span className="text-sm font-medium">目录</span>
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/35"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute left-3 right-3 bottom-24 max-h-[65vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="文章目录"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <ListTree className="w-4 h-4" />
                <span>文章导航</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="关闭文章目录"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol
              ref={tocContainerRef}
              className="max-h-[calc(65vh-3.5rem)] overflow-y-auto py-2"
            >
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
                      data-mobile-toc-id={heading.id}
                      className={`toc-link${isActive ? " toc-link-active" : ""}`}
                      onClick={() => {
                        setActiveHeadingId(heading.id);
                        setIsOpen(false);
                      }}
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
      )}
    </>
  );
}
