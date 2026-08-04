"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import EditorStatusbar from "@/components/editor/EditorStatusbar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import StyleCodeEditor from "@/components/editor/StyleCodeEditor";
import PostContentRenderer from "@/components/PostContentRenderer";
import { formatEditorTime, getSaveStateLabel } from "@/components/editor/editor-utils";
import type { EditorDraftDetail, SaveState } from "@/components/editor/types";
import {
  plainTextToRichTextDocument,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";

type DraftResponse = {
  draft?: EditorDraftDetail;
  error?: string;
};

export default function StyleWorkspace() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [styleCss, setStyleCss] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isSavingRef = useRef(false);
  const lastSavedCssRef = useRef("");

  const saveStateLabel = getSaveStateLabel(saveState, errorMessage);
  const canSave = Boolean(draftId);
  const wordCount = useMemo(() => styleCss.trim().length, [styleCss]);

  const loadDraft = useCallback(async () => {
    if (!draftId) {
      setLoading(false);
      setErrorMessage("请先在正文编辑器里创建或打开一个草稿，再进入 CSS 工作区。");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        cache: "no-store",
      });
      const data = await response.json() as DraftResponse;

      if (!response.ok || !data.draft) {
        throw new Error(data.error || "加载草稿失败");
      }

      setTitle(data.draft.title?.trim() || "未命名文档");
      const previewDocument = data.draft.contentFormat === "RICH_TEXT" && data.draft.contentJson
        ? data.draft.contentJson
        : plainTextToRichTextDocument(data.draft.content ?? "");
      setContent(serializeRichTextDocument(previewDocument));
      setStyleCss(data.draft.styleCss ?? "");
      lastSavedCssRef.current = data.draft.styleCss ?? "";
      setLastSavedAt(data.draft.updatedAt);
      setSaveState("saved");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载草稿失败");
      setSaveState("error");
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent("/editor/style")}`);
    }
  }, [router, status]);

  useEffect(() => {
    if (status === "authenticated") {
      void loadDraft();
    }
  }, [loadDraft, status]);

  const handleSave = useCallback(async () => {
    if (!draftId || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          styleConfig: null,
          styleCss,
        }),
      });
      const data = await response.json() as DraftResponse;

      if (!response.ok || !data.draft) {
        throw new Error(data.error || "保存样式失败");
      }

      const nextCss = data.draft.styleCss ?? "";
      setStyleCss(nextCss);
      lastSavedCssRef.current = nextCss;
      setLastSavedAt(data.draft.updatedAt);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "保存样式失败");
    } finally {
      isSavingRef.current = false;
    }
  }, [draftId, styleCss]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (styleCss === lastSavedCssRef.current) {
      if (saveState !== "saved") {
        setSaveState("saved");
      }
      return;
    }

    setSaveState("idle");
  }, [loading, saveState, styleCss]);

  if (status === "loading" || loading) {
    return <EditorBootScreen />;
  }

  if (status !== "authenticated") {
    return <EditorBootScreen />;
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#f3f5f7] text-slate-900">
      <EditorTopbar
        title={`${title} · CSS 工作区`}
        draftStatusLabel="高级模式"
        saveState={saveState}
        saveStateLabel={saveStateLabel}
        savedAtLabel={formatEditorTime(lastSavedAt)}
        canPublish={false}
        isPublishing={false}
        onSave={handleSave}
        onPublish={() => {}}
      />

      {errorMessage ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0">
          <div className="min-w-0 flex-1 border-r border-slate-200">
            <StyleCodeEditor
              styleConfig={null}
              value={styleCss}
              onChange={setStyleCss}
            />
          </div>
          <div className="hidden min-w-0 flex-1 overflow-y-auto bg-[#f8f8f6] xl:block">
            <div className="border-b border-slate-200 bg-[#faf9f6] px-8 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                实时预览
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                这里复用帖子详情页的渲染组件，用来检查你写的 CSS 会不会真正影响最终展示。
              </p>
            </div>
            <div className="p-6">
              <div className="border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <PostContentRenderer
                  postId={draftId ?? "style-preview"}
                  title={title}
                  content={content}
                  styleConfig={null}
                  styleCss={styleCss}
                  withHeadingIds={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditorStatusbar
        wordCount={wordCount}
        headingCount={0}
        saveStateLabel={saveStateLabel}
        documentLabel={canSave ? "样式.css" : "未关联草稿"}
      />
    </div>
  );
}
