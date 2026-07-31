"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface EditorResizeHandleProps {
  direction: "left" | "right";
  onResize: (deltaX: number) => void;
  onResizeEnd?: () => void;
  className?: string;
}

export default function EditorResizeHandle({
  direction,
  onResize,
  onResizeEnd,
  className,
}: EditorResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; lastX: number } | null>(null);
  const pointerMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const restoreBodyStylesRef = useRef<(() => void) | null>(null);

  const finishDragging = useCallback(() => {
    if (!dragRef.current) {
      return;
    }

    dragRef.current = null;
    if (pointerMoveHandlerRef.current) {
      window.removeEventListener("pointermove", pointerMoveHandlerRef.current);
      pointerMoveHandlerRef.current = null;
    }
    restoreBodyStylesRef.current?.();
    restoreBodyStylesRef.current = null;
    setDragging(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.lastX;
    drag.lastX = event.clientX;
    onResize(deltaX);
  }, [onResize]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || dragRef.current) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, lastX: event.clientX };

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    restoreBodyStylesRef.current = () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };

    setDragging(true);
    pointerMoveHandlerRef.current = handlePointerMove;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDragging, { once: true });
    window.addEventListener("pointercancel", finishDragging, { once: true });
  }, [finishDragging, handlePointerMove]);

  useEffect(() => () => {
    if (dragRef.current) {
      finishDragging();
    }
  }, [finishDragging]);

  return (
    <div
      className={`${className ?? ""} group relative z-20 h-full w-1.5 shrink-0 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-blue-200 ${
        dragging ? "bg-blue-300" : ""
      }`}
      onPointerDown={handlePointerDown}
      role="separator"
      aria-orientation="vertical"
      aria-label={direction === "left" ? "调整左侧栏宽度" : "调整右侧栏宽度"}
    >
      <span className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
