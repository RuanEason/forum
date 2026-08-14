import type { JSONContent } from "@tiptap/core";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { prisma } from "@/lib/prisma";

export interface MentionTarget {
  id: string;
  name: string;
}

export type MentionTargetMap = ReadonlyMap<string, MentionTarget>;

const mentionNamePattern = /^[\p{L}\p{N}_-]+$/u;
const mentionTokenPattern = /@([\p{L}\p{N}_-]+)/gu;
const mentionCharacterPattern = /^[\p{L}\p{N}_-]$/u;
const MAX_MENTION_LOOKUP_NAMES = 1000;

type MarkdownPosition = {
  start?: { offset?: number };
  end?: { offset?: number };
};

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: MarkdownPosition;
};

type MentionMatch = {
  name: string;
  start: number;
  end: number;
};

const PROTECTED_MARKDOWN_ANCESTORS = new Set([
  "code",
  "definition",
  "html",
  "image",
  "imageReference",
  "inlineCode",
  "link",
  "linkReference",
]);

const PROTECTED_RICH_TEXT_MARKS = new Set(["code", "link"]);

export function isMentionableName(value: string): boolean {
  return mentionNamePattern.test(value);
}

function isMentionCharacter(value: string | undefined): boolean {
  return Boolean(value && mentionCharacterPattern.test(value));
}

function findMentionMatches(value: string, source?: string, sourceOffset = 0): MentionMatch[] {
  const matches: MentionMatch[] = [];

  for (const match of value.matchAll(mentionTokenPattern)) {
    const fullMatch = match[0];
    const name = match[1];
    const start = match.index ?? 0;
    const end = start + fullMatch.length;
    const absoluteStart = sourceOffset + start;
    const absoluteEnd = sourceOffset + end;
    const previousCharacter = source
      ? source[absoluteStart - 1]
      : value[start - 1];
    const nextCharacter = source
      ? source[absoluteEnd]
      : value[end];

    if (previousCharacter === "@" || isMentionCharacter(previousCharacter)) {
      continue;
    }

    if (isMentionCharacter(nextCharacter)) {
      continue;
    }

    if (source && source.slice(absoluteStart, absoluteEnd) !== fullMatch) {
      // Escaped Markdown text can have a different source length than its AST value.
      // Skip it instead of risking a replacement at the wrong source position.
      continue;
    }

    matches.push({ name, start, end });
  }

  return matches;
}

function parseMarkdownTree(markdown: string): MarkdownNode | null {
  try {
    return fromMarkdown(markdown, {
      mdastExtensions: gfmFromMarkdown(),
    }) as unknown as MarkdownNode;
  } catch {
    return null;
  }
}

function walkMarkdownTextNodes(
  node: MarkdownNode,
  ancestors: MarkdownNode[],
  visitor: (node: MarkdownNode, ancestors: MarkdownNode[]) => void,
): void {
  if (node.type === "text") {
    visitor(node, ancestors);
  }

  for (const child of node.children ?? []) {
    walkMarkdownTextNodes(child, [...ancestors, node], visitor);
  }
}

function isProtectedMarkdownText(ancestors: MarkdownNode[]): boolean {
  return ancestors.some((ancestor) => PROTECTED_MARKDOWN_ANCESTORS.has(ancestor.type));
}

function getMarkdownTextSourceOffset(
  markdown: string,
  node: MarkdownNode,
  ancestors: MarkdownNode[],
): number | null {
  const explicitOffset = node.position?.start?.offset;
  if (typeof explicitOffset === "number") {
    return explicitOffset;
  }

  if (typeof node.value !== "string") {
    return null;
  }

  const parent = [...ancestors]
    .reverse()
    .find((ancestor) => (
      typeof ancestor.position?.start?.offset === "number"
      && typeof ancestor.position?.end?.offset === "number"
    ));
  const parentStart = parent?.position?.start?.offset;
  const parentEnd = parent?.position?.end?.offset;
  if (typeof parentStart !== "number" || typeof parentEnd !== "number") {
    return null;
  }

  const candidate = markdown.indexOf(node.value, parentStart);
  if (candidate < parentStart || candidate + node.value.length > parentEnd) {
    return null;
  }

  return candidate;
}

function forEachMarkdownMention(
  markdown: string,
  visitor: (match: MentionMatch, node: MarkdownNode, sourceOffset: number) => void,
): void {
  const tree = parseMarkdownTree(markdown);
  if (!tree) {
    return;
  }

  walkMarkdownTextNodes(tree, [], (node, ancestors) => {
    if (isProtectedMarkdownText(ancestors) || typeof node.value !== "string") {
      return;
    }

    const sourceOffset = getMarkdownTextSourceOffset(markdown, node, ancestors);
    if (sourceOffset === null) {
      return;
    }

    for (const match of findMentionMatches(node.value, markdown, sourceOffset)) {
      visitor(match, node, sourceOffset);
    }
  });
}

export function collectMentionNamesFromMarkdown(markdown: string): Set<string> {
  const names = new Set<string>();

  forEachMarkdownMention(markdown, (match) => {
    names.add(match.name);
  });

  return names;
}

export function transformMarkdownMentions(
  markdown: string,
  targets: MentionTargetMap,
): string {
  const replacements: Array<{ start: number; end: number; value: string }> = [];

  forEachMarkdownMention(markdown, (match, _node, sourceOffset) => {
    const target = targets.get(match.name);
    if (!target) {
      return;
    }

    const start = sourceOffset + match.start;
    const end = sourceOffset + match.end;
    const original = markdown.slice(start, end);
    if (original !== `@${match.name}`) {
      return;
    }

    replacements.push({
      start,
      end,
      value: `[@${match.name}](/user/${encodeURIComponent(target.id)})`,
    });
  });

  if (replacements.length === 0) {
    return markdown;
  }

  replacements.sort((left, right) => right.start - left.start);
  let transformed = markdown;
  for (const replacement of replacements) {
    transformed = `${transformed.slice(0, replacement.start)}${replacement.value}${transformed.slice(replacement.end)}`;
  }

  return transformed;
}

export function collectMentionNamesFromRichText(document: JSONContent | null | undefined): Set<string> {
  const names = new Set<string>();

  const visit = (node: JSONContent, insideCodeBlock = false) => {
    if (insideCodeBlock || node.type === "codeBlock") {
      return;
    }

    if (node.type === "text" && typeof node.text === "string") {
      const hasProtectedMark = node.marks?.some((mark) => PROTECTED_RICH_TEXT_MARKS.has(mark.type));
      if (!hasProtectedMark) {
        for (const match of findMentionMatches(node.text)) {
          names.add(match.name);
        }
      }
    }

    for (const child of node.content ?? []) {
      visit(child, insideCodeBlock || node.type === "codeBlock");
    }
  };

  if (document) {
    visit(document);
  }

  return names;
}

function transformRichTextNode(
  node: JSONContent,
  targets: MentionTargetMap,
  insideCodeBlock = false,
): { nodes: JSONContent[]; changed: boolean } {
  if (insideCodeBlock || node.type === "codeBlock") {
    return { nodes: [node], changed: false };
  }

  if (node.type === "text" && typeof node.text === "string") {
    const hasProtectedMark = node.marks?.some((mark) => PROTECTED_RICH_TEXT_MARKS.has(mark.type));
    if (hasProtectedMark) {
      return { nodes: [node], changed: false };
    }

    const matches = findMentionMatches(node.text);
    if (matches.length === 0) {
      return { nodes: [node], changed: false };
    }

    const transformedNodes: JSONContent[] = [];
    let cursor = 0;
    let changed = false;

    for (const match of matches) {
      const target = targets.get(match.name);
      if (!target) {
        continue;
      }

      if (match.start > cursor) {
        transformedNodes.push({
          ...node,
          text: node.text.slice(cursor, match.start),
        });
      }

      transformedNodes.push({
        ...node,
        text: node.text.slice(match.start, match.end),
        marks: [
          ...(node.marks ?? []),
          {
            type: "link",
            attrs: { href: `/user/${encodeURIComponent(target.id)}` },
          },
        ],
      });
      cursor = match.end;
      changed = true;
    }

    if (!changed) {
      return { nodes: [node], changed: false };
    }

    if (cursor < node.text.length) {
      transformedNodes.push({
        ...node,
        text: node.text.slice(cursor),
      });
    }

    return { nodes: transformedNodes, changed: true };
  }

  if (!node.content?.length) {
    return { nodes: [node], changed: false };
  }

  const nextContent: JSONContent[] = [];
  let changed = false;
  for (const child of node.content) {
    const result = transformRichTextNode(child, targets, insideCodeBlock || node.type === "codeBlock");
    nextContent.push(...result.nodes);
    changed = changed || result.changed;
  }

  return {
    nodes: changed ? [{ ...node, content: nextContent }] : [node],
    changed,
  };
}

export function transformRichTextMentions(
  document: JSONContent,
  targets: MentionTargetMap,
): JSONContent {
  return transformRichTextNode(document, targets).nodes[0] ?? document;
}

export function buildUniqueMentionTargetMap(users: MentionTarget[]): Map<string, MentionTarget> {
  const grouped = new Map<string, MentionTarget[]>();
  for (const user of users) {
    const current = grouped.get(user.name) ?? [];
    current.push(user);
    grouped.set(user.name, current);
  }

  const targets = new Map<string, MentionTarget>();
  for (const [name, matches] of grouped) {
    if (matches.length === 1) {
      targets.set(name, matches[0]);
    }
  }

  return targets;
}

export async function resolveMentionTargets(names: Iterable<string>): Promise<Map<string, MentionTarget>> {
  const requestedNames = Array.from(new Set(names))
    .filter(isMentionableName)
    .slice(0, MAX_MENTION_LOOKUP_NAMES);

  if (requestedNames.length === 0) {
    return new Map();
  }

  const users = await prisma.user.findMany({
    where: {
      name: { in: requestedNames },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const matches: MentionTarget[] = [];
  for (const user of users) {
    if (!user.name || !requestedNames.includes(user.name)) {
      continue;
    }

    matches.push({ id: user.id, name: user.name });
  }

  return buildUniqueMentionTargetMap(matches);
}

export async function linkMarkdownMentions(markdown: string): Promise<string> {
  const names = collectMentionNamesFromMarkdown(markdown);
  if (names.size === 0) {
    return markdown;
  }

  return transformMarkdownMentions(markdown, await resolveMentionTargets(names));
}

export async function linkRichTextMentions(document: JSONContent): Promise<JSONContent> {
  const names = collectMentionNamesFromRichText(document);
  if (names.size === 0) {
    return document;
  }

  return transformRichTextMentions(document, await resolveMentionTargets(names));
}
