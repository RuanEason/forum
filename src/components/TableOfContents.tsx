"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Heading } from "@/lib/markdown";

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(
    new Map()
  );

  // 设置 IntersectionObserver 来跟踪当前可见的标题
  useEffect(() => {
    if (headings.length === 0) return;

    // 清理之前的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    headingElementsRef.current = new Map();

    const callback = (entries: IntersectionObserverEntry[]) => {
      // 更新 headingElementsRef
      entries.forEach((entry) => {
        headingElementsRef.current.set(entry.target.id, entry);
      });

      // 找到当前可见的标题
      const visibleHeadings: IntersectionObserverEntry[] = [];
      headingElementsRef.current.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleHeadings.push(entry);
        }
      });

      // 如果有可见的标题，选择最靠近顶部的一个
      if (visibleHeadings.length > 0) {
        // 按照在视口中的位置排序，选择最靠近顶部的
        const sortedHeadings = visibleHeadings.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        setActiveId(sortedHeadings[0].target.id);
      }
    };

    // 创建 observer，rootMargin 设置为顶部偏移，考虑固定导航栏
    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: [0, 1],
    });

    // 观察所有标题元素
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  // 点击标题时平滑滚动
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        // 计算偏移量，考虑固定导航栏高度
        const navbarHeight = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });

        // 更新 URL hash（不触发跳转）
        history.pushState(null, "", `#${id}`);
        setActiveId(id);
      }
    },
    []
  );

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="toc-container" aria-label="目录">
      <div className="toc-header">
        <svg
          className="toc-icon"
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
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span>目录</span>
      </div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`toc-item toc-level-${heading.level}`}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`toc-link ${
                activeId === heading.id ? "toc-link-active" : ""
              }`}
              title={heading.text}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
