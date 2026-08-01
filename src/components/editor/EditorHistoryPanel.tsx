"use client";

import { useEffect } from "react";
import { Check, FileText, History, Loader2, X } from "lucide-react";
import {
  formatEditorDateTime,
  getDraftDisplayTitle,
  getDraftSummaryText,
} from "@/components/editor/editor-utils";
import { cn } from "@/lib/utils";
import type { DraftHistoryGroup, EditorDraftSummary } from "@/components/editor/types";

interface EditorHistoryPanelProps {
  open: boolean;
  groups: DraftHistoryGroup[];
  activeDraftId: string | null;
  loading: boolean;
  switchingId: string | null;
  onClose: () => void;
  onSelectDraft: (draft: EditorDraftSummary) => void | Promise<void>;
}

export default function EditorHistoryPanel({
  open,
  groups,
  activeDraftId,
  loading,
  switchingId,
  onClose,
  onSelectDraft,
}: EditorHistoryPanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/20 px-6 pb-6 pt-20 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="flex max-h-[calc(100dvh-112px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-[#f7f7f5] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-history-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <History className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="editor-history-title" className="truncate text-base font-semibold text-slate-900">
                历史草稿
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">选择一篇草稿继续编辑</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="关闭历史草稿"
            title="关闭"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              正在加载历史草稿
            </div>
          ) : groups.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
              还没有已保存草稿。
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.label}>
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {group.label}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {group.items.map((draft) => {
                      const isActive = draft.id === activeDraftId;
                      const isSwitching = draft.id === switchingId;

                      return (
                        <button
                          key={draft.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            void onSelectDraft(draft);
                          }}
                          disabled={isActive || Boolean(switchingId)}
                          className={cn(
                            "w-full border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            isActive
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <div className="flex items-start gap-3">
                            <span className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                              isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500",
                            )}>
                              {isSwitching ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : isActive ? (
                                <Check className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <FileText className="h-4 w-4" aria-hidden="true" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="truncate text-sm font-semibold text-slate-900">
                                  {getDraftDisplayTitle(draft)}
                                </span>
                                <span className="shrink-0 text-[11px] text-slate-400">
                                  {formatEditorDateTime(draft.updatedAt)}
                                </span>
                              </span>
                              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
                                {getDraftSummaryText(draft.content)}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
