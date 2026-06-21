"use client";

import { FileCode2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorDocumentTab } from "@/components/editor/types";

interface EditorDocumentTabsProps {
  activeTab: EditorDocumentTab;
  onChange: (tab: EditorDocumentTab) => void;
}

const TABS: Array<{
  id: EditorDocumentTab;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "content",
    label: "正文.md",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "style",
    label: "样式.css",
    icon: <FileCode2 className="h-4 w-4" />,
  },
];

export default function EditorDocumentTabs({
  activeTab,
  onChange,
}: EditorDocumentTabsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-[#f7f7f5] px-5 py-2">
      {TABS.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 border px-3 py-2 text-sm transition-colors",
              active
                ? "border-slate-200 border-b-white bg-white text-slate-900"
                : "border-transparent bg-transparent text-slate-500 hover:bg-white hover:text-slate-800",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
