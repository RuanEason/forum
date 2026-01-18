"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [postViewMode, setPostViewMode] = useState("both");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (session?.user) {
      const user = session.user as any;
      setName(user.name || "");
      setAvatar(user.avatar || "");
      setPostViewMode(user.postViewMode || "both");
      // Bio is not in session by default, we might need to fetch it or just rely on what we have.
      // For now, let's assume we update what's in session.
      // Ideally, we should fetch the latest user data from an API.
      fetchUserData();
    }
  }, [status, router, session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me"); // We need this endpoint
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
        setPostViewMode(data.postViewMode || "both");
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAvatar(data.url);
      } else {
        setError(data.error || "图片上传失败");
      }
    } catch {
      setError("网络错误，图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        // Reusing this endpoint as it updates user
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, bio, avatar, postViewMode }),
      });

      const data = await response.json();

      if (response.ok) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: name,
            avatar: avatar,
            postViewMode: postViewMode,
          },
        });
        setSuccess("个人信息更新成功！");
        router.refresh();
      } else {
        setError(data.error || "更新失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "确定要注销账号吗？此操作不可逆，您的所有帖子、评论和点赞都将被删除。"
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (response.ok) {
        // 强制退出登录并跳转到首页
        // 使用 window.location.href 确保完全重定向，避免 Next.js 客户端路由可能保留的状态
        await signOut({ redirect: false });
        window.location.href = "/";
      } else {
        const data = await response.json();
        setError(data.error || "注销账号失败");
        setDeleting(false);
      }
    } catch {
      setError("网络错误，注销账号失败");
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        加载中...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:hidden mb-4">
              <BackButton href="/" />
            </div>
            <div className="relative">
              <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 pr-6">
                <BackButton href="/" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                编辑个人资料
              </h3>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>更新您的个人信息和头像。</p>
            </div>
            <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头像
                  </label>
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={avatar}
                      name={name || session?.user?.email}
                      size="lg"
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {uploading ? "上传中..." : "更换头像"}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    昵称
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700"
                  >
                    个人简介
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="postViewMode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    帖子列表显示模式
                  </label>
                  <div
                    className={`ui-dropdown ${isDropdownOpen ? "open" : ""}`}
                    ref={dropdownRef}
                  >
                    <div
                      className="ui-select-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>
                        {postViewMode === "both" && "智能显示标题或正文"}
                        {postViewMode === "title" && "仅显示标题"}
                        {postViewMode === "content" && "仅预览正文"}
                        {postViewMode === "titleAndContent" &&
                          "同时显示标题和正文"}
                      </span>
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          isDropdownOpen ? "transform rotate-180" : ""
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ui-dropdown-menu">
                      <div
                        className="ui-dropdown-item"
                        onClick={() => {
                          setPostViewMode("both");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>智能显示标题或正文</span>
                        {postViewMode === "both" && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div
                        className="ui-dropdown-item"
                        onClick={() => {
                          setPostViewMode("title");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>仅显示标题</span>
                        {postViewMode === "title" && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div
                        className="ui-dropdown-item"
                        onClick={() => {
                          setPostViewMode("content");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>仅预览正文</span>
                        {postViewMode === "content" && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div
                        className="ui-dropdown-item"
                        onClick={() => {
                          setPostViewMode("titleAndContent");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>同时显示标题和正文</span>
                        {postViewMode === "titleAndContent" && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    选择您在浏览帖子列表时希望看到的内容。
                  </p>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm">{success}</div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? "保存中..." : "保存更改"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg mt-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-red-600">
              危险区域
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                注销账号将永久删除您的所有数据，包括帖子、评论和点赞。此操作无法撤销。
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? "注销中..." : "注销账号"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
