import type { JSONContent } from "@tiptap/core";

export const MAX_RICH_TEXT_JSON_LENGTH = 1_000_000;

export type RichTextContentFormat = "RICH_TEXT" | "PLAIN_TEXT";

export interface RichTextHeading {
  id: string;
  depth: number;
  text: string;
  position?: number;
}

export interface RichTextDocumentPayload {
  format: RichTextContentFormat;
  document: JSONContent | null;
}

export const RICH_TEXT_LINE_HEIGHT_MIN = 1;
export const RICH_TEXT_LINE_HEIGHT_MAX = 3;
export const RICH_TEXT_LINE_HEIGHT_STEP = 0.05;
export const RICH_TEXT_LINE_HEIGHT_PRESETS = [1, 1.15, 1.5, 1.75, 2, 2.5, 3] as const;

export type RichTextLineHeight = number;

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "hardBreak",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
]);

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "textStyle",
  "highlight",
]);

const ALLOWED_IMAGE_ALIGNMENTS = new Set(["left", "center", "right"]);
const ALLOWED_TEXT_ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
const ALLOWED_FONT_SIZES = new Set(["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"]);
const SAFE_COLOR_PATTERN = /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)|[a-z]{1,24})$/i;

export function isAllowedRichTextLineHeight(value: unknown): value is RichTextLineHeight {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }

  if (value < RICH_TEXT_LINE_HEIGHT_MIN || value > RICH_TEXT_LINE_HEIGHT_MAX) {
    return false;
  }

  const rounded = Math.round(value * 100);
  return Math.abs(value * 100 - rounded) < 1e-9;
}

function getNodeSize(node: JSONContent): number {
  if (node.type === "text") {
    return node.text?.length ?? 0;
  }

  if (!node.content?.length) {
    return 1;
  }

  return 2 + node.content.reduce((size, child) => size + getNodeSize(child), 0);
}

function normalizeHeadingText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function slugifyHeading(value: string): string {
  const normalized = normalizeHeadingText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const slug = normalized
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function getTextFromNode(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  if (node.type === "image") {
    return node.attrs?.alt ? `[${String(node.attrs.alt)}]` : "";
  }

  if (!node.content?.length) {
    return "";
  }

  const separator = [
    "paragraph",
    "heading",
    "blockquote",
    "listItem",
    "taskItem",
    "codeBlock",
  ].includes(node.type ?? "")
    ? "\n"
    : "";

  return node.content.map(getTextFromNode).join("") + separator;
}

function findTextInNode(node: JSONContent): string {
  return normalizeHeadingText(getTextFromNode(node));
}

function validateColor(value: unknown): boolean {
  return typeof value === "string" && SAFE_COLOR_PATTERN.test(value.trim());
}

function validateNode(node: JSONContent, depth: number): boolean {
  if (!node || typeof node !== "object" || typeof node.type !== "string") {
    return false;
  }

  if (!ALLOWED_NODE_TYPES.has(node.type) || depth > 30) {
    return false;
  }

  if (
    node.attrs !== undefined
    && (!node.attrs || typeof node.attrs !== "object" || Array.isArray(node.attrs))
  ) {
    return false;
  }

  if (node.type === "text" && typeof node.text !== "string") {
    return false;
  }

  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 1);
    if (!Number.isInteger(level) || level < 1 || level > 4) {
      return false;
    }
  }

  if (
    ["paragraph", "heading"].includes(node.type)
    && node.attrs?.textAlign !== undefined
    && node.attrs.textAlign !== null
  ) {
    if (!ALLOWED_TEXT_ALIGNMENTS.has(String(node.attrs.textAlign))) {
      return false;
    }
  }

  if (["paragraph", "heading"].includes(node.type)) {
    const lineHeight = node.attrs?.lineHeight;
    if (lineHeight !== undefined && lineHeight !== null && !isAllowedRichTextLineHeight(lineHeight)) {
      return false;
    }
  }

  if (node.type === "image") {
    const src = node.attrs?.src;
    const alt = node.attrs?.alt;
    const title = node.attrs?.title;
    const width = node.attrs?.width;
    const align = node.attrs?.align;

    if (!isAllowedRichTextUrl(src, { kind: "image" })) {
      return false;
    }
    if (
      (alt !== null && alt !== undefined && (typeof alt !== "string" || alt.length > 200))
      || (title !== null && title !== undefined && (typeof title !== "string" || title.length > 200))
    ) {
      return false;
    }
    if (width !== null && width !== undefined && (!Number.isFinite(Number(width)) || Number(width) < 40 || Number(width) > 2400)) {
      return false;
    }
    if (align !== null && align !== undefined && !ALLOWED_IMAGE_ALIGNMENTS.has(String(align))) {
      return false;
    }
  }

  if (
    node.type === "codeBlock"
    && node.attrs?.language !== undefined
    && node.attrs.language !== null
    && typeof node.attrs.language !== "string"
  ) {
    return false;
  }

  if (node.marks) {
    if (!Array.isArray(node.marks)) {
      return false;
    }

    for (const mark of node.marks) {
      if (!mark || typeof mark.type !== "string" || !ALLOWED_MARK_TYPES.has(mark.type)) {
        return false;
      }

      if (
        mark.attrs !== undefined
        && (!mark.attrs || typeof mark.attrs !== "object" || Array.isArray(mark.attrs))
      ) {
        return false;
      }

      if (mark.type === "link" && !isAllowedRichTextUrl(mark.attrs?.href)) {
        return false;
      }

      if (mark.type === "textStyle") {
        const attrs = mark.attrs ?? {};
        if (attrs.fontSize !== null && attrs.fontSize !== undefined && !ALLOWED_FONT_SIZES.has(String(attrs.fontSize))) {
          return false;
        }
        if (attrs.color !== null && attrs.color !== undefined && !validateColor(attrs.color)) {
          return false;
        }
        if (attrs.fontFamily !== null && attrs.fontFamily !== undefined) {
          const family = String(attrs.fontFamily);
          if (!/^[a-zA-Z0-9 ,"'-]{1,80}$/.test(family)) {
            return false;
          }
        }
      }

      if (mark.type === "highlight" && mark.attrs?.color !== null && mark.attrs?.color !== undefined && !validateColor(mark.attrs.color)) {
        return false;
      }
    }
  }

  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) {
      return false;
    }

    return node.content.every((child) => validateNode(child, depth + 1));
  }

  return true;
}

export function createEmptyRichTextDocument(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

export function parseRichTextDocument(value: unknown): JSONContent | null {
  let candidate = value;

  if (typeof candidate === "string") {
    if (candidate.length > MAX_RICH_TEXT_JSON_LENGTH) {
      return null;
    }

    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }

  if (!candidate || typeof candidate !== "object" || (candidate as JSONContent).type !== "doc") {
    return null;
  }

  // JSON requests are parsed before validation, so also cap object inputs to
  // prevent oversized attributes from reaching the renderer or database.
  try {
    const serialized = JSON.stringify(candidate);
    if (!serialized || serialized.length > MAX_RICH_TEXT_JSON_LENGTH) {
      return null;
    }
  } catch {
    return null;
  }

  const document = candidate as JSONContent;
  return validateNode(document, 0) ? document : null;
}

export function serializeRichTextDocument(document: JSONContent): string {
  const serialized = JSON.stringify(document);
  if (serialized.length > MAX_RICH_TEXT_JSON_LENGTH) {
    throw new Error("Rich text content is too large");
  }
  return serialized;
}

export function getRichTextPlainText(document: JSONContent | null | undefined): string {
  if (!document) {
    return "";
  }

  return getTextFromNode(document).replace(/\n{3,}/g, "\n\n").trim();
}

export function hasRichTextContent(document: JSONContent | null | undefined): boolean {
  if (!document) {
    return false;
  }

  let hasContent = false;
  const visit = (node: JSONContent) => {
    if (hasContent) {
      return;
    }

    if (node.type === "text" && node.text?.trim()) {
      hasContent = true;
      return;
    }

    if (node.type === "image") {
      hasContent = true;
      return;
    }

    node.content?.forEach(visit);
  };

  visit(document);
  return hasContent;
}

export function getRichTextSummary(document: JSONContent | null | undefined, maxLength = 180): string {
  const text = getRichTextPlainText(document).replace(/\s+/g, " ");
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

interface RichTextSummaryPart {
  markdown: string;
  text: string;
  isMention: boolean;
}

interface RichTextSummaryOptions {
  preserveLineBreaks?: boolean;
}

function normalizeSummaryWhitespace(value: string, preserveLineBreaks: boolean): string {
  const normalizedValue = value.replace(/\r\n?/g, "\n");

  if (!preserveLineBreaks) {
    return normalizedValue.replace(/\s+/g, " ");
  }

  return normalizedValue
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function escapeSummaryMarkdownText(value: string): string {
  return value.replace(/[\\`*_\[\]~]/g, "\\$&");
}

function getRichTextSummaryParts(node: JSONContent): RichTextSummaryPart[] {
  if (node.type === "text") {
    const text = node.text ?? "";
    const mentionLink = node.marks?.find((mark) => (
      mark.type === "link"
      && typeof mark.attrs?.href === "string"
      && /^\/user\/[^/?#]+(?:[/?#]|$)/.test(mark.attrs.href)
    ));

    if (mentionLink && typeof mentionLink.attrs?.href === "string") {
      return [{
        markdown: `[${escapeSummaryMarkdownText(text)}](${mentionLink.attrs.href})`,
        text,
        isMention: true,
      }];
    }

    return [{
      markdown: escapeSummaryMarkdownText(text),
      text,
      isMention: false,
    }];
  }

  if (node.type === "hardBreak") {
    return [{ markdown: "\n", text: "\n", isMention: false }];
  }

  if (node.type === "image") {
    const text = node.attrs?.alt ? `[${String(node.attrs.alt)}]` : "";
    return [{
      markdown: escapeSummaryMarkdownText(text),
      text,
      isMention: false,
    }];
  }

  const parts = (node.content ?? []).flatMap(getRichTextSummaryParts);
  if ([
    "paragraph",
    "heading",
    "blockquote",
    "listItem",
    "taskItem",
    "codeBlock",
  ].includes(node.type ?? "")) {
    parts.push({ markdown: "\n", text: "\n", isMention: false });
  }

  return parts;
}

export function getRichTextSummaryWithMentions(
  document: JSONContent | null | undefined,
  maxLength = 180,
  options: RichTextSummaryOptions = {},
): string {
  if (!document) {
    return "";
  }

  const preserveLineBreaks = options.preserveLineBreaks === true;
  const parts = getRichTextSummaryParts(document);
  const fullText = normalizeSummaryWhitespace(
    parts.map((part) => part.text).join(""),
    preserveLineBreaks,
  ).trim();
  if (!fullText) {
    return "";
  }

  const fullMarkdown = normalizeSummaryWhitespace(
    parts.map((part) => part.markdown).join(""),
    preserveLineBreaks,
  ).trim();
  if (fullText.length <= maxLength) {
    return fullMarkdown;
  }

  let output = "";
  let visibleLength = 0;

  for (const part of parts) {
    const normalizedText = normalizeSummaryWhitespace(part.text, preserveLineBreaks);
    const trimLeadingWhitespace = output.length === 0
      || output.endsWith(" ")
      || (preserveLineBreaks && output.endsWith("\n"));
    const text = trimLeadingWhitespace
      ? normalizedText.replace(/^[ \t]+/, "")
      : normalizedText;

    if (!text) {
      continue;
    }

    const remaining = maxLength - visibleLength;
    if (remaining <= 0) {
      break;
    }

    if (text.length <= remaining) {
      output += part.isMention ? part.markdown : escapeSummaryMarkdownText(text);
      visibleLength += text.length;
      continue;
    }

    if (part.isMention) {
      output += part.markdown;
    } else {
      output += escapeSummaryMarkdownText(text.slice(0, remaining));
    }
    break;
  }

  return `${output.trim()}...`;
}

export function extractRichTextHeadings(
  document: JSONContent | null | undefined,
  options?: { includeEmpty?: boolean },
): RichTextHeading[] {
  if (!document) {
    return [];
  }

  const counts = new Map<string, number>();
  const headings: RichTextHeading[] = [];

  const visit = (node: JSONContent, position: number) => {
    if (node.type === "heading") {
      const text = findTextInNode(node);
      if (text || options?.includeEmpty) {
        const baseId = text ? slugifyHeading(text) : "";
        const count = counts.get(baseId) ?? 0;
        counts.set(baseId, count + 1);
        headings.push({
          id: text ? (count === 0 ? baseId : `${baseId}-${count}`) : "",
          depth: Number(node.attrs?.level ?? 1),
          text,
          position: position + 1,
        });
      }
    }

    let childPosition = position + (node.type === "doc" ? 0 : 1);
    for (const child of node.content ?? []) {
      visit(child, childPosition);
      childPosition += getNodeSize(child);
    }
  };

  visit(document, 0);
  return headings;
}

export function isAllowedRichTextUrl(
  value: unknown,
  options?: { kind?: "link" | "image" },
): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return false;
  }

  if (value.startsWith("/")) {
    if (options?.kind === "image") {
      return false;
    }
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    if (url.protocol === "mailto:") {
      if (options?.kind === "image") {
        return false;
      }

      const address = value.slice(value.indexOf(":") + 1).split("?", 1)[0];
      return /^[^\s@]+@[^\s@]+$/.test(address);
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    if (options?.kind === "image") {
      const configuredCdn = process.env.NEXT_PUBLIC_CDN_DOMAIN;
      if (configuredCdn) {
        try {
          const configuredUrl = new URL(configuredCdn);
          if (url.hostname !== configuredUrl.hostname) {
            return false;
          }
        } catch {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function plainTextToRichTextDocument(value: string): JSONContent {
  const paragraphs = value
    .split(/\r?\n/)
    .map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : undefined,
    }));

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
  };
}
