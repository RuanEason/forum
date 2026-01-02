/**
 * Markdown 工具函数
 */

export interface Heading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

/**
 * 将文本转换为 URL 友好的 slug（与 rehype-slug 保持一致）
 * @param text 标题文本
 * @returns slug 字符串
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 保留中文字符、字母、数字
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    // 将空格和连续的空白替换为连字符
    .replace(/[\s_]+/g, '-')
    // 移除开头和结尾的连字符
    .replace(/^-+|-+$/g, '');
}

/**
 * 从 Markdown 文本中提取 H1-H3 标题
 * @param markdown Markdown 原始文本
 * @returns 标题数组
 */
export function extractHeadings(markdown: string): Heading[] {
  if (!markdown) return [];

  const headings: Heading[] = [];
  
  // 先移除代码块内容，避免误匹配代码块中的 # 符号
  // 处理 ``` 代码块
  const withoutFencedCode = markdown.replace(/```[\s\S]*?```/g, '');
  // 处理缩进代码块（4个空格或1个tab开头）
  const withoutIndentedCode = withoutFencedCode.replace(/^(?: {4}|\t).+$/gm, '');
  
  // 匹配 ATX 风格标题（# 开头）
  const headingRegex = /^(#{1,3})\s+(.+?)(?:\s+#+)?$/gm;
  
  let match;
  const idCounts = new Map<string, number>(); // 用于处理重复 ID
  
  while ((match = headingRegex.exec(withoutIndentedCode)) !== null) {
    const level = match[1].length as 1 | 2 | 3;
    const text = match[2].trim();
    
    // 生成基础 ID
    let id = slugify(text);
    
    // 处理空 ID 的情况
    if (!id) {
      id = 'heading';
    }
    
    // 处理重复 ID：添加后缀 -1, -2, etc.
    const count = idCounts.get(id) || 0;
    if (count > 0) {
      id = `${id}-${count}`;
    }
    idCounts.set(id.replace(/-\d+$/, ''), count + 1);
    
    headings.push({ id, text, level });
  }
  
  return headings;
}

/**
 * 检查内容是否包含有效的标题（用于判断是否显示 TOC）
 * @param markdown Markdown 原始文本
 * @returns 是否包含标题
 */
export function hasHeadings(markdown: string): boolean {
  const headings = extractHeadings(markdown);
  return headings.length > 0;
}
