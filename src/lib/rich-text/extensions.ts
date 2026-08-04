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

export function createRichTextExtensions(options?: {
  placeholder?: string;
  imageExtension?: AnyExtension;
}) {
  const imageExtension = options?.imageExtension ?? RichTextImage;

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: {
        HTMLAttributes: { class: "rich-text-code-block" },
      },
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
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    imageExtension.configure({
      inline: false,
      allowBase64: false,
    }),
    Placeholder.configure({
      placeholder: options?.placeholder ?? "开始写作...",
    }),
    CharacterCount,
  ];
}
