import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownForDisplay } from "@/lib/markdown";
import { createMarkdownComponents } from "@/lib/markdown-components";
import { buildScopedPostStyleSheet } from "@/lib/post-style";
import type { PostStyleConfig } from "@/types/post-style";

interface PostContentRendererProps {
  postId: string;
  title: string | null;
  content: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
  withHeadingIds?: boolean;
  headingDataAttributeName?: string;
}

export default function PostContentRenderer({
  postId,
  title,
  content,
  styleConfig: _styleConfig = null,
  styleCss: _styleCss = null,
  withHeadingIds = false,
  headingDataAttributeName,
}: PostContentRendererProps) {
  const scopeId = `post-${postId}`;
  void _styleConfig;
  const markdownComponents = createMarkdownComponents({
    withHeadingIds,
    headingDataAttributeName,
  });
  const normalizedContent = normalizeMarkdownForDisplay(content);
  const scopedCss = buildScopedPostStyleSheet({
    scopeId,
    styleConfig: null,
    styleCss: _styleCss,
  });

  return (
    <div data-style-scope={scopeId}>
      {scopedCss ? <style>{scopedCss}</style> : null}
      <div className="editor-style-card">
        {title ? (
          <div className="mb-4">
            <h1 className="editor-style-title text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
        ) : null}
        <div className="editor-style-body prose prose-sm sm:prose-base max-w-none break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={markdownComponents}
          >
            {normalizedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
