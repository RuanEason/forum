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
const allowedLineHeightValue = /^(?:[12](?:\.\d{1,2})?|3(?:\.0{1,2})?)$/;
const allowedTextAlignValue = /^(?:left|center|right|justify)$/;

function restoreBlockStyles(tagName: string, attribs: Record<string, string>) {
  const {
    "data-line-height": lineHeight,
    "data-text-align": textAlign,
    style: existingStyle,
    ...rest
  } = attribs;
  const styles = existingStyle ? [existingStyle] : [];

  if (lineHeight && allowedLineHeightValue.test(lineHeight)) {
    styles.push(`line-height: ${lineHeight}`);
  }
  if (textAlign && allowedTextAlignValue.test(textAlign)) {
    styles.push(`text-align: ${textAlign}`);
  }

  return {
    tagName,
    attribs: {
      ...rest,
      ...(styles.length > 0 ? { style: styles.join("; ") } : {}),
    },
  };
}

export function renderRichTextHtml(document: JSONContent): string {
  const html = generateHTML(document, createRichTextExtensions());
  const headings = extractRichTextHeadings(document, { includeEmpty: true });
  let headingIndex = 0;
  const transformHeading = (tagName: string, attribs: Record<string, string>) => {
    const heading = headings[headingIndex];
    headingIndex += 1;
    const transformed = restoreBlockStyles(tagName, attribs);
    return {
      tagName: transformed.tagName,
      attribs: {
        ...transformed.attribs,
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
      p: ["style", "data-line-height", "data-text-align"],
      h1: ["id", "style", "data-line-height", "data-text-align"],
      h2: ["id", "style", "data-line-height", "data-text-align"],
      h3: ["id", "style", "data-line-height", "data-text-align"],
      h4: ["id", "style", "data-line-height", "data-text-align"],
      img: ["src", "alt", "title", "data-width", "data-align", "data-custom-emoji", "class", "style"],
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
        "line-height": [allowedLineHeightValue],
      },
      h1: {
        "text-align": [/^(?:left|center|right|justify)$/],
        "line-height": [allowedLineHeightValue],
      },
      h2: {
        "text-align": [/^(?:left|center|right|justify)$/],
        "line-height": [allowedLineHeightValue],
      },
      h3: {
        "text-align": [/^(?:left|center|right|justify)$/],
        "line-height": [allowedLineHeightValue],
      },
      h4: {
        "text-align": [/^(?:left|center|right|justify)$/],
        "line-height": [allowedLineHeightValue],
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
      a: (_tagName, attribs) => {
        const isInternalUserLink = typeof attribs.href === "string"
          && /^\/user\/[^/?#]+(?:[/?#]|$)/.test(attribs.href);
        const nextAttribs = { ...attribs };

        if (isInternalUserLink) {
          delete nextAttribs.rel;
          delete nextAttribs.target;
        } else {
          nextAttribs.rel = "nofollow noopener noreferrer";
          nextAttribs.target = "_blank";
        }

        return { tagName: "a", attribs: nextAttribs };
      },
      p: (_tagName, attribs) => restoreBlockStyles("p", attribs),
      input: (_tagName, attribs) => ({
        tagName: "input",
        attribs: {
          ...attribs,
          disabled: "disabled",
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
