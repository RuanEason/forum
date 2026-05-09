"use client";

import { useEffect, useRef, useState } from "react";
import { ListTree } from "lucide-react";
import type { CatalogItem, CatalogGenerator } from "@/lib/catalog";

interface ArticleCatalogProps {
  items: CatalogItem[];
  articleSelector?: string;
  scrollOffset?: number;
}

const SCROLL_OFFSET = 120;

export default function ArticleCatalog({
  items,
  articleSelector = ".prose",
  scrollOffset = SCROLL_OFFSET,
}: ArticleCatalogProps) {
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
    if (!activeId || !catalogRef.current) return;

    const activeElement = itemRefs.current.get(activeId);
    if (!activeElement) return;

    const container = catalogRef.current;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    const isAbove = activeRect.top < containerRect.top + 60; // 60 是头部高度
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
  }, [activeId]);

  if (items.length === 0) return null;

  return (
    <aside className="post-sidebar" aria-label="文章目录">
      <div className="sidebar-content">
        <div ref={catalogRef} className="toc-container sidebar-panel">
          <div className="toc-header">
            <ListTree className="w-4 h-4 toc-icon" />
            <span>文章导航</span>
          </div>

          <div className="catalog-list">
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
                    onClick={(e) => {
                      setActiveId(item.id);
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
    </aside>
  );
}
