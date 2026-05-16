"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import COS from "cos-js-sdk-v5";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import Toggle from "@/components/ui/Toggle";

type PostViewMode = "both" | "title" | "content" | "titleAndContent";

type SettingsField =
  | "name"
  | "bio"
  | "avatar"
  | "coverImage"
  | "postViewMode"
  | "showUserData";

type SettingsPatchPayload = {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  postViewMode?: PostViewMode;
  showUserData?: boolean;
};

type SettingsApiUser = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  postViewMode: PostViewMode | null;
  coverImage: string | null;
  showUserData: boolean;
};

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
  const [savedName, setSavedName] = useState("");
  const [bio, setBio] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [postViewMode, setPostViewMode] = useState<PostViewMode>("both");
  const [showUserData, setShowUserData] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");
  const [coverVideoAssetId, setCoverVideoAssetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingFields, setSavingFields] = useState<Partial<Record<SettingsField, boolean>>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitializedRef = useRef(false);
  const hasTextUnsavedChangesRef = useRef(false);
  const coverImageRef = useRef("");

  const isNameDirty = name !== savedName;
  const isBioDirty = bio !== savedBio;
  const hasTextUnsavedChanges = isNameDirty || isBioDirty;

  const isVideo = /\.(mp4|mov|avi|webm)(\?.*)?$/i.test(coverImage);
  const previewUrl = isVideo
    ? coverImage.replace(/\.(mp4|mov|avi|webm)(\?.*)?$/i, "_preview.webp$2")
    : coverImage;

  useEffect(() => {
    coverImageRef.current = coverImage;
  }, [coverImage]);

  useEffect(() => {
    hasTextUnsavedChangesRef.current = hasTextUnsavedChanges;
  }, [hasTextUnsavedChanges]);

  const setFieldSaving = (field: SettingsField, saving: boolean) => {
    setSavingFields((prev) => ({ ...prev, [field]: saving }));
  };

  const isFieldSaving = (field: SettingsField) => Boolean(savingFields[field]);

  const stopCoverVideoPolling = () => {
    if (coverPollTimerRef.current) {
      clearInterval(coverPollTimerRef.current);
      coverPollTimerRef.current = null;
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return;

      const data = await response.json();
      const nextName = data.name || "";
      const nextBio = data.bio || "";
      const nextAvatar = data.avatar || "";
      const nextCoverImage = data.coverImage || "";
      const nextPostViewMode = (data.postViewMode || "both") as PostViewMode;
      const nextShowUserData = data.showUserData ?? true;

      setName(nextName);
      setSavedName(nextName);
      setBio(nextBio);
      setSavedBio(nextBio);
      setAvatar(nextAvatar);
      setCoverImage(nextCoverImage);
      setPostViewMode(nextPostViewMode);
      setShowUserData(nextShowUserData);
    } catch (fetchError) {
      console.error("Failed to fetch user data", fetchError);
    }
  };

  const patchSettings = async (
    payload: SettingsPatchPayload,
    field: SettingsField,
    successMessage: string,
  ): Promise<SettingsApiUser | null> => {
    setError("");
    setSuccess("");
    setFieldSaving(field, true);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string; user?: SettingsApiUser };

      if (!response.ok || !data.user) {
        setError(data.error || "更新失败，请稍后重试");
        return null;
      }

      const user = data.user;

      await update({
        ...session,
        user: {
          ...session?.user,
          name: user.name || "",
          avatar: user.avatar || "",
          postViewMode: user.postViewMode || "both",
          coverImage: user.coverImage || "",
          showUserData: user.showUserData,
        },
      });

      setSuccess(successMessage);
      router.refresh();

      return user;
    } catch {
      setError("网络错误，请稍后重试");
      return null;
    } finally {
      setFieldSaving(field, false);
    }
  };

  const handleSaveName = async () => {
    if (!isNameDirty || isFieldSaving("name")) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("昵称不能为空");
      return;
    }

    const user = await patchSettings({ name: trimmedName }, "name", "昵称已更新");
    if (!user) return;

    const nextName = user.name || trimmedName;
    setName(nextName);
    setSavedName(nextName);
  };

  const handleSaveBio = async () => {
    if (!isBioDirty || isFieldSaving("bio")) return;

    const normalizedBio = bio.trim();
    const user = await patchSettings({ bio: normalizedBio || null }, "bio", "个人简介已更新");
    if (!user) return;

    const nextBio = user.bio || "";
    setBio(nextBio);
    setSavedBio(nextBio);
  };

  const handlePostViewModeChange = async (value: string) => {
    const nextMode = value as PostViewMode;
    if (nextMode === postViewMode || isFieldSaving("postViewMode")) return;

    const previousMode = postViewMode;
    setPostViewMode(nextMode);

    const user = await patchSettings(
      { postViewMode: nextMode },
      "postViewMode",
      "帖子显示模式已更新",
    );

    if (!user) {
      setPostViewMode(previousMode);
      return;
    }

    setPostViewMode((user.postViewMode || nextMode) as PostViewMode);
  };

  const handleShowUserDataChange = async (checked: boolean) => {
    if (isFieldSaving("showUserData")) return;

    const previousValue = showUserData;
    setShowUserData(checked);

    const user = await patchSettings(
      { showUserData: checked },
      "showUserData",
      checked ? "已开启用户统计展示" : "已关闭用户统计展示",
    );

    if (!user) {
      setShowUserData(previousValue);
      return;
    }

    setShowUserData(Boolean(user.showUserData));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error || "图片上传失败");
        return;
      }

      const previousAvatar = avatar;
      setAvatar(data.url);

      const user = await patchSettings({ avatar: data.url }, "avatar", "头像已更新");
      if (!user) {
        setAvatar(previousAvatar);
        return;
      }

      setAvatar(user.avatar || "");
    } catch {
      setError("网络错误，图片上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCoverChangeLegacy = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }

    setUploadingCover(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/background", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error || "背景图上传失败");
        return;
      }

      const previousCover = coverImageRef.current;
      setCoverImage(data.url);

      const user = await patchSettings(
        { coverImage: data.url },
        "coverImage",
        "背景图已自动应用",
      );

      if (!user) {
        setCoverImage(previousCover);
        return;
      }

      setCoverImage(user.coverImage || "");
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

      const data = (await response.json()) as BackgroundVideoStatusResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "获取背景视频状态失败");
      }

      if (data.status === "READY") {
        if (!data.videoUrl) {
          throw new Error("背景视频处理完成但未返回输出地址");
        }

        stopCoverVideoPolling();
        setUploadingCover(false);
        setCoverVideoAssetId(null);
        setCoverUploadProgress(100);
        setCoverUploadStatus("");

        const previousCover = coverImageRef.current;
        setCoverImage(data.videoUrl);

        const user = await patchSettings(
          { coverImage: data.videoUrl },
          "coverImage",
          "背景视频已自动应用",
        );

        if (!user) {
          setCoverImage(previousCover);
          return;
        }

        setCoverImage(user.coverImage || "");
        return;
      }

      if (data.status === "FAILED") {
        stopCoverVideoPolling();
        setUploadingCover(false);
        setCoverVideoAssetId(null);
        setCoverUploadStatus("");
        setError(data.errorMessage || "背景视频处理失败，请重新上传");
        return;
      }

      setCoverUploadStatus("背景视频转码中...");
    } catch (statusError) {
      stopCoverVideoPolling();
      setUploadingCover(false);
      setCoverVideoAssetId(null);
      setCoverUploadStatus("");
      setError(
        statusError instanceof Error
          ? statusError.message
          : "获取背景视频状态失败，请重试",
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
    setCoverUploadStatus("正在请求上传凭证...");

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

      const stsData = (await stsResponse.json()) as Partial<BackgroundVideoStsResponse> & {
        error?: string;
      };
      if (!stsResponse.ok) {
        throw new Error(stsData.error || "获取背景视频上传凭证失败");
      }

      const backgroundVideoAssetId = stsData.backgroundVideoAssetId;
      const objectKey = stsData.objectKey;
      const bucket = stsData.bucket;
      const region = stsData.region;
      const credentials = stsData.credentials;

      if (!backgroundVideoAssetId || !objectKey || !bucket || !region || !credentials) {
        throw new Error("背景视频上传凭证返回不完整");
      }

      setCoverVideoAssetId(backgroundVideoAssetId);

      const cos = new COS({
        SecretId: credentials.tmpSecretId,
        SecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: credentials.startTime,
        ExpiredTime: credentials.expiredTime,
      });

      setCoverUploadStatus("背景视频上传中...");

      const uploadResult = await new Promise<{ ETag?: string }>((resolve, reject) => {
        (cos as {
          sliceUploadFile: (
            params: {
              Bucket: string;
              Region: string;
              Key: string;
              Body: File;
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
      setCoverUploadStatus("上传完成，正在提交转码任务...");

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

      const commitData = (await commitResponse.json()) as { error?: string };
      if (!commitResponse.ok) {
        throw new Error(commitData.error || "背景视频提交转码失败");
      }

      setCoverUploadStatus("背景视频转码中...");
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
          : "背景视频上传失败，请重试",
      );
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith("video/") || /\.(mp4|mov|avi|webm)$/i.test(file.name);

    if (isVideoFile) {
      await uploadCoverVideoBySts(file);
      e.target.value = "";
      return;
    }

    await handleCoverChangeLegacy(file);
    e.target.value = "";
  };

  const handleRemoveCover = async () => {
    if (!coverImage || isFieldSaving("coverImage")) return;

    stopCoverVideoPolling();
    setUploadingCover(false);
    setCoverVideoAssetId(null);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");

    const previousCover = coverImage;
    setCoverImage("");

    const user = await patchSettings({ coverImage: null }, "coverImage", "背景图已移除");
    if (!user) {
      setCoverImage(previousCover);
      return;
    }

    setCoverImage(user.coverImage || "");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("确定要注销账号吗？此操作不可逆，您的所有帖子、评论和点赞都将被删除。")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (response.ok) {
        await signOut({ redirect: false });
        window.location.href = "/";
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "注销账号失败");
        setDeleting(false);
      }
    } catch {
      setError("网络错误，注销账号失败");
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasTextUnsavedChangesRef.current) return;
      e.preventDefault();
      e.returnValue = "昵称或个人简介尚未保存，确定离开吗？";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      stopCoverVideoPolling();
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (status !== "authenticated" || !session?.user || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;
    const user = session.user as {
      name?: string | null;
      avatar?: string | null;
      coverImage?: string | null;
      postViewMode?: PostViewMode;
      showUserData?: boolean;
    };

    const initialName = user.name || "";
    setName(initialName);
    setSavedName(initialName);
    setAvatar(user.avatar || "");
    setCoverImage(user.coverImage || "");
    setPostViewMode((user.postViewMode || "both") as PostViewMode);
    setShowUserData(user.showUserData ?? true);

    void fetchUserData();
  }, [status, session, router, pathname]);

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
                  if (hasTextUnsavedChanges) {
                    return !confirm("昵称或个人简介尚未保存，确定要离开吗？");
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
                    if (hasTextUnsavedChanges) {
                      return !confirm("昵称或个人简介尚未保存，确定要离开吗？");
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

            <div className="mt-5 space-y-6">
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
                        disabled={uploading || isFieldSaving("avatar")}
                      >
                        {uploading || isFieldSaving("avatar") ? "上传中..." : "更换头像"}
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

                <div className="space-y-2">
                  <Input
                    id="name"
                    name="name"
                    label="昵称"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                  />
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isNameDirty ? "max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveName}
                        disabled={!isNameDirty || isFieldSaving("name")}
                      >
                        {isFieldSaving("name") ? "保存中..." : "保存更改"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    id="bio"
                    name="bio"
                    label="个人简介"
                    rows={3}
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                    }}
                  />
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      isBioDirty ? "max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveBio}
                        disabled={!isBioDirty || isFieldSaving("bio")}
                      >
                        {isFieldSaving("bio") ? "保存中..." : "保存更改"}
                      </Button>
                    </div>
                  </div>
                </div>

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
                              onError={(e) => console.error("Preview video error:", e)}
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
                        disabled={uploadingCover || isFieldSaving("coverImage")}
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
                          onClick={() => void handleRemoveCover()}
                          disabled={uploadingCover || isFieldSaving("coverImage")}
                        >
                          {isFieldSaving("coverImage") ? "移除中..." : "移除背景图"}
                        </Button>
                      )}
                    </div>
                    {(uploadingCover || coverVideoAssetId || coverUploadStatus) && (
                      <p className="text-xs text-gray-500">
                        {coverUploadStatus || "背景文件处理中..."}
                        {coverUploadProgress > 0 ? ` (${coverUploadProgress}%)` : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      支持图片和视频上传。视频会自动上传并异步转码，转码完成后自动应用，无需手动保存。
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
                      void handlePostViewModeChange(value);
                    }}
                    disabled={isFieldSaving("postViewMode")}
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
                    void handleShowUserDataChange(checked);
                  }}
                  disabled={isFieldSaving("showUserData")}
                  label="展示用户统计"
                  description="在您的个人资料页面公开显示您的活动数据，包括加入天数、发布帖子数、被浏览量、获得点赞数和送出点赞数。关闭后将仅对您自己可见。"
                />
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">{success}</div>}
            </div>
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
                onClick={() => void handleDeleteAccount()}
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
