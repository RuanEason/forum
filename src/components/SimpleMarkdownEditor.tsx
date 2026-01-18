"use client";

import { useRef, useCallback } from "react";
import "./SimpleMarkdownEditor.css";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarButton {
  icon: React.ReactNode;
  title: string;
  action: () => void;
}

export default function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = "写点什么...",
  minHeight = 300,
}: SimpleMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert text at cursor position or wrap selected text
  const insertText = useCallback(
    (before: string, after: string = "", defaultText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || defaultText;
      
      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newValue);

      // Restore focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newCursorPos = start + before.length + textToInsert.length + after.length;
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + textToInsert.length
        );
      }, 0);
    },
    [value, onChange]
  );

  // Insert at line start
  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      
      const newValue =
        value.substring(0, lineStart) + prefix + value.substring(lineStart);

      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    },
    [value, onChange]
  );

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8m-4-4v8" />
          <text x="14" y="16" fontSize="10" fontWeight="bold" fill="currentColor">B</text>
        </svg>
      ),
      title: "粗体 (Ctrl+B)",
      action: () => insertText("**", "**", "粗体文本"),
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <text x="8" y="17" fontSize="14" fontStyle="italic" fill="currentColor">I</text>
        </svg>
      ),
      title: "斜体 (Ctrl+I)",
      action: () => insertText("*", "*", "斜体文本"),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" style={{ textDecoration: 'line-through' }} />
          <text x="6" y="16" fontSize="10" fill="currentColor" style={{ textDecoration: 'line-through' }}>S</text>
        </svg>
      ),
      title: "删除线",
      action: () => insertText("~~", "~~", "删除文本"),
    },
    { icon: <span className="text-gray-300">|</span>, title: "", action: () => {} },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <text x="4" y="16" fontSize="12" fontWeight="bold" fill="currentColor">H</text>
        </svg>
      ),
      title: "标题",
      action: () => insertAtLineStart("## "),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      title: "分割线",
      action: () => insertText("\n---\n", "", ""),
    },
    { icon: <span className="text-gray-300">|</span>, title: "", action: () => {} },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: "链接",
      action: () => insertText("[", "](https://)", "链接文本"),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "引用",
      action: () => insertAtLineStart("> "),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: "代码",
      action: () => insertText("`", "`", "code"),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h.01M8 12h.01M8 16h.01M12 8h4M12 12h4M12 16h4" />
        </svg>
      ),
      title: "代码块",
      action: () => insertText("\n```\n", "\n```\n", "// 代码"),
    },
    { icon: <span className="text-gray-300">|</span>, title: "", action: () => {} },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      title: "无序列表",
      action: () => insertAtLineStart("- "),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13" />
          <text x="2" y="8" fontSize="6" fill="currentColor">1</text>
          <text x="2" y="14" fontSize="6" fill="currentColor">2</text>
          <text x="2" y="20" fontSize="6" fill="currentColor">3</text>
        </svg>
      ),
      title: "有序列表",
      action: () => insertAtLineStart("1. "),
    },
  ];

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertText("**", "**", "粗体文本");
          break;
        case "i":
          e.preventDefault();
          insertText("*", "*", "斜体文本");
          break;
        case "k":
          e.preventDefault();
          insertText("[", "](https://)", "链接文本");
          break;
      }
    }
  };

  return (
    <div className="simple-md-editor w-full">
      {/* Toolbar */}
      <div className="simple-md-editor-toolbar">
        {toolbarButtons.map((btn, index) =>
          btn.title === "" ? (
            <span key={index} className="toolbar-divider">
              {btn.icon}
            </span>
          ) : (
            <button
              key={index}
              type="button"
              title={btn.title}
              onClick={btn.action}
              className="toolbar-btn"
            >
              {btn.icon}
            </button>
          )
        )}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="simple-md-editor-textarea"
        style={{ minHeight: `${minHeight}px` }}
      />
    </div>
  );
}
