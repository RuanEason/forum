"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Copy, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorImageAsset } from "@/components/editor/types";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface EditorImagePoolProps {
  assets: EditorImageAsset[];
  usedBytes: number;
  maxBytes: number;
  loading: boolean;
  uploading: boolean;
  error: string;
  hasMore: boolean;
  onUpload: (files: File[]) => void;
  onLoadMore: () => void;
  onInsert: (asset: EditorImageAsset) => void;
  onDelete: (asset: EditorImageAsset) => Promise<void>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(0, bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function EditorImagePool({
  assets,
  usedBytes,
  maxBytes,
  loading,
  uploading,
  error,
  hasMore,
  onUpload,
  onLoadMore,
  onInsert,
  onDelete,
}: EditorImagePoolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [assetPendingDelete, setAssetPendingDelete] = useState<EditorImageAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();
  const usage = Math.min(100, (usedBytes / maxBytes) * 100);

  const copyUrl = async (asset: EditorImageAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
    } catch {
      // Clipboard permissions vary by browser; inserting remains available.
    }
  };

  const confirmDelete = async () => {
    if (!assetPendingDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(assetPendingDelete);
      toast.success("图片已从图片池删除");
      setAssetPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除图片失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-0 flex flex-1 flex-col">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">图片池</div>
            <div className="mt-1 text-xs text-slate-500">{formatBytes(usedBytes)} / 1 GB</div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || usedBytes >= maxBytes}
            className="inline-flex h-9 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            上传
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden bg-slate-200">
          <div className="h-full bg-slate-900 transition-[width]" style={{ width: `${usage}%` }} />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) {
              onUpload(files);
            }
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {error ? (
          <div className="mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {loading && assets.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载图片池...
          </div>
        ) : assets.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm leading-6 text-slate-500">
            上传图片后，点击缩略图即可插入文章。
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative min-w-0 border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => onInsert(asset)}
                  className="block w-full text-left"
                  title="插入到文章光标处"
                >
                  <div className="relative aspect-square w-full bg-slate-100">
                    <Image
                      src={asset.url}
                      alt={asset.fileName}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2 py-2">
                    <div className="truncate text-xs font-medium text-slate-700">{asset.fileName}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{formatBytes(asset.fileSize)}</div>
                  </div>
                </button>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => void copyUrl(asset)}
                    title="复制图片链接"
                    className="inline-flex h-7 w-7 items-center justify-center bg-white/95 text-slate-600 shadow-sm transition-colors hover:text-slate-950"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetPendingDelete(asset)}
                    title="删除图片"
                    className="inline-flex h-7 w-7 items-center justify-center bg-white/95 text-red-600 shadow-sm transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50",
              loading && "cursor-not-allowed opacity-60",
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            加载更多
          </button>
        ) : null}
      </div>

      <Modal
        isOpen={Boolean(assetPendingDelete)}
        onClose={() => {
          if (!isDeleting) {
            setAssetPendingDelete(null);
          }
        }}
        title="删除图片"
        showCloseButton={!isDeleting}
        className="max-w-sm rounded-md"
      >
        <p className="text-sm leading-6 text-slate-600">
          删除后将无法恢复。已被文章或草稿引用的图片无法删除。
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAssetPendingDelete(null)}
            disabled={isDeleting}
            className="h-9 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={isDeleting}
            className="inline-flex h-9 items-center gap-2 bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            删除
          </button>
        </div>
      </Modal>
    </div>
  );
}
