"use client";

import { useEffect, useId, useState, type FocusEvent } from "react";
import { History } from "lucide-react";
import { formatDateTime } from "@/lib/datetime";

type PostEditHistoryEntry = {
  id: string;
  editorName: string;
  createdAt: Date | string;
};

type PostEditHistoryProps = {
  createdAt: Date | string;
  history: PostEditHistoryEntry[];
  dateStyle?: "dash" | "cn";
};

export default function PostEditHistory({
  createdAt,
  history,
  dateStyle = "dash",
}: PostEditHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverId = useId();
  const latestEdit = history[0];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  if (!latestEdit) {
    return <span>{formatDateTime(createdAt, { style: dateStyle })}</span>;
  }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        onClick={() => setIsOpen((open) => !open)}
      >
        编辑于 {formatDateTime(latestEdit.createdAt, { style: dateStyle })}
      </button>

      {isOpen ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label="编辑足迹"
          className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden border border-gray-200 bg-white text-gray-700 shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-sm font-semibold text-gray-900">
            <History className="h-4 w-4" aria-hidden="true" />
            编辑足迹
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span>{formatDateTime(entry.createdAt, { style: dateStyle })}</span>
                <span className="min-w-0 truncate font-medium text-gray-900">{entry.editorName}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
