"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import EditorResizeHandle from "@/components/editor/EditorResizeHandle";
import type { EditorOutlineItem } from "@/components/editor/types";

interface EditorOutlineProps {
  width: number;
  items: EditorOutlineItem[];
  activePosition: number;
  onSelectPosition: (position: number) => void;
  onResize: (deltaX: number) => void;
  onResizeEnd: () => void;
}

export default function EditorOutline({
  width,
  items,
  activePosition,
  onSelectPosition,
  onResize,
  onResizeEnd,
}: EditorOutlineProps) {
  const [expanded, setExpanded] = useState(true);
  const collapsedWidth = 44;
  const activeItem = items.reduce<EditorOutlineItem | null>((current, item) => {
    if (item.position > activePosition) {
      return current;
    }

    if (!current || item.position >= current.position) {
      return item;
    }

    return current;
  }, null);

  return (
    <div
      className="relative h-full shrink-0 overflow-hidden border-l border-slate-200 bg-[#fbfdff] transition-[width] duration-300 ease-out"
      style={{ width: expanded ? width : collapsedWidth }}
    >
      {expanded ? (
        <EditorResizeHandle
          direction="right"
          className="!absolute !left-0 !top-0"
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      ) : null}
      <aside
        className="absolute inset-y-0 right-0 flex h-full flex-row bg-[#fbfdff] transition-transform duration-300 ease-out"
        style={{
          width,
          transform: expanded
            ? "translateX(0)"
            : `translateX(${width - collapsedWidth}px)`,
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className={cn(
            "flex h-full w-11 flex-shrink-0 flex-col items-center justify-start gap-3 border-r border-slate-200 bg-white/90 px-2 py-4 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900",
            expanded && "bg-slate-50",
          )}
          aria-label={expanded ? "折叠文档结构" : "展开文档结构"}
        >
          {expanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <ListTree className="h-4 w-4" />
          <span
            className="text-[11px] font-semibold tracking-[0.2em] text-slate-400"
            style={{ writingMode: "vertical-rl" }}
          >
            结构
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="flex items-center gap-2">
              <ListTree className="h-4 w-4" />
              文档结构
            </span>
            <span className="text-[11px] tracking-normal text-slate-400">
              {items.length} 项
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {items.length === 0 ? (
              <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm leading-6 text-slate-500">
                还没有检测到标题。
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = activeItem?.id === item.id && activeItem.position === item.position;
                  const paddingLeft = 12 + (item.depth - 1) * 12;

                  return (
                    <button
                      key={`${item.id}-${item.position}`}
                      type="button"
                      onClick={() => onSelectPosition(item.position)}
                      className={cn(
                        "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                      style={{ paddingLeft }}
                    >
                      <div className="truncate">{item.text}</div>
                      <div className="mt-1 text-[11px] text-slate-400">位置 {item.position}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
