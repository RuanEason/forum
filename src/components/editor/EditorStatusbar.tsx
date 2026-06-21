"use client";

interface EditorStatusbarProps {
  wordCount: number;
  headingCount: number;
  saveStateLabel: string;
  documentLabel: string;
  activeLineLabel?: string;
}

export default function EditorStatusbar({
  wordCount,
  headingCount,
  saveStateLabel,
  documentLabel,
  activeLineLabel,
}: EditorStatusbarProps) {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-slate-200 bg-[#f7f7f5] px-4 text-xs text-slate-600">
      <div className="flex items-center gap-4">
        <span>{documentLabel}</span>
        {activeLineLabel ? <span>{activeLineLabel}</span> : null}
        <span>字数 {wordCount}</span>
        <span>标题 {headingCount}</span>
        <span>{saveStateLabel}</span>
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <span>Ctrl/Cmd + S 保存</span>
        <span>Ctrl/Cmd + Enter 发布</span>
      </div>
    </footer>
  );
}
