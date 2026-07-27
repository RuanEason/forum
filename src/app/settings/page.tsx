"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import COS from "cos-js-sdk-v5";
import {
  Bell,
  BookOpen,
  Check,
  CircleUserRound,
  Github,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Toggle from "@/components/ui/Toggle";

type PostViewMode = "both" | "title" | "content" | "titleAndContent";
type SettingsSection = "profile" | "security" | "notifications" | "reading";
type SavingKey = "profile" | "avatar" | "coverImage" | "postViewMode" | "showUserData"
  | "notifyReplies" | "notifyLikes" | "notifyFollows" | "password" | "github" | "delete";

type SettingsPatchPayload = {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  postViewMode?: PostViewMode;
  showUserData?: boolean;
  notifyReplies?: boolean;
  notifyLikes?: boolean;
  notifyFollows?: boolean;
};

type SettingsApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  postViewMode: PostViewMode | null;
  coverImage: string | null;
  showUserData: boolean;
  notifyReplies: boolean;
  notifyLikes: boolean;
  notifyFollows: boolean;
};

type SecuritySettings = {
  email: string | null;
  hasPassword: boolean;
  githubLinked: boolean;
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
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  videoUrl?: string | null;
  errorMessage?: string | null;
};

const sectionDetails: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  { id: "profile", label: "个人资料", description: "管理公开信息与个人展示", icon: UserRound },
  { id: "security", label: "账号与安全", description: "密码与登录方式", icon: ShieldCheck },
  { id: "notifications", label: "通知设置", description: "管理接收的动态提醒", icon: Bell },
  { id: "reading", label: "阅读与隐私", description: "调整浏览体验和资料可见性", icon: BookOpen },
];

function isSettingsSection(value: string | null): value is SettingsSection {
  return sectionDetails.some((section) => section.id === value);
}

function isVideoUrl(value: string) {
  return /\.(mp4|mov|avi|webm)(\?.*)?$/i.test(value);
}

function getGitHubStatusMessage(value: string | null) {
  switch (value) {
    case "connected":
      return { type: "success" as const, text: "GitHub 已成功绑定" };
    case "cancelled":
      return { type: "error" as const, text: "已取消 GitHub 授权" };
    case "conflict":
      return { type: "error" as const, text: "该 GitHub 账号已绑定到其他论坛账户" };
    case "already-linked":
      return { type: "error" as const, text: "请先解绑当前 GitHub 账号后再更换" };
    case "error":
      return { type: "error" as const, text: "GitHub 绑定未完成，请稍后重试" };
    default:
      return null;
  }
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [bio, setBio] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [postViewMode, setPostViewMode] = useState<PostViewMode>("both");
  const [showUserData, setShowUserData] = useState(true);
  const [notifyReplies, setNotifyReplies] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [disconnectPassword, setDisconnectPassword] = useState("");
  const [isDisconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState<Partial<Record<SavingKey, boolean>>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  const profileDirty = name !== savedName || bio !== savedBio;
  const selectedSection = useMemo(
    () => sectionDetails.find((section) => section.id === activeSection) ?? sectionDetails[0],
    [activeSection],
  );
  const isCoverVideo = isVideoUrl(coverImage);
  const coverPreviewUrl = isCoverVideo
    ? coverImage.replace(/\.(mp4|mov|avi|webm)(\?.*)?$/i, "_preview.webp$2")
    : coverImage;

  const setSavingState = (key: SavingKey, value: boolean) => {
    setSaving((previous) => ({ ...previous, [key]: value }));
  };
  const isSaving = (key: SavingKey) => Boolean(saving[key]);

  const stopCoverPolling = () => {
    if (coverPollingRef.current) {
      clearInterval(coverPollingRef.current);
      coverPollingRef.current = null;
    }
  };

  const refreshSecurity = useCallback(async () => {
    const response = await fetch("/api/user/security", { cache: "no-store" });
    if (!response.ok) return;
    setSecurity((await response.json()) as SecuritySettings);
  }, []);

  const applyUser = useCallback(async (user: SettingsApiUser) => {
    setName(user.name || "");
    setSavedName(user.name || "");
    setBio(user.bio || "");
    setSavedBio(user.bio || "");
    setAvatar(user.avatar || "");
    setCoverImage(user.coverImage || "");
    setPostViewMode(user.postViewMode || "both");
    setShowUserData(user.showUserData);
    setNotifyReplies(user.notifyReplies);
    setNotifyLikes(user.notifyLikes);
    setNotifyFollows(user.notifyFollows);

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
  }, [session, update]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return;
      await applyUser((await response.json()) as SettingsApiUser);
    } catch {
      setError("无法加载设置，请刷新后重试");
    }
  }, [applyUser]);

  const patchSettings = async (
    payload: SettingsPatchPayload,
    key: SavingKey,
    successMessage: string,
  ): Promise<SettingsApiUser | null> => {
    setError("");
    setSuccess("");
    setSavingState(key, true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; user?: SettingsApiUser };
      if (!response.ok || !data.user) {
        setError(data.error || "保存失败，请稍后重试");
        return null;
      }
      await applyUser(data.user);
      setSuccess(successMessage);
      router.refresh();
      return data.user;
    } catch {
      setError("网络错误，请稍后重试");
      return null;
    } finally {
      setSavingState(key, false);
    }
  };

  const saveProfile = async () => {
    if (!profileDirty || isSaving("profile")) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("昵称不能为空");
      return;
    }
    await patchSettings(
      { name: trimmedName, bio: bio.trim() || null },
      "profile",
      "个人资料已保存",
    );
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    setSavingState("avatar", true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "头像上传失败");
      await patchSettings({ avatar: data.url }, "avatar", "头像已更新");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "头像上传失败");
    } finally {
      setSavingState("avatar", false);
    }
  };

  const saveImageCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片或视频文件");
      return;
    }
    setUploadingCover(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/background", { method: "POST", body: formData });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "背景图上传失败");
      await patchSettings({ coverImage: data.url }, "coverImage", "背景图已更新");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "背景图上传失败");
    } finally {
      setUploadingCover(false);
    }
  };

  const pollCoverVideo = async (assetId: string) => {
    try {
      const response = await fetch(`/api/background-video/${assetId}`, { cache: "no-store" });
      const data = (await response.json()) as BackgroundVideoStatusResponse;
      if (!response.ok) throw new Error("无法获取背景视频处理状态");
      if (data.status === "READY") {
        if (!data.videoUrl) throw new Error("背景视频处理完成，但未返回播放地址");
        stopCoverPolling();
        setUploadingCover(false);
        setCoverUploadProgress(100);
        setCoverUploadStatus("");
        await patchSettings({ coverImage: data.videoUrl }, "coverImage", "背景视频已更新");
        return;
      }
      if (data.status === "FAILED") {
        stopCoverPolling();
        setUploadingCover(false);
        setCoverUploadStatus("");
        setError(data.errorMessage || "背景视频处理失败，请重新上传");
        return;
      }
      setCoverUploadStatus("背景视频转码中...");
    } catch (statusError) {
      stopCoverPolling();
      setUploadingCover(false);
      setCoverUploadStatus("");
      setError(statusError instanceof Error ? statusError.message : "背景视频处理失败");
    }
  };

  const uploadVideoCover = async (file: File) => {
    setUploadingCover(true);
    setCoverUploadProgress(0);
    setCoverUploadStatus("正在请求上传凭证...");
    setError("");
    stopCoverPolling();
    try {
      const stsResponse = await fetch("/api/background-video/sts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
      });
      const sts = (await stsResponse.json()) as Partial<BackgroundVideoStsResponse> & { error?: string };
      if (!stsResponse.ok || !sts.backgroundVideoAssetId || !sts.objectKey || !sts.bucket || !sts.region || !sts.credentials) {
        throw new Error(sts.error || "获取背景视频上传凭证失败");
      }
      const { backgroundVideoAssetId, bucket, credentials, objectKey, region } = sts;
      const cos = new COS({
        SecretId: credentials.tmpSecretId,
        SecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: credentials.startTime,
        ExpiredTime: credentials.expiredTime,
      });
      setCoverUploadStatus("背景视频上传中...");
      const upload = await new Promise<{ ETag?: string }>((resolve, reject) => {
        cos.sliceUploadFile(
          {
            Bucket: bucket,
            Region: region,
            Key: objectKey,
            Body: file,
            onProgress: (progress) => setCoverUploadProgress(Math.round((progress.percent || 0) * 100)),
          },
          (uploadError, data) => (uploadError ? reject(uploadError) : resolve(data || {})),
        );
      });
      setCoverUploadProgress(100);
      setCoverUploadStatus("上传完成，正在提交转码任务...");
      const commitResponse = await fetch("/api/background-video/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundVideoAssetId,
          objectKey,
          etag: upload.ETag || null,
        }),
      });
      const commit = (await commitResponse.json()) as { error?: string };
      if (!commitResponse.ok) throw new Error(commit.error || "背景视频转码任务提交失败");
      setCoverUploadStatus("背景视频转码中...");
      await pollCoverVideo(backgroundVideoAssetId);
      coverPollingRef.current = setInterval(() => void pollCoverVideo(backgroundVideoAssetId), 2500);
    } catch (uploadError) {
      stopCoverPolling();
      setUploadingCover(false);
      setCoverUploadProgress(0);
      setCoverUploadStatus("");
      setError(uploadError instanceof Error ? uploadError.message : "背景视频上传失败");
    }
  };

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type.startsWith("video/") || /\.(mp4|mov|avi|webm)$/i.test(file.name)) {
      await uploadVideoCover(file);
      return;
    }
    await saveImageCover(file);
  };

  const removeCover = async () => {
    if (!coverImage || isSaving("coverImage")) return;
    await patchSettings({ coverImage: null }, "coverImage", "背景图已移除");
  };

  const updateBooleanSetting = async (
    key: "showUserData" | "notifyReplies" | "notifyLikes" | "notifyFollows",
    value: boolean,
    setValue: (next: boolean) => void,
    message: string,
  ) => {
    const previous = key === "showUserData"
      ? showUserData
      : key === "notifyReplies"
        ? notifyReplies
        : key === "notifyLikes"
          ? notifyLikes
          : notifyFollows;
    setValue(value);
    const user = await patchSettings({ [key]: value }, key, message);
    if (!user) setValue(previous);
  };

  const updatePostViewMode = async (value: string) => {
    const nextMode = value as PostViewMode;
    const previous = postViewMode;
    setPostViewMode(nextMode);
    const user = await patchSettings({ postViewMode: nextMode }, "postViewMode", "阅读偏好已更新");
    if (!user) setPostViewMode(previous);
  };

  const savePassword = async () => {
    if (isSaving("password")) return;
    if (newPassword.length < 6) {
      setError("新密码至少需要 6 个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    if (security?.hasPassword && !currentPassword) {
      setError("请输入当前密码");
      return;
    }
    setError("");
    setSuccess("");
    setSavingState("password", true);
    try {
      const response = await fetch("/api/user/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string; hasPassword?: boolean };
      if (!response.ok) throw new Error(data.error || "密码保存失败");
      setSecurity((previous) => previous ? { ...previous, hasPassword: Boolean(data.hasPassword) } : previous);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(data.message || "密码已保存");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "密码保存失败");
    } finally {
      setSavingState("password", false);
    }
  };

  const disconnectGitHub = async () => {
    if (!disconnectPassword || isSaving("github")) return;
    setSavingState("github", true);
    setError("");
    try {
      const response = await fetch("/api/user/security", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: disconnectPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string; githubLinked?: boolean };
      if (!response.ok) throw new Error(data.error || "GitHub 解绑失败");
      setSecurity((previous) => previous ? { ...previous, githubLinked: Boolean(data.githubLinked) } : previous);
      setDisconnectPassword("");
      setDisconnectModalOpen(false);
      setSuccess(data.message || "GitHub 已解绑");
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "GitHub 解绑失败");
    } finally {
      setSavingState("github", false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("确定要注销账号吗？此操作不可撤销。")) return;
    setSavingState("delete", true);
    setError("");
    try {
      const response = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "注销账号失败");
      }
      await signOut({ redirect: false });
      window.location.href = "/";
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "注销账号失败");
      setSavingState("delete", false);
    }
  };

  const selectSection = (section: SettingsSection) => {
    setActiveSection(section);
    router.replace(`/settings?section=${section}`, { scroll: false });
  };

  useEffect(() => () => stopCoverPolling(), []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!profileDirty) return;
      event.preventDefault();
      event.returnValue = "您有尚未保存的个人资料更改";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [profileDirty]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status !== "authenticated" || !session?.user || initializedRef.current) return;
    initializedRef.current = true;
    void Promise.all([fetchSettings(), refreshSecurity()]);
  }, [fetchSettings, pathname, refreshSecurity, router, session, status]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const section = search.get("section");
    if (isSettingsSection(section)) setActiveSection(section);
    const githubResult = getGitHubStatusMessage(search.get("github"));
    if (githubResult) {
      setActiveSection("security");
      if (githubResult.type === "success") setSuccess(githubResult.text);
      else setError(githubResult.text);
      void refreshSecurity();
    }
  }, [refreshSecurity]);

  if (status === "loading" || !session) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-gray-500">加载设置中...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] text-gray-900">
      <div className="mx-auto w-full max-w-[1200px] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
        <aside className="border-b border-gray-200 bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:border-gray-200 lg:bg-transparent lg:pr-4">
          <div className="px-4 py-5 lg:px-0 lg:py-8">
            <p className="hidden text-xs font-medium text-gray-500 lg:block">账户设置</p>
            <div className="mt-3 lg:hidden">
              <label htmlFor="settings-section" className="sr-only">设置分区</label>
              <select
                id="settings-section"
                value={activeSection}
                onChange={(event) => selectSection(event.target.value as SettingsSection)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {sectionDetails.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
              </select>
            </div>
            <nav className="hidden space-y-1 lg:block" aria-label="设置分区">
              {sectionDetails.map((section) => {
                const Icon = section.icon;
                const active = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-indigo-600" />}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-0 lg:py-10">
          <div className="max-w-[46rem]">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-950">{selectedSection.label}</h1>
              <p className="mt-1 text-sm text-gray-500">{selectedSection.description}</p>
            </header>

            {(error || success) && (
              <div className={`mb-6 flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`} role="status">
                {error ? <X className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{error || success}</span>
              </div>
            )}

            {activeSection === "profile" && (
              <section className="space-y-8">
                <div className="rounded-lg bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_2px_rgba(0,0,0,0.04)] sm:flex sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar src={avatar} name={name || session.user.email} size="lg" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-gray-950">{name || "未设置昵称"}</p>
                      <p className="mt-1 truncate text-sm text-gray-500">{security?.email || session.user.email || "未绑定邮箱"}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isSaving("avatar")} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0">
                    {isSaving("avatar") ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                    更换头像
                  </button>
                  <input ref={avatarInputRef} className="hidden" type="file" accept="image/*" onChange={uploadAvatar} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-950">基本信息</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-5 space-y-5">
                    <Input id="settings-name" label="昵称" value={name} maxLength={50} onChange={(event) => setName(event.target.value)} />
                    <div>
                      <Textarea id="settings-bio" label="个人简介" rows={4} value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} />
                      <p className="mt-1 text-xs text-gray-500">简短介绍一下自己，将展示在个人主页。</p>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => void saveProfile()} disabled={!profileDirty || isSaving("profile")} className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {isSaving("profile") && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        保存更改
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-950">个人主页背景</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-5">
                    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
                      {coverImage ? (
                        isCoverVideo ? <video src={coverImage} className="h-full w-full object-cover" autoPlay loop muted playsInline /> : <Image src={coverPreviewUrl} alt="个人主页背景预览" fill sizes="(min-width: 1024px) 46rem, 100vw" className="object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-sm text-gray-500"><ImagePlus className="h-6 w-6" />暂无背景图</div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover || isSaving("coverImage")} className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                        {uploadingCover || isSaving("coverImage") ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        更换背景
                      </button>
                      {coverImage && <button type="button" onClick={() => void removeCover()} disabled={uploadingCover || isSaving("coverImage")} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" />移除</button>}
                      <input ref={coverInputRef} className="hidden" type="file" accept="image/*,video/*" onChange={(event) => void uploadCover(event)} />
                    </div>
                    {(uploadingCover || coverUploadStatus) && <p className="mt-3 text-xs text-gray-500">{coverUploadStatus || "正在处理背景文件..."}{coverUploadProgress > 0 ? ` (${coverUploadProgress}%)` : ""}</p>}
                    <p className="mt-3 text-xs text-gray-500">支持图片和视频。视频上传完成后会自动转码并应用到个人主页。</p>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "security" && (
              <section className="space-y-8">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">登录邮箱</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-4 flex items-center gap-3 rounded-lg bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"><CircleUserRound className="h-5 w-5 text-gray-400" /><div><p className="text-sm font-medium text-gray-900">{security?.email || "未绑定邮箱"}</p><p className="mt-1 text-xs text-gray-500">登录邮箱暂不支持在此处修改。</p></div></div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">{security?.hasPassword ? "修改密码" : "设置本地密码"}</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-5 space-y-4">
                    {security?.hasPassword && <Input id="current-password" label="当前密码" type="password" value={currentPassword} autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} />}
                    <Input id="new-password" label="新密码" type="password" value={newPassword} minLength={6} autoComplete="new-password" onChange={(event) => setNewPassword(event.target.value)} />
                    <Input id="confirm-password" label="确认新密码" type="password" value={confirmPassword} minLength={6} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} />
                    <div className="flex justify-end"><button type="button" onClick={() => void savePassword()} disabled={isSaving("password")} className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving("password") && <LoaderCircle className="h-4 w-4 animate-spin" />}{security?.hasPassword ? "更新密码" : "设置密码"}</button></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">第三方登录</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3"><Github className="h-6 w-6 text-gray-900" /><div><p className="text-sm font-medium text-gray-900">GitHub</p><p className="mt-1 text-xs text-gray-500">{security?.githubLinked ? "已绑定，可使用 GitHub 登录" : "未绑定"}</p></div></div>
                    {security?.githubLinked ? <button type="button" onClick={() => setDisconnectModalOpen(true)} className="inline-flex h-9 items-center gap-2 self-start rounded-md px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:self-auto"><Trash2 className="h-4 w-4" />解绑</button> : <Link href="/api/auth/github/connect" prefetch={false} className="inline-flex h-9 items-center gap-2 self-start rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:self-auto"><Github className="h-4 w-4" />绑定 GitHub</Link>}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-4 shadow-[0_0_0_1px_rgba(239,68,68,0.16)]"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><div><h2 className="text-sm font-semibold text-red-800">注销账号</h2><p className="mt-1 text-sm text-red-700">永久删除帖子、评论、点赞等所有账户数据，此操作无法撤销。</p><button type="button" onClick={() => void deleteAccount()} disabled={isSaving("delete")} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving("delete") && <LoaderCircle className="h-4 w-4 animate-spin" />}注销账号</button></div></div></div>
              </section>
            )}

            {activeSection === "notifications" && (
              <section>
                <h2 className="text-base font-semibold text-gray-950">接收通知</h2>
                <p className="mt-1 text-sm text-gray-500">关闭后不会创建对应的站内通知，也不会发送移动推送。</p>
                <div className="mt-5 divide-y divide-gray-200 rounded-lg bg-white px-4 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="py-5"><Toggle id="notify-replies" checked={notifyReplies} disabled={isSaving("notifyReplies")} onChange={(value) => void updateBooleanSetting("notifyReplies", value, setNotifyReplies, value ? "已开启回复通知" : "已关闭回复通知")} label="回复通知" description="有人回复你的帖子或评论时提醒你。" /></div>
                  <div className="py-5"><Toggle id="notify-likes" checked={notifyLikes} disabled={isSaving("notifyLikes")} onChange={(value) => void updateBooleanSetting("notifyLikes", value, setNotifyLikes, value ? "已开启获赞通知" : "已关闭获赞通知")} label="获赞通知" description="有人点赞你的帖子或评论时提醒你。" /></div>
                  <div className="py-5"><Toggle id="notify-follows" checked={notifyFollows} disabled={isSaving("notifyFollows")} onChange={(value) => void updateBooleanSetting("notifyFollows", value, setNotifyFollows, value ? "已开启关注通知" : "已关闭关注通知")} label="关注通知" description="有新用户关注你时提醒你。" /></div>
                </div>
              </section>
            )}

            {activeSection === "reading" && (
              <section className="space-y-8">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">帖子列表显示</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-5"><label htmlFor="post-view-mode" className="mb-2 block text-sm font-medium text-gray-700">默认展示方式</label><Dropdown value={postViewMode} onChange={(value) => void updatePostViewMode(value)} disabled={isSaving("postViewMode")} options={[{ value: "both", label: "智能显示标题或正文" }, { value: "title", label: "仅显示标题" }, { value: "content", label: "仅预览正文" }, { value: "titleAndContent", label: "同时显示标题和正文" }]} /><p className="mt-2 text-xs text-gray-500">此设置会同步到首页与用户主页的帖子列表。</p></div>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">个人资料隐私</h2>
                  <div className="mt-3 h-px bg-gray-200" />
                  <div className="mt-5 rounded-lg bg-white p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"><Toggle id="show-user-data" checked={showUserData} disabled={isSaving("showUserData")} onChange={(value) => void updateBooleanSetting("showUserData", value, setShowUserData, value ? "已公开个人统计" : "已隐藏个人统计")} label="公开个人统计" description="在个人主页展示加入天数、帖子、浏览和点赞等活动数据。" /></div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <Modal isOpen={isDisconnectModalOpen} onClose={() => { setDisconnectModalOpen(false); setDisconnectPassword(""); }} title="解绑 GitHub">
        <div className="space-y-4"><div className="flex gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800"><LockKeyhole className="h-4 w-4 shrink-0" /><p>解绑后将不能再使用 GitHub 登录。请验证当前本地密码以继续。</p></div><Input id="disconnect-github-password" label="当前密码" type="password" value={disconnectPassword} autoComplete="current-password" onChange={(event) => setDisconnectPassword(event.target.value)} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setDisconnectModalOpen(false)} className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button><button type="button" onClick={() => void disconnectGitHub()} disabled={!disconnectPassword || isSaving("github")} className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving("github") && <LoaderCircle className="h-4 w-4 animate-spin" />}确认解绑</button></div></div>
      </Modal>
    </div>
  );
}
