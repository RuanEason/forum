"use client";

import { ChevronDown, ChevronRight, Hash, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import DualPaneEditor from "@/components/editor/DualPaneEditor";
import NotionStyleEditor from "@/components/editor/NotionStyleEditor";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import type { PostStyleConfig } from "@/types/post-style";

export type UnifiedEditorMode = "markdown" | "visual";

interface UnifiedEditorProps {
  documentKey: string;
  title: string;
  content: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
  hideTitleInput?: boolean;
}

export default function UnifiedEditor({
  documentKey,
  title,
  content,
  styleConfig: _styleConfig = null,
  styleCss = "",
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
  activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
  hideTitleInput = false,
}: UnifiedEditorProps) {
  void _styleConfig;
  const [mode, setMode] = useState<UnifiedEditorMode>("markdown");
  const [titleExpandedByDoc, setTitleExpandedByDoc] = useState<Record<string, boolean>>({});
  const titleExpanded = hideTitleInput ? false : (titleExpandedByDoc[documentKey] ?? Boolean(title.trim()));

  useEffect(() => {
    if (mode === "visual" && externalJumpLine) {
      onExternalJumpHandled();
    }
  }, [externalJumpLine, mode, onExternalJumpHandled]);

  return (
    <section className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,251,255,0.98))]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-10 py-4">
          {hideTitleInput ? (
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              正文编辑
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleExpandedByDoc((current) => ({
                  ...current,
                  [documentKey]: !titleExpanded,
                }));
              }}
              className="flex min-w-0 items-center gap-2 text-left transition-colors hover:text-slate-900"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {titleExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Hash className="h-4 w-4" />
                <span>文档标题</span>
              </div>
            </button>
          )}

          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                mode === "markdown" ? "text-slate-900" : "text-slate-400",
              )}
            >
              Markdown
            </span>
            <Toggle
              checked={mode === "visual"}
              onChange={(checked) => setMode(checked ? "visual" : "markdown")}
              id={`editor-mode-${documentKey}`}
            />
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium transition-colors",
                mode === "visual" ? "text-slate-900" : "text-slate-400",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              视觉编辑
            </span>
          </div>
        </div>

        {!hideTitleInput && titleExpanded ? (
          <div className="px-10 pb-6">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value.slice(0, 200))}
              placeholder="输入一个清晰的标题，让读者更快进入内容"
              className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex flex-1 overflow-hidden">
        {mode === "markdown" ? (
          <DualPaneEditor
            content={content}
            styleCss={styleCss}
            onChange={onContentChange}
            onSave={onSave}
            onPublish={onPublish}
            activeLineNumber={activeLineNumber}
            setActiveLineNumber={setActiveLineNumber}
            externalJumpLine={externalJumpLine}
            onExternalJumpHandled={onExternalJumpHandled}
          />
        ) : (
          <NotionStyleEditor
            content={content}
            onChange={(value) => {
              onContentChange(value);
              setActiveLineNumber(1);
            }}
          />
        )}
      </div>
    </section>
  );
}
