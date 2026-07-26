export const MAX_IMPORTED_MARKDOWN_LENGTH = 10000;

export type MarkdownImportResult = {
  content: string;
  wasTruncated: boolean;
};

export function parseMarkdownImport(fileName: string, rawContent: string): MarkdownImportResult {
  if (!/\.(?:md|markdown)$/i.test(fileName)) {
    throw new Error("请选择 .md 或 .markdown 文件");
  }

  const normalizedContent = rawContent
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

  if (!normalizedContent.trim()) {
    throw new Error("Markdown 文件为空");
  }

  return {
    content: normalizedContent.slice(0, MAX_IMPORTED_MARKDOWN_LENGTH),
    wasTruncated: normalizedContent.length > MAX_IMPORTED_MARKDOWN_LENGTH,
  };
}
