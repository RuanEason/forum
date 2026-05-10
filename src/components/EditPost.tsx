"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Paperclip,
  Save,
  X,
} from "lucide-react";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";

type PostType = "TEXT" | "VIDEO";
type PostVisibility = "PUBLIC" | "UNLISTED";

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
  images: { url: string }[];
  attachments: EditableAttachment[];
};

type EditPostProps = {
  post: EditablePost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UploadProgressHandler = (percent: number, status: string) => void;

const MAX_IMAGES = 9;
const MAX_ATTACHMENTS = 5;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;

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

export default function EditPost({ post, open, onOpenChange }: EditPostProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelRequestedRef = useRef(false);

  const isTextPost = post.postType === "TEXT";
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    post.images.map((image) => image.url),
  );
  const [selectedAttachments, setSelectedAttachments] = useState<EditableAttachment[]>(
    post.attachments,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(post.title ?? "");
    setContent(post.content);
    setVisibility(post.visibility);
    setSelectedImages(post.images.map((image) => image.url));
    setSelectedAttachments(post.attachments);
    setError("");
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;
  }, [open, post]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, saving]);

  const uploadFile = useCallback(
    async (file: File, endpoint: string, onProgress: UploadProgressHandler) => {
      const formData = new FormData();
      formData.append("file", file);

      return new Promise<unknown>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (!event.lengthComputable || cancelRequestedRef.current) {
            return;
          }
          onProgress(Math.round((event.loaded / event.total) * 100), "正在上传...");
        });

        xhr.addEventListener("loadstart", () => {
          onProgress(0, "开始上传...");
        });

        xhr.addEventListener("load", () => {
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

        xhr.addEventListener("error", () => reject(new Error("网络错误")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", endpoint);
        xhr.send(formData);
      });
    },
    [],
  );

  const cancelUpload = () => {
    cancelRequestedRef.current = true;
    setUploadStatus("正在取消上传...");
    xhrRef.current?.abort();
    xhrRef.current = null;
  };

  const resetUploadState = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      setError(`最多只能保留 ${MAX_IMAGES} 张图片`);
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      setError(`最多只能保留 ${MAX_IMAGES} 张图片，已自动忽略多余图片`);
    } else {
      setError("");
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;

    try {
      const uploadedUrls: string[] = [];

      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index];
        const result = await uploadFile(file, "/api/upload", (percent, status) => {
          const overallProgress = ((index + percent / 100) / filesToUpload.length) * 100;
          setUploadProgress(Math.round(overallProgress));
          setUploadStatus(`第 ${index + 1}/${filesToUpload.length} 张图片：${status}`);
        }) as { url: string };

        uploadedUrls.push(result.url);
      }

      setSelectedImages((current) => [...current, ...uploadedUrls].slice(0, MAX_IMAGES));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error && uploadError.message === "Upload cancelled"
          ? "上传已取消"
          : `图片上传失败：${uploadError instanceof Error ? uploadError.message : "请稍后重试"}`,
      );
    } finally {
      resetUploadState();
      event.target.value = "";
    }
  };

  const handleAttachmentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - selectedAttachments.length;
    if (remainingSlots <= 0) {
      setError(`最多只能保留 ${MAX_ATTACHMENTS} 个附件`);
      event.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      setError(`最多只能保留 ${MAX_ATTACHMENTS} 个附件，已自动忽略多余附件`);
    } else {
      setError("");
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    cancelRequestedRef.current = false;

    try {
      const uploadedAttachments: EditableAttachment[] = [];

      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index];
        const result = await uploadFile(file, "/api/upload/attachment", (percent, status) => {
          const overallProgress = ((index + percent / 100) / filesToUpload.length) * 100;
          setUploadProgress(Math.round(overallProgress));
          setUploadStatus(`第 ${index + 1}/${filesToUpload.length} 个附件：${status}`);
        }) as EditableAttachment;

        uploadedAttachments.push(result);
      }

      setSelectedAttachments((current) =>
        [...current, ...uploadedAttachments].slice(0, MAX_ATTACHMENTS),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error && uploadError.message === "Upload cancelled"
          ? "上传已取消"
          : `附件上传失败：${uploadError instanceof Error ? uploadError.message : "请稍后重试"}`,
      );
    } finally {
      resetUploadState();
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (title.length > MAX_TITLE_LENGTH) {
      setError(`标题不能超过 ${MAX_TITLE_LENGTH} 个字符`);
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`);
      return;
    }

    if (
      isTextPost
      && content.trim() === ""
      && selectedImages.length === 0
      && selectedAttachments.length === 0
    ) {
      setError("帖子内容、图片或附件不能全部为空");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/post", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: post.id,
          title: title.trim() ? title.trim() : null,
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

      onOpenChange(false);
      router.refresh();
    } catch (saveError) {
      console.error("Edit post error:", saveError);
      setError("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-label="编辑帖子"
    >
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={() => {
          if (!saving) {
            onOpenChange(false);
          }
        }}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">编辑帖子</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {isTextPost ? "可修改正文、图片、附件和可见性" : "可修改标题、简介、附件和可见性"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="关闭编辑"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-post-title" className="text-sm font-medium text-gray-700">
                  标题（可选）
                </label>
                <input
                  id="edit-post-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH))}
                  placeholder="给帖子补一个标题"
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <SimpleMarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder={isTextPost ? "修改你的帖子内容..." : "修改视频简介..."}
                  minHeight={220}
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

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
                disabled={!isTextPost || saving || isUploading || selectedImages.length >= MAX_IMAGES}
              />
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentSelect}
                disabled={saving || isUploading || selectedAttachments.length >= MAX_ATTACHMENTS}
              />

              {isTextPost && selectedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">图片</span>
                    <span className="text-xs text-gray-400">
                      {selectedImages.length}/{MAX_IMAGES}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {selectedImages.map((url, index) => (
                      <div key={`${url}-${index}`} className="group relative aspect-square">
                        <Image
                          src={url}
                          alt={`帖子图片 ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                          sizes="(max-width: 640px) 33vw, 180px"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
                          }
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
                          aria-label="移除图片"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAttachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">附件</span>
                    <span className="text-xs text-gray-400">
                      {selectedAttachments.length}/{MAX_ATTACHMENTS}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedAttachments.map((attachment, index) => (
                      <div
                        key={`${attachment.id ?? attachment.url}-${index}`}
                        className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                      >
                        <Paperclip className="h-5 w-5 shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAttachments((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="移除附件"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">可见性</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      visibility === "PUBLIC"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Globe2 className="h-4 w-4" />
                      公开
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">会出现在首页和搜索结果中</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("UNLISTED")}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      visibility === "UNLISTED"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {visibility === "UNLISTED" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      仅链接可见
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">隐藏在首页和搜索外，只能通过链接访问</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
                <span>内容：{content.length}/{MAX_CONTENT_LENGTH}</span>
                <span>标题：{title.length}/{MAX_TITLE_LENGTH}</span>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-wrap">{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "保存中..." : "保存修改"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
