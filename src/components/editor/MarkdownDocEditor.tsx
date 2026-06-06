"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownDocEditorProps {
  documentKey: string;
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
}

export default function MarkdownDocEditor({
  documentKey,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
  activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
}: MarkdownDocEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [titleExpandedByDoc, setTitleExpandedByDoc] = useState<Record<string, boolean>>({});
  const titleExpanded = titleExpandedByDoc[documentKey] ?? Boolean(title.trim());
  const lineHeight = 28;
  const editorPaddingTop = 24;
  const lineNumberItems = useMemo(() => {
    const lineCount = Math.max(content.split(/\r?\n/).length, 1);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [content]);

  useEffect(() => {
    if (!externalJumpLine || !textareaRef.current) {
      return;
    }

    const textarea = textareaRef.current;
    const lines = content.split(/\r?\n/);
    let cursor = 0;

    for (let index = 0; index < Math.max(0, externalJumpLine - 1); index += 1) {
      cursor += (lines[index]?.length ?? 0) + 1;
    }

    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);

    const targetLineHeight = 28;
    textarea.scrollTop = Math.max(0, (externalJumpLine - 3) * targetLineHeight);
    setActiveLineNumber(externalJumpLine);
    onExternalJumpHandled();
  }, [
    content,
    externalJumpLine,
    onExternalJumpHandled,
    setActiveLineNumber,
  ]);

  function getCurrentLineNumber(text: string, selectionStart: number): number {
    return text.slice(0, selectionStart).split(/\r?\n/).length;
  }

  function syncSelectionFromDom() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    setActiveLineNumber(getCurrentLineNumber(textarea.value, textarea.selectionStart));
  }

  function handleSelectionSync() {
    requestAnimationFrame(() => {
      syncSelectionFromDom();
    });
  }

  function handleScroll() {
    if (!textareaRef.current) {
      return;
    }

    const nextScrollTop = textareaRef.current.scrollTop;
    setScrollTop(nextScrollTop);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${content.slice(0, start)}  ${content.slice(end)}`;

      onContentChange(nextValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2);
      });
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onPublish();
      }
    }
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <div className="border-b border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => {
            setTitleExpandedByDoc((current) => ({
              ...current,
              [documentKey]: !titleExpanded,
            }));
          }}
          className="flex w-full items-center justify-between px-10 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {titleExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Hash className="h-4 w-4" />
            <span>文档标题（可选）</span>
          </div>

        </button>

        {titleExpanded ? (
          <div className="px-10 pb-6">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value.slice(0, 200))}
              placeholder="输入标题开始写作"
              className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
            />
          </div>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[linear-gradient(180deg,_#fcfdff_0%,_#f7fbff_100%)]">
        <div className="flex h-full">
          <div className="w-16 flex-shrink-0 overflow-hidden border-r border-slate-100 bg-slate-50/80 text-right font-mono text-[13px] text-slate-400">
            <div
              className="will-change-transform px-2 py-6"
              style={{
                transform: `translate3d(0, ${-scrollTop}px, 0)`,
              }}
            >
              {lineNumberItems.map((lineNumber) => (
                <div
                  key={lineNumber}
                  className={cn(
                    "h-7 pr-2 leading-7",
                    lineNumber === activeLineNumber && "font-semibold text-blue-600",
                  )}
                >
                  {lineNumber}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              className="pointer-events-none absolute inset-x-0 z-0 h-7 bg-blue-50/70"
              style={{
                top: `${(activeLineNumber - 1) * lineHeight + editorPaddingTop - scrollTop}px`,
              }}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => {
                onContentChange(event.target.value);
                setActiveLineNumber(getCurrentLineNumber(event.target.value, event.target.selectionStart));
              }}
              onClick={handleSelectionSync}
              onKeyUp={handleSelectionSync}
              onSelect={handleSelectionSync}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              placeholder="# 输入标题开始写作&#10;&#10;## 创建章节，右侧会自动生成目录"
              spellCheck={false}
              wrap="off"
              className="absolute inset-0 z-10 h-full w-full resize-none overflow-auto border-none bg-transparent px-8 py-6 font-mono text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-300 selection:bg-blue-100/80"
              style={{
                tabSize: 2,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
