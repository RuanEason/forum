"use client";

import { useEffect, useRef, useState } from "react";
import { Ellipsis, LoaderCircle, Pin, PinOff, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type PostListMoreMenuProps = {
  postId: string;
  pinned: boolean;
  canDelete: boolean;
  canPin: boolean;
  onDelete?: (postId: string) => Promise<boolean>;
  onPinnedChange?: (postId: string, pinned: boolean) => void;
};

export default function PostListMoreMenu({
  postId,
  pinned,
  canDelete,
  canPin,
  onDelete,
  onPinnedChange,
}: PostListMoreMenuProps) {
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!canDelete && !canPin) {
    return null;
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const deleted = await onDelete(postId);
    if (deleted) {
      setOpen(false);
    }
    setIsDeleting(false);
  };

  const handlePin = async () => {
    if (isPinning) {
      return;
    }

    setIsPinning(true);
    try {
      const response = await fetch("/api/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, pinned: !pinned }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "置顶操作失败");
        return;
      }

      onPinnedChange?.(postId, !pinned);
      setOpen(false);
    } catch {
      toast.error("网络错误，置顶操作失败");
    } finally {
      setIsPinning(false);
    }
  };

  const pinLabel = pinned ? "取消置顶帖子" : "置顶帖子";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        aria-label="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        title="更多操作"
      >
        <Ellipsis className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {canPin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void handlePin()}
              disabled={isPinning}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPinning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : pinned ? (
                <PinOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pin className="h-4 w-4" aria-hidden="true" />
              )}
              {pinLabel}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
