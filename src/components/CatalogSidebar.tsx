"use client";

import { useEffect, useRef } from "react";
import { ListTree } from "lucide-react";
import PostAttachments, {
  type PostAttachmentItem,
} from "@/components/PostAttachments";
import { usePostToc } from "@/components/PostTocLayout";

interface CatalogItem {
  id: string;
  text: string;
  level: number;
}

interface CatalogSidebarPropsNew {
  items: CatalogItem[];
  title?: string;
  attachments?: PostAttachmentItem[];
  postId?: string;
  authorId?: string;
}

export default function CatalogSidebar({
  items,
  title = "目录",
  attachments = [],
  postId,
  authorId,
}: CatalogSidebarPropsNew) {
  const dirRef = useRef<HTMLDivElement>(null);
  const hasAttachments = attachments.length > 0 && Boolean(postId && authorId);
  const { isOpen, toggle } = usePostToc();

  useEffect(() => {
    const article = document.querySelector('.prose');
    const dir = dirRef.current;
    if (!article || !dir) return;

    // 获取所有标题元素
    const articleHeadings = Array.from(
      article.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    );

    if (articleHeadings.length === 0) return;

    // 监听滚动事件，自动更新目录高亮
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      let currentHeading: HTMLElement | null = null;

      // 找到当前正在阅读的章节标题
      for (let i = articleHeadings.length - 1; i >= 0; i--) {
        const heading = articleHeadings[i];
        const headingOffset = heading.offsetTop;
        if (headingOffset <= currentScroll + 100) {
          currentHeading = heading;
          break;
        }
      }

      // 更新目录高亮
      const anchorName = currentHeading ? currentHeading.id : '';
      const activeCatalog = Array.from(
        dir.querySelectorAll<HTMLElement>('.catalog')
      ).find((item) => item.dataset.anchor === anchorName);
      if (activeCatalog) {
        // 移除所有已激活的目录条目的激活状态
        dir.querySelectorAll('.catalog-active').forEach(function(item) {
          item.classList.remove('catalog-active');
        });
        // 将当前活动的目录条目添加激活状态
        activeCatalog.classList.add('catalog-active');

        // 滚动目录，使当前章节可见
        const dirRect = dir.getBoundingClientRect();
        const activeRect = (activeCatalog as HTMLElement).getBoundingClientRect();
        const targetScroll = dir.scrollTop + activeRect.top - dirRect.top - 50;

        // 平滑滚动到目标位置
        if (targetScroll >= 0 && targetScroll <= dir.scrollHeight - dir.clientHeight) {
          dir.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    };

    // 初始化高亮
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [items]);

  if (items.length === 0 && !hasAttachments) return null;

  return (
    <aside className="catalog-sidebar">
      <div className="catalog-sidebar-inner">
        <div className="catalog-sidebar-title">
          <button
            type="button"
            onClick={toggle}
            className="catalog-sidebar-toggle"
            aria-label={isOpen ? "收起目录" : "打开目录"}
            aria-expanded={isOpen}
            title={isOpen ? "收起目录" : "打开目录"}
          >
            <ListTree className="catalog-sidebar-toggle-icon" aria-hidden="true" />
          </button>
          {title}
        </div>
        <div className="catalog-hr"></div>
      </div>
      <div ref={dirRef} className="catalog-dir">
        {items.map((item) => {
          const paddingLeft = 0.5 + (item.level - 1) * 0.75;

          return (
            <div
              key={item.id}
              className="catalog"
              data-anchor={item.id}
              style={{ paddingLeft: `${paddingLeft}rem` }}
            >
              <a href={`#${item.id}`}>
                {item.text}
              </a>
            </div>
          );
        })}
      </div>
      {hasAttachments && (
        <div className="hidden lg:block">
          <PostAttachments
            attachments={attachments}
            postId={postId!}
            authorId={authorId!}
            variant="sidebar"
          />
        </div>
      )}
    </aside>
  );
}
