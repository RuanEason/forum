/**
 * Markdown 工具函数
 */

export interface MarkdownHeading {
  depth: number;
  text: string;
  id: string;
  lineNumber: number;
}

export function isInternalUserLink(href: string | null | undefined): boolean {
  return typeof href === "string" && /^\/user\/[^/?#]+(?:[/?#]|$)/.test(href);
}

const ATX_HEADING_REGEX = /^(#{1,6})[ \t]+(.+?)\s*#*\s*$/;

function stripMarkdownInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_~]/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
    .trim();
}

function slugifyHeading(text: string): string {
  const normalized = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const slug = normalized
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

export function createHeadingIdGenerator(): (text: string) => string {
  const slugCounts = new Map<string, number>();

  return (text: string) => {
    const normalizedText = stripMarkdownInline(text);
    const baseSlug = slugifyHeading(normalizedText);
    const count = slugCounts.get(baseSlug) ?? 0;

    slugCounts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${count}`;
  };
}

export function normalizeMarkdownForDisplay(markdown: string): string {
  return markdown.replace(
    /([^\n])(```[^\n]*\r?\n|~~~[^\n]*\r?\n)/g,
    (_, previous: string, fence: string) => `${previous}\n${fence}`,
  );
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const lines = markdown.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];
  const generateId = createHeadingIdGenerator();

  let inCodeFence = false;
  let fenceChar = "";
  let fenceLength = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);

    if (fenceMatch) {
      const marker = fenceMatch[1];

      if (!inCodeFence) {
        inCodeFence = true;
        fenceChar = marker[0];
        fenceLength = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceLength) {
        inCodeFence = false;
      }

      continue;
    }

    if (inCodeFence) {
      continue;
    }

    const atxMatch = line.match(ATX_HEADING_REGEX);
    if (atxMatch) {
      const depth = atxMatch[1].length;
      const text = stripMarkdownInline(atxMatch[2]);

      if (text) {
        headings.push({
          depth,
          text,
          id: generateId(text),
          lineNumber: index + 1,
        });
      }

      continue;
    }

    const nextLine = lines[index + 1];
    if (!nextLine || !line.trim()) {
      continue;
    }

    const setextMatch = nextLine.match(/^\s*(=+|-+)\s*$/);
    if (setextMatch) {
      const depth = setextMatch[1][0] === "=" ? 1 : 2;
      const text = stripMarkdownInline(line.trim());

      if (text) {
        headings.push({
          depth,
          text,
          id: generateId(text),
          lineNumber: index + 1,
        });
      }

      index += 1;
    }
  }

  return headings;
}
