"use client";

import UnifiedEditor from "@/components/editor/UnifiedEditor";

interface MarkdownDocEditorProps {
  documentKey: string;
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onPublish: () => void;
  activeLineNumber: number;
  setActiveLineNumber: (lineNumber: number) => void;
  externalJumpLine: number | null;
  onExternalJumpHandled: () => void;
}

export default function MarkdownDocEditor({
  documentKey,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onPublish,
  activeLineNumber,
  setActiveLineNumber,
  externalJumpLine,
  onExternalJumpHandled,
}: MarkdownDocEditorProps) {
  return (
    <UnifiedEditor
      documentKey={documentKey}
      title={title}
      content={content}
      onTitleChange={onTitleChange}
      onContentChange={onContentChange}
      onSave={onSave}
      onPublish={onPublish}
      activeLineNumber={activeLineNumber}
      setActiveLineNumber={setActiveLineNumber}
      externalJumpLine={externalJumpLine}
      onExternalJumpHandled={onExternalJumpHandled}
    />
  );
}
