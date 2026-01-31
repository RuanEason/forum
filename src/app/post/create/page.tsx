"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";
import TopicSelector from "@/components/TopicSelector";
import { X, Loader2, ChevronDown, ChevronUp, Settings, Paperclip, FileText } from "lucide-react";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<Array<{ url: string; fileName: string; fileSize: number; mimeType: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [cancelRequested, setCancelRequested] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableTitle, setEnableTitle] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/post/create");
    }
  }, [status, router]);

  const uploadFile = async (file: File, endpoint: string, onProgress: (percent: number, status: string) => void) => {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      let uploadComplete = false;
      let processingStartTime = 0;
      const PROCESSING_DURATION = 30000;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && !cancelRequested) {
          const uploadPercent = Math.round((e.loaded / e.total) * 70);
          onProgress(uploadPercent, "正在上传...");
          
          if (e.loaded >= e.total && !uploadComplete) {
            uploadComplete = true;
            processingStartTime = Date.now();
            onProgress(70, "服务器正在处理文件，请稍候...");
            simulateProcessingProgress();
          }
        }
      });

      const simulateProcessingProgress = () => {
        if (!uploadComplete || xhr.readyState === 4) return;
        
        const elapsed = Date.now() - processingStartTime;
        const processingProgress = Math.min(29, Math.round((elapsed / PROCESSING_DURATION) * 29));
        const totalProgress = 70 + processingProgress;
        
        if (totalProgress < 99) {
          onProgress(totalProgress, "服务器正在处理文件，请稍候...");
          setTimeout(simulateProcessingProgress, 500);
        }
      };

      xhr.addEventListener("loadstart", () => {
        onProgress(0, "开始上传...");
      });

      xhr.addEventListener("load", () => {
        uploadComplete = true;
        if (cancelRequested) {
          reject(new Error("Upload cancelled"));
          return;
        }
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            onProgress(100, "上传完成！");
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid response"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      xhr.open("POST", endpoint);
      xhr.send(formData);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    setCancelRequested(false);
    setError("");

    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        if (cancelRequested) {
          throw new Error("Upload cancelled");
        }

        const file = files[i];
        setUploadStatus(`正在上传第 ${i + 1}/${totalFiles} 张图片...`);

        const result = await uploadFile(
          file,
          "/api/upload",
          (percent, statusMsg) => {
            const overallProgress = ((i + percent / 100) / totalFiles) * 100;
            setUploadProgress(Math.round(overallProgress));
            setUploadStatus(`第 ${i + 1}/${totalFiles} 张图片: ${statusMsg}`);
          }
        ) as { url: string };

        uploadedUrls.push(result.url);
      }

      setSelectedImages((prev) => [...prev, ...uploadedUrls]);
      setUploadStatus("上传完成！");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Upload cancelled") {
          setError("上传已取消");
          setUploadStatus("已取消");
        } else {
          console.error("Upload error:", err);
          setError(`图片上传失败: ${err.message}`);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      setCancelRequested(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("");
    setCancelRequested(false);
    setError("");

    try {
      const files = Array.from(e.target.files);
      const uploadedFiles: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }> = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        if (cancelRequested) {
          throw new Error("Upload cancelled");
        }

        const file = files[i];
        setUploadStatus(`正在上传第 ${i + 1}/${totalFiles} 个附件...`);

        const result = await uploadFile(
          file,
          "/api/upload/attachment",
          (percent, statusMsg) => {
            const overallProgress = ((i + percent / 100) / totalFiles) * 100;
            setUploadProgress(Math.round(overallProgress));
            setUploadStatus(`第 ${i + 1}/${totalFiles} 个附件: ${statusMsg}`);
          }
        ) as any;

        uploadedFiles.push(result);
      }

      setSelectedAttachments((prev) => [...prev, ...uploadedFiles]);
      setUploadStatus("上传完成！");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Upload cancelled") {
          setError("上传已取消");
          setUploadStatus("已取消");
        } else {
          console.error("Attachment upload error:", err);
          const errorMsg = err.message;
          if (errorMsg.includes("is not allowed")) {
            setError(`附件上传失败: ${errorMsg}\n\n当前系统不支持上传可执行文件，请压缩成ZIP或RAR后再上传。`);
          } else if (errorMsg.includes("exceeds maximum")) {
            setError(`附件上传失败: ${errorMsg}`);
          } else {
            setError(`附件上传失败: ${errorMsg}`);
          }
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      setCancelRequested(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }
  };

  const triggerAttachmentUpload = () => {
    attachmentInputRef.current?.click();
  };

  const removeAttachment = (indexToRemove: number) => {
    setSelectedAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const cancelUpload = () => {
    setCancelRequested(true);
    setUploadStatus("正在取消上传...");
    
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(session as any)?.user?.id) {
      setError("请先登录才能发布帖子");
      return;
    }
    if (!content.trim() && selectedImages.length === 0 && selectedAttachments.length === 0) {
      setError("帖子内容、图片或附件不能为空");
      return;
    }

    if (selectedAttachments.length > 5) {
      setError("最多只能上传 5 个附件");
      return;
    }

    // 如果启用了标题但标题为空，则提示
    if (enableTitle && !title.trim()) {
      setError("请输入标题");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: enableTitle ? title : null,
          content: content,
          authorId: (session as any)?.user?.id,
          images: selectedImages,
          attachments: selectedAttachments,
          topicId: selectedTopicId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "发布帖子失败");
      }
    } catch {
      setError("网络错误，发布帖子失败");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto py-6 px-4">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
          <h1 className="text-lg font-semibold text-gray-900">发布动态</h1>
          <button
            type="button"
            onClick={handleCreatePost}
            disabled={loading || isUploading || (!content.trim() && selectedImages.length === 0)}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "发布中..." : "发布"}
          </button>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-4">
          {/* 主编辑区域 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Markdown 编辑器 */}
            <SimpleMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="分享你的想法..."
              minHeight={200}
              showToolbarToggle={true}
              onImageClick={triggerImageUpload}
              imageCount={selectedImages.length}
              maxImages={9}
              isUploading={isUploading}
              onAttachmentClick={triggerAttachmentUpload}
              attachmentCount={selectedAttachments.length}
              maxAttachments={5}
              onCancelUpload={cancelUpload}
              uploadProgress={uploadProgress}
              uploadStatus={uploadStatus}
              topicSelector={
                <TopicSelector
                  selectedTopicId={selectedTopicId}
                  onSelect={setSelectedTopicId}
                />
              }
            />

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
              disabled={loading || isUploading || selectedImages.length >= 9}
            />

            {/* 隐藏的附件输入 */}
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentSelect}
              disabled={loading || isUploading || selectedAttachments.length >= 5}
            />

            {/* 图片上传区域 */}
            {selectedImages.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-3 pt-3">
                  {selectedImages.map((url, index) => (
                    <div key={index} className="relative aspect-square group">
                      <Image
                        src={url}
                        alt={`Upload preview ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 附件上传区域 */}
            {selectedAttachments.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-2 pt-3">
                  {selectedAttachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 text-gray-500">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 底部工具栏 - 只显示高级选项按钮 */}
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100">
              {/* 高级选项按钮 */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">高级选项</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 高级选项面板 */}
          {showAdvanced && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              {/* 标题开关和输入 */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTitle}
                    onChange={(e) => setEnableTitle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">添加标题</span>
                </label>
                {enableTitle && (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入标题（可选）"
                    maxLength={200}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                )}
              </div>

              {/* 字符统计 */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                <span>内容: {content.length} / 10000</span>
                {enableTitle && <span>标题: {title.length} / 200</span>}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
