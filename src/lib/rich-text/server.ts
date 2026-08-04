import { generateHTML } from "@tiptap/html";
import sanitizeHtml from "sanitize-html";
import type { JSONContent } from "@tiptap/core";
import { createRichTextExtensions } from "@/lib/rich-text/extensions";
import {
  extractRichTextHeadings,
  getRichTextPlainText,
  parseRichTextDocument,
} from "@/lib/rich-text/content";

const allowedStyleValue = /^[\w#().,%\s'"-]+$/;

export function renderRichTextHtml(document: JSONContent): string {
  const html = generateHTML(document, createRichTextExtensions());
  const headings = extractRichTextHeadings(document, { includeEmpty: true });
  let headingIndex = 0;
  const transformHeading = (tagName: string, attribs: Record<string, string>) => {
    const heading = headings[headingIndex];
    headingIndex += 1;
    return {
      tagName,
      attribs: {
        ...attribs,
        ...(heading?.id ? { id: heading.id } : {}),
      },
    };
  };

  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h1", "h2", "h3", "h4", "strong", "em", "u", "s", "mark", "code", "pre",
      "blockquote", "ul", "ol", "li", "hr", "br", "a", "img", "input", "span", "label", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      mark: ["data-color", "style"],
      p: ["style"],
      h1: ["id", "style"],
      h2: ["id", "style"],
      h3: ["id", "style"],
      h4: ["id", "style"],
      img: ["src", "alt", "title", "data-width", "data-align", "style"],
      ul: ["data-type"],
      span: ["style"],
      li: ["data-type", "data-checked"],
      code: ["class"],
      pre: ["class"],
      input: ["type", "checked", "disabled"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowedStyles: {
      p: {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      h1: {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      h2: {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      h3: {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      h4: {
        "text-align": [/^(?:left|center|right|justify)$/],
      },
      img: {
        width: [allowedStyleValue],
        "max-width": [allowedStyleValue],
        height: [allowedStyleValue],
      },
      span: {
        color: [allowedStyleValue],
        "background-color": [allowedStyleValue],
        "font-size": [allowedStyleValue],
        "font-family": [allowedStyleValue],
      },
      mark: {
        "background-color": [allowedStyleValue],
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: "nofollow noopener noreferrer",
          target: "_blank",
        },
      }),
      h1: transformHeading,
      h2: transformHeading,
      h3: transformHeading,
      h4: transformHeading,
    },
  });
}

export function parseAndRenderRichText(value: unknown): { document: JSONContent; html: string; text: string } | null {
  const document = parseRichTextDocument(value);
  if (!document) {
    return null;
  }

  return {
    document,
    html: renderRichTextHtml(document),
    text: getRichTextPlainText(document),
  };
}
