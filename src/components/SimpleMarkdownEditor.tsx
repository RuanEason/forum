"use client";

import { useRef, useCallback, useState } from "react";
import "./SimpleMarkdownEditor.css";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  showToolbarToggle?: boolean; // 是否显示toolbar切换按钮
  onImageClick?: () => void; // 图片按钮点击回调
  imageCount?: number; // 已上传图片数量
  maxImages?: number; // 最大图片数量
  isUploading?: boolean; // 是否正在上传
  topicSelector?: React.ReactNode; // 话题选择器组件
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
  minHeight = 150,
  showToolbarToggle = false,
  onImageClick,
  imageCount = 0,
  maxImages = 9,
  isUploading = false,
  topicSelector,
}: SimpleMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);

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
      {/* Toolbar - 根据状态显示/隐藏 */}
      {showToolbar && (
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
      )}

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

      {/* 底部工具栏 - 图片按钮、Markdown切换按钮、话题选择器 */}
      {showToolbarToggle && (
        <div className="simple-md-editor-footer">
          <div className="flex items-center justify-between w-full">
            {/* 左侧：图片按钮和Markdown切换按钮 */}
            <div className="flex items-center gap-2">
              {/* 图片按钮 */}
              {onImageClick && (
                <button
                  type="button"
                  onClick={onImageClick}
                  disabled={imageCount >= maxImages || isUploading}
                  className="footer-action-btn"
                  title={`添加图片 (${imageCount}/${maxImages})`}
                >
                  {isUploading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Markdown 工具栏切换按钮 */}
              <button
                type="button"
                onClick={() => setShowToolbar(!showToolbar)}
                className={`footer-action-btn ${showToolbar ? "active" : ""}`}
                title={showToolbar ? "隐藏 Markdown 工具栏" : "显示 Markdown 工具栏"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs font-bold">T</span>
              </button>
            </div>

            {/* 右侧：话题选择器 */}
            {topicSelector && (
              <div className="pointer-events-auto">
                {topicSelector}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
