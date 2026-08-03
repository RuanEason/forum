"use client";

import {
  Bold,
  Check,
  ChevronDown,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  MoreHorizontal,
  Quote,
  Redo2,
  Smile,
  Strikethrough,
  Text,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Ref } from "react";
import type {
  MarkdownBlockFormat,
  MarkdownInlineFormat,
} from "@/components/editor/markdown-editor-utils";
import { cn } from "@/lib/utils";

interface MarkdownFormattingToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  selectedText: string;
  onUndo: () => void;
  onRedo: () => void;
  onInlineFormat: (format: MarkdownInlineFormat) => void;
  onBlockFormat: (format: MarkdownBlockFormat) => void;
  onCodeBlock: () => void;
  onHorizontalRule: () => void;
  onClearFormatting: () => void;
  onInsertLink: (label: string, url: string) => boolean;
  onRemoveLink: () => void;
  onOpenImagePool: () => void;
  onInsertEmoji: (emoji: string) => void;
}

type OpenMenu = "heading" | "link" | "emoji" | "more" | null;

const EMOJI_OPTIONS = [
  "😀",
  "😄",
  "😅",
  "😂",
  "😍",
  "🤔",
  "😎",
  "😭",
  "😡",
  "👍",
  "👎",
  "👏",
  "🙏",
  "🎉",
  "❤️",
  "🔥",
  "✨",
  "✅",
  "❌",
  "💡",
];

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" aria-hidden="true" />;
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
}

function ToolbarButton({
  label,
  icon,
  onClick,
  disabled = false,
  active = false,
  className,
  buttonRef,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      ref={buttonRef}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-slate-600 transition-colors",
        "hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
        "disabled:cursor-not-allowed disabled:opacity-35",
        active && "border-blue-200 bg-blue-50 text-blue-700",
        className,
      )}
    >
      {icon}
    </button>
  );
}

interface MenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

function MenuItem({ label, icon, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-500">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

interface ToolbarPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

function ToolbarPopover({ anchorRef, children }: ToolbarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 8, left: 8 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const popover = popoverRef.current;
    const margin = 8;
    const gap = 8;
    const popoverWidth = popover?.offsetWidth ?? 320;
    const popoverHeight = popover?.offsetHeight ?? 280;
    const fitsBelow = rect.bottom + gap + popoverHeight <= window.innerHeight - margin;
    const fitsAbove = rect.top - gap - popoverHeight >= margin;
    const top = fitsBelow || !fitsAbove
      ? Math.min(
        rect.bottom + gap,
        Math.max(margin, window.innerHeight - popoverHeight - margin),
      )
      : rect.top - gap - popoverHeight;
    const left = Math.max(
      margin,
      Math.min(rect.left, window.innerWidth - popoverWidth - margin),
    );

    setPosition({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updatePosition);
    if (resizeObserver && popoverRef.current) {
      resizeObserver.observe(popoverRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [updatePosition]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className="max-h-[calc(100dvh-1rem)] overflow-y-auto border border-slate-200 bg-white p-1.5 shadow-[0_14px_32px_rgba(15,23,42,0.16)]"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

export default function MarkdownFormattingToolbar({
  canUndo,
  canRedo,
  selectedText,
  onUndo,
  onRedo,
  onInlineFormat,
  onBlockFormat,
  onCodeBlock,
  onHorizontalRule,
  onClearFormatting,
  onInsertLink,
  onRemoveLink,
  onOpenImagePool,
  onInsertEmoji,
}: MarkdownFormattingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const headingButtonRef = useRef<HTMLButtonElement | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const linkLabelRef = useRef<HTMLInputElement | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    if (openMenu === "link") {
      window.requestAnimationFrame(() => linkLabelRef.current?.focus());
    }
  }, [openMenu]);

  const openLinkMenu = () => {
    setLinkLabel(selectedText || "链接文字");
    setLinkUrl("https://");
    setLinkError("");
    setOpenMenu("link");
  };

  const submitLink = () => {
    if (!onInsertLink(linkLabel, linkUrl)) {
      setLinkError("请输入有效的 http、https 或 mailto 链接");
      return;
    }

    setOpenMenu(null);
  };

  const runMenuAction = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  return (
    <div
      ref={toolbarRef}
      className="relative z-20 flex min-h-12 shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur"
      role="toolbar"
      aria-label="Markdown 格式工具栏"
      aria-orientation="horizontal"
    >
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="flex min-w-max items-center gap-0.5">
        <ToolbarButton label="撤销" icon={<Undo2 className="h-4 w-4" />} onClick={onUndo} disabled={!canUndo} />
        <ToolbarButton label="重做" icon={<Redo2 className="h-4 w-4" />} onClick={onRedo} disabled={!canRedo} />

        <ToolbarDivider />

        <div className="relative">
          <button
            type="button"
            ref={headingButtonRef}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setOpenMenu((current) => current === "heading" ? null : "heading")}
            aria-label="段落和标题"
            aria-haspopup="menu"
            aria-expanded={openMenu === "heading"}
            title="段落和标题"
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1 border border-transparent px-2 text-slate-600 transition-colors",
              "hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
              openMenu === "heading" && "border-slate-200 bg-slate-100 text-slate-950",
            )}
          >
            <Text className="h-4 w-4" />
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {openMenu === "heading" ? (
            <ToolbarPopover anchorRef={headingButtonRef}>
              <div role="menu" aria-label="段落和标题" className="min-w-40">
                <MenuItem label="普通段落" icon={<Text className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("paragraph"))} />
                <MenuItem label="一级标题" icon={<Heading1 className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("heading1"))} />
                <MenuItem label="二级标题" icon={<Heading2 className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("heading2"))} />
                <MenuItem label="三级标题" icon={<Heading3 className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("heading3"))} />
                <MenuItem label="四级标题" icon={<Heading4 className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("heading4"))} />
              </div>
            </ToolbarPopover>
          ) : null}
        </div>

        <ToolbarButton label="粗体" icon={<Bold className="h-4 w-4" />} onClick={() => onInlineFormat("bold")} />
        <ToolbarButton label="斜体" icon={<Italic className="h-4 w-4" />} onClick={() => onInlineFormat("italic")} />
        <ToolbarButton label="删除线" icon={<Strikethrough className="h-4 w-4" />} onClick={() => onInlineFormat("strike")} />

        <ToolbarDivider />

        <ToolbarButton label="无序列表" icon={<List className="h-4 w-4" />} onClick={() => onBlockFormat("bulletList")} />
        <ToolbarButton label="有序列表" icon={<ListOrdered className="h-4 w-4" />} onClick={() => onBlockFormat("orderedList")} />

        <ToolbarDivider />

        <div className="relative">
          <ToolbarButton
            label="插入链接"
            icon={<Link2 className="h-4 w-4" />}
            onClick={openLinkMenu}
            active={openMenu === "link"}
            buttonRef={linkButtonRef}
          />
          {openMenu === "link" ? (
            <ToolbarPopover anchorRef={linkButtonRef}>
              <div className="w-72 space-y-3 p-1" role="dialog" aria-label="插入链接">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">插入链接</span>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(null)}
                    aria-label="关闭链接弹窗"
                    title="关闭"
                    className="inline-flex h-7 w-7 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label className="block text-xs font-medium text-slate-600">
                  文字
                  <input
                    ref={linkLabelRef}
                    value={linkLabel}
                    onChange={(event) => setLinkLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitLink();
                      }
                    }}
                    className="mt-1 h-9 w-full border border-slate-200 px-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  链接
                  <input
                    value={linkUrl}
                    onChange={(event) => {
                      setLinkUrl(event.target.value);
                      setLinkError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitLink();
                      }
                    }}
                    className="mt-1 h-9 w-full border border-slate-200 px-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                {linkError ? <p className="text-xs leading-5 text-red-600">{linkError}</p> : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onRemoveLink();
                      setOpenMenu(null);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    清除链接
                  </button>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={submitLink}
                    className="inline-flex h-8 items-center gap-1.5 bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    <Check className="h-3.5 w-3.5" />
                    插入
                  </button>
                </div>
              </div>
            </ToolbarPopover>
          ) : null}
        </div>

        <ToolbarButton label="打开图片库" icon={<ImagePlus className="h-4 w-4" />} onClick={onOpenImagePool} />

        <div className="relative">
          <ToolbarButton
            label="插入表情"
            icon={<Smile className="h-4 w-4" />}
            onClick={() => setOpenMenu((current) => current === "emoji" ? null : "emoji")}
            active={openMenu === "emoji"}
            buttonRef={emojiButtonRef}
          />
          {openMenu === "emoji" ? (
            <ToolbarPopover anchorRef={emojiButtonRef}>
              <div role="menu" aria-label="表情" className="grid w-48 grid-cols-5 gap-1 p-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="menuitem"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runMenuAction(() => onInsertEmoji(emoji))}
                    aria-label={`插入 ${emoji}`}
                    title={`插入 ${emoji}`}
                    className="inline-flex h-8 w-8 items-center justify-center text-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ToolbarPopover>
          ) : null}
        </div>

        <div className="relative">
          <ToolbarButton
            label="更多 Markdown 操作"
            icon={<MoreHorizontal className="h-4 w-4" />}
            onClick={() => setOpenMenu((current) => current === "more" ? null : "more")}
            active={openMenu === "more"}
            buttonRef={moreButtonRef}
          />
          {openMenu === "more" ? (
            <ToolbarPopover anchorRef={moreButtonRef}>
              <div role="menu" aria-label="更多 Markdown 操作" className="min-w-44">
                <MenuItem label="任务列表" icon={<ListTodo className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("taskList"))} />
                <MenuItem label="引用" icon={<Quote className="h-4 w-4" />} onClick={() => runMenuAction(() => onBlockFormat("blockquote"))} />
                <MenuItem label="行内代码" icon={<Code2 className="h-4 w-4" />} onClick={() => runMenuAction(() => onInlineFormat("code"))} />
                <MenuItem label="代码块" icon={<Code2 className="h-4 w-4" />} onClick={() => runMenuAction(onCodeBlock)} />
                <MenuItem label="分隔线" icon={<Minus className="h-4 w-4" />} onClick={() => runMenuAction(onHorizontalRule)} />
                <MenuItem label="清除常见格式" icon={<Eraser className="h-4 w-4" />} onClick={() => runMenuAction(onClearFormatting)} />
              </div>
            </ToolbarPopover>
          ) : null}
        </div>
      </div>
    </div>
    </div>
  );
}
