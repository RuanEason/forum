"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  // 从 session 中获取初始值，避免页面刷新时显示错误的值
  const [postViewMode, setPostViewMode] = useState(
    (session?.user as any)?.postViewMode || "both"
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => {
    console.log("组件挂载 - 视图模式:", postViewMode);
  }, [postViewMode]);

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
        <Card>
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
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "上传中..." : "更换头像"}
                      </Button>
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

                <Input
                  id="name"
                  name="name"
                  label="昵称"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Textarea
                  id="bio"
                  name="bio"
                  label="个人简介"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />

                <div>
                  <label
                    htmlFor="postViewMode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    帖子列表显示模式
                  </label>
                  <Dropdown
                    value={postViewMode}
                    onChange={(value) => setPostViewMode(value)}
                    options={[
                      { value: "both", label: "智能显示标题或正文" },
                      { value: "title", label: "仅显示标题" },
                      { value: "content", label: "仅预览正文" },
                      { value: "titleAndContent", label: "同时显示标题和正文" },
                    ]}
                  />
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
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card className="mt-6">
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
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "注销中..." : "注销账号"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
