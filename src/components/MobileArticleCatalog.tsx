"use client";

import { useEffect, useRef, useState } from "react";
import { ListTree, X } from "lucide-react";
import type { CatalogItem } from "@/lib/catalog";

interface MobileArticleCatalogProps {
  items: CatalogItem[];
  scrollOffset?: number;
}

const SCROLL_OFFSET = 120;

export default function MobileArticleCatalog({
  items,
  scrollOffset = SCROLL_OFFSET,
}: MobileArticleCatalogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // 监听滚动事件，更新当前高亮项
  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const updateActiveHeading = () => {
      const currentScroll = window.scrollY + scrollOffset;
      let activeHeading: HTMLElement | null = null;

      // 从后往前找，找到当前正在阅读的章节标题
      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        const headingOffset = heading.offsetTop;

        if (headingOffset <= currentScroll) {
          activeHeading = heading;
          break;
        }
      }

      const anchorId = activeHeading?.id ?? null;
      setActiveId(anchorId);
    };

    // 初始化高亮
    updateActiveHeading();

    window.addEventListener("scroll", updateActiveHeading, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
    };
  }, [items, scrollOffset]);

  // 滚动目录容器，使当前激活项可见
  useEffect(() => {
    if (!activeId || !isOpen || !catalogRef.current) return;

    const activeElement = itemRefs.current.get(activeId);
    if (!activeElement) return;

    const container = catalogRef.current;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    const isAbove = activeRect.top < containerRect.top;
    const isBelow = activeRect.bottom > containerRect.bottom;

    if (!isAbove && !isBelow) return;

    const nextTop =
      container.scrollTop +
      (activeRect.top - containerRect.top) -
      container.clientHeight / 2 +
      activeRect.height / 2;

    container.scrollTo({
      top: Math.max(0, nextTop),
      behavior: "smooth",
    });
  }, [activeId, isOpen]);

  if (items.length === 0) return null;

  return (
    <>
      {/* 移端悬浮按钮 */}
      <button
        type="button"
        className="lg:hidden fixed right-4 bottom-20 z-40 rounded-full shadow-lg bg-blue-600 text-white px-4 py-3 flex items-center gap-2"
        onClick={() => setIsOpen(true)}
        aria-label="打开文章目录"
      >
        <ListTree className="w-4 h-4" />
        <span className="text-sm font-medium">目录</span>
      </button>

      {/* 移端目录弹窗 */}
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

            <div
              ref={catalogRef}
              className="max-h-[calc(65vh-3.5rem)] overflow-y-auto py-2"
            >
              {items.map((item) => {
                const isActive = activeId === item.id;
                const paddingLeft = 5 + (item.level - 1) * 5;

                return (
                  <div
                    key={item.id}
                    className={`catalog-item${
                      isActive ? " catalog-active" : ""
                    }`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                  >
                    <a
                      ref={(el) => {
                        if (el) itemRefs.current.set(item.id, el);
                      }}
                      href={`#${item.id}`}
                      className="catalog-link"
                      onClick={() => {
                        setActiveId(item.id);
                        setIsOpen(false);
                      }}
                      title={item.text}
                    >
                      {item.text}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
