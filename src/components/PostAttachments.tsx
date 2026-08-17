"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import FileIcon from "./FileIcon";
import { Download, Trash2, FileText } from "lucide-react";

export interface PostAttachmentItem {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
}

interface PostAttachmentsProps {
  attachments: PostAttachmentItem[];
  postId: string;
  authorId: string;
  variant?: "default" | "sidebar";
}

export default function PostAttachments({
  attachments,
  postId,
  authorId,
  variant = "default",
}: PostAttachmentsProps) {
  const { data: session } = useSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isSidebar = variant === "sidebar";

  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = async (attachment: PostAttachmentItem) => {
    try {
      await fetch("/api/attachment/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attachment.id }),
      });
      window.open(attachment.url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      window.open(attachment.url, "_blank");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个附件吗？")) return;

    setDeletingId(id);
    try {
      const response = await fetch("/api/attachment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      window.location.reload();
    } catch (error) {
      console.error("Delete error:", error);
      alert("删除失败，请重试");
    } finally {
      setDeletingId(null);
    }
  };

  // Robust delete permission check to avoid TS type issues with session.user
  type UserLike = { id?: string | number; role?: string };
  const user = (session?.user as UserLike) ?? null;
  const isAuthor = !!user?.id && String(user.id) === String(authorId);
  const isAdmin = !!user?.role && user.role === "admin";
  const canDelete = !!(session && (isAuthor || isAdmin));

  return (
    <div
      className={isSidebar ? "post-attachments-sidebar" : "my-6"}
      data-post-id={postId}
    >
      <div className={isSidebar ? "border-t border-gray-200 pt-4" : "border-t border-gray-100 pt-4"}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          附件 ({attachments.length})
        </h3>
        <div className={isSidebar ? "post-attachments-sidebar-list" : "space-y-2"}>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={
                isSidebar
                  ? "group flex items-center gap-2 rounded-lg bg-gray-50 p-2 transition-all duration-200 hover:bg-gray-100"
                  : "group bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-all duration-200 flex items-center gap-3"
              }
            >
              <div className={isSidebar ? "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-500" : "flex-shrink-0 text-gray-500"}>
                <FileIcon
                  mimeType={attachment.mimeType}
                  size={isSidebar ? "sm" : "md"}
                />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <p className={isSidebar ? "truncate text-xs font-medium text-gray-900" : "text-sm font-medium text-gray-900 truncate"}>
                    {attachment.fileName}
                  </p>
                </div>
                <div
                  className={
                    isSidebar
                      ? "mt-1 flex items-center gap-2 text-[11px] text-gray-500"
                      : "flex items-center gap-3 mt-1 text-xs text-gray-500"
                  }
                >
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span>•</span>
                  <span>{attachment.downloadCount} 次下载</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  className={
                    isSidebar
                      ? "inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-all duration-200 hover:bg-white hover:text-indigo-600"
                      : "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  }
                  aria-label={`下载 ${attachment.fileName}`}
                >
                  <Download className="h-4 w-4" />
                  <span className={isSidebar ? "sr-only" : "hidden sm:inline"}>下载</span>
                </button>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                    className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === attachment.id ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
