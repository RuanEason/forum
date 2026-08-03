"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import PostContentRenderer from "@/components/PostContentRenderer";
import MarkdownFormattingToolbar from "@/components/editor/MarkdownFormattingToolbar";
import {
  applyBlockFormat,
  applyCodeBlock,
  applyHorizontalRule,
  applyInlineFormat,
  applyLink,
  clearInlineMarkdown,
  insertText,
  normalizeMarkdownUrl,
  removeLink,
} from "@/components/editor/markdown-editor-utils";
import type {
  MarkdownBlockFormat,
  MarkdownInlineFormat,
  MarkdownSelection,
} from "@/components/editor/markdown-editor-utils";
import { extractMarkdownHeadings, normalizeMarkdownForDisplay } from "@/lib/markdown";
import type { EditorImageInsertRequest } from "@/components/editor/types";

interface DualPaneEditorProps {
  documentKey: string;
  content: string;
  styleCss?: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
  imageInsertRequest: EditorImageInsertRequest | null;
  onImageInsertHandled: () => void;
  onOpenImagePool: () => void;
}

interface HistoryEntry {
  value: string;
  selectionStart: number;
  selectionEnd: number;
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
  documentKey,
  content,
  styleCss = "",
  onChange,
  onSave,
  onPublish,
  activeLineNumber: _activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
  imageInsertRequest,
  onImageInsertHandled,
  onOpenImagePool,
}: DualPaneEditorProps) {
  void _activeLineNumber;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef(false);
  const scrollSyncFrameRef = useRef<number | null>(null);
  const selectionRef = useRef<MarkdownSelection>({ start: 0, end: 0 });
  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const lastHistoryValueRef = useRef("");
  const lastEmittedValueRef = useRef<string | null>(null);
  const lastHistoryKindRef = useRef<"typing" | "command" | "external">("external");
  const lastTypingAtRef = useRef(0);
  const selectionRestoreFrameRef = useRef<number | null>(null);
  const lastDocumentKeyRef = useRef(documentKey);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [selectedText, setSelectedText] = useState("");

  const normalizedContent = useMemo(() => normalizeMarkdownForDisplay(content), [content]);
  const contentHeadings = useMemo(() => extractMarkdownHeadings(normalizedContent), [normalizedContent]);
  const visibleLineCount = useMemo(() => Math.max(normalizedContent.split(/\r?\n/).length, 1), [normalizedContent]);

  const updateHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
  }, []);

  const resetHistory = useCallback((value: string) => {
    pastRef.current = [];
    futureRef.current = [];
    lastHistoryValueRef.current = value;
    lastHistoryKindRef.current = "external";
    lastTypingAtRef.current = 0;
    updateHistoryState();
  }, [updateHistoryState]);

  useEffect(() => {
    if (lastDocumentKeyRef.current === documentKey) {
      return;
    }

    lastDocumentKeyRef.current = documentKey;
    resetHistory(normalizedContent);
    selectionRef.current = { start: 0, end: 0 };
  }, [documentKey, normalizedContent, resetHistory]);

  useEffect(() => {
    if (lastEmittedValueRef.current !== null && content === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    resetHistory(normalizedContent);
    selectionRef.current = {
      start: Math.min(selectionRef.current.start, normalizedContent.length),
      end: Math.min(selectionRef.current.end, normalizedContent.length),
    };
    setSelectedText(
      normalizedContent.slice(selectionRef.current.start, selectionRef.current.end),
    );
  }, [content, normalizedContent, resetHistory]);

  useEffect(() => () => {
    if (selectionRestoreFrameRef.current !== null) {
      cancelAnimationFrame(selectionRestoreFrameRef.current);
    }
  }, []);

  const updateSelectionState = useCallback((value: string, start: number, end: number) => {
    const safeStart = Math.min(Math.max(start, 0), value.length);
    const safeEnd = Math.min(Math.max(end, safeStart), value.length);
    selectionRef.current = { start: safeStart, end: safeEnd };
    setSelectedText(value.slice(safeStart, safeEnd));
    setActiveLineNumber(value.slice(0, safeStart).split(/\r?\n/).length);
  }, [setActiveLineNumber]);

  const restoreSelection = useCallback((value: string, start: number, end: number) => {
    if (selectionRestoreFrameRef.current !== null) {
      cancelAnimationFrame(selectionRestoreFrameRef.current);
    }

    selectionRestoreFrameRef.current = window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const max = textarea.value.length;
      const safeStart = Math.min(Math.max(start, 0), max, value.length);
      const safeEnd = Math.min(Math.max(end, safeStart), max, value.length);
      textarea.focus();
      textarea.setSelectionRange(safeStart, safeEnd);
      updateSelectionState(textarea.value, safeStart, safeEnd);
      selectionRestoreFrameRef.current = null;
    });
  }, [updateSelectionState]);

  const recordHistory = useCallback((previousValue: string, kind: "typing" | "command") => {
    const now = Date.now();
    const shouldCreateTypingStep = kind !== "typing"
      || lastHistoryKindRef.current !== "typing"
      || now - lastTypingAtRef.current > 750;

    if (shouldCreateTypingStep) {
      pastRef.current.push({
        value: previousValue,
        selectionStart: selectionRef.current.start,
        selectionEnd: selectionRef.current.end,
      });
    }

    futureRef.current = [];
    lastHistoryKindRef.current = kind;
    lastTypingAtRef.current = kind === "typing" ? now : 0;
    updateHistoryState();
  }, [updateHistoryState]);

  const emitEdit = useCallback((result: {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  }) => {
    const textarea = textareaRef.current;
    const previousValue = textarea?.value ?? lastHistoryValueRef.current;

    if (result.value === previousValue) {
      restoreSelection(result.value, result.selectionStart, result.selectionEnd);
      return;
    }

    recordHistory(previousValue, "command");
    lastHistoryValueRef.current = result.value;
    lastEmittedValueRef.current = result.value;
    onChange(result.value);
    restoreSelection(result.value, result.selectionStart, result.selectionEnd);
  }, [onChange, recordHistory, restoreSelection]);

  const undo = useCallback(() => {
    const entry = pastRef.current.pop();
    if (!entry) {
      return;
    }

    const currentValue = lastHistoryValueRef.current;
    futureRef.current.push({
      value: currentValue,
      selectionStart: selectionRef.current.start,
      selectionEnd: selectionRef.current.end,
    });
    lastHistoryValueRef.current = entry.value;
    lastEmittedValueRef.current = entry.value;
    lastHistoryKindRef.current = "command";
    onChange(entry.value);
    restoreSelection(entry.value, entry.selectionStart, entry.selectionEnd);
    updateHistoryState();
  }, [onChange, restoreSelection, updateHistoryState]);

  const redo = useCallback(() => {
    const entry = futureRef.current.pop();
    if (!entry) {
      return;
    }

    const currentValue = lastHistoryValueRef.current;
    pastRef.current.push({
      value: currentValue,
      selectionStart: selectionRef.current.start,
      selectionEnd: selectionRef.current.end,
    });
    lastHistoryValueRef.current = entry.value;
    lastEmittedValueRef.current = entry.value;
    lastHistoryKindRef.current = "command";
    onChange(entry.value);
    restoreSelection(entry.value, entry.selectionStart, entry.selectionEnd);
    updateHistoryState();
  }, [onChange, restoreSelection, updateHistoryState]);

  const getCurrentSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return selectionRef.current;
    }

    const selection = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
    selectionRef.current = selection;
    return selection;
  }, []);

  const applyInline = useCallback((format: MarkdownInlineFormat) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(applyInlineFormat(textarea.value, getCurrentSelection(), format));
  }, [emitEdit, getCurrentSelection]);

  const applyBlock = useCallback((format: MarkdownBlockFormat) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(applyBlockFormat(textarea.value, getCurrentSelection(), format));
  }, [emitEdit, getCurrentSelection]);

  const insertCodeBlock = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(applyCodeBlock(textarea.value, getCurrentSelection()));
  }, [emitEdit, getCurrentSelection]);

  const insertHorizontalRule = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(applyHorizontalRule(textarea.value, getCurrentSelection()));
  }, [emitEdit, getCurrentSelection]);

  const clearFormatting = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) {
      return;
    }

    emitEdit(clearInlineMarkdown(textarea.value, getCurrentSelection()));
  }, [emitEdit, getCurrentSelection]);

  const insertLink = useCallback((label: string, rawUrl: string) => {
    const url = normalizeMarkdownUrl(rawUrl);
    const textarea = textareaRef.current;
    if (!url || !textarea) {
      return false;
    }

    emitEdit(applyLink(textarea.value, getCurrentSelection(), label, url));
    return true;
  }, [emitEdit, getCurrentSelection]);

  const clearLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(removeLink(textarea.value, getCurrentSelection()));
  }, [emitEdit, getCurrentSelection]);

  const insertEmoji = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    emitEdit(insertText(textarea.value, getCurrentSelection(), emoji));
  }, [emitEdit, getCurrentSelection]);

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
    selectionRef.current = { start: cursor, end: cursor };
    window.requestAnimationFrame(() => setSelectedText(""));

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

  useEffect(() => {
    if (!imageInsertRequest) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      onImageInsertHandled();
      return;
    }

    const imageMarkdown = `![图片](${imageInsertRequest.url})`;
    emitEdit(insertText(textarea.value, getCurrentSelection(), imageMarkdown));
    onImageInsertHandled();
  }, [emitEdit, getCurrentSelection, imageInsertRequest, onImageInsertHandled]);

  const syncSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    updateSelectionState(textarea.value, textarea.selectionStart, textarea.selectionEnd);
  };

  const handleTextareaKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (key === "b" || key === "i") {
        event.preventDefault();
        applyInline(key === "b" ? "bold" : "italic");
        return;
      }

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
    const nextValue = event.target.value;
    const previousValue = lastHistoryValueRef.current;

    if (nextValue !== previousValue) {
      recordHistory(previousValue, "typing");
      lastHistoryValueRef.current = nextValue;
      lastEmittedValueRef.current = nextValue;
      onChange(nextValue);
    }

    updateSelectionState(nextValue, event.target.selectionStart, event.target.selectionEnd);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f5f7fa]">
      <MarkdownFormattingToolbar
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        selectedText={selectedText}
        onUndo={undo}
        onRedo={redo}
        onInlineFormat={applyInline}
        onBlockFormat={applyBlock}
        onCodeBlock={insertCodeBlock}
        onHorizontalRule={insertHorizontalRule}
        onClearFormatting={clearFormatting}
        onInsertLink={insertLink}
        onRemoveLink={clearLink}
        onOpenImagePool={onOpenImagePool}
        onInsertEmoji={insertEmoji}
      />

      <div className="min-h-0 flex flex-1 gap-0 p-4">
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
    </div>
  );
}
