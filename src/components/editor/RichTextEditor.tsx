"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Loader2,
  List,
  ListChecks,
  ListOrdered,
  Paperclip,
  PenLine,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createEmptyRichTextDocument,
  extractRichTextHeadings,
  isAllowedRichTextUrl,
  parseRichTextDocument,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";
import {
  createRichTextExtensions,
  RICH_TEXT_FONT_SIZES,
} from "@/lib/rich-text/extensions";
import { EditableRichTextImage } from "@/components/editor/rich-text-editor-extensions";
import type { EditorImageInsertRequest, EditorOutlineItem } from "@/components/editor/types";

interface RichTextEditorProps {
  content?: string;
  value?: string;
  onChange: (value: string) => void;
  imageInsertRequest?: EditorImageInsertRequest | null;
  onImageInsertHandled?: () => void;
  externalJumpPosition?: number | null;
  onExternalJumpHandled?: () => void;
  onOutlineChange?: (items: EditorOutlineItem[]) => void;
  onActivePositionChange?: (position: number) => void;
  onSave?: () => void;
  onPublish?: () => void;
  placeholder?: string;
  minHeight?: number;
  contentSlot?: ReactNode;
  footerRight?: ReactNode;
  onImageClick?: () => void;
  onAttachmentClick?: () => void;
  showToolbarToggle?: boolean;
  variant?: "default" | "composer";
  imageCount?: number;
  maxImages?: number;
  isUploading?: boolean;
  attachmentCount?: number;
  maxAttachments?: number;
  onCancelUpload?: () => void;
  uploadProgress?: number;
  uploadStatus?: string;
  onOpenEditor?: () => void;
  topicSelector?: ReactNode;
}

const FONT_FAMILIES = [
  { label: "系统字体", value: "" },
  { label: "无衬线", value: "Arial, Helvetica, sans-serif" },
  { label: "衬线", value: "Georgia, 'Times New Roman', serif" },
  { label: "等宽", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

function getEditorOutline(editor: Editor): EditorOutlineItem[] {
  return extractRichTextHeadings(editor.getJSON()).map((heading) => ({
    id: heading.id,
    depth: heading.depth,
    text: heading.text,
    position: heading.position ?? 1,
  }));
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors",
        "hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35",
        active && "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-300 hover:bg-blue-100 hover:text-blue-800",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-slate-200" />;
}

function ColorControl({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      title={label}
      className="relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
    >
      {icon}
      <span
        aria-hidden="true"
        className="absolute bottom-1 h-0.5 w-4 rounded-full"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={onChange}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      />
    </label>
  );
}

function RichTextToolbar({
  editor,
}: {
  editor: Editor;
}) {
  const [textColor, setTextColor] = useState("#1e293b");
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const headingAttributes = currentEditor.getAttributes("heading") as { level?: number | null };
      const textStyleAttributes = currentEditor.getAttributes("textStyle") as {
        fontFamily?: string | null;
        fontSize?: string | null;
      };
      const headingLevel = Number(headingAttributes.level);

      return {
        headingLevel: currentEditor.isActive("heading") && [1, 2, 3, 4].includes(headingLevel)
          ? String(headingLevel)
          : "paragraph",
        fontFamily: textStyleAttributes.fontFamily ?? "",
        fontSize: textStyleAttributes.fontSize ?? "",
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        strike: currentEditor.isActive("strike"),
        alignLeft: currentEditor.isActive({ textAlign: "left" }),
        alignCenter: currentEditor.isActive({ textAlign: "center" }),
        alignRight: currentEditor.isActive({ textAlign: "right" }),
        alignJustify: currentEditor.isActive({ textAlign: "justify" }),
        bulletList: currentEditor.isActive("bulletList"),
        orderedList: currentEditor.isActive("orderedList"),
        taskList: currentEditor.isActive("taskList"),
        blockquote: currentEditor.isActive("blockquote"),
        codeBlock: currentEditor.isActive("codeBlock"),
        link: currentEditor.isActive("link"),
      };
    },
  });

  const run = (callback: (editor: Editor) => void) => {
    callback(editor);
  };

  const promptForLink = () => {
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const value = window.prompt("输入链接地址", currentHref ?? "https://");
    if (value === null) {
      return;
    }

    const normalized = value.trim();
    if (!normalized) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    if (!isAllowedRichTextUrl(normalized)) {
      window.alert("链接只支持 http 或 https 地址");
      return;
    }

    editor.chain().focus().setLink({ href: normalized }).run();
  };

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2">
      <ToolbarButton label="撤销" disabled={!editor.can().undo()} onClick={() => run((item) => item.chain().focus().undo().run())}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="重做" disabled={!editor.can().redo()} onClick={() => run((item) => item.chain().focus().redo().run())}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <select
        aria-label="段落格式"
        title="段落格式"
        value={toolbarState.headingLevel}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 }).run();
          }
        }}
        className="h-8 max-w-28 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
      >
        <option value="paragraph">正文</option>
        <option value="1">标题 1</option>
        <option value="2">标题 2</option>
        <option value="3">标题 3</option>
        <option value="4">标题 4</option>
      </select>

      <select
        aria-label="字体"
        title="字体"
        value={toolbarState.fontFamily}
        onChange={(event) => {
          const value = event.target.value;
          if (value) {
            editor.chain().focus().setFontFamily(value).run();
          } else {
            editor.chain().focus().unsetFontFamily().run();
          }
        }}
        className="h-8 max-w-28 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
      >
        {FONT_FAMILIES.map((family) => (
          <option key={family.label} value={family.value}>{family.label}</option>
        ))}
      </select>

      <select
        aria-label="字号"
        title="字号"
        value={toolbarState.fontSize}
        onChange={(event) => {
          const value = event.target.value;
          if (value) {
            editor.chain().focus().setMark("textStyle", { fontSize: value }).run();
          } else {
            editor.chain().focus().setMark("textStyle", { fontSize: null }).run();
          }
        }}
        className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
      >
        <option value="">默认字号</option>
        {RICH_TEXT_FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size.replace("px", "")}</option>
        ))}
      </select>

      <ToolbarDivider />

      <ToolbarButton label="粗体" active={toolbarState.bold} onClick={() => run((item) => item.chain().focus().toggleBold().run())}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="斜体" active={toolbarState.italic} onClick={() => run((item) => item.chain().focus().toggleItalic().run())}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="下划线" active={toolbarState.underline} onClick={() => run((item) => item.chain().focus().toggleUnderline().run())}>
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="删除线" active={toolbarState.strike} onClick={() => run((item) => item.chain().focus().toggleStrike().run())}>
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ColorControl
        label="文字颜色"
        value={textColor}
        onChange={(event) => {
          setTextColor(event.target.value);
          editor.chain().focus().setColor(event.target.value).run();
        }}
        icon={<span className="text-sm font-bold">A</span>}
      />
      <ColorControl
        label="文字高亮"
        value={highlightColor}
        onChange={(event) => {
          setHighlightColor(event.target.value);
          editor.chain().focus().toggleHighlight({ color: event.target.value }).run();
        }}
        icon={<Highlighter className="h-4 w-4" />}
      />

      <ToolbarDivider />

      <ToolbarButton label="左对齐" active={toolbarState.alignLeft} onClick={() => run((item) => item.chain().focus().setTextAlign("left").run())}>
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="居中" active={toolbarState.alignCenter} onClick={() => run((item) => item.chain().focus().setTextAlign("center").run())}>
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="右对齐" active={toolbarState.alignRight} onClick={() => run((item) => item.chain().focus().setTextAlign("right").run())}>
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="两端对齐" active={toolbarState.alignJustify} onClick={() => run((item) => item.chain().focus().setTextAlign("justify").run())}>
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="无序列表" active={toolbarState.bulletList} onClick={() => run((item) => item.chain().focus().toggleBulletList().run())}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="有序列表" active={toolbarState.orderedList} onClick={() => run((item) => item.chain().focus().toggleOrderedList().run())}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="任务列表" active={toolbarState.taskList} onClick={() => run((item) => item.chain().focus().toggleTaskList().run())}>
        <ListChecks className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="引用" active={toolbarState.blockquote} onClick={() => run((item) => item.chain().focus().toggleBlockquote().run())}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="代码块" active={toolbarState.codeBlock} onClick={() => run((item) => item.chain().focus().toggleCodeBlock().run())}>
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="链接" active={toolbarState.link} onClick={promptForLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="清除格式" onClick={() => run((item) => item.chain().focus().unsetAllMarks().clearNodes().run())}>
        <Eraser className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({
  content: contentProp,
  value,
  onChange,
  imageInsertRequest = null,
  onImageInsertHandled = () => undefined,
  externalJumpPosition = null,
  onExternalJumpHandled = () => undefined,
  onOutlineChange = () => undefined,
  onActivePositionChange = () => undefined,
  onSave = () => undefined,
  onPublish = () => undefined,
  placeholder,
  minHeight = 560,
  contentSlot,
  footerRight,
  onImageClick,
  onAttachmentClick,
  showToolbarToggle = false,
  variant = "default",
  imageCount = 0,
  maxImages = 9,
  isUploading = false,
  attachmentCount = 0,
  maxAttachments = 5,
  onCancelUpload,
  uploadProgress = 0,
  uploadStatus = "",
  onOpenEditor,
  topicSelector,
}: RichTextEditorProps) {
  const content = contentProp ?? value ?? serializeRichTextDocument(createEmptyRichTextDocument());
  const lastEmittedContentRef = useRef(content);
  const initialContent = useMemo(
    () => parseRichTextDocument(content) ?? createEmptyRichTextDocument(),
    [content],
  );

  const emitDocument = useCallback((editor: Editor) => {
    const nextContent = serializeRichTextDocument(editor.getJSON());
    lastEmittedContentRef.current = nextContent;
    onChange(nextContent);
    onOutlineChange(getEditorOutline(editor));
    onActivePositionChange(editor.state.selection.from);
  }, [onActivePositionChange, onChange, onOutlineChange]);

  const editor = useEditor({
    extensions: createRichTextExtensions({
      imageExtension: EditableRichTextImage,
      placeholder,
    }),
    content: initialContent,
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      lastEmittedContentRef.current = content;
      onOutlineChange(getEditorOutline(createdEditor));
      onActivePositionChange(createdEditor.state.selection.from);
    },
    onUpdate: ({ editor: updatedEditor }) => {
      emitDocument(updatedEditor);
    },
    onSelectionUpdate: ({ editor: selectionEditor }) => {
      onActivePositionChange(selectionEditor.state.selection.from);
    },
    editorProps: {
      attributes: {
        class: "rich-text-prose outline-none",
        style: `min-height: ${minHeight}px`,
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSave();
          return true;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          onPublish();
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor || content === lastEmittedContentRef.current) {
      return;
    }

    const nextDocument = parseRichTextDocument(content) ?? createEmptyRichTextDocument();
    editor.commands.setContent(nextDocument, false);
    lastEmittedContentRef.current = content;
    onOutlineChange(getEditorOutline(editor));
  }, [content, editor, onOutlineChange]);

  useEffect(() => {
    if (!editor || !imageInsertRequest) {
      return;
    }

    editor.chain().focus().insertContent({
      type: "image",
      attrs: {
        src: imageInsertRequest.url,
        alt: imageInsertRequest.alt ?? "图片",
        title: null,
        width: null,
        align: "center",
      },
    }).run();
    onImageInsertHandled();
  }, [editor, imageInsertRequest, onImageInsertHandled]);

  useEffect(() => {
    if (!editor || externalJumpPosition === null) {
      return;
    }

    const position = Math.max(
      1,
      Math.min(externalJumpPosition, editor.state.doc.content.size),
    );
    editor.chain().focus(position).scrollIntoView().run();
    onExternalJumpHandled();
  }, [editor, externalJumpPosition, onExternalJumpHandled]);

  if (!editor) {
    return <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-400">正在加载编辑器...</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f7fa]">
      <RichTextToolbar
        editor={editor}
      />
      <div className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        variant === "composer" ? "p-0" : "p-4 sm:p-6",
      )}>
        <div className={cn(
          "min-h-full bg-white",
          variant === "composer"
            ? "w-full max-w-none px-6 py-7 sm:px-10"
            : "mx-auto max-w-4xl border border-slate-200 px-6 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:px-10",
        )}>
          <EditorContent editor={editor} />
          {contentSlot ? <div className="mt-6 border-t border-slate-100 pt-4">{contentSlot}</div> : null}
        </div>
      </div>
      {showToolbarToggle || footerRight || onOpenEditor || onImageClick || onAttachmentClick ? (
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div className={cn(
            "flex flex-wrap items-center justify-between gap-3",
            variant === "composer" && "sm:gap-4",
          )}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {onImageClick ? (
                <button
                  type="button"
                  onClick={onImageClick}
                  disabled={isUploading || imageCount >= maxImages}
                  className={cn(
                    "inline-flex h-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45",
                    variant === "composer"
                      ? "w-9 rounded-md hover:bg-slate-100"
                      : "gap-1.5 rounded-md border border-slate-200 px-2.5 text-sm hover:bg-slate-50",
                  )}
                  title={`添加图片 (${imageCount}/${maxImages})`}
                  aria-label={`添加图片 (${imageCount}/${maxImages})`}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {variant !== "composer" ? <span>图片</span> : null}
                </button>
              ) : null}

              {onAttachmentClick ? (
                <button
                  type="button"
                  onClick={onAttachmentClick}
                  disabled={isUploading || attachmentCount >= maxAttachments}
                  className={cn(
                    "inline-flex h-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45",
                    variant === "composer"
                      ? "w-9 rounded-md hover:bg-slate-100"
                      : "gap-1.5 rounded-md border border-slate-200 px-2.5 text-sm hover:bg-slate-50",
                  )}
                  title={`添加附件 (${attachmentCount}/${maxAttachments})`}
                  aria-label={`添加附件 (${attachmentCount}/${maxAttachments})`}
                >
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  {variant !== "composer" ? <span>附件</span> : null}
                </button>
              ) : null}

              {isUploading && onCancelUpload ? (
                <button
                  type="button"
                  onClick={onCancelUpload}
                  className={cn(
                    "inline-flex h-9 items-center justify-center text-red-600 transition-colors hover:bg-red-50",
                    variant === "composer"
                      ? "w-9 rounded-md"
                      : "gap-1.5 rounded-md border border-red-200 px-2.5 text-sm",
                  )}
                  title="取消上传"
                  aria-label="取消上传"
                >
                  {variant === "composer" ? <X className="h-4 w-4" aria-hidden="true" /> : <span>取消</span>}
                </button>
              ) : null}

              {onOpenEditor ? (
                <button
                  type="button"
                  onClick={onOpenEditor}
                  className={cn(
                    "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
                    variant === "composer"
                      ? "h-9 w-9 rounded-md bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      : "h-9 gap-1.5 rounded-md border border-slate-200 px-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                  title={variant === "composer" ? "打开完整编辑器" : "在编辑器中继续编辑"}
                  aria-label={variant === "composer" ? "打开完整编辑器" : "在编辑器中继续编辑"}
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  {variant !== "composer" ? <span>编辑器</span> : null}
                </button>
              ) : null}

              {isUploading && uploadStatus ? (
                <span className="max-w-[220px] truncate text-xs text-slate-400" title={uploadStatus}>
                  {uploadProgress > 0 ? `${uploadProgress}% ` : ""}{uploadStatus}
                </span>
              ) : null}
            </div>

            {(topicSelector || footerRight) ? (
              <div className="flex min-w-0 shrink-0 items-center gap-2">
                {topicSelector}
                {footerRight}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
