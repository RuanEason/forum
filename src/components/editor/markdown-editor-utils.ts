export interface MarkdownSelection {
  start: number;
  end: number;
}

export interface MarkdownEditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export type MarkdownInlineFormat = "bold" | "italic" | "strike" | "code";
export type MarkdownBlockFormat =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote";

const INLINE_FORMATS: Record<MarkdownInlineFormat, {
  before: string;
  after: string;
  placeholder: string;
}> = {
  bold: { before: "**", after: "**", placeholder: "粗体文本" },
  italic: { before: "*", after: "*", placeholder: "斜体文本" },
  strike: { before: "~~", after: "~~", placeholder: "删除线文本" },
  code: { before: "`", after: "`", placeholder: "代码" },
};

function clampSelection(value: string, selection: MarkdownSelection): MarkdownSelection {
  const max = value.length;
  const start = Math.min(Math.max(selection.start, 0), max);
  const end = Math.min(Math.max(selection.end, start), max);
  return { start, end };
}

function createEdit(
  value: string,
  selection: MarkdownSelection,
  replacement: string,
  nextSelectionStart: number,
  nextSelectionEnd: number,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const nextValue = `${value.slice(0, safeSelection.start)}${replacement}${value.slice(safeSelection.end)}`;

  return {
    value: nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionEnd,
  };
}

export function applyInlineFormat(
  value: string,
  selection: MarkdownSelection,
  format: MarkdownInlineFormat,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const config = INLINE_FORMATS[format];
  const selectedText = value.slice(safeSelection.start, safeSelection.end);

  if (
    selectedText.length >= config.before.length + config.after.length
    && selectedText.startsWith(config.before)
    && selectedText.endsWith(config.after)
  ) {
    const unwrapped = selectedText.slice(
      config.before.length,
      selectedText.length - config.after.length,
    );

    return createEdit(
      value,
      safeSelection,
      unwrapped,
      safeSelection.start,
      safeSelection.start + unwrapped.length,
    );
  }

  const hasSurroundingMarkers = safeSelection.start >= config.before.length
    && value.slice(
      safeSelection.start - config.before.length,
      safeSelection.start,
    ) === config.before
    && value.slice(
      safeSelection.end,
      safeSelection.end + config.after.length,
    ) === config.after;

  if (selectedText && hasSurroundingMarkers) {
    const wrappedSelection = {
      start: safeSelection.start - config.before.length,
      end: safeSelection.end + config.after.length,
    };

    return createEdit(
      value,
      wrappedSelection,
      selectedText,
      wrappedSelection.start,
      wrappedSelection.start + selectedText.length,
    );
  }

  const text = selectedText || config.placeholder;
  const replacement = `${config.before}${text}${config.after}`;
  const textStart = safeSelection.start + config.before.length;

  return createEdit(
    value,
    safeSelection,
    replacement,
    textStart,
    textStart + text.length,
  );
}

export function insertText(
  value: string,
  selection: MarkdownSelection,
  text: string,
  selectInsertedText = false,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const insertedEnd = safeSelection.start + text.length;
  const selectionStart = selectInsertedText ? safeSelection.start : insertedEnd;
  const selectionEnd = insertedEnd;

  return createEdit(
    value,
    safeSelection,
    text,
    selectionStart,
    selectionEnd,
  );
}

export function applyLink(
  value: string,
  selection: MarkdownSelection,
  label: string,
  url: string,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const safeLabel = label.trim() || "链接文字";
  const replacement = `[${safeLabel}](${url.trim()})`;
  const labelStart = safeSelection.start + 1;

  return createEdit(
    value,
    safeSelection,
    replacement,
    labelStart,
    labelStart + safeLabel.length,
  );
}

export function removeLink(
  value: string,
  selection: MarkdownSelection,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const selectedText = value.slice(safeSelection.start, safeSelection.end);
  const fullLinkMatch = selectedText.match(/^\[([^\]]+)\]\([^)]*\)$/);

  if (fullLinkMatch) {
    const label = fullLinkMatch[1];
    return createEdit(
      value,
      safeSelection,
      label,
      safeSelection.start,
      safeSelection.start + label.length,
    );
  }

  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch: RegExpExecArray | null = null;
  let matchedStart = -1;

  for (const match of value.matchAll(linkPattern)) {
    const linkStart = match.index ?? -1;
    const linkEnd = linkStart + match[0].length;
    if (linkStart >= 0 && safeSelection.start >= linkStart && safeSelection.end <= linkEnd) {
      linkMatch = match;
      matchedStart = linkStart;
      break;
    }
  }

  if (!linkMatch || matchedStart < 0) {
    return {
      value,
      selectionStart: safeSelection.start,
      selectionEnd: safeSelection.end,
    };
  }

  const linkStart = matchedStart;
  const label = linkMatch[1] ?? linkMatch[0];

  return createEdit(
    value,
    { start: linkStart, end: linkStart + linkMatch[0].length },
    label,
    linkStart,
    linkStart + label.length,
  );
}

export function normalizeMarkdownUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\r\n\s]/.test(trimmed)) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function getLineBounds(value: string, selection: MarkdownSelection) {
  const safeSelection = clampSelection(value, selection);
  const lineStart = value.lastIndexOf("\n", Math.max(0, safeSelection.start - 1)) + 1;
  const endProbe = safeSelection.end > safeSelection.start && value[safeSelection.end - 1] === "\n"
    ? safeSelection.end - 1
    : safeSelection.end;
  const lineBreak = value.indexOf("\n", endProbe);
  const lineEnd = lineBreak === -1 ? value.length : lineBreak;

  return {
    selection: safeSelection,
    lineStart,
    lineEnd,
  };
}

function getLineMarkerLength(line: string, format: MarkdownBlockFormat) {
  switch (format) {
    case "paragraph":
      return line.match(/^\s*#{1,6}\s+/)?.[0].length ?? 0;
    case "heading1":
    case "heading2":
    case "heading3":
    case "heading4":
      return line.match(/^\s*#{1,6}\s+/)?.[0].length ?? 0;
    case "bulletList":
    case "orderedList":
    case "taskList":
      return line.match(/^\s*(?:(?:[-+*]\s+)(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/)?.[0].length ?? 0;
    case "blockquote":
      return line.match(/^\s*>\s?/)?.[0].length ?? 0;
    default:
      return 0;
  }
}

function getBlockPrefix(format: MarkdownBlockFormat, line: string) {
  const indent = line.match(/^\s*/)?.[0] ?? "";

  switch (format) {
    case "paragraph":
      return indent;
    case "heading1":
      return `${indent}# `;
    case "heading2":
      return `${indent}## `;
    case "heading3":
      return `${indent}### `;
    case "heading4":
      return `${indent}#### `;
    case "bulletList":
      return `${indent}- `;
    case "orderedList":
      return `${indent}1. `;
    case "taskList":
      return `${indent}- [ ] `;
    case "blockquote":
      return `${indent}> `;
    default:
      return indent;
  }
}

function stripBlockMarker(line: string, format: MarkdownBlockFormat) {
  const markerLength = getLineMarkerLength(line, format);
  return line.slice(markerLength);
}

function transformBlockLine(line: string, format: MarkdownBlockFormat, remove: boolean) {
  const content = stripBlockMarker(line, format);
  return remove ? content : `${getBlockPrefix(format, line)}${content}`;
}

function isTargetBlockLine(line: string, format: MarkdownBlockFormat) {
  switch (format) {
    case "paragraph":
      return /^\s*#{1,6}\s+/.test(line);
    case "heading1":
      return /^\s*#{1}\s+/.test(line) && !/^\s*#{2,6}\s+/.test(line);
    case "heading2":
      return /^\s*#{2}\s+/.test(line) && !/^\s*#{3,6}\s+/.test(line);
    case "heading3":
      return /^\s*#{3}\s+/.test(line) && !/^\s*#{4,6}\s+/.test(line);
    case "heading4":
      return /^\s*#{4}\s+/.test(line) && !/^\s*#{5,6}\s+/.test(line);
    case "bulletList":
      return /^\s*[-+*]\s+(?!\[[ xX]\]\s+)/.test(line);
    case "orderedList":
      return /^\s*\d+[.)]\s+/.test(line);
    case "taskList":
      return /^\s*[-+*]\s+\[[ xX]\]\s+/.test(line);
    case "blockquote":
      return /^\s*>\s?/.test(line);
    default:
      return false;
  }
}

interface LineRange {
  start: number;
  end: number;
  text: string;
}

interface FencedCodeBlock {
  opening: LineRange;
  closing: LineRange;
}

function getLineRanges(value: string): LineRange[] {
  const lines: LineRange[] = [];
  let start = 0;

  while (start <= value.length) {
    const lineBreak = value.indexOf("\n", start);
    const end = lineBreak === -1 ? value.length : lineBreak;
    lines.push({ start, end, text: value.slice(start, end) });

    if (lineBreak === -1) {
      break;
    }

    start = lineBreak + 1;
  }

  return lines;
}

function getFenceMarker(line: string) {
  const match = line.match(/^\s*(`{3,}|~{3,})/);
  if (!match) {
    return null;
  }

  return {
    character: match[1][0],
    length: match[1].length,
  };
}

function getFencedCodeBlocks(value: string): FencedCodeBlock[] {
  const blocks: FencedCodeBlock[] = [];
  let opening: LineRange | null = null;
  let openingMarker: ReturnType<typeof getFenceMarker> = null;

  for (const line of getLineRanges(value)) {
    const marker = getFenceMarker(line.text);
    if (!marker) {
      continue;
    }

    if (!opening) {
      opening = line;
      openingMarker = marker;
      continue;
    }

    if (
      openingMarker
      && marker.character === openingMarker.character
      && marker.length >= openingMarker.length
    ) {
      blocks.push({ opening, closing: line });
      opening = null;
      openingMarker = null;
    }
  }

  return blocks;
}

function getProtectedCodeLineStarts(value: string) {
  const protectedLineStarts = new Set<number>();
  let openingMarker: ReturnType<typeof getFenceMarker> = null;

  for (const line of getLineRanges(value)) {
    const marker = getFenceMarker(line.text);

    if (openingMarker) {
      protectedLineStarts.add(line.start);
      if (
        marker
        && marker.character === openingMarker.character
        && marker.length >= openingMarker.length
      ) {
        openingMarker = null;
      }
      continue;
    }

    if (marker) {
      protectedLineStarts.add(line.start);
      openingMarker = marker;
    }
  }

  return protectedLineStarts;
}

function findContainingCodeBlock(value: string, selection: MarkdownSelection) {
  const safeSelection = clampSelection(value, selection);
  const blocks = getFencedCodeBlocks(value);

  return blocks.find(({ opening, closing }) => {
    const closingEnd = closing.end;
    const closingEndWithLineBreak = closing.end + (value[closing.end] === "\n" ? 1 : 0);
    const selectionEndsAtBlockLine = safeSelection.end <= closingEnd;
    const selectionIncludesBlockLineBreak = safeSelection.end === closingEndWithLineBreak
      && safeSelection.start < closingEnd;

    return safeSelection.start >= opening.start
      && (selectionEndsAtBlockLine || selectionIncludesBlockLineBreak);
  }) ?? null;
}

export function applyBlockFormat(
  value: string,
  selection: MarkdownSelection,
  format: MarkdownBlockFormat,
): MarkdownEditResult {
  const bounds = getLineBounds(value, selection);
  const originalBlock = value.slice(bounds.lineStart, bounds.lineEnd);
  const originalLines = originalBlock.split("\n");
  const protectedLineStarts = getProtectedCodeLineStarts(value);
  const lineStarts = originalLines.map((_, index) => {
    if (index === 0) {
      return bounds.lineStart;
    }

    return bounds.lineStart + originalLines
      .slice(0, index)
      .reduce((offset, line) => offset + line.length + 1, 0);
  });
  const editableLines = originalLines.filter((_, index) => !protectedLineStarts.has(lineStarts[index]));

  if (editableLines.length === 0) {
    return {
      value,
      selectionStart: bounds.selection.start,
      selectionEnd: bounds.selection.end,
    };
  }

  const shouldRemove = editableLines.every((line) => isTargetBlockLine(line, format));
  const transformedBlock = originalLines
    .map((line, index) => protectedLineStarts.has(lineStarts[index])
      ? line
      : transformBlockLine(line, format, shouldRemove))
    .join("\n");
  const nextValue = `${value.slice(0, bounds.lineStart)}${transformedBlock}${value.slice(bounds.lineEnd)}`;
  const delta = transformedBlock.length - originalBlock.length;
  const isSingleCursor = bounds.selection.start === bounds.selection.end;

  if (isSingleCursor) {
    const oldMarkerLength = getLineMarkerLength(originalLines[0] ?? "", format);
    const newMarkerLength = shouldRemove
      ? 0
      : getBlockPrefix(format, originalLines[0] ?? "").length;
    const nextCursor = Math.max(
      bounds.lineStart,
      Math.min(
        bounds.lineStart + transformedBlock.length,
        bounds.selection.start + newMarkerLength - oldMarkerLength,
      ),
    );

    return {
      value: nextValue,
      selectionStart: nextCursor,
      selectionEnd: nextCursor,
    };
  }

  const nextSelectionEnd = Math.max(
    bounds.lineStart,
    Math.min(bounds.lineEnd + delta, nextValue.length),
  );

  return {
    value: nextValue,
    selectionStart: bounds.lineStart,
    selectionEnd: nextSelectionEnd,
  };
}

export function applyCodeBlock(
  value: string,
  selection: MarkdownSelection,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);

  const containingBlock = findContainingCodeBlock(value, safeSelection);
  if (containingBlock) {
    const contentStart = containingBlock.opening.end + (value[containingBlock.opening.end] === "\n" ? 1 : 0);
    const contentEnd = containingBlock.closing.start;
    const content = value.slice(contentStart, contentEnd);
    const closingEnd = containingBlock.closing.end + (value[containingBlock.closing.end] === "\n" ? 1 : 0);
    const nextValue = `${value.slice(0, containingBlock.opening.start)}${content}${value.slice(closingEnd)}`;
    const selectionStart = containingBlock.opening.start + Math.min(
      Math.max(safeSelection.start - contentStart, 0),
      content.length,
    );
    const selectionEnd = containingBlock.opening.start + Math.min(
      Math.max(safeSelection.end - contentStart, 0),
      content.length,
    );

    return {
      value: nextValue,
      selectionStart,
      selectionEnd: Math.max(selectionStart, selectionEnd),
    };
  }

  const selectedText = value.slice(safeSelection.start, safeSelection.end) || "代码";
  const replacement = `\`\`\`\n${selectedText}\n\`\`\``;
  const textStart = safeSelection.start + 4;

  return createEdit(
    value,
    safeSelection,
    replacement,
    textStart,
    textStart + selectedText.length,
  );
}

export function applyHorizontalRule(
  value: string,
  selection: MarkdownSelection,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const replacement = "\n\n---\n\n";
  const cursor = safeSelection.start + replacement.length;

  return createEdit(value, safeSelection, replacement, cursor, cursor);
}

export function clearInlineMarkdown(
  value: string,
  selection: MarkdownSelection,
): MarkdownEditResult {
  const safeSelection = clampSelection(value, selection);
  const selectedText = value.slice(safeSelection.start, safeSelection.end);
  const cleared = selectedText
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");

  return createEdit(
    value,
    safeSelection,
    cleared,
    safeSelection.start,
    safeSelection.start + cleared.length,
  );
}
