"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  History,
  Loader2,
  Save,
  SendHorizonal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatEditorDateTime,
  getDraftDisplayTitle,
} from "@/components/editor/editor-utils";
import type { EditorDraftSummary, SaveState } from "@/components/editor/types";

const MENU_HOVER_DELAY = 700;
const RECENT_DRAFT_LIMIT = 5;
const DEFAULT_DOCUMENT_LABEL = "文件";

interface EditorTopbarProps {
  title: string;
  draftStatusLabel: string;
  saveState: SaveState;
  saveStateLabel: string;
  savedAtLabel: string;
  canPublish: boolean;
  publishDisabledReason?: string;
  isPublishing: boolean;
  historyLoading?: boolean;
  switchingId?: string | null;
  activeDraftId?: string | null;
  recentDrafts?: EditorDraftSummary[];
  onCreateNew?: () => void;
  onSave: () => void;
  onOpenHistory?: () => void;
  onSelectDraft?: (draft: EditorDraftSummary) => void | Promise<void>;
  onPublish: () => void;
}

export default function EditorTopbar({
  title,
  draftStatusLabel,
  saveState,
  saveStateLabel,
  savedAtLabel,
  canPublish,
  publishDisabledReason,
  isPublishing,
  historyLoading = false,
  switchingId = null,
  activeDraftId = null,
  recentDrafts = [],
  onCreateNew,
  onSave,
  onOpenHistory,
  onSelectDraft,
  onPublish,
}: EditorTopbarProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearHoverTimer();
    setIsMenuOpen(false);
    setIsHistoryMenuOpen(false);
  }, [clearHoverTimer]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeMenu();
      triggerRef.current?.focus();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isMenuOpen]);

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

  const scheduleMenuOpen = useCallback(() => {
    clearHoverTimer();
    if (isMenuOpen) {
      return;
    }

    hoverTimerRef.current = setTimeout(() => {
      setIsMenuOpen(true);
      hoverTimerRef.current = null;
    }, MENU_HOVER_DELAY);
  }, [clearHoverTimer, isMenuOpen]);

  const handleTriggerClick = useCallback(() => {
    clearHoverTimer();
    setIsMenuOpen((open) => !open);
    setIsHistoryMenuOpen(false);
  }, [clearHoverTimer]);

  const runMenuAction = (action: () => void) => {
    closeMenu();
    action();
  };

  const recentDraftsToShow = recentDrafts.slice(0, RECENT_DRAFT_LIMIT);

  return (
    <header className="relative z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur-xl">
      <div className="min-w-0">
        <div
          ref={menuRef}
          className="relative w-fit max-w-full"
          onMouseEnter={scheduleMenuOpen}
          onMouseLeave={closeMenu}
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={handleTriggerClick}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                clearHoverTimer();
                setIsMenuOpen(true);
              }
            }}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-sm px-1 py-0.5 text-left text-sm font-semibold text-slate-900 transition-colors",
              "hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              isMenuOpen && "bg-slate-100",
            )}
            aria-label={`${title || DEFAULT_DOCUMENT_LABEL} 菜单`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <span className="truncate">{title || DEFAULT_DOCUMENT_LABEL}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
                isMenuOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>

          {isMenuOpen ? (
            <div
              className="absolute left-0 top-full z-50 w-56 pt-2"
            >
              <div
                role="menu"
                aria-label="文档菜单"
                className="overflow-visible rounded-md border border-slate-200 bg-white p-1 shadow-xl"
              >
                {onCreateNew ? (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runMenuAction(onCreateNew)}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <FilePlus2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>新建文档</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                  </>
                ) : null}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => runMenuAction(onSave)}
                  disabled={saveState === "saving"}
                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saveState === "saving" ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>保存</span>
                </button>

                {onOpenHistory && onSelectDraft ? (
                  <>
                    <div className="my-1 border-t border-slate-100" />

                    <div
                      className="relative"
                      onMouseEnter={() => setIsHistoryMenuOpen(true)}
                      onMouseLeave={() => setIsHistoryMenuOpen(false)}
                      onFocus={() => setIsHistoryMenuOpen(true)}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setIsHistoryMenuOpen((open) => !open)}
                        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        aria-haspopup="menu"
                        aria-expanded={isHistoryMenuOpen}
                      >
                        <History className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">历史草稿</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      </button>

                      {isHistoryMenuOpen ? (
                        <div
                          role="menu"
                          aria-label="历史草稿"
                          className="absolute left-full top-0 w-64 rounded-md border border-slate-200 bg-white p-1 shadow-xl"
                        >
                          {historyLoading ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              <span>正在加载历史草稿</span>
                            </div>
                          ) : recentDraftsToShow.length > 0 ? (
                            recentDraftsToShow.map((draft) => {
                              const isActive = draft.id === activeDraftId;
                              const isSwitching = draft.id === switchingId;

                              return (
                                <button
                                  key={draft.id}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => runMenuAction(() => void onSelectDraft(draft))}
                                  disabled={isActive || Boolean(switchingId)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                    isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
                                  )}
                                  aria-current={isActive ? "page" : undefined}
                                >
                                  {isSwitching ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                                  ) : isActive ? (
                                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                                  ) : (
                                    <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                      {getDraftDisplayTitle(draft)}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                      {formatEditorDateTime(draft.updatedAt)}
                                    </span>
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-500">暂无已保存草稿</div>
                          )}

                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => runMenuAction(onOpenHistory)}
                            className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <History className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>全部历史草稿</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
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
          onClick={onPublish}
          disabled={isPublishing || (!canPublish && !publishDisabledReason)}
          aria-label="发布"
          aria-disabled={!canPublish || isPublishing}
          title={publishDisabledReason || "发布"}
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
