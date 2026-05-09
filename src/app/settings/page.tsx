"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import COS from "cos-js-sdk-v5";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import Toggle from "@/components/ui/Toggle";

type BackgroundVideoStsResponse = {
  backgroundVideoAssetId: string;
  objectKey: string;
  bucket: string;
  region: string;
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
    startTime: number;
    expiredTime: number;
  };
};

type BackgroundVideoStatusResponse = {
  id: string;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  videoUrl?: string | null;
  errorMessage?: string | null;
};

type CosUploadProgress = {
  percent?: number;
};

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [postViewMode, setPostViewMode] = useState(
    (session?.user as any)?.postViewMode || "both"
  );
  const [showUserData, setShowUserData] = useState(
    (session?.user as any)?.showUserData ?? true
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");
  const [coverVideoAssetId, setCoverVideoAssetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coverCosRef = useRef<unknown>(null);
  const coverTaskIdRef = useRef<string | null>(null);

  const initialDataRef = useRef({
    name: "",
    bio: "",
    avatar: "",
    coverImage: "",
    postViewMode: "both",
    showUserData: true
  });

  const isVideo = /\.(mp4|mov|avi|webm)(\?.*)?$/i.test(coverImage);
  const previewUrl = isVideo
    ? coverImage.replace(/\.(mp4|mov|avi|webm)(\?.*)?$/i, "_preview.webp$2")
    : coverImage;

  const checkHasChanges = () => {
    return (
      name !== initialDataRef.current.name ||
      bio !== initialDataRef.current.bio ||
      avatar !== initialDataRef.current.avatar ||
      coverImage !== initialDataRef.current.coverImage ||
      postViewMode !== initialDataRef.current.postViewMode ||
      showUserData !== initialDataRef.current.showUserData
    );
  };

  const updateUnsavedChanges = () => {
    const hasChanges = checkHasChanges();
    setHasUnsavedChanges(hasChanges);
    hasUnsavedChangesRef.current = hasChanges;
  };

  const markUnsavedChanges = () => {
    setHasUnsavedChanges(true);
    hasUnsavedChangesRef.current = true;
  };

  const stopCoverVideoPolling = () => {
    if (coverPollTimerRef.current) {
      clearInterval(coverPollTimerRef.current);
      coverPollTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = "您的更改可能未保存。";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (coverPollTimerRef.current) {
        clearInterval(coverPollTimerRef.current);
        coverPollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
    }
    if (session?.user) {
      const user = session.user as any;
      setName(user.name || "");
      setAvatar(user.avatar || "");
      setCoverImage(user.coverImage || "");
      setPostViewMode(user.postViewMode || "both");
      setShowUserData(user.showUserData ?? true);
      fetchUserData();
    }
  }, [status, router, session, pathname]);
  useEffect(() => {
    console.log("组件挂载 - 视图模式:", postViewMode);
  }, [postViewMode]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
        setCoverImage(data.coverImage || "");
        setPostViewMode(data.postViewMode || "both");
        setShowUserData(data.showUserData ?? true);
        initialDataRef.current = {
          name: data.name || "",
          bio: data.bio || "",
          avatar: data.avatar || "",
          coverImage: data.coverImage || "",
          postViewMode: data.postViewMode || "both",
          showUserData: data.showUserData ?? true
        };
        setHasUnsavedChanges(false);
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
        updateUnsavedChanges();
      } else {
        setError(data.error || "图片上传失败");
      }
    } catch {
      setError("网络错误，图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverChangeLegacy = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");

    if (!isImage) {
      setError("Please upload an image file");
      return;
    }

    setUploadingCover(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/background", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCoverImage(data.url);
        updateUnsavedChanges();
      } else {
        setError(data.error || "背景图上传失败");
      }
    } catch {
      setError("网络错误，背景图上传失败");
    } finally {
      setUploadingCover(false);
    }
  };

  const fetchCoverVideoStatus = async (assetId: string) => {
    try {
      const response = await fetch(`/api/background-video/${assetId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json() as BackgroundVideoStatusResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch background video status");
      }

      if (data.status === "READY") {
        if (!data.videoUrl) {
          throw new Error("Background video is READY but no output URL was returned");
        }

        stopCoverVideoPolling();
        setUploadingCover(false);
        setCoverVideoAssetId(null);
        setCoverUploadProgress(100);
        setCoverUploadStatus("");
        setCoverImage(data.videoUrl);
        markUnsavedChanges();
        setSuccess("Background video processed. Please click Save changes.");
        return;
      }

      if (data.status === "FAILED") {
        stopCoverVideoPolling();
        setUploadingCover(false);
        setCoverVideoAssetId(null);
        setCoverUploadStatus("");
        setError(data.errorMessage || "Background video processing failed. Please upload again.");
        return;
      }

      setCoverUploadStatus("Background video is transcoding...");
    } catch (statusError) {
      stopCoverVideoPolling();
      setUploadingCover(false);
      setCoverVideoAssetId(null);
      setCoverUploadStatus("");
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to fetch background video status. Please retry.",
      );
    }
  };

  const startCoverVideoPolling = (assetId: string) => {
    stopCoverVideoPolling();
    void fetchCoverVideoStatus(assetId);
    coverPollTimerRef.current = setInterval(() => {
      void fetchCoverVideoStatus(assetId);
    }, 2500);
  };

  const uploadCoverVideoBySts = async (file: File) => {
    setError("");
    setSuccess("");
    stopCoverVideoPolling();

    setUploadingCover(true);
    setCoverVideoAssetId(null);
    setCoverUploadProgress(0);
    setCoverUploadStatus("Requesting upload credentials...");

    try {
      const stsResponse = await fetch("/api/background-video/sts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      const stsData = await stsResponse.json() as Partial<BackgroundVideoStsResponse> & { error?: string };
      if (!stsResponse.ok) {
        throw new Error(stsData.error || "Failed to request STS credentials");
      }

      const backgroundVideoAssetId = stsData.backgroundVideoAssetId;
      const objectKey = stsData.objectKey;
      const bucket = stsData.bucket;
      const region = stsData.region;
      const credentials = stsData.credentials;

      if (!backgroundVideoAssetId || !objectKey || !bucket || !region || !credentials) {
        throw new Error("Incomplete STS response for background video upload");
      }

      setCoverVideoAssetId(backgroundVideoAssetId);

      const cos = new COS({
        SecretId: credentials.tmpSecretId,
        SecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: credentials.startTime,
        ExpiredTime: credentials.expiredTime,
      });

      coverCosRef.current = cos;
      setCoverUploadStatus("Uploading background video...");

      const uploadResult = await new Promise<{ ETag?: string }>((resolve, reject) => {
        (cos as {
          sliceUploadFile: (
            params: {
              Bucket: string;
              Region: string;
              Key: string;
              Body: File;
              onTaskReady?: (taskId: string) => void;
              onProgress?: (progressData: CosUploadProgress) => void;
            },
            callback: (error: unknown, data: { ETag?: string }) => void,
          ) => void;
        }).sliceUploadFile(
          {
            Bucket: bucket,
            Region: region,
            Key: objectKey,
            Body: file,
            onTaskReady: (taskId: string) => {
              coverTaskIdRef.current = taskId;
            },
            onProgress: (progressData: CosUploadProgress) => {
              const percent = Math.max(
                0,
                Math.min(100, Math.round((progressData.percent ?? 0) * 100)),
              );
              setCoverUploadProgress(percent);
            },
          },
          (uploadError: unknown, data: { ETag?: string }) => {
            if (uploadError) {
              reject(uploadError);
              return;
            }
            resolve(data || {});
          },
        );
      });

      setCoverUploadProgress(100);
      setCoverUploadStatus("Upload complete. Submitting transcode task...");

      const commitResponse = await fetch("/api/background-video/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backgroundVideoAssetId,
          objectKey,
          etag: uploadResult.ETag ?? null,
        }),
      });

      const commitData = await commitResponse.json() as { error?: string };
      if (!commitResponse.ok) {
        throw new Error(commitData.error || "Failed to commit background video upload");
      }

      setCoverUploadStatus("Background video is transcoding...");
      startCoverVideoPolling(backgroundVideoAssetId);
    } catch (uploadError) {
      stopCoverVideoPolling();
      setUploadingCover(false);
      setCoverVideoAssetId(null);
      setCoverUploadProgress(0);
      setCoverUploadStatus("");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Background video upload failed. Please retry.",
      );
    } finally {
      coverTaskIdRef.current = null;
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile =
      file.type.startsWith("video/")
      || /\.(mp4|mov|avi|webm)$/i.test(file.name);

    if (isVideoFile) {
      await uploadCoverVideoBySts(file);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
      return;
    }

    await handleCoverChangeLegacy(e);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleRemoveCover = () => {
    stopCoverVideoPolling();
    setUploadingCover(false);
    setCoverVideoAssetId(null);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");
    setCoverImage("");
    markUnsavedChanges();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (uploadingCover && coverVideoAssetId) {
      setError("Background video is still processing. Please wait for completion before saving.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, bio, avatar, postViewMode, coverImage, showUserData }),
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
            coverImage: coverImage,
            showUserData: showUserData,
          },
        });
        setSuccess("个人信息更新更新成功！");
        initialDataRef.current = {
          name,
          bio,
          avatar,
          coverImage,
          postViewMode,
          showUserData
        };
        setHasUnsavedChanges(false);
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
                <BackButton
                  href="/"
                  onBeforeNavigate={() => {
                    if (hasUnsavedChanges) {
                      return !confirm("您有未保存的更改，确定要离开吗？");
                    }
                    return false;
                  }}
                />
            </div>
            <div className="relative">
              <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 pr-6">
              <BackButton
                href="/"
                onBeforeNavigate={() => {
                  if (hasUnsavedChanges) {
                    return !confirm("您有未保存的更改，确定要离开吗？");
                  }
                  return false;
                }}
              />
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
                  onChange={(e) => {
                    setName(e.target.value);
                    updateUnsavedChanges();
                  }}
                />

                <Textarea
                  id="bio"
                  name="bio"
                  label="个人简介"
                  rows={3}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    updateUnsavedChanges();
                  }}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介背景图
                  </label>
                  <div className="space-y-3">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-200 relative">
                      {coverImage ? (
                        isVideo ? (
                          <>
                            <video
                              src={coverImage}
                              autoPlay
                              loop
                              muted
                              playsInline
                              onError={(e) => console.error('Preview video error:', e)}
                              onLoadStart={() => console.log('Preview video load started')}
                              className="w-full h-full object-cover"
                            />
                            <img
                              src={previewUrl}
                              alt="背景预览"
                              className="w-full h-full object-cover"
                            />
                          </>
                        ) : (
                          <img
                            src={coverImage}
                            alt="背景图预览"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          暂无背景图
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? "处理中..." : "更换背景图"}
                      </Button>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleCoverChange}
                      />
                      {coverImage && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleRemoveCover}
                        >
                          移除背景图
                        </Button>
                      )}
                    </div>
                    {(uploadingCover || coverVideoAssetId || coverUploadStatus) && (
                      <p className="text-xs text-gray-500">
                        {coverUploadStatus || "Processing background upload..."}
                        {coverUploadProgress > 0 ? ` (${coverUploadProgress}%)` : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Supports image and video uploads. Videos are uploaded directly to COS under `backgrounds/` and transcoded asynchronously by CI. Save after processing completes.
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="postViewMode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    帖子列表显示模式
                  </label>
                  <Dropdown
                    value={postViewMode}
                    onChange={(value) => {
                      setPostViewMode(value);
                      updateUnsavedChanges();
                    }}
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

                <Toggle
                  id="showUserData"
                  checked={showUserData}
                  onChange={(checked) => {
                    setShowUserData(checked);
                    updateUnsavedChanges();
                  }}
                  label="展示用户统计"
                  description="在您的个人资料页面公开显示您的活动数据，包括加入天数、发布帖子数、被浏览量、获得点赞数和送出点赞数。关闭后将仅对您自己可见。"
                />
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
