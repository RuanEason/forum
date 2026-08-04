import {
  extractRichTextHeadings,
  getRichTextPlainText,
  parseRichTextDocument,
} from "@/lib/rich-text/content";
import type {
  DraftHistoryGroup,
  EditorDraftSummary,
  EditorOutlineItem,
  SaveState,
} from "@/components/editor/types";

export function formatEditorTime(dateText: string | null | undefined): string {
  if (!dateText) {
    return "--:--:--";
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString("zh-CN", {
    hour12: false,
  });
}

export function formatEditorDateTime(dateText: string | null | undefined): string {
  if (!dateText) {
    return "";
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function looksLikeRichTextDocument(value: string): boolean {
  return Boolean(
    parseRichTextDocument(value)
    || /^\{\s*["']type["']\s*:\s*["']doc["']/.test(value),
  );
}

export function normalizeDraftTitle(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed && !looksLikeRichTextDocument(trimmed) ? trimmed : "";
}

export function getDraftDisplayTitle(
  draft: Pick<EditorDraftSummary, "title" | "content"> & { contentSummary?: string },
): string {
  const trimmedTitle = normalizeDraftTitle(draft.title);
  if (trimmedTitle) {
    return trimmedTitle;
  }

  const contentDocument = parseRichTextDocument(draft.content);
  const contentText = contentDocument ? getRichTextPlainText(contentDocument) : draft.content;
  const summary = draft.contentSummary?.trim();
  const fallbackContent = summary && !looksLikeRichTextDocument(summary) ? summary : contentText;
  const firstMeaningfulLine = fallbackContent
    .replace(/<[^>]*>/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstMeaningfulLine) {
    return "未命名文档";
  }

  return firstMeaningfulLine.replace(/^#+\s*/, "").slice(0, 30) || "未命名文档";
}

export function getDraftSummaryText(content: string): string {
  const document = parseRichTextDocument(content);
  const source = document ? getRichTextPlainText(document) : content;
  const normalized = source.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 80) : "暂无内容";
}

export function getSaveStateLabel(state: SaveState, errorMessage?: string): string {
  switch (state) {
    case "saving":
      return "正在保存";
    case "saved":
      return "已保存";
    case "error":
      return errorMessage || "保存失败";
    default:
      return "未保存";
  }
}

export function groupDraftsByDate(drafts: EditorDraftSummary[]): DraftHistoryGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;

  const today: EditorDraftSummary[] = [];
  const recent: EditorDraftSummary[] = [];
  const older: EditorDraftSummary[] = [];

  for (const draft of drafts) {
    const updatedAt = new Date(draft.updatedAt).getTime();
    if (Number.isNaN(updatedAt)) {
      older.push(draft);
      continue;
    }

    if (updatedAt >= startOfToday) {
      today.push(draft);
      continue;
    }

    if (updatedAt >= sevenDaysAgo) {
      recent.push(draft);
      continue;
    }

    older.push(draft);
  }

  return [
    { label: "今天", items: today },
    { label: "近 7 天", items: recent },
    { label: "更早", items: older },
  ].filter((group) => group.items.length > 0);
}

export function buildOutlineItems(content: string): EditorOutlineItem[] {
  const document = parseRichTextDocument(content);
  if (!document) {
    return [];
  }

  const headings = extractRichTextHeadings(document);

  return headings.map((heading) => ({
    id: heading.id,
    depth: heading.depth,
    text: heading.text,
    position: heading.position ?? 1,
  }));
}
