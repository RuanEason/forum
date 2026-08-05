import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownForDisplay } from "@/lib/markdown";
import { createMarkdownComponents } from "@/lib/markdown-components";
import { buildScopedPostStyleSheet } from "@/lib/post-style";
import type { PostStyleConfig } from "@/types/post-style";
import { parseRichTextDocument } from "@/lib/rich-text/content";
import { renderRichTextHtml } from "@/lib/rich-text/server";
import PostContentImagePreview from "@/components/PostContentImagePreview";

interface PostContentRendererProps {
  postId: string;
  title: string | null;
  content: string;
  contentJson?: unknown;
  contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
  withHeadingIds?: boolean;
  headingDataAttributeName?: string;
  enableImagePreview?: boolean;
}

export default function PostContentRenderer({
  postId,
  title,
  content,
  contentJson,
  contentFormat,
  styleConfig: _styleConfig = null,
  styleCss: _styleCss = null,
  withHeadingIds = false,
  headingDataAttributeName,
  enableImagePreview = false,
}: PostContentRendererProps) {
  const scopeId = `post-${postId}`;
  void _styleConfig;
  const markdownComponents = createMarkdownComponents({
    withHeadingIds,
    headingDataAttributeName,
  });
  const normalizedContent = normalizeMarkdownForDisplay(content);
  const richTextDocument = contentFormat === "PLAIN_TEXT"
    ? null
    : parseRichTextDocument(contentJson ?? content);
  const richTextHtml = richTextDocument ? renderRichTextHtml(richTextDocument) : null;
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
          {enableImagePreview ? (
            <PostContentImagePreview>
              {richTextHtml ? (
                <div className="rich-text-prose" dangerouslySetInnerHTML={{ __html: richTextHtml }} />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={markdownComponents}
                >
                  {normalizedContent}
                </ReactMarkdown>
              )}
            </PostContentImagePreview>
          ) : richTextHtml ? (
            <div className="rich-text-prose" dangerouslySetInnerHTML={{ __html: richTextHtml }} />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={markdownComponents}
            >
              {normalizedContent}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
