"use client";

import UnifiedEditor from "@/components/editor/UnifiedEditor";
import type { PostStyleConfig } from "@/types/post-style";
import type { EditorImageInsertRequest } from "@/components/editor/types";

interface MarkdownDocEditorProps {
  documentKey: string;
  title: string;
  content: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
  hideTitleInput?: boolean;
  imageInsertRequest: EditorImageInsertRequest | null;
  onImageInsertHandled: () => void;
}

export default function MarkdownDocEditor({
  documentKey,
  title,
  content,
  styleConfig = null,
  styleCss = "",
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
  activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
  hideTitleInput = false,
  imageInsertRequest,
  onImageInsertHandled,
}: MarkdownDocEditorProps) {
  return (
    <UnifiedEditor
      documentKey={documentKey}
      title={title}
      content={content}
      styleConfig={styleConfig}
      styleCss={styleCss}
      onTitleChange={onTitleChange}
      onContentChange={onContentChange}
      onSave={onSave}
      onPublish={onPublish}
      activeLineNumber={activeLineNumber}
      setActiveLineNumber={setActiveLineNumber}
      externalJumpLine={externalJumpLine}
      onExternalJumpHandled={onExternalJumpHandled}
      hideTitleInput={hideTitleInput}
      imageInsertRequest={imageInsertRequest}
      onImageInsertHandled={onImageInsertHandled}
    />
  );
}
