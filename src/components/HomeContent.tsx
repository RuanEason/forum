"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeButton from "@/components/LikeButton";
import RepostButton from "@/components/RepostButton";
import Avatar from "@/components/Avatar";
import PostImages from "@/components/PostImages";
import Image from "next/image";

interface PostProps {
  id: string;
  content: string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  likes: {
    userId: string;
  }[];
  reposts: {
    userId: string;
  }[];
  comments: {
    id: string;
  }[];
  images: {
    url: string;
  }[];
  createdAt: string;
}

export default function HomeContent({ initialPosts }: { initialPosts: PostProps[] }) {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<PostProps[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("确定要删除这条帖子吗？")) return;

    try {
      const response = await fetch("/api/post", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: postId }),
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (err) {
      alert("网络错误，删除失败");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!session?.user?.id) {
      setError("请先登录才能发布帖子");
      return;
    }
    if (!newPostContent.trim() && selectedImages.length === 0) {
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
          content: newPostContent,
          authorId: session.user.id,
          images: selectedImages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewPostContent("");
        setSelectedImages([]);
        // 重新获取帖子列表
        const postsResponse = await fetch("/api/post");
        if (postsResponse.ok) {
          const updatedPosts = await postsResponse.json();
          setPosts(updatedPosts);
        }
      } else {
        setError(data.error || "发布帖子失败");
      }
    } catch (err) {
      setError("网络错误，发布帖子失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <main className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6">
        <div className="px-0 sm:px-0">
          {session && (
            <div className="mb-6 bg-white p-4 sm:rounded-lg shadow-sm border-b sm:border-0 border-gray-200">
              <form onSubmit={handleCreatePost}>
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <Avatar src={session.user.avatar} name={session.user.name} size="md" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base"
                      rows={3}
                      placeholder="分享你的新鲜事..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      disabled={loading}
                    ></textarea>

                    {/* Image Previews */}
                    {selectedImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {selectedImages.map((url, index) => (
                          <div key={index} className="relative aspect-square group">
                            <Image
                              src={url}
                              alt={`Upload preview ${index + 1}`}
                              fill
                              className="object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer text-gray-500 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageSelect}
                            disabled={loading || isUploading}
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </label>
                        {isUploading && <span className="text-xs text-gray-500">上传中...</span>}
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        disabled={loading || isUploading}
                      >
                        {loading ? "发布中..." : "发布"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white sm:rounded-lg shadow-sm">
                <p className="text-gray-500">还没有帖子，快来发布第一个帖子吧！</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <Avatar src={post.author.avatar} name={post.author.name} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/user/${post.author.id}`} className="text-sm font-bold text-gray-900 hover:underline truncate">
                            {post.author.name || "匿名用户"}
                          </Link>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {new Date(post.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-800">
                          <Link href={`/post/${post.id}`} className="block hover:bg-gray-50 rounded-md -mx-2 p-2 transition duration-150 ease-in-out">
                            <div className="prose prose-sm max-w-none line-clamp-4 break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {post.content}
                              </ReactMarkdown>
                            </div>
                          </Link>
                          {post.images && post.images.length > 0 && (
                            <PostImages images={post.images.map((img) => img.url)} />
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between sm:justify-start sm:space-x-8 pt-2 border-t border-gray-50">
                      <LikeButton
                        targetType="post"
                        targetId={post.id}
                        initialLikesCount={post.likes.length}
                        initialLikedByUser={
                          session?.user?.id
                            ? post.likes.some((like) => like.userId === session.user.id)
                            : false
                        }
                      />
                      <Link href={`/post/${post.id}`} className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 group p-2 rounded-full hover:bg-blue-50 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="group-hover:scale-110 transition-transform duration-200"
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span className="text-sm font-medium">{post.comments.length > 0 ? post.comments.length : "评论"}</span>
                      </Link>
                      <RepostButton
                        postId={post.id}
                        initialRepostsCount={post.reposts.length}
                        initialRepostedByUser={
                          session?.user?.id
                            ? post.reposts.some((repost) => repost.userId === session.user.id)
                            : false
                        }
                      />
                      {session?.user?.id && session.user.id === post.author.id && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-500 hover:text-red-700 text-sm p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}