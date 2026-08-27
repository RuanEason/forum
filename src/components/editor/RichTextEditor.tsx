"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BetweenVerticalStart,
  Bold,
  Code2,
  Check,
  ChevronDown,
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
  Smile,
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
  isAllowedRichTextLineHeight,
  parseRichTextDocument,
  RICH_TEXT_LINE_HEIGHT_MAX,
  RICH_TEXT_LINE_HEIGHT_MIN,
  RICH_TEXT_LINE_HEIGHT_PRESETS,
  RICH_TEXT_LINE_HEIGHT_STEP,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";
import {
  createRichTextExtensions,
  RICH_TEXT_FONT_SIZES,
} from "@/lib/rich-text/extensions";
import { parseMarkdownHeadingPaste } from "@/lib/rich-text/paste";
import { EditableRichTextEmoji, EditableRichTextImage } from "@/components/editor/rich-text-editor-extensions";
import type { EditorImageInsertRequest, EditorOutlineItem } from "@/components/editor/types";
import EmojiPicker, { EmojiPickerPanel } from "@/components/EmojiPicker";
import type { CustomEmoji } from "@/types/emoji";

interface RichTextEditorProps {
  content?: string;
  value?: string;
  historyKey?: string;
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
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        "hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35",
        active && "bg-slate-200 text-slate-950 hover:bg-slate-200 hover:text-slate-950",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-slate-200" />;
}

function scheduleEditorTask(callback: () => void) {
  const taskId = window.setTimeout(callback, 0);
  return () => window.clearTimeout(taskId);
}

const LOCAL_HISTORY_VERSION = 1;
const LOCAL_HISTORY_MAX_ENTRIES = 50;
const LOCAL_HISTORY_MAX_BYTES = 2_000_000;
const LOCAL_HISTORY_GROUP_DELAY = 500;

interface LocalHistoryState {
  entries: string[];
  index: number;
  lastGroupAt: number;
}

interface StoredLocalHistory {
  version: number;
  entries: string[];
  index: number;
}

function getLocalHistoryStorageKey(historyKey: string): string {
  return `forum:rich-text-history:${encodeURIComponent(historyKey)}`;
}

function readLocalHistory(historyKey: string): StoredLocalHistory | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getLocalHistoryStorageKey(historyKey));
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredLocalHistory>;
    if (parsed.version !== LOCAL_HISTORY_VERSION || !Array.isArray(parsed.entries)) {
      return null;
    }

    const entries = parsed.entries.filter((entry): entry is string => (
      typeof entry === "string" && Boolean(parseRichTextDocument(entry))
    ));
    if (entries.length === 0) {
      return null;
    }

    const index = typeof parsed.index === "number" && Number.isInteger(parsed.index)
      ? Math.min(Math.max(parsed.index, 0), entries.length - 1)
      : entries.length - 1;

    return {
      version: LOCAL_HISTORY_VERSION,
      entries,
      index,
    };
  } catch {
    return null;
  }
}

function createLocalHistoryState(historyKey: string | undefined, content: string): LocalHistoryState {
  if (historyKey) {
    const stored = readLocalHistory(historyKey);
    if (stored) {
      if (stored.entries[stored.index] === content) {
        return { ...stored, lastGroupAt: 0 };
      }

      const matchingIndex = stored.entries.lastIndexOf(content);
      if (matchingIndex >= 0) {
        return {
          entries: stored.entries,
          index: matchingIndex,
          lastGroupAt: 0,
        };
      }
    }
  }

  return {
    entries: [content],
    index: 0,
    lastGroupAt: 0,
  };
}

function writeLocalHistory(historyKey: string, state: LocalHistoryState): void {
  if (typeof window === "undefined") {
    return;
  }

  const startIndex = Math.max(0, state.entries.length - LOCAL_HISTORY_MAX_ENTRIES);
  let entries = state.entries.slice(startIndex);
  let index = Math.min(Math.max(state.index - startIndex, 0), entries.length - 1);

  while (entries.length > 1 && JSON.stringify({
    version: LOCAL_HISTORY_VERSION,
    entries,
    index,
  }).length > LOCAL_HISTORY_MAX_BYTES) {
    entries = entries.slice(1);
    index = Math.max(0, index - 1);
  }

  const payload = JSON.stringify({
    version: LOCAL_HISTORY_VERSION,
    entries,
    index,
  } satisfies StoredLocalHistory);

  try {
    window.localStorage.setItem(getLocalHistoryStorageKey(historyKey), payload);
  } catch {
    try {
      const currentEntry = state.entries[state.index] ?? entries[entries.length - 1];
      window.localStorage.setItem(getLocalHistoryStorageKey(historyKey), JSON.stringify({
        version: LOCAL_HISTORY_VERSION,
        entries: [currentEntry],
        index: 0,
      } satisfies StoredLocalHistory));
    } catch {
      // localStorage can be unavailable or full; editing still works in memory.
    }
  }
}

function updateLocalHistoryState(
  historyRef: { current: LocalHistoryState },
  setHistoryState: (state: LocalHistoryState) => void,
  nextState: LocalHistoryState,
) {
  historyRef.current = nextState;
  setHistoryState(nextState);
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

type LineHeightToolbarValue = number | null | "mixed";

const LINE_HEIGHT_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: "默认" },
  ...RICH_TEXT_LINE_HEIGHT_PRESETS.map((value) => ({
    value,
    label: value === 1 ? "单倍" : `${value} 倍`,
  })),
];

function isLineHeightNode(nodeType: string): boolean {
  return nodeType === "paragraph" || nodeType === "heading";
}

function getBlockTargetPositions(
  editor: Editor,
  isTarget: (nodeType: string) => boolean,
): number[] {
  const { from, to } = editor.state.selection;
  const positions = new Set<number>();

  const addAncestors = (resolvedPosition: ReturnType<typeof editor.state.doc.resolve>) => {
    for (let depth = resolvedPosition.depth; depth > 0; depth -= 1) {
      const node = resolvedPosition.node(depth);
      if (isTarget(node.type.name)) {
        positions.add(resolvedPosition.before(depth));
      }
    }
  };

  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (isTarget(node.type.name)) {
      positions.add(position);
    }
    return true;
  });

  addAncestors(editor.state.doc.resolve(from));
  if (to !== from) {
    addAncestors(editor.state.doc.resolve(to));
  }

  return Array.from(positions).sort((left, right) => left - right);
}

function getLineHeightTargetPositions(editor: Editor): number[] {
  return getBlockTargetPositions(editor, isLineHeightNode);
}

type TextAlignToolbarValue = "left" | "center" | "right" | "justify" | "mixed" | null;

function getTextAlignToolbarValue(editor: Editor): TextAlignToolbarValue {
  const positions = getBlockTargetPositions(editor, isLineHeightNode);
  if (positions.length === 0) {
    return null;
  }

  const values = positions.map((position) => {
    const node = editor.state.doc.nodeAt(position);
    return node?.attrs.textAlign ?? "left";
  });
  const firstValue = values[0];

  return values.every((value) => value === firstValue)
    ? firstValue as Exclude<TextAlignToolbarValue, "mixed" | null>
    : "mixed";
}

function getLineHeightToolbarValue(editor: Editor): LineHeightToolbarValue {
  const positions = getLineHeightTargetPositions(editor);
  if (positions.length === 0) {
    return null;
  }

  const values = positions.map((position) => {
    const node = editor.state.doc.nodeAt(position);
    return node?.attrs.lineHeight ?? null;
  });
  const firstValue = values[0];

  return values.every((value) => value === firstValue) ? firstValue : "mixed";
}

function setLineHeightForSelection(editor: Editor, value: number | null): boolean {
  const positions = getLineHeightTargetPositions(editor);
  if (positions.length === 0) {
    return false;
  }

  const transaction = editor.state.tr;
  let changed = false;

  for (const position of positions) {
    const node = editor.state.doc.nodeAt(position);
    if (!node || !isLineHeightNode(node.type.name)) {
      continue;
    }

    const currentValue = node.attrs.lineHeight ?? null;
    if (currentValue === value) {
      continue;
    }

    transaction.setNodeMarkup(
      position,
      undefined,
      { ...node.attrs, lineHeight: value },
      node.marks,
    );
    changed = true;
  }

  if (!changed) {
    return false;
  }

  editor.view.focus();
  editor.view.dispatch(transaction);
  return true;
}

function formatLineHeight(value: number): string {
  return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function getLineHeightLabel(value: LineHeightToolbarValue): string {
  if (value === "mixed") {
    return "混合";
  }
  if (value === null) {
    return "默认";
  }

  const preset = LINE_HEIGHT_OPTIONS.find((option) => option.value === value);
  return preset?.label ?? `${formatLineHeight(value)} 倍`;
}

function LineHeightControl({
  editor,
  value,
  disabled,
}: {
  editor: Editor;
  value: LineHeightToolbarValue;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState(() => (
    typeof value === "number" ? formatLineHeight(value) : "1.5"
  ));
  const [customError, setCustomError] = useState("");
  const controlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (controlRef.current && !controlRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const applyValue = (nextValue: number | null) => {
    setLineHeightForSelection(editor, nextValue);
    setOpen(false);
    setCustomError("");
  };

  const applyCustomValue = () => {
    const parsedValue = Number(customValue);
    if (!isAllowedRichTextLineHeight(parsedValue)) {
      setCustomError(`请输入 ${RICH_TEXT_LINE_HEIGHT_MIN.toFixed(1)}–${RICH_TEXT_LINE_HEIGHT_MAX.toFixed(1)} 之间、最多两位小数的数值`);
      return;
    }

    applyValue(parsedValue);
  };

  const currentLabel = getLineHeightLabel(value);

  return (
    <div ref={controlRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        title="行距"
        aria-label={`行距：${currentLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-slate-600 transition-colors",
          "hover:bg-slate-100 hover:text-slate-950",
          open && "bg-slate-200 text-slate-950",
        )}
      >
        <BetweenVerticalStart className="h-4 w-4" />
        <span className="text-xs font-medium">{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="行距选项"
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
        >
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            行距
          </div>
          <div className="space-y-0.5">
            {LINE_HEIGHT_OPTIONS.map((option) => {
              const active = value !== "mixed" && value === option.value;

              return (
                <button
                  key={option.label}
                  type="button"
                  role="menuitem"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyValue(option.value)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span>{option.label}</span>
                  {active ? <Check className="h-4 w-4 text-slate-700" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-slate-100 pt-2">
            <label className="block px-2 text-xs font-medium text-slate-500" htmlFor="rich-text-custom-line-height">
              自定义倍数
            </label>
            <div className="mt-1 flex items-center gap-1.5 px-2">
              <input
                id="rich-text-custom-line-height"
                type="number"
                min={RICH_TEXT_LINE_HEIGHT_MIN}
                max={RICH_TEXT_LINE_HEIGHT_MAX}
                step={RICH_TEXT_LINE_HEIGHT_STEP}
                inputMode="decimal"
                value={customValue}
                onChange={(event) => {
                  setCustomValue(event.target.value);
                  setCustomError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCustomValue();
                  }
                }}
                className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-xs text-slate-500">倍</span>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={applyCustomValue}
                className="h-8 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                应用
              </button>
            </div>
            {customError ? <p className="px-2 pt-1 text-[11px] leading-4 text-red-600">{customError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function promptForEditorLink(editor: Editor) {
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
    window.alert("链接只支持 http、https 或有效的邮箱地址");
    return;
  }

  editor.chain().focus().setLink({ href: normalized }).run();
}

function RichTextToolbar({
  editor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: {
  editor: Editor;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  className?: string;
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
      const textAlign = getTextAlignToolbarValue(currentEditor);

      return {
        headingLevel: currentEditor.isActive("heading") && [1, 2, 3, 4].includes(headingLevel)
          ? String(headingLevel)
          : "paragraph",
        fontFamily: textStyleAttributes.fontFamily ?? "",
        fontSize: textStyleAttributes.fontSize ?? "",
        lineHeight: getLineHeightToolbarValue(currentEditor),
        canSetLineHeight: getLineHeightTargetPositions(currentEditor).length > 0,
        canUndo: canUndo ?? currentEditor.can().undo(),
        canRedo: canRedo ?? currentEditor.can().redo(),
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        strike: currentEditor.isActive("strike"),
        textAlign,
        alignLeft: textAlign === "left",
        alignCenter: textAlign === "center",
        alignRight: textAlign === "right",
        alignJustify: textAlign === "justify",
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

  return (
    <div className={cn(
      "flex min-h-12 flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2",
      className,
    )}>
      <ToolbarButton
        label="撤销"
        disabled={!toolbarState.canUndo}
        onClick={() => onUndo ? onUndo() : run((item) => item.chain().focus().undo().run())}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="重做"
        disabled={!toolbarState.canRedo}
        onClick={() => onRedo ? onRedo() : run((item) => item.chain().focus().redo().run())}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <EmojiPicker
        onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()}
        onSelectCustomEmoji={(emoji: CustomEmoji) => {
          editor.chain().focus().insertContent({
            type: "emoji",
            attrs: { src: emoji.url, alt: emoji.name, title: emoji.name },
          }).run();
        }}
        placement="bottom"
        buttonClassName="h-8 w-8"
      />

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

      <LineHeightControl
        key={`line-height-${String(toolbarState.lineHeight)}`}
        editor={editor}
        value={toolbarState.lineHeight}
        disabled={!toolbarState.canSetLineHeight}
      />

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
      <ToolbarButton label="链接" active={toolbarState.link} onClick={() => promptForEditorLink(editor)}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="清除格式" onClick={() => run((item) => item.chain().focus().unsetAllMarks().clearNodes().run())}>
        <Eraser className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

function MobileAccessoryToolbar({
  editor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  visible,
  offsetY,
  emojiPanelOpen,
  onToggleEmojiPanel,
  onEmojiPanelDismiss,
}: {
  editor: Editor;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  visible: boolean;
  offsetY: number;
  emojiPanelOpen: boolean;
  onToggleEmojiPanel: () => void;
  onEmojiPanelDismiss: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canUndo: canUndo ?? currentEditor.can().undo(),
      canRedo: canRedo ?? currentEditor.can().redo(),
      bold: currentEditor.isActive("bold"),
      italic: currentEditor.isActive("italic"),
      underline: currentEditor.isActive("underline"),
      strike: currentEditor.isActive("strike"),
      bulletList: currentEditor.isActive("bulletList"),
      orderedList: currentEditor.isActive("orderedList"),
      blockquote: currentEditor.isActive("blockquote"),
      link: currentEditor.isActive("link"),
    }),
  });

  useEffect(() => {
    if (!emojiPanelOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node;
      if (containerRef.current?.contains(targetNode)) {
        return;
      }
      if (editor.view.dom.contains(targetNode)) {
        return;
      }
      onEmojiPanelDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [emojiPanelOpen, editor, onEmojiPanelDismiss]);

  if (!visible) {
    return null;
  }

  const run = (callback: (editor: Editor) => void) => {
    callback(editor);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-[70] md:hidden"
      style={{ transform: `translateY(${offsetY}px) translateY(-100%)` }}
    >
      <div className="border-t border-slate-200 bg-white shadow-[0_-6px_20px_rgba(15,23,42,0.10)]">
        <div className="flex items-stretch gap-1 px-1.5 py-1.5">
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onToggleEmojiPanel}
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                emojiPanelOpen && "bg-slate-200 text-slate-950 hover:bg-slate-200 hover:text-slate-950",
              )}
              title="表情"
              aria-label="表情"
              aria-expanded={emojiPanelOpen}
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            <ToolbarButton
              label="撤销"
              disabled={!toolbarState.canUndo}
              onClick={() => onUndo ? onUndo() : run((item) => item.chain().focus().undo().run())}
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label="重做"
              disabled={!toolbarState.canRedo}
              onClick={() => onRedo ? onRedo() : run((item) => item.chain().focus().redo().run())}
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>

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

            <ToolbarDivider />

            <ToolbarButton label="无序列表" active={toolbarState.bulletList} onClick={() => run((item) => item.chain().focus().toggleBulletList().run())}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="有序列表" active={toolbarState.orderedList} onClick={() => run((item) => item.chain().focus().toggleOrderedList().run())}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="引用" active={toolbarState.blockquote} onClick={() => run((item) => item.chain().focus().toggleBlockquote().run())}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="链接" active={toolbarState.link} onClick={() => promptForEditorLink(editor)}>
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton label="清除格式" onClick={() => run((item) => item.chain().focus().unsetAllMarks().clearNodes().run())}>
              <Eraser className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>

        {emojiPanelOpen ? (
          <div className="border-t border-slate-200">
            <EmojiPickerPanel
              onSelect={(emoji) => editor.chain().insertContent(emoji).run()}
              onSelectCustomEmoji={(emoji: CustomEmoji) => {
                editor.chain().insertContent({
                  type: "emoji",
                  attrs: { src: emoji.url, alt: emoji.name, title: emoji.name },
                }).run();
              }}
              pickerHeight={280}
              autoFocusSearch={false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RichTextEditor({
  content: contentProp,
  value,
  historyKey,
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
  const localHistoryEnabled = Boolean(historyKey);
  const [localHistoryState, setLocalHistoryState] = useState<LocalHistoryState>(() => (
    createLocalHistoryState(historyKey, content)
  ));
  const localHistoryRef = useRef(localHistoryState);
  const historyInitializedKeyRef = useRef<string | undefined>(undefined);
  const localUndoRef = useRef<() => boolean>(() => false);
  const localRedoRef = useRef<() => boolean>(() => false);

  const resetLocalHistory = useCallback((nextContent: string) => {
    if (!historyKey) {
      return;
    }

    const nextState = createLocalHistoryState(historyKey, nextContent);
    updateLocalHistoryState(localHistoryRef, setLocalHistoryState, nextState);
    writeLocalHistory(historyKey, nextState);
  }, [historyKey]);

  const recordLocalHistory = useCallback((nextContent: string) => {
    if (!historyKey || !localHistoryEnabled) {
      return;
    }

    const currentState = localHistoryRef.current;
    if (currentState.entries[currentState.index] === nextContent) {
      return;
    }

    const now = Date.now();
    const canMerge = currentState.index === currentState.entries.length - 1
      && currentState.lastGroupAt > 0
      && now - currentState.lastGroupAt <= LOCAL_HISTORY_GROUP_DELAY;
    const entries = currentState.index < currentState.entries.length - 1
      ? currentState.entries.slice(0, currentState.index + 1)
      : currentState.entries.slice();

    if (canMerge && entries.length > 1) {
      entries[entries.length - 1] = nextContent;
    } else {
      entries.push(nextContent);
    }

    const nextState: LocalHistoryState = {
      entries,
      index: entries.length - 1,
      lastGroupAt: now,
    };
    updateLocalHistoryState(localHistoryRef, setLocalHistoryState, nextState);
    writeLocalHistory(historyKey, nextState);
  }, [historyKey, localHistoryEnabled]);

  const emitDocument = useCallback((editor: Editor) => {
    const nextContent = serializeRichTextDocument(editor.getJSON());
    lastEmittedContentRef.current = nextContent;
    onChange(nextContent);
    onOutlineChange(getEditorOutline(editor));
    onActivePositionChange(editor.state.selection.from);
    return nextContent;
  }, [onActivePositionChange, onChange, onOutlineChange]);

  const editor = useEditor({
    extensions: createRichTextExtensions({
      imageExtension: EditableRichTextImage,
      emojiExtension: EditableRichTextEmoji,
      placeholder,
      disableHistory: localHistoryEnabled,
    }),
    content: initialContent,
    immediatelyRender: false,
    onCreate: ({ editor: createdEditor }) => {
      lastEmittedContentRef.current = content;
      onOutlineChange(getEditorOutline(createdEditor));
      onActivePositionChange(createdEditor.state.selection.from);
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const nextContent = emitDocument(updatedEditor);
      recordLocalHistory(nextContent);
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
        if (localHistoryEnabled && (event.ctrlKey || event.metaKey)) {
          const key = event.key.toLowerCase();
          if (key === "z" || key === "y") {
            event.preventDefault();
            if (key === "y" || event.shiftKey) {
              localRedoRef.current();
            } else {
              localUndoRef.current();
            }
            return true;
          }
        }

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
      handlePaste: (view, event) => {
        const plainText = event.clipboardData?.getData("text/plain") ?? "";
        const blocks = parseMarkdownHeadingPaste(plainText);
        if (!blocks) {
          return false;
        }

        try {
          const nodes = blocks.map((block) => view.state.schema.nodeFromJSON(block));
          const transaction = view.state.tr.replaceSelection(
            new Slice(Fragment.from(nodes), 0, 0),
          );
          view.dispatch(transaction);
          event.preventDefault();
          return true;
        } catch {
          return false;
        }
      },
    },
  });

  const applyLocalHistory = useCallback((direction: "undo" | "redo"): boolean => {
    if (!editor || !localHistoryEnabled || !historyKey || editor.isDestroyed) {
      return false;
    }

    const currentState = localHistoryRef.current;
    const nextIndex = direction === "undo"
      ? currentState.index - 1
      : currentState.index + 1;
    const nextContent = currentState.entries[nextIndex];
    const nextDocument = nextContent ? parseRichTextDocument(nextContent) : null;
    if (!nextDocument) {
      return false;
    }

    const nextState: LocalHistoryState = {
      entries: currentState.entries,
      index: nextIndex,
      lastGroupAt: 0,
    };
    updateLocalHistoryState(localHistoryRef, setLocalHistoryState, nextState);
    writeLocalHistory(historyKey, nextState);
    editor.commands.setContent(nextDocument, false);
    editor.commands.focus();
    emitDocument(editor);
    return true;
  }, [editor, emitDocument, historyKey, localHistoryEnabled]);

  useEffect(() => {
    localUndoRef.current = () => applyLocalHistory("undo");
    localRedoRef.current = () => applyLocalHistory("redo");

    return () => {
      localUndoRef.current = () => false;
      localRedoRef.current = () => false;
    };
  }, [applyLocalHistory]);

  useEffect(() => {
    if (!editor || !localHistoryEnabled || !historyKey) {
      return;
    }

    if (historyInitializedKeyRef.current !== historyKey) {
      historyInitializedKeyRef.current = historyKey;
      resetLocalHistory(content);
    }
  }, [content, editor, historyKey, localHistoryEnabled, resetLocalHistory]);

  useEffect(() => {
    if (!editor || content === lastEmittedContentRef.current) {
      return;
    }

    if (localHistoryEnabled) {
      resetLocalHistory(content);
    }

    const nextDocument = parseRichTextDocument(content) ?? createEmptyRichTextDocument();
    return scheduleEditorTask(() => {
      if (editor.isDestroyed) {
        return;
      }

      editor.commands.setContent(nextDocument, false);
      lastEmittedContentRef.current = content;
      onOutlineChange(getEditorOutline(editor));
    });
  }, [content, editor, localHistoryEnabled, onOutlineChange, resetLocalHistory]);

  useEffect(() => {
    if (!editor || !imageInsertRequest) {
      return;
    }

    return scheduleEditorTask(() => {
      if (editor.isDestroyed) {
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
    });
  }, [editor, imageInsertRequest, onImageInsertHandled]);

  useEffect(() => {
    if (!editor || externalJumpPosition === null) {
      return;
    }

    return scheduleEditorTask(() => {
      if (editor.isDestroyed) {
        return;
      }

      const position = Math.max(
        1,
        Math.min(externalJumpPosition, editor.state.doc.content.size),
      );
      editor.chain().focus(position).scrollIntoView().run();
      onExternalJumpHandled();
    });
  }, [editor, externalJumpPosition, onExternalJumpHandled]);

  const isMobileAccessoryEnabled = variant === "composer" && typeof window !== "undefined" && Boolean(window.visualViewport);
  const [isAccessoryBarVisible, setIsAccessoryBarVisible] = useState(false);
  const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);
  const [mobileKeyboardState, setMobileKeyboardState] = useState<{ open: boolean; offsetY: number }>(() => ({
    open: false,
    offsetY: 0,
  }));
  const accessoryHideTimerRef = useRef<number | null>(null);

  const cancelAccessoryBarHide = useCallback(() => {
    if (accessoryHideTimerRef.current !== null) {
      window.clearTimeout(accessoryHideTimerRef.current);
      accessoryHideTimerRef.current = null;
    }
  }, []);

  const scheduleAccessoryBarHide = useCallback(() => {
    if (accessoryHideTimerRef.current !== null) {
      return;
    }
    accessoryHideTimerRef.current = window.setTimeout(() => {
      accessoryHideTimerRef.current = null;
      setIsAccessoryBarVisible(false);
    }, 350);
  }, []);

  useEffect(() => {
    return () => {
      if (accessoryHideTimerRef.current !== null) {
        window.clearTimeout(accessoryHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileAccessoryEnabled || !editor || editor.isDestroyed) {
      return;
    }

    const handleFocus = () => {
      cancelAccessoryBarHide();
      setIsAccessoryBarVisible(true);
      setIsEmojiPanelOpen(false);
    };
    const handleBlur = () => {
      scheduleAccessoryBarHide();
    };

    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor, isMobileAccessoryEnabled, cancelAccessoryBarHide, scheduleAccessoryBarHide]);

  useEffect(() => {
    if (!isMobileAccessoryEnabled) {
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    let baselineHeight = viewport.height;
    let baselineLandscape = window.innerWidth > window.innerHeight;

    const update = () => {
      const height = viewport.height;
      const landscape = window.innerWidth > window.innerHeight;

      if (height > baselineHeight || landscape !== baselineLandscape) {
        baselineHeight = height;
        baselineLandscape = landscape;
      }

      const open = height < window.innerHeight - 120
        || baselineHeight - height > 120;
      const offsetY = Math.round(viewport.offsetTop + height);

      setMobileKeyboardState((current) => {
        if (current.open === open && current.offsetY === offsetY) {
          return current;
        }
        return { open, offsetY };
      });

      if (open && editor && !editor.isDestroyed && editor.isFocused) {
        cancelAccessoryBarHide();
        setIsAccessoryBarVisible(true);
      } else if (!open) {
        scheduleAccessoryBarHide();
      }
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [editor, isMobileAccessoryEnabled, cancelAccessoryBarHide, scheduleAccessoryBarHide]);

  const handleToggleEmojiPanel = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    if (isEmojiPanelOpen) {
      setIsEmojiPanelOpen(false);
      editor.commands.focus();
    } else {
      setIsEmojiPanelOpen(true);
      editor.commands.blur();
    }
  }, [editor, isEmojiPanelOpen]);

  const handleDismissEmojiPanel = useCallback(() => {
    setIsEmojiPanelOpen(false);
  }, []);

  if (!editor) {
    return <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-400">正在加载编辑器...</div>;
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f7fa]">
        <RichTextToolbar
          editor={editor}
          canUndo={localHistoryEnabled ? localHistoryState.index > 0 : undefined}
          canRedo={localHistoryEnabled ? localHistoryState.index < localHistoryState.entries.length - 1 : undefined}
          onUndo={localHistoryEnabled ? () => localUndoRef.current() : undefined}
          onRedo={localHistoryEnabled ? () => localRedoRef.current() : undefined}
          className={variant === "composer" ? "hidden md:flex" : undefined}
        />
        <div className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          variant === "composer" ? "p-0" : "p-4 sm:p-6",
        )}>
          <div className={cn(
            "min-h-full bg-white",
            variant === "composer"
              ? "rich-text-composer-mobile w-full max-w-none px-6 py-7 sm:px-10"
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
                        ? "hidden h-9 w-9 rounded-md bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700 md:inline-flex"
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

      {variant === "composer" ? (
        <MobileAccessoryToolbar
          editor={editor}
          canUndo={localHistoryEnabled ? localHistoryState.index > 0 : undefined}
          canRedo={localHistoryEnabled ? localHistoryState.index < localHistoryState.entries.length - 1 : undefined}
          onUndo={localHistoryEnabled ? () => localUndoRef.current() : undefined}
          onRedo={localHistoryEnabled ? () => localRedoRef.current() : undefined}
          visible={isMobileAccessoryEnabled && (isAccessoryBarVisible || isEmojiPanelOpen)}
          offsetY={mobileKeyboardState.offsetY}
          emojiPanelOpen={isEmojiPanelOpen}
          onToggleEmojiPanel={handleToggleEmojiPanel}
          onEmojiPanelDismiss={handleDismissEmojiPanel}
        />
      ) : null}
    </>
  );
}
