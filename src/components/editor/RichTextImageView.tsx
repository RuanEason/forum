"use client";

import { useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

const MIN_IMAGE_WIDTH = 80;
const MAX_IMAGE_WIDTH = 1600;

export default function RichTextImageView({ node, selected, updateAttributes, editor, getPos }: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const align = typeof node.attrs.align === "string" ? node.attrs.align : "center";
  const width = typeof node.attrs.width === "number" ? node.attrs.width : null;
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startWidth = imageRef.current?.getBoundingClientRect().width ?? width ?? 480;
    const startX = event.clientX;
    const pointerId = event.pointerId;
    const target = event.currentTarget;
    target.setPointerCapture(pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(
        MIN_IMAGE_WIDTH,
        Math.min(MAX_IMAGE_WIDTH, Math.round(startWidth + moveEvent.clientX - startX)),
      );
      updateAttributes({ width: nextWidth });
    };

    const handleEnd = () => {
      target.releasePointerCapture(pointerId);
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleEnd);
      target.removeEventListener("pointercancel", handleEnd);
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleEnd);
    target.addEventListener("pointercancel", handleEnd);
  };

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "rich-image-node group relative my-5 w-full text-center",
        selected && "is-selected",
      )}
      data-image-align={align}
      data-image-position={typeof getPos === "function" ? getPos() : undefined}
      onClick={() => {
        if (typeof getPos === "function") {
          editor.commands.setNodeSelection(getPos());
        }
      }}
    >
      <span className="relative inline-block max-w-full leading-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={String(node.attrs.src ?? "")}
          alt={String(node.attrs.alt ?? "")}
          title={node.attrs.title ? String(node.attrs.title) : undefined}
          draggable={false}
          className="block max-w-full rounded-md object-contain"
          style={{
            width: width ? `${width}px` : undefined,
            maxWidth: "100%",
            height: "auto",
          }}
        />
        {selected ? (
          <button
            type="button"
            aria-label="调整图片宽度"
            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-ew-resize rounded-sm border-2 border-white bg-blue-600 shadow"
            onPointerDown={beginResize}
          />
        ) : null}
      </span>
      {selected ? (
        <div
          contentEditable={false}
          className="mx-auto mt-3 flex max-w-md items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
            <span className="shrink-0">替代文本</span>
            <input
              value={alt}
              maxLength={200}
              onChange={(event) => updateAttributes({ alt: event.target.value })}
              placeholder="描述这张图片"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
            />
          </label>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
