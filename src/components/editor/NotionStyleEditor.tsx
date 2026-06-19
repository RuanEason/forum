"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import {
  getAllContent,
  Placeholder,
  StarterKit,
  TiptapLink,
  TiptapUnderline,
  UpdatedImage,
  useEditor as useCurrentEditor,
} from "novel";
import type { EditorInstance as TiptapEditor, JSONContent } from "novel";
import type { MutableRefObject } from "react";
import { Markdown } from "tiptap-markdown";
import { cn } from "@/lib/utils";

const NovelEditorContent = dynamic(
  async () => {
    const mod = await import("novel");
    return mod.EditorContent;
  },
  { ssr: false },
);

const NovelEditorRoot = dynamic(
  async () => {
    const mod = await import("novel");
    return mod.EditorRoot;
  },
  { ssr: false },
);

interface NotionStyleEditorProps {
  content: string;
  onChange: (value: string) => void;
}

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export default function NotionStyleEditor({
  content,
  onChange,
}: NotionStyleEditorProps) {
  const lastSyncedMarkdownRef = useRef(content);

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `标题 ${node.attrs.level}`;
          }

          return "输入 '/' 调出命令，像在 Notion 一样开始写作";
        },
        includeChildren: true,
      }),
      TiptapUnderline,
      TiptapLink.configure({
        openOnClick: false,
      }),
      UpdatedImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: "-",
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ];
  }, []);

  const handleUpdate = ({ editor }: { editor: TiptapEditor }) => {
    const markdown = getAllContent(editor).trimEnd();
    lastSyncedMarkdownRef.current = markdown;
    onChange(markdown);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white/90 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">视觉块编辑模式</p>
            <p className="mt-1 text-xs text-slate-500">
              更接近 Notion 的自由排版体验，内容会实时回写成 Markdown。
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            自动同步 Markdown
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.28),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] px-8 py-6">
        <div className="mx-auto min-h-full max-w-4xl rounded-[30px] border border-slate-200/80 bg-white/95 px-8 py-10 shadow-[0_28px_70px_rgba(15,23,42,0.09)] backdrop-blur">
          <NovelEditorRoot>
            <NovelEditorContent
              initialContent={EMPTY_DOC}
              immediatelyRender={false}
              extensions={extensions}
              onCreate={({ editor }) => {
                lastSyncedMarkdownRef.current = content;

                if (!content.trim()) {
                  return;
                }

                editor.commands.setContent(content);
              }}
              onUpdate={handleUpdate}
              editorProps={{
                attributes: {
                  class:
                    "novel-prose min-h-[560px] outline-none prose prose-slate max-w-none text-slate-800",
                },
              }}
              className={cn(
                "novel-editor rounded-3xl bg-transparent",
                "[&_.ProseMirror]:min-h-[560px] [&_.ProseMirror]:outline-none",
                "[&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:tracking-tight",
                "[&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold",
                "[&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold",
                "[&_.ProseMirror_p]:my-3 [&_.ProseMirror_p]:leading-8",
                "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-sky-200 [&_.ProseMirror_blockquote]:bg-sky-50/70 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-3",
                "[&_.ProseMirror_code]:rounded-md [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5",
                "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-2xl [&_.ProseMirror_pre]:bg-slate-950 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:text-slate-100",
                "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
              )}
            >
              <ExternalMarkdownSync
                markdown={content}
                lastSyncedMarkdownRef={lastSyncedMarkdownRef}
              />
            </NovelEditorContent>
          </NovelEditorRoot>
        </div>
      </div>
    </div>
  );
}

interface ExternalMarkdownSyncProps {
  markdown: string;
  lastSyncedMarkdownRef: MutableRefObject<string>;
}

function ExternalMarkdownSync({
  markdown,
  lastSyncedMarkdownRef,
}: ExternalMarkdownSyncProps) {
  const { editor } = useCurrentEditor();

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (markdown === lastSyncedMarkdownRef.current) {
      return;
    }

    const currentMarkdown = getAllContent(editor).trimEnd();

    if (markdown !== currentMarkdown) {
      editor.commands.setContent(markdown);
    }

    lastSyncedMarkdownRef.current = markdown;
  }, [editor, lastSyncedMarkdownRef, markdown]);

  return null;
}
