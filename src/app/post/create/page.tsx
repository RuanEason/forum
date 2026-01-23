"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";
import TopicSelector from "@/components/TopicSelector";
import { X, Loader2, ChevronDown, ChevronUp, Settings } from "lucide-react";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setSelectedImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("图片上传失败，请重试");
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(session as any)?.user?.id) {
      setError("请先登录才能发布帖子");
      return;
    }
    if (!content.trim() && selectedImages.length === 0) {
      setError("帖子内容或图片不能为空");
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
