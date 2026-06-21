"use client";

import dynamic from "next/dynamic";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Command as SlashCommand,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapLink,
  TiptapUnderline,
  UpdatedImage,
  createSuggestionItems,
  getAllContent,
  handleCommandNavigation,
  renderItems,
  useEditor as useCurrentEditor,
} from "novel";
import type {
  EditorInstance as TiptapEditor,
  JSONContent,
  SuggestionItem,
} from "novel";
import type { MutableRefObject, RefObject } from "react";
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

type SlashCommandItem = SuggestionItem & {
  command: NonNullable<SuggestionItem["command"]>;
  searchTerms: string[];
};

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

const CODE_LANGUAGE_OPTIONS = [
  { label: "纯文本", value: "plaintext" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSX", value: "jsx" },
  { label: "TSX", value: "tsx" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "Bash", value: "bash" },
  { label: "Shell", value: "shell" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Java", value: "java" },
  { label: "SQL", value: "sql" },
  { label: "YAML", value: "yaml" },
];

function filterSlashCommandItems(
  items: SlashCommandItem[],
  query: string,
): SlashCommandItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystacks = [item.title, item.description, ...item.searchTerms];

    return haystacks.some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}

export default function NotionStyleEditor({
  content,
  onChange,
}: NotionStyleEditorProps) {
  const lastSyncedMarkdownRef = useRef(content);
  const editorFrameRef = useRef<HTMLDivElement | null>(null);

  const slashCommandItems = useMemo<SlashCommandItem[]>(() => {
    return createSuggestionItems([
      {
        title: "正文",
        description: "切换为普通段落，用于自由书写。",
        searchTerms: ["paragraph", "text", "正文", "段落"],
        icon: <Pilcrow className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setParagraph().run();
        },
      },
      {
        title: "一级标题",
        description: "插入大标题，适合文章主章节。",
        searchTerms: ["h1", "heading 1", "标题", "一级标题"],
        icon: <Heading1 className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
      },
      {
        title: "二级标题",
        description: "插入中标题，适合分段结构。",
        searchTerms: ["h2", "heading 2", "二级标题"],
        icon: <Heading2 className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
      },
      {
        title: "三级标题",
        description: "插入小标题，适合补充说明。",
        searchTerms: ["h3", "heading 3", "三级标题"],
        icon: <Heading3 className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
      },
      {
        title: "无序列表",
        description: "创建项目符号列表。",
        searchTerms: ["bullet list", "ul", "列表", "无序列表"],
        icon: <List className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "有序列表",
        description: "创建带序号的列表。",
        searchTerms: ["ordered list", "ol", "数字列表", "编号"],
        icon: <ListOrdered className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "任务列表",
        description: "创建可勾选的 checklist。",
        searchTerms: ["todo", "task list", "checklist", "待办", "任务列表"],
        icon: <ListChecks className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
      },
      {
        title: "引用",
        description: "突出引用、摘录或观点。",
        searchTerms: ["blockquote", "quote", "引用", "摘录"],
        icon: <Quote className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: "代码块",
        description: "插入多行代码区域。",
        searchTerms: ["code", "code block", "代码", "代码块"],
        icon: <Code2 className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock({ language: "plaintext" }).run();
        },
      },
      {
        title: "分隔线",
        description: "插入一条水平分隔线。",
        searchTerms: ["divider", "hr", "separator", "分隔线"],
        icon: <Minus className="h-4 w-4" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
    ]) as SlashCommandItem[];
  }, []);

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `标题 ${node.attrs.level}`;
          }

          return "输入 '/' 调出命令，开始写作吧！";
        },
        includeChildren: true,
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }: { query: string }) => filterSlashCommandItems(slashCommandItems, query),
          render: renderItems,
        },
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
  }, [slashCommandItems]);

  const handleUpdate = ({ editor }: { editor: TiptapEditor }) => {
    const markdown = getAllContent(editor).trimEnd();
    lastSyncedMarkdownRef.current = markdown;
    onChange(markdown);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white/90 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">视觉块编辑模式</p>
            <p className="mt-1 text-xs text-slate-500">
              自由排版，内容会实时回写成 Markdown。
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            自动同步 Markdown
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.28),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] px-8 py-6">
        <div
          ref={editorFrameRef}
          className="relative mx-auto flex h-full min-h-0 max-w-4xl flex-col overflow-y-auto overscroll-contain rounded-[30px] border border-slate-200/80 bg-white/95 px-8 py-10 shadow-[0_28px_70px_rgba(15,23,42,0.09)] backdrop-blur"
        >
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
                handleDOMEvents: {
                  keydown: (_view, event) => handleCommandNavigation(event),
                },
                attributes: {
                  class:
                    "novel-prose min-h-[560px] outline-none prose prose-slate max-w-none text-slate-800",
                },
              }}
              className={cn(
                "novel-editor flex min-h-0 flex-1 flex-col rounded-3xl bg-transparent",
                "[&_.ProseMirror]:min-h-[560px] [&_.ProseMirror]:outline-none",
                "[&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:tracking-tight",
                "[&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold",
                "[&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold",
                "[&_.ProseMirror_p]:my-3 [&_.ProseMirror_p]:leading-8",
                "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-sky-200 [&_.ProseMirror_blockquote]:bg-sky-50/70 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-3",
                "[&_.ProseMirror_code]:rounded-md [&_.ProseMirror_code]:bg-slate-100 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5",
                "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-2xl [&_.ProseMirror_pre]:bg-slate-950 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:text-slate-100",
                "[&_.ProseMirror_pre_code]:rounded-none [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-inherit",
                "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
                "[&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-0",
              )}
            >
              <ExternalMarkdownSync
                markdown={content}
                lastSyncedMarkdownRef={lastSyncedMarkdownRef}
              />

              <CodeBlockLanguageToolbar editorFrameRef={editorFrameRef} />

              <EditorCommand className="z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                <EditorCommandList className="max-h-[320px] overflow-y-auto">
                  <EditorCommandEmpty className="px-3 py-6 text-center text-sm text-slate-500">
                    没有匹配的命令
                  </EditorCommandEmpty>

                  {slashCommandItems.map((item) => (
                    <EditorCommandItem
                      key={item.title}
                      value={item.title}
                      keywords={item.searchTerms}
                      onCommand={item.command}
                      onMouseDown={(event) => event.preventDefault()}
                      className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors data-[selected='true']:bg-slate-100"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </EditorCommand>
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

interface CodeBlockLanguageToolbarProps {
  editorFrameRef: RefObject<HTMLDivElement | null>;
}

function CodeBlockLanguageToolbar({
  editorFrameRef,
}: CodeBlockLanguageToolbarProps) {
  const { editor } = useCurrentEditor();
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarState, setToolbarState] = useState<{
    visible: boolean;
    top: number;
    left: number;
    language: string;
  }>({
    visible: false,
    top: 0,
    left: 0,
    language: "plaintext",
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const hideToolbar = () => {
      setToolbarState((current) => ({ ...current, visible: false }));
    };
    const frame = editorFrameRef.current;

    const updateToolbar = () => {
      if (!frame) {
        hideToolbar();
        return;
      }

      const { selection } = editor.state;
      if (!editor.isActive("codeBlock") || !selection.empty) {
        hideToolbar();
        return;
      }

      const domAtPos = editor.view.domAtPos(selection.from).node;
      const baseElement = domAtPos instanceof HTMLElement ? domAtPos : domAtPos.parentElement;
      const preElement = baseElement?.closest("pre");

      if (!preElement) {
        hideToolbar();
        return;
      }

      const frameRect = frame.getBoundingClientRect();
      const preRect = preElement.getBoundingClientRect();
      const language = (editor.getAttributes("codeBlock").language as string | null) ?? "plaintext";
      const toolbarWidth = toolbarRef.current?.offsetWidth ?? 188;
      const left = Math.max(
        16,
        Math.min(
          preRect.right - frameRect.left + frame.scrollLeft - toolbarWidth - 10,
          frame.scrollWidth - toolbarWidth - 16,
        ),
      );

      setToolbarState({
        visible: true,
        top: Math.max(preRect.top - frameRect.top + frame.scrollTop + 10, 10),
        left,
        language,
      });
    };

    const updateToolbarNextFrame = () => {
      window.requestAnimationFrame(updateToolbar);
    };

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const toolbar = toolbarRef.current;
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (toolbar?.contains(target) || frame?.contains(target)) {
        return;
      }

      hideToolbar();
    };

    updateToolbarNextFrame();
    editor.on("selectionUpdate", updateToolbarNextFrame);
    editor.on("transaction", updateToolbarNextFrame);
    editor.on("focus", updateToolbarNextFrame);
    editor.view.dom.addEventListener("mouseup", updateToolbarNextFrame);
    frame?.addEventListener("scroll", updateToolbarNextFrame, { passive: true });
    window.addEventListener("resize", updateToolbarNextFrame);
    document.addEventListener("mousedown", handleDocumentPointerDown);

    return () => {
      editor.off("selectionUpdate", updateToolbarNextFrame);
      editor.off("transaction", updateToolbarNextFrame);
      editor.off("focus", updateToolbarNextFrame);
      editor.view.dom.removeEventListener("mouseup", updateToolbarNextFrame);
      frame?.removeEventListener("scroll", updateToolbarNextFrame);
      window.removeEventListener("resize", updateToolbarNextFrame);
      document.removeEventListener("mousedown", handleDocumentPointerDown);
    };
  }, [editor, editorFrameRef]);

  if (!editor || !toolbarState.visible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      aria-label="代码块操作栏"
      className="pointer-events-auto absolute z-20 flex items-center gap-2 rounded-md border border-white/10 bg-[#0f172a]/96  text-slate-100 shadow-[0_10px_24px_rgba(2,6,23,0.30)] backdrop-blur"
      style={{
        top: toolbarState.top,
        left: toolbarState.left,
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <select
        value={toolbarState.language}
        onChange={(event) => {
          const nextLanguage = event.target.value;
          editor
            .chain()
            .focus()
            .updateAttributes("codeBlock", {
              language: nextLanguage === "plaintext" ? null : nextLanguage,
            })
            .run();
        }}
        className="rounded border border-white/10 bg-[#1e293b] px-2 py-1 text-xs text-slate-100 outline-none transition-colors hover:border-white/20"
      >
        {CODE_LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
