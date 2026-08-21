import { Extension, type AnyExtension } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { CUSTOM_EMOJI_RENDER_SIZE, isCustomEmojiUrl } from "@/lib/emoji";
import { isAllowedRichTextLineHeight } from "@/lib/rich-text/content";

export const RICH_TEXT_FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"] as const;
export type RichTextFontSize = (typeof RICH_TEXT_FONT_SIZES)[number];

export const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: { fontSize?: string | null }) => {
              if (!attributes.fontSize) {
                return {};
              }

              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

export const LineHeight = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const value = Number(
                element.getAttribute("data-line-height") ?? element.style.lineHeight.trim(),
              );
              return isAllowedRichTextLineHeight(value) ? value : null;
            },
            renderHTML: (attributes: { lineHeight?: number | null }) => {
              if (!isAllowedRichTextLineHeight(attributes.lineHeight)) {
                return {};
              }

              return {
                style: `line-height: ${attributes.lineHeight}`,
                "data-line-height": String(attributes.lineHeight),
              };
            },
          },
        },
      },
    ];
  },
});

// Keep block alignment as data as well as style so the server HTML serializer
// can restore it after its DOM shim drops inline style attributes.
export const RichTextTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    const parentAttributes = this.parent?.() ?? [];

    return parentAttributes.map((group) => {
      const textAlignAttribute = group.attributes?.textAlign;
      if (!textAlignAttribute) {
        return group;
      }

      return {
        ...group,
        attributes: {
          ...group.attributes,
          textAlign: {
            ...textAlignAttribute,
            renderHTML: (attributes) => {
              const rendered = textAlignAttribute.renderHTML?.(attributes) ?? {};
              const alignment = attributes.textAlign;
              return typeof alignment === "string"
                ? { ...rendered, "data-text-align": alignment }
                : rendered;
            },
          },
        },
      };
    });
  },
});

export const RichTextImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-width") || element.style.width;
          const numericValue = Number.parseFloat(value || "");
          return Number.isFinite(numericValue) ? numericValue : null;
        },
        renderHTML: (attributes: { width?: number | null }) => {
          if (!attributes.width) {
            return {};
          }

          return {
            "data-width": String(Math.round(attributes.width)),
            style: `width: ${Math.round(attributes.width)}px; max-width: 100%; height: auto`,
          };
        },
      },
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: { align?: string }) => ({
          "data-align": attributes.align || "center",
        }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", HTMLAttributes];
  },
});

export const RichTextEmoji = Image.extend({
  name: "emoji",
  inline: true,
  group: "inline",
  selectable: false,
  draggable: false,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "自定义表情" },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{
      tag: "img[data-custom-emoji]",
      priority: 100,
      getAttrs: (element: HTMLElement) => {
        const src = element.getAttribute("src");
        return src && isCustomEmojiUrl(src) ? {
          src,
          alt: element.getAttribute("alt") || "自定义表情",
          title: element.getAttribute("title"),
        } : false;
      },
    }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", {
      ...HTMLAttributes,
      "data-custom-emoji": "true",
      class: "rich-text-emoji",
      width: CUSTOM_EMOJI_RENDER_SIZE,
      height: CUSTOM_EMOJI_RENDER_SIZE,
    }];
  },
});

export function createRichTextExtensions(options?: {
  placeholder?: string;
  imageExtension?: AnyExtension;
  emojiExtension?: AnyExtension;
  disableHistory?: boolean;
}) {
  const imageExtension = options?.imageExtension ?? RichTextImage;
  const emojiExtension = options?.emojiExtension ?? RichTextEmoji;

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: {
        HTMLAttributes: { class: "rich-text-code-block" },
      },
      history: options?.disableHistory ? false : {},
    }),
    TextStyle,
    Color,
    FontFamily.configure({
      types: ["textStyle"],
    }),
    FontSize,
    Highlight.configure({ multicolor: true }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    }),
    RichTextTextAlign.configure({ types: ["heading", "paragraph"] }),
    LineHeight,
    TaskList.configure({
      HTMLAttributes: { class: "rich-task-list" },
    }),
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: "rich-task-item",
        "data-type": "taskItem",
        style: "display: grid; grid-template-columns: 1.1rem minmax(0, 1fr); align-items: start; gap: 0.5rem; margin-left: 0",
      },
    }),
    imageExtension.configure({
      inline: false,
      allowBase64: false,
    }),
    emojiExtension.configure({
      inline: true,
      allowBase64: false,
    }),
    Placeholder.configure({
      placeholder: options?.placeholder ?? "开始写作...",
    }),
    CharacterCount,
  ];
}
