/**
 * 目录生成工具 - 基于 Catalog-generation 的提取逻辑
 * 原逻辑：自动扫描文章内的 h1-h6 标题，生成目录并实现滚动高亮
 */

export interface CatalogItem {
  id: string;
  text: string;
  level: number; // 1-6
}

export interface CatalogGeneratorOptions {
  scrollOffset?: number; // 滚动偏移量，默认 60
  smoothScroll?: boolean; // 是否平滑滚动，默认 true
}

/**
 * 创建目录生成器类
 */
export class CatalogGenerator {
  private articleSelector: string;
  private catalogContainer: HTMLElement | null = null;
  private items: CatalogItem[] = [];
  private scrollOffset: number;
  private smoothScroll: boolean;
  private headings: HTMLElement[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  constructor(
    articleSelector: string,
    options: CatalogGeneratorOptions = {}
  ) {
    this.articleSelector = articleSelector;
    this.scrollOffset = options.scrollOffset ?? 60;
    this.smoothScroll = options.smoothScroll ?? true;
  }

  /**
   * 初始化目录
   */
  init(): CatalogItem[] {
    const article = document.querySelector(this.articleSelector);
    if (!article) {
      console.warn(`[CatalogGenerator] 未找到文章容器: ${this.articleSelector}`);
      return [];
    }

    // 获取所有标题
    this.headings = Array.from(
      article.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );

    // 提取标题信息
    this.items = this.headings.map((heading, index) => {
      const level = parseInt(heading.tagName.replace('H', ''), 10);
      const text = heading.innerText.trim();
      let id = heading.id;

      // 如果没有 ID，自动生成
      if (!id) {
        id = `section-${index + 1}`;
        heading.id = id;
      }

      return { id, text, level };
    });

    return this.items;
  }

  /**
   * 渲染目录到指定容器
   */
  render(container: HTMLElement): void {
    this.catalogContainer = container;
    container.innerHTML = '';

    this.items.forEach((item) => {
      const paddingLeft = 5 + (item.level - 1) * 5; // 5px 起始，每级增加 5px

      const catalogItem = document.createElement('div');
      catalogItem.className = `catalog-item catalog-level-${item.level}`;
      catalogItem.setAttribute('data-catalog-id', item.id);
      catalogItem.innerHTML = `<a href="#${item.id}" style="padding-left: ${paddingLeft}px;">${item.text}</a>`;

      container.appendChild(catalogItem);
    });
  }

  /**
   * 启动滚动监听
   */
  startScrollTracking(
    onActiveChange?: (activeId: string | null) => void
  ): () => void {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      let currentHeading: HTMLElement | null = null;

      // 从后往前找，找到当前正在阅读的章节标题
      for (let i = this.headings.length - 1; i >= 0; i--) {
        const heading = this.headings[i];
        const headingOffset = heading.offsetTop;

        if (headingOffset <= currentScroll + this.scrollOffset) {
          currentHeading = heading;
          break;
        }
      }

      const anchorName = currentHeading?.id ?? '';
      this.updateActive(anchorName);

      if (onActiveChange) {
        onActiveChange(anchorName || null);
      }
    };

    // 初始化高亮
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 返回清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }

  /**
   * 更新当前高亮的目录项
   */
  private updateActive(anchorId: string): void {
    if (!this.catalogContainer) return;

    // 移除所有激活状态
    this.catalogContainer.querySelectorAll('.catalog-active').forEach((item) => {
      item.classList.remove('catalog-active');
    });

    if (!anchorId) return;

    // 添加激活状态
    const activeItem = this.catalogContainer.querySelector(
      `[data-catalog-id="${anchorId}"]`
    );

    if (activeItem) {
      activeItem.classList.add('catalog-active');

      // 滚动目录容器，使当前章节可见
      this.catalogContainer.scrollTop =
        (activeItem as HTMLElement).offsetTop - this.catalogContainer.offsetTop;
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  /**
   * 获取目录项
   */
  getItems(): CatalogItem[] {
    return this.items;
  }
}

/**
 * 简单的目录生成函数（兼容原函数的用法）
 */
export function generateCatalog(
  articleSelector: string,
  dirSelector: string,
  options?: CatalogGeneratorOptions
): void {
  const article = document.querySelector(articleSelector);
  const catalogs = document.querySelector(dirSelector);

  if (!article || !catalogs) {
    console.warn('[generateCatalog] 未找到文章容器或目录容器');
    return;
  }

  const generator = new CatalogGenerator(articleSelector, options);
  const items = generator.init();

  if (items.length === 0) {
    return;
  }

  generator.render(catalogs as HTMLElement);
  generator.startScrollTracking();
}

/**
 * 从 HTML 元素中提取标题信息
 */
export function extractHeadingsFromHTML(
  html: string
): CatalogItem[] {
  const div = document.createElement('div');
  div.innerHTML = html;

  const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const items: CatalogItem[] = [];

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.replace('H', ''), 10);
    const text = heading.textContent?.trim() || '';

    if (text) {
      items.push({
        id: heading.id || `section-${index + 1}`,
        text,
        level,
      });
    }
  });

  return items;
}

/**
 * 计算标题的左边距
 */
export function calculateHeadingPadding(level: number, basePadding = 5): number {
  return basePadding + (level - 1) * basePadding;
}

/**
 * 从 MarkdownHeading 数组转换为 CatalogItem 数组
 */
export function markdownHeadingsToCatalogItems(
  headings: Array<{ depth: number; text: string; id: string }>
): CatalogItem[] {
  return headings.map((heading) => ({
    id: heading.id,
    text: heading.text,
    level: heading.depth,
  }));
}
