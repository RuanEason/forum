"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import PostContentRenderer from "@/components/PostContentRenderer";
import { extractMarkdownHeadings, normalizeMarkdownForDisplay } from "@/lib/markdown";

interface DualPaneEditorProps {
  content: string;
  styleCss?: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
}

function getScrollableDistance(element: HTMLElement) {
  return Math.max(element.scrollHeight - element.clientHeight, 0);
}

function syncScrollByProgress(source: HTMLElement, target: HTMLElement) {
  const sourceDistance = getScrollableDistance(source);
  const targetDistance = getScrollableDistance(target);
  const progress = sourceDistance === 0 ? 0 : source.scrollTop / sourceDistance;

  target.scrollTop = targetDistance * progress;
}

function getEditorLineHeight(textarea: HTMLTextAreaElement) {
  const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
  return Number.isFinite(lineHeight) ? lineHeight : 28;
}

function escapeAttributeValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export default function DualPaneEditor({
  content,
  styleCss = "",
  onChange,
  onSave,
  onPublish,
  activeLineNumber: _activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
}: DualPaneEditorProps) {
  void _activeLineNumber;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef(false);
  const scrollSyncFrameRef = useRef<number | null>(null);

  const normalizedContent = useMemo(() => normalizeMarkdownForDisplay(content), [content]);
  const contentHeadings = useMemo(() => extractMarkdownHeadings(normalizedContent), [normalizedContent]);
  const visibleLineCount = useMemo(() => Math.max(normalizedContent.split(/\r?\n/).length, 1), [normalizedContent]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const previewPane = previewPaneRef.current;
    if (!textarea || !previewPane) {
      return;
    }

    const releaseScrollLock = () => {
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
      }

      scrollSyncFrameRef.current = window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
        scrollSyncFrameRef.current = null;
      });
    };

    const syncPreviewFromEditor = (source: HTMLElement) => {
      if (isSyncingScrollRef.current) {
        return;
      }

      isSyncingScrollRef.current = true;
      syncScrollByProgress(source, previewPane);
      releaseScrollLock();
    };

    const syncEditorFromPreview = (source: HTMLElement) => {
      if (isSyncingScrollRef.current) {
        return;
      }

      isSyncingScrollRef.current = true;
      syncScrollByProgress(source, textarea);
      releaseScrollLock();
    };

    const handleEditorScroll = (event: Event) => {
      const source = event.currentTarget;
      if (!(source instanceof HTMLElement)) {
        return;
      }

      const lineHeight = getEditorLineHeight(textarea);
      const nextLineNumber = Math.max(1, Math.floor(source.scrollTop / lineHeight) + 1);
      setActiveLineNumber(Math.min(nextLineNumber, visibleLineCount));
      syncPreviewFromEditor(source);
    };

    const handlePreviewScroll = (event: Event) => {
      const source = event.currentTarget;
      if (!(source instanceof HTMLElement)) {
        return;
      }

      syncEditorFromPreview(source);
    };

    textarea.addEventListener("scroll", handleEditorScroll, { passive: true });
    previewPane.addEventListener("scroll", handlePreviewScroll, { passive: true });

    return () => {
      textarea.removeEventListener("scroll", handleEditorScroll);
      previewPane.removeEventListener("scroll", handlePreviewScroll);
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
        scrollSyncFrameRef.current = null;
      }
      isSyncingScrollRef.current = false;
    };
  }, [setActiveLineNumber, visibleLineCount]);

  useEffect(() => {
    if (!externalJumpLine) {
      return;
    }

    const textarea = textareaRef.current;
    const previewPane = previewPaneRef.current;
    if (!textarea || !previewPane) {
      onExternalJumpHandled();
      return;
    }

    const lines = normalizedContent.split(/\r?\n/);
    const targetHeading = contentHeadings.find((heading) => heading.lineNumber === externalJumpLine);
    let cursor = 0;

    for (let index = 0; index < Math.max(0, externalJumpLine - 1); index += 1) {
      cursor += (lines[index]?.length ?? 0) + 1;
    }

    const nextScrollTop = Math.max(0, (externalJumpLine - 3) * getEditorLineHeight(textarea));

    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
    textarea.scrollTop = nextScrollTop;

    const targetPreviewHeading = targetHeading
      ? previewPane.querySelector<HTMLElement>(
        `[data-editor-heading-id="${escapeAttributeValue(targetHeading.id)}"]`,
      )
      : null;

    if (targetPreviewHeading) {
      previewPane.scrollTop = Math.max(targetPreviewHeading.offsetTop - 24, 0);
    } else {
      syncScrollByProgress(textarea, previewPane);
    }

    setActiveLineNumber(externalJumpLine);
    onExternalJumpHandled();
  }, [
    contentHeadings,
    externalJumpLine,
    normalizedContent,
    onExternalJumpHandled,
    setActiveLineNumber,
  ]);

  const updateLineFromSelection = (value: string, selectionStart: number) => {
    const lineNumber = value.slice(0, selectionStart).split(/\r?\n/).length;
    setActiveLineNumber(lineNumber);
  };

  const syncSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    updateLineFromSelection(textarea.value, textarea.selectionStart);
  };

  const handleTextareaKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        onSave();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onPublish();
      }
    }
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateLineFromSelection(event.target.value, event.target.selectionStart);
    onChange(event.target.value);
  };

  return (
    <div className="flex min-h-0 flex-1 gap-0 bg-[#f5f7fa] p-4">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Markdown 源码
        </div>
        <textarea
          ref={textareaRef}
          value={normalizedContent}
          onChange={handleTextareaChange}
          onClick={syncSelection}
          onKeyUp={syncSelection}
          onSelect={syncSelection}
          onKeyDown={handleTextareaKeyDown}
          placeholder="# 从这里开始写作"
          spellCheck={false}
          wrap="off"
          className="min-h-0 flex-1 resize-none border-0 bg-white px-5 py-4 font-mono text-[14px] leading-7 text-slate-900 outline-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border border-l-0 border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          详情页预览
        </div>
        <div ref={previewPaneRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <PostContentRenderer
            postId="editor-preview"
            title={null}
            content={normalizedContent}
            styleConfig={null}
            styleCss={styleCss}
            withHeadingIds={true}
            headingDataAttributeName="data-editor-heading-id"
          />
        </div>
      </div>
    </div>
  );
}
