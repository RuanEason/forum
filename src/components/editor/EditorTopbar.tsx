"use client";

import { Loader2, Save, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveState } from "@/components/editor/types";

interface EditorTopbarProps {
  title: string;
  draftStatusLabel: string;
  saveState: SaveState;
  saveStateLabel: string;
  savedAtLabel: string;
  canPublish: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export default function EditorTopbar({
  title,
  draftStatusLabel,
  saveState,
  saveStateLabel,
  savedAtLabel,
  canPublish,
  isPublishing,
  onSave,
  onPublish,
}: EditorTopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur-xl">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {title || "未命名文档"}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {draftStatusLabel}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5",
              saveState === "error"
                ? "bg-red-50 text-red-600"
                : saveState === "saving"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700",
            )}
          >
            {saveStateLabel}
          </span>
          <span>最近保存 {savedAtLabel}</span>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Save className="h-4 w-4" />
          保存
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isPublishing}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors",
            !canPublish || isPublishing
              ? "cursor-not-allowed bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700",
          )}
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          
        </button>
      </div>
    </header>
  );
}
