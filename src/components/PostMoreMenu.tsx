"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil } from "lucide-react";
import EditPost, { type EditablePost } from "@/components/EditPost";

type PostMoreMenuProps = {
  post: EditablePost;
  canEdit: boolean;
};

export default function PostMoreMenu({ post, canEdit }: PostMoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <div ref={menuRef} className="relative mr-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="帖子更多操作"
          aria-expanded={open}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {open && (
          <div className="absolute right-0 top-9 z-50 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
              编辑帖子
            </button>
          </div>
        )}
      </div>

      <EditPost post={post} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
