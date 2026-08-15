import type { JSONContent } from "@tiptap/core";

const ATX_HEADING_PATTERN = /^( {0,3})(#{1,4})(?:[ \t]+(.*)|[ \t]*)$/;
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;

function createParagraph(text: string): JSONContent {
  return {
    type: "paragraph",
    ...(text ? { content: [{ type: "text", text }] } : {}),
  };
}

function createHeading(level: number, text: string): JSONContent {
  return {
    type: "heading",
    attrs: { level },
    ...(text ? { content: [{ type: "text", text }] } : {}),
  };
}

/**
 * Converts pasted Markdown ATX headings into rich-text blocks while leaving
 * ordinary paste content to ProseMirror's default clipboard handling.
 */
export function parseMarkdownHeadingPaste(value: string): JSONContent[] | null {
  if (!value || !/[\r\n]/.test(value) && !/^ {0,3}#{1,4}(?:[ \t]+|$)/.test(value)) {
    return null;
  }

  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  let fenceMarker: string | null = null;
  let hasHeading = false;
  const blocks: JSONContent[] = [];

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_PATTERN);

    if (fenceMarker) {
      blocks.push(createParagraph(line));
      if (
        fenceMatch
        && fenceMatch[1][0] === fenceMarker[0]
        && fenceMatch[1].length >= fenceMarker.length
      ) {
        fenceMarker = null;
      }
      continue;
    }

    if (fenceMatch) {
      fenceMarker = fenceMatch[1];
      blocks.push(createParagraph(line));
      continue;
    }

    const headingMatch = line.match(ATX_HEADING_PATTERN);
    if (!headingMatch) {
      blocks.push(createParagraph(line));
      continue;
    }

    hasHeading = true;
    const level = headingMatch[2].length;
    const text = (headingMatch[3] ?? "")
      .replace(/[ \t]+#{1,4}[ \t]*$/, "")
      .trim();
    blocks.push(createHeading(level, text));
  }

  return hasHeading ? blocks : null;
}
