"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Paperclip,
  Save,
  X,
} from "lucide-react";
import PostContentRenderer from "@/components/PostContentRenderer";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";
import type { PostStyleConfig } from "@/types/post-style";

type PostType = "TEXT" | "VIDEO";
type PostVisibility = "PUBLIC" | "UNLISTED";
type EditorMode = "edit" | "preview";

type EditableAttachment = {
  id?: string | null;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadCount?: number;
};

export type EditablePost = {
  id: string;
  title: string | null;
  content: string;
  postType: PostType;
  visibility: PostVisibility;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
  images: { url: string }[];
  attachments: EditableAttachment[];
};

type PostEditDrawerProps = {
  post: EditablePost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UploadProgressHandler = (percent: number, status: string) => void;

const MAX_IMAGES = 9;
const MAX_ATTACHMENTS = 5;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const IMAGE_UPLOAD_TIMEOUT_MS = 3 * 60 * 1000;
const ATTACHMENT_UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;
const TRANSFER_PROGRESS_MAX = 95;
const PROCESSING_PROGRESS_START = 96;
const PROCESSING_PROGRESS_MAX = 99;

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function createSnapshot(
  title: string,
  content: string,
  visibility: PostVisibility,
  images: string[],
  attachments: EditableAttachment[],
) {
  return JSON.stringify({
    title,
    content,
    visibility,
    images,
    attachments: attachments.map((attachment) => ({
      id: attachment.id ?? null,
      url: attachment.url,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    })),
  });
}

export default function PostEditDrawer({ post, open, onOpenChange }: PostEditDrawerProps) {
  const router = useRouter();
  const drawerRef = useRef<HTMLFormElement>(null);
  const discardDialogRef = useRef<HTMLDivElement>(null);
  const continueEditingRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelRequestedRef = useRef(false);

  const isTextPost = post.postType === "TEXT";
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);
  const [selectedImages, setSelectedImages] = useState<string[]>(post.images.map((image) => image.url));
  const [selectedAttachments, setSelectedAttachments] = useState<EditableAttachment[]>(post.attachments);
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    createSnapshot(post.title ?? "", post.content, post.visibility, post.images.map((image) => image.url), post.attachments),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const currentSnapshot = useMemo(
    () => createSnapshot(title, content, visibility, selectedImages, selectedAttachments),
    [content, selectedAttachments, selectedImages, title, visibility],
  );
  const isDirty = currentSnapshot !== initialSnapshot;
  const isBusy = saving || isUploading;

  const closeDrawer = useCallback(() => {
    setDiscardConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const requestClose = useCallback(() => {
    if (isBusy) {
      return;
    }

    if (isDirty) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeDrawer();
  }, [closeDrawer, isBusy, isDirty]);

  useEffect(() => {
    let enterAnimationFrame: number | undefined;
    let visibleAnimationFrame: number | undefined;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;

    if (open) {
      setMounted(true);
      // The first frame paints the drawer off-canvas; the second starts the transition.
      enterAnimationFrame = window.requestAnimationFrame(() => {
        visibleAnimationFrame = window.requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      exitTimer = setTimeout(() => setMounted(false), 300);
    }

    return () => {
      if (enterAnimationFrame) {
        window.cancelAnimationFrame(enterAnimationFrame);
      }
      if (visibleAnimationFrame) {
        window.cancelAnimationFrame(visibleAnimationFrame);
      }
      if (exitTimer) {
        clearTimeout(exitTimer);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextTitle = post.title ?? "";
    const nextImages = post.images.map((image) => image.url);
    const nextAttachments = post.attachments;
    setTitle(nextTitle);
    setContent(post.content);
    setVisibility(post.visibility);
    setSelectedImages(nextImages);
    setSelectedAttachments(nextAttachments);
    setInitialSnapshot(createSnapshot(nextTitle, post.content, post.visibility, nextImages, nextAttachments));
    setEditorMode("edit");
    setError("");
    setUploadProgress(0);
    setUploadStatus("");
    setDiscardConfirmOpen(false);
    cancelRequestedRef.current = false;
  }, [open, post]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, [mounted]);

  useEffect(() => {
    if (discardConfirmOpen) {
      window.requestAnimationFrame(() => continueEditingRef.current?.focus());
    }
  }, [discardConfirmOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (discardConfirmOpen) {
          setDiscardConfirmOpen(false);
          return;
        }
        requestClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = (discardConfirmOpen ? discardDialogRef.current : drawerRef.current)?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [discardConfirmOpen, open, requestClose]);

  const uploadFile = useCallback(
    async (file: File, endpoint: string, onProgress: UploadProgressHandler) => {
      const formData = new FormData();
      formData.append("file", file);

      return new Promise<unknown>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.timeout = endpoint.includes("/attachment")
          ? ATTACHMENT_UPLOAD_TIMEOUT_MS
          : IMAGE_UPLOAD_TIMEOUT_MS;

        let settled = false;
        let processingProgress = PROCESSING_PROGRESS_START;
        let processingTimer: ReturnType<typeof setInterval> | null = null;

        const cleanup = () => {
          if (processingTimer) {
            clearInterval(processingTimer);
          }
          if (xhrRef.current === xhr) {
            xhrRef.current = null;
          }
        };
        const settle = (callback: () => void) => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          callback();
        };
        const startProcessing = () => {
          if (processingTimer) {
            return;
          }
          onProgress(PROCESSING_PROGRESS_START, "文件已上传，服务器处理中...");
          processingTimer = setInterval(() => {
            processingProgress = Math.min(processingProgress + 1, PROCESSING_PROGRESS_MAX);
            onProgress(processingProgress, "文件已上传，服务器处理中...");
          }, 500);
        };

        xhr.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable || cancelRequestedRef.current) {
            return;
          }
          const ratio = Math.min(event.loaded / event.total, 1);
          onProgress(Math.min(Math.round(ratio * TRANSFER_PROGRESS_MAX), TRANSFER_PROGRESS_MAX), "正在上传...");
          if (event.loaded >= event.total) {
            startProcessing();
          }
        });
        xhr.addEventListener("loadstart", () => onProgress(0, "开始上传..."));
        xhr.addEventListener("load", () => {
          settle(() => {
            if (cancelRequestedRef.current) {
              reject(new Error("Upload cancelled"));
              return;
            }
            let response: { error?: string } | null = null;
            try {
              response = JSON.parse(xhr.responseText) as { error?: string };
            } catch {
              reject(new Error("服务器响应格式错误"));
              return;
            }
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(100, "上传完成");
              resolve(response);
              return;
            }
            reject(new Error(response?.error || `Upload failed: ${xhr.status}`));
          });
        });
        xhr.addEventListener("error", () => settle(() => reject(new Error("网络错误"))));
        xhr.addEventListener("abort", () => settle(() => reject(new Error("Upload cancelled"))));
        xhr.addEventListener("timeout", () => settle(() => reject(new Error("上传超时，请重试"))));
        xhr.open("POST", endpoint);
        xhr.send(formData);
      });
    },
    [],
  );

  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;
  };

  const cancelUpload = () => {
    cancelRequestedRef.current = true;
    setUploadStatus("正在取消上传...");
    xhrRef.current?.abort();
    xhrRef.current = null;
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      setError(`最多只能保留 ${MAX_IMAGES} 张图片`);
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setError(filesToUpload.length < files.length ? `最多只能保留 ${MAX_IMAGES} 张图片，已自动忽略多余图片` : "");
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;

    try {
      const uploadedUrls: string[] = [];
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const result = await uploadFile(filesToUpload[index], "/api/upload", (percent, status) => {
          setUploadProgress(Math.round(((index + percent / 100) / filesToUpload.length) * 100));
          setUploadStatus(`第 ${index + 1}/${filesToUpload.length} 张图片：${status}`);
        }) as { url: string };
        uploadedUrls.push(result.url);
      }
      setSelectedImages((current) => [...current, ...uploadedUrls].slice(0, MAX_IMAGES));
    } catch (uploadError) {
      setError(uploadError instanceof Error && uploadError.message === "Upload cancelled"
        ? "上传已取消"
        : `图片上传失败：${uploadError instanceof Error ? uploadError.message : "请稍后重试"}`);
    } finally {
      resetUploadState();
      event.target.value = "";
    }
  };

  const handleAttachmentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - selectedAttachments.length;
    if (remainingSlots <= 0) {
      setError(`最多只能保留 ${MAX_ATTACHMENTS} 个附件`);
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setError(filesToUpload.length < files.length ? `最多只能保留 ${MAX_ATTACHMENTS} 个附件，已自动忽略多余附件` : "");
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;

    try {
      const uploadedAttachments: EditableAttachment[] = [];
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const result = await uploadFile(filesToUpload[index], "/api/upload/attachment", (percent, status) => {
          setUploadProgress(Math.round(((index + percent / 100) / filesToUpload.length) * 100));
          setUploadStatus(`第 ${index + 1}/${filesToUpload.length} 个附件：${status}`);
        }) as EditableAttachment;
        uploadedAttachments.push(result);
      }
      setSelectedAttachments((current) => [...current, ...uploadedAttachments].slice(0, MAX_ATTACHMENTS));
    } catch (uploadError) {
      setError(uploadError instanceof Error && uploadError.message === "Upload cancelled"
        ? "上传已取消"
        : `附件上传失败：${uploadError instanceof Error ? uploadError.message : "请稍后重试"}`);
    } finally {
      resetUploadState();
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`);
      return;
    }
    if (isTextPost && !content.trim() && !selectedImages.length && !selectedAttachments.length) {
      setError("帖子内容、图片或附件不能全部为空");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/post", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post.id,
          title: title.trim() || null,
          content,
          visibility,
          images: isTextPost ? selectedImages : [],
          attachments: selectedAttachments.map((attachment) => ({
            id: attachment.id ?? null,
            url: attachment.url,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })),
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setError(data.error || "保存失败，请稍后重试");
        return;
      }
      closeDrawer();
      router.refresh();
    } catch (saveError) {
      console.error("Edit post error:", saveError);
      setError("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const statusLabel = saving
    ? "保存中"
    : isUploading
      ? "上传中"
      : isDirty
        ? "有未保存修改"
        : "已保存";

  return (
    <div
      className={`fixed inset-0 z-[90] transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      role="dialog"
      aria-modal="true"
      aria-label="编辑帖子"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out"
        aria-label="关闭编辑抽屉"
        tabIndex={-1}
        onClick={requestClose}
        disabled={isBusy}
      />

      <form
        ref={drawerRef}
        onSubmit={handleSubmit}
        className={`absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out md:w-[min(760px,72vw)] ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={requestClose}
              disabled={isBusy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="关闭编辑"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-950">编辑帖子</h2>
              <p className="text-xs text-slate-500">{isTextPost ? "图文帖子" : "视频帖子"} · {statusLabel}</p>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setEditorMode("edit")}
              className={`h-8 rounded px-3 text-xs font-medium transition-colors ${editorMode === "edit" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              aria-pressed={editorMode === "edit"}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("preview")}
              className={`h-8 rounded px-3 text-xs font-medium transition-colors ${editorMode === "preview" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              aria-pressed={editorMode === "preview"}
            >
              预览
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          {editorMode === "preview" ? (
            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
              <PostContentRenderer
                postId={post.id}
                title={title.trim() || null}
                content={content}
                styleConfig={post.styleConfig}
                styleCss={post.styleCss}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-8 px-5 py-6 sm:px-8">
              <section className="space-y-2">
                <label htmlFor="edit-post-title" className="text-xs font-semibold text-slate-500">标题</label>
                <input
                  id="edit-post-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH))}
                  placeholder={isTextPost ? "给帖子补一个标题" : "输入视频标题"}
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full border-0 border-b border-slate-200 bg-transparent px-0 py-3 text-2xl font-semibold text-slate-950 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500"
                />
              </section>

              <section className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">{isTextPost ? "正文" : "视频简介"}</label>
                <div className="overflow-hidden border-y border-slate-200">
                  <SimpleMarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder={isTextPost ? "修改你的帖子内容..." : "修改视频简介..."}
                    minHeight={320}
                    showToolbarToggle={true}
                    onImageClick={isTextPost ? () => imageInputRef.current?.click() : undefined}
                    imageCount={selectedImages.length}
                    maxImages={MAX_IMAGES}
                    isUploading={isUploading}
                    onAttachmentClick={() => attachmentInputRef.current?.click()}
                    attachmentCount={selectedAttachments.length}
                    maxAttachments={MAX_ATTACHMENTS}
                    onCancelUpload={cancelUpload}
                    uploadProgress={uploadProgress}
                    uploadStatus={uploadStatus}
                  />
                </div>
              </section>

              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={!isTextPost || isBusy || selectedImages.length >= MAX_IMAGES} />
              <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={handleAttachmentSelect} disabled={isBusy || selectedAttachments.length >= MAX_ATTACHMENTS} />

              {isTextPost ? (
                <section className="space-y-3 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">图片</h3>
                    <span className="text-xs text-slate-400">{selectedImages.length}/{MAX_IMAGES}</span>
                  </div>
                  {selectedImages.length ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {selectedImages.map((url, index) => (
                        <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
                          <Image src={url} alt={`帖子图片 ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 30vw, 150px" />
                          <button type="button" onClick={() => setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={isBusy} className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/70 text-white transition-colors hover:bg-slate-950 disabled:opacity-50" aria-label="移除图片">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">可从正文工具栏添加图片。</p>
                  )}
                </section>
              ) : null}

              <section className="space-y-3 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">附件</h3>
                  <span className="text-xs text-slate-400">{selectedAttachments.length}/{MAX_ATTACHMENTS}</span>
                </div>
                {selectedAttachments.length ? (
                  <div className="space-y-2">
                    {selectedAttachments.map((attachment, index) => (
                      <div key={`${attachment.id ?? attachment.url}-${index}`} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
                        <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{attachment.fileName}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={isBusy} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="移除附件">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">可从正文工具栏添加附件。</p>
                )}
              </section>

              <section className="space-y-3 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">可见性</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setVisibility("PUBLIC")} disabled={isBusy} className={`flex min-h-20 flex-col items-start justify-center gap-1 border px-3 text-left transition-colors ${visibility === "PUBLIC" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold"><Globe2 className="h-4 w-4" />公开</span>
                    <span className="text-xs opacity-75">展示在首页和搜索中</span>
                  </button>
                  <button type="button" onClick={() => setVisibility("UNLISTED")} disabled={isBusy} className={`flex min-h-20 flex-col items-start justify-center gap-1 border px-3 text-left transition-colors ${visibility === "UNLISTED" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold">{visibility === "UNLISTED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}仅链接可见</span>
                    <span className="text-xs opacity-75">只通过链接访问</span>
                  </button>
                </div>
              </section>

              {error ? (
                <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-wrap">{error}</span>
                </div>
              ) : null}
            </div>
          )}
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0 text-xs text-slate-500">
            <span>内容 {content.length}/{MAX_CONTENT_LENGTH}</span>
            <span className="ml-3">标题 {title.length}/{MAX_TITLE_LENGTH}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={requestClose} disabled={isBusy} className="h-9 px-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45">取消</button>
            <button type="submit" disabled={isBusy} className="inline-flex h-9 items-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中" : "保存修改"}
            </button>
          </div>
        </footer>
      </form>

      {discardConfirmOpen ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/20 px-5" role="alertdialog" aria-modal="true" aria-labelledby="discard-edit-title">
          <div ref={discardDialogRef} className="w-full max-w-sm border border-slate-200 bg-white p-5 shadow-xl">
            <h3 id="discard-edit-title" className="text-base font-semibold text-slate-950">放弃未保存的修改？</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">关闭后，本次输入和素材调整不会保存。</p>
            <div className="mt-5 flex justify-end gap-2">
              <button ref={continueEditingRef} type="button" onClick={() => setDiscardConfirmOpen(false)} className="h-9 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">继续编辑</button>
              <button type="button" onClick={closeDrawer} className="inline-flex h-9 items-center gap-2 bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"><Check className="h-4 w-4" />放弃修改</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
