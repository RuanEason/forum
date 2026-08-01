"use client";

import { useRef, useCallback } from "react";
import "./SimpleMarkdownEditor.css";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  showToolbarToggle?: boolean;
  variant?: "default" | "composer";
  contentSlot?: React.ReactNode;
  footerRight?: React.ReactNode;
  onImageClick?: () => void;
  imageCount?: number;
  maxImages?: number;
  isUploading?: boolean;
  onAttachmentClick?: () => void;
  attachmentCount?: number;
  maxAttachments?: number;
  topicSelector?: React.ReactNode;
  onCancelUpload?: () => void;
  uploadProgress?: number;
  uploadStatus?: string;
  onOpenEditor?: () => void;
}

export default function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = "写点什么...",
  minHeight = 150,
  showToolbarToggle = false,
  variant = "default",
  contentSlot,
  footerRight,
  onImageClick,
  imageCount = 0,
  maxImages = 9,
  isUploading = false,
  onAttachmentClick,
  attachmentCount = 0,
  maxAttachments = 5,
  topicSelector,
  onCancelUpload,
  uploadProgress = 0,
  uploadStatus = "",
  onOpenEditor,
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
    <div className={`simple-md-editor w-full ${variant === "composer" ? "simple-md-editor--composer" : ""}`}>
      {/* Markdown 工具栏已停用，统一引导到 /editor 使用桌面编辑器体验 */}

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

      {contentSlot && (
        <div className="simple-md-editor-content-slot">
          {contentSlot}
        </div>
      )}

      {/* 底部工具栏 - 图片按钮、附件按钮、Markdown切换按钮、话题选择器 */}
      {showToolbarToggle && (
        <>
          <div className="simple-md-editor-footer">
            <div className={`flex items-center justify-between w-full ${variant === "composer" ? "gap-3" : ""}`}>
              {/* 左侧：图片按钮、附件按钮、Markdown切换按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 图片按钮 */}
                {onImageClick && (
                  <button
                    type="button"
                    onClick={onImageClick}
                    disabled={imageCount >= maxImages || isUploading}
                    className="footer-action-btn"
                    title={`添加图片 (${imageCount}/${maxImages})`}
                  >
                    {isUploading && uploadProgress > 0 ? (
                      <span className="text-xs font-bold">{uploadProgress}%</span>
                    ) : isUploading ? (
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

                {/* 附件按钮 */}
                {onAttachmentClick && (
                  <button
                    type="button"
                    onClick={onAttachmentClick}
                    disabled={attachmentCount >= maxAttachments || isUploading}
                    className="footer-action-btn"
                    title={`添加附件 (${attachmentCount}/${maxAttachments})`}
                  >
                    {isUploading && uploadProgress > 0 ? (
                      <span className="text-xs font-bold">{uploadProgress}%</span>
                    ) : isUploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>
                )}

                {/* 取消上传按钮 */}
                {isUploading && onCancelUpload && (
                  <button
                    type="button"
                    onClick={onCancelUpload}
                    className="footer-action-btn text-red-600"
                    title="取消上传"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {onOpenEditor && (
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    className="footer-action-btn"
                    title="在编辑器中继续编辑"
                    aria-label="在编辑器中继续编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-xs font-bold">T</span>
                  </button>
                )}
              </div>

              {/* 右侧：话题选择器和主要操作 */}
              {(topicSelector || footerRight) && (
                <div className={variant === "composer"
                  ? "simple-md-editor-footer-right pointer-events-auto flex min-w-0 flex-shrink-0 items-center gap-2"
                  : "pointer-events-auto ml-2 flex-shrink-0"
                }>
                  {topicSelector && (
                    <div className="flex-shrink-0">
                      {topicSelector}
                    </div>
                  )}
                  {footerRight}
                </div>
              )}
            </div>
          </div>

          {/* 上传进度条 - 独立显示在 footer 下方 */}
          {isUploading && uploadProgress > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              {uploadStatus && (
                <div className="text-xs text-gray-600 mb-1 truncate">{uploadStatus}</div>
              )}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
