"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Hash } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import type { EditorImageInsertRequest } from "@/components/editor/types";

interface RichTextDocumentEditorProps {
  documentKey: string;
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  setActivePosition: (position: number) => void;
  externalJumpPosition: number | null;
  onExternalJumpHandled: () => void;
  hideTitleInput?: boolean;
  imageInsertRequest: EditorImageInsertRequest | null;
  onImageInsertHandled: () => void;
}

export default function RichTextDocumentEditor({
  documentKey,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
  setActivePosition,
  externalJumpPosition,
  onExternalJumpHandled,
  hideTitleInput = false,
  imageInsertRequest,
  onImageInsertHandled,
}: RichTextDocumentEditorProps) {
  const [titleExpandedByDoc, setTitleExpandedByDoc] = useState<Record<string, boolean>>({});
  const titleExpanded = hideTitleInput ? false : (titleExpandedByDoc[documentKey] ?? Boolean(title.trim()));

  return (
    <section className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center px-10 py-4">
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
                {titleExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Hash className="h-4 w-4" />
                <span>文章标题</span>
              </div>
            </button>
          )}
        </div>

        {!hideTitleInput && titleExpanded ? (
          <div className="px-10 pb-6">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value.slice(0, 200))}
              placeholder="输入一个清晰的标题"
              className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
            />
          </div>
        ) : null}
      </div>

      <RichTextEditor
        content={content}
        historyKey={documentKey}
        onChange={onContentChange}
        imageInsertRequest={imageInsertRequest}
        onImageInsertHandled={onImageInsertHandled}
        externalJumpPosition={externalJumpPosition}
        onExternalJumpHandled={onExternalJumpHandled}
        onOutlineChange={() => undefined}
        onActivePositionChange={setActivePosition}
        onSave={onSave}
        onPublish={onPublish}
      />
    </section>
  );
}
