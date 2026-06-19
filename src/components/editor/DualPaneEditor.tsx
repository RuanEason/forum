"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import type { MDEditorProps } from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

interface DualPaneEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
}

export default function DualPaneEditor({
  content,
  onChange,
  onSave,
  onPublish,
  activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
}: DualPaneEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const visibleLineCount = useMemo(() => {
    return Math.max(content.split(/\r?\n/).length, 1);
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
    textarea.scrollTop = Math.max(0, (externalJumpLine - 3) * 28);
    setActiveLineNumber(externalJumpLine);
    onExternalJumpHandled();
  }, [
    content,
    externalJumpLine,
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
  };

  const textareaProps: MDEditorProps["textareaProps"] = {
    placeholder: "# 从这里开始写作\n\n## Markdown 模式会同步展示实时预览",
    onChange: handleTextareaChange,
    onClick: syncSelection,
    onKeyUp: syncSelection,
    onSelect: syncSelection,
    onKeyDown: handleTextareaKeyDown,
    spellCheck: false,
    wrap: "off",
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white/90 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Markdown 双栏模式</p>
            <p className="mt-1 text-xs text-slate-500">
              左侧源码，右侧预览，适合熟悉 Markdown 的用户。
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            当前行 {Math.min(activeLineNumber, visibleLineCount)} / {visibleLineCount}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] p-5">
        <div
          data-color-mode="light"
          className={cn(
            "editor-md-shell h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]",
            "ring-1 ring-white/70",
          )}
        >
          <MDEditor
            value={content}
            onChange={(value) => onChange(value ?? "")}
            preview="live"
            visibleDragbar={false}
            height="100%"
            hideToolbar={false}
            textareaProps={textareaProps}
            onStatistics={(stats) => {
              if (stats.lineCount && activeLineNumber > stats.lineCount) {
                setActiveLineNumber(stats.lineCount);
              }
            }}
            components={{
              textarea: (props) => {
                return (
                  <textarea
                    {...props}
                    ref={(node) => {
                      textareaRef.current = node;
                    }}
                    className={cn(
                      props.className,
                      "font-mono text-[15px] leading-7 text-slate-800",
                    )}
                  />
                );
              },
            }}
            className="h-full"
            enableScroll
            highlightEnable={false}
            previewOptions={{
              className: "wmde-markdown !bg-white px-4 py-3",
            }}
          />
        </div>
      </div>
    </div>
  );
}
