"use client";

import PostContentRenderer from "@/components/PostContentRenderer";
import type { PostStyleConfig } from "@/types/post-style";

interface StyleCodeEditorProps {
  value: string;
  styleConfig?: PostStyleConfig | null;
  previewTitle?: string;
  previewContent?: string;
  previewPostId?: string;
  onChange: (value: string) => void;
}

export const DEFAULT_STYLE_TEMPLATE = `/* 标题样式 */
h1 {
}

h2 {
}

h3 {
}

h4 {
}

h5 {
}

h6 {
}

/* 段落和文本 */
p {
}

strong {
}

em {
}

/* 引用块 */
blockquote {
}

blockquote > p {
}

/* 代码 */
/* 行内代码 */
.codespan {
}

/* 代码块容器 */
pre.code__pre,
.hljs.code__pre {
}

/* 代码块内的 code */
pre.code__pre > code,
.hljs.code__pre > code {
}

/* 列表 */
ol {
}

ul {
}

li {
}

/* 表格 */
table {
}

thead {
}

th {
}

td {
}

/* 其他元素 */
img {
}

hr {
}

/* 分隔线变体：--- */
hr.hr-dash {
}

/* 分隔线变体：*** */
hr.hr-star {
}

/* 分隔线变体：___ */
hr.hr-underscore {
}

figure {
}

figcaption {
}

/* KaTeX 公式 */
.katex-inline {
}

.katex-block {
}
`;

export default function StyleCodeEditor({
  value,
  styleConfig = null,
  previewTitle = "",
  previewContent = "",
  previewPostId = "style-preview",
  onChange,
}: StyleCodeEditorProps) {
  return (
    <section className="flex min-w-0 min-h-0 flex-1 overflow-hidden bg-white">
      <div className="flex min-w-0 flex-1 flex-col border-r border-slate-200">
        <div className="border-b border-slate-200 bg-[#faf9f6] px-8 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            样式.css
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            模板里已经放好了常用规则骨架。想改哪个元素，就直接往对应花括号里写声明；不想改就保持为空。
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#f5f5f2] p-4">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="h-full min-h-[560px] w-full resize-none border border-slate-200 bg-[#fcfcfb] px-5 py-4 font-mono text-[14px] leading-7 text-slate-900 outline-none"
          />
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 overflow-y-auto bg-[#f8f8f6] xl:block">
        <div className="border-b border-slate-200 bg-[#faf9f6] px-8 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            实时预览
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            只要你在左边写了有效规则，右边就会立刻看到实际效果。
          </p>
        </div>
        <div className="p-6">
          <div className="border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <PostContentRenderer
              postId={previewPostId}
              title={previewTitle}
              content={previewContent}
              styleConfig={styleConfig}
              styleCss={value}
              withHeadingIds={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
