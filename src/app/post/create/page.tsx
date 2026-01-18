"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";
import TopicSelector from "@/components/TopicSelector";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { X, Plus, Loader2 } from "lucide-react";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

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
      e.target.value = "";
    }
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

    setLoading(true);
    try {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">发布新帖子</h1>
          </div>

          <div className="p-6">
            <form onSubmit={handleCreatePost}>
              <div className="space-y-6">
                {/* 新增：标题输入框 */}
                <Input
                  type="text"
                  id="title"
                  label="标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入帖子标题（可选）"
                  maxLength={100}
                />

                {/* Topic Selector */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                      选择话题 (可选)
                   </label>
                   <TopicSelector
                      selectedTopicId={selectedTopicId}
                      onSelect={setSelectedTopicId}
                   />
                </div>

                {/* Simple Markdown Editor */}
                <SimpleMarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="分享你的新鲜事... 支持 Markdown 格式"
                  minHeight={300}
                />

                {/* Image Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      添加图片
                    </label>
                    <span className="text-xs text-gray-500">
                      {selectedImages.length} / 9 张
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {selectedImages.map((url, index) => (
                      <div key={index} className="relative aspect-square group">
                        <Image
                          src={url}
                          alt={`Upload preview ${index + 1}`}
                          fill
                          className="object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {selectedImages.length < 9 && (
                      <label className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                          disabled={loading || isUploading}
                        />
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        ) : (
                          <>
                            <Plus className="h-8 w-8 text-gray-400" />
                            <span className="mt-2 text-xs text-gray-500">
                              上传图片
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || isUploading}
                  >
                    {loading ? "发布中..." : "发布帖子"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}
