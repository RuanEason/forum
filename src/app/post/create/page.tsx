"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import COS from "cos-js-sdk-v5";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";
import TopicSelector from "@/components/TopicSelector";
import {
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  Paperclip,
  UploadCloud,
  Video,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type PostMode = "TEXT" | "VIDEO";
type PostVisibility = "PUBLIC" | "UNLISTED";
type VideoWorkflowStatus = "IDLE" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

type UploadedAttachment = {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

type VideoStatusResponse = {
  id: string;
  status?: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  hlsMasterUrl?: string | null;
  coverUrl?: string | null;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
  bitrateKbps?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

type VideoStsResponse = {
  videoAssetId: string;
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

type CosUploadProgress = {
  percent?: number;
};

const MAX_TEXT_ATTACHMENTS = 5;
const MAX_VIDEO_ATTACHMENTS = 5;
const MAX_VIDEO_TITLE_LENGTH = 80;
const MAX_VIDEO_DESC_LENGTH = 2000;
const MAX_VIDEO_COVER_SIZE = 10 * 1024 * 1024;

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

function normalizeVideoStatus(status?: string): VideoWorkflowStatus {
  if (status === "UPLOADING" || status === "PROCESSING" || status === "READY" || status === "FAILED") {
    return status;
  }
  return "PROCESSING";
}

function getVideoStatusMeta(status: VideoWorkflowStatus) {
  switch (status) {
    case "UPLOADING":
      return {
        label: "上传中",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "PROCESSING":
      return {
        label: "转码中",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "READY":
      return {
        label: "可发布",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "FAILED":
      return {
        label: "处理失败",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    default:
      return {
        label: "未上传",
        className: "bg-gray-50 text-gray-600 border-gray-200",
      };
  }
}

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoAttachmentInputRef = useRef<HTMLInputElement>(null);
  const videoCoverInputRef = useRef<HTMLInputElement>(null);
  const videoPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoCosRef = useRef<unknown>(null);
  const videoTaskIdRef = useRef<string | null>(null);
  const [postMode, setPostMode] = useState<PostMode>("TEXT");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [cancelRequested, setCancelRequested] = useState(false);
  const [error, setError] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enableTitle, setEnableTitle] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoTopicId, setVideoTopicId] = useState<string | null>(null);
  const [videoAttachments, setVideoAttachments] = useState<UploadedAttachment[]>([]);
  const [videoAssetId, setVideoAssetId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoWorkflowStatus>("IDLE");
  const [videoMeta, setVideoMeta] = useState<VideoStatusResponse | null>(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoFileSize, setVideoFileSize] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadMessage, setVideoUploadMessage] = useState("");
  const [videoUploadError, setVideoUploadError] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoAttachmentUploading, setVideoAttachmentUploading] = useState(false);
  const [videoCoverUrl, setVideoCoverUrl] = useState<string | null>(null);
  const [videoCoverUploading, setVideoCoverUploading] = useState(false);
  const stopVideoPolling = useCallback(() => {
    if (videoPollTimerRef.current) {
      clearInterval(videoPollTimerRef.current);
      videoPollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  useEffect(() => {
    return () => {
      stopVideoPolling();
    };
  }, [stopVideoPolling]);

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
          } catch {
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
      const uploadedFiles: UploadedAttachment[] = [];
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
        ) as UploadedAttachment;

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

  const triggerVideoUpload = () => {
    videoFileInputRef.current?.click();
  };

  const triggerVideoAttachmentUpload = () => {
    videoAttachmentInputRef.current?.click();
  };

  const triggerVideoCoverUpload = () => {
    videoCoverInputRef.current?.click();
  };

  const removeAttachment = (indexToRemove: number) => {
    setSelectedAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const removeVideoAttachment = (indexToRemove: number) => {
    setVideoAttachments((prev) =>
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

  const uploadVideoAttachment = async (file: File): Promise<UploadedAttachment> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/attachment", {
      method: "POST",
      body: formData,
    });

    const data = await response.json() as UploadedAttachment & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "附件上传失败");
    }

    return {
      url: data.url,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    };
  };

  const uploadVideoCover = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error || "视频封面上传失败");
    }

    return data.url;
  };

  const handleVideoCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!videoAssetId) {
      setVideoUploadError("请先上传视频，再上传封面");
      if (videoCoverInputRef.current) {
        videoCoverInputRef.current.value = "";
      }
      return;
    }

    if (!file.type.startsWith("image/")) {
      setVideoUploadError("视频封面仅支持图片格式");
      if (videoCoverInputRef.current) {
        videoCoverInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_VIDEO_COVER_SIZE) {
      setVideoUploadError(
        `视频封面大小不能超过 ${(MAX_VIDEO_COVER_SIZE / 1024 / 1024).toFixed(0)}MB`,
      );
      if (videoCoverInputRef.current) {
        videoCoverInputRef.current.value = "";
      }
      return;
    }

    setVideoCoverUploading(true);
    setVideoUploadError("");

    try {
      const coverUrl = await uploadVideoCover(file);
      setVideoCoverUrl(coverUrl);
    } catch (uploadError) {
      console.error("Video cover upload error:", uploadError);
      setVideoUploadError(
        uploadError instanceof Error ? uploadError.message : "视频封面上传失败，请稍后重试",
      );
    } finally {
      setVideoCoverUploading(false);
      if (videoCoverInputRef.current) {
        videoCoverInputRef.current.value = "";
      }
    }
  };

  const fetchVideoStatus = useCallback(
    async (assetId: string) => {
      const response = await fetch(`/api/video/${assetId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json() as VideoStatusResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "查询视频状态失败");
      }

      const normalizedStatus = normalizeVideoStatus(data.status);
      setVideoStatus(normalizedStatus);
      setVideoMeta(data);

      if (normalizedStatus === "READY") {
        setVideoUploadError("");
        setVideoUploadMessage("视频处理完成，可以发布了");
        stopVideoPolling();
        return;
      }

      if (normalizedStatus === "FAILED") {
        setVideoUploadMessage("");
        setVideoUploadError(data.errorMessage || "视频处理失败，请重新上传");
        stopVideoPolling();
        return;
      }

      setVideoUploadMessage("视频转码处理中，请稍候...");
    },
    [stopVideoPolling],
  );

  const startVideoPolling = useCallback(
    (assetId: string) => {
      stopVideoPolling();
      void fetchVideoStatus(assetId);
      videoPollTimerRef.current = setInterval(() => {
        void fetchVideoStatus(assetId);
      }, 2500);
    },
    [fetchVideoStatus, stopVideoPolling],
  );

  const uploadVideoBySts = async (file: File) => {
    setError("");
    setVideoUploadError("");
    stopVideoPolling();

    setVideoUploading(true);
    setVideoAssetId(null);
    setVideoMeta(null);
    setVideoCoverUrl(null);
    setVideoStatus("UPLOADING");
    setVideoFileName(file.name);
    setVideoFileSize(file.size);
    setVideoUploadProgress(0);
    setVideoUploadMessage("正在申请上传凭证...");

    try {
      const stsResponse = await fetch("/api/video/sts", {
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

      const stsData = await stsResponse.json() as Partial<VideoStsResponse> & { error?: string };

      if (!stsResponse.ok) {
        throw new Error(stsData.error || "获取上传凭证失败");
      }

      const videoAssetId = stsData.videoAssetId;
      const objectKey = stsData.objectKey;
      const bucket = stsData.bucket;
      const region = stsData.region;
      const credentials = stsData.credentials;

      if (!videoAssetId || !objectKey || !bucket || !region || !credentials) {
        throw new Error("上传凭证响应不完整");
      }

      setVideoAssetId(videoAssetId);

      const cos = new COS({
        SecretId: credentials.tmpSecretId,
        SecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: credentials.startTime,
        ExpiredTime: credentials.expiredTime,
      });

      videoCosRef.current = cos;
      setVideoUploadMessage("视频上传中...");

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
              videoTaskIdRef.current = taskId;
            },
            onProgress: (progressData: CosUploadProgress) => {
              const percent = Math.max(
                0,
                Math.min(100, Math.round((progressData.percent ?? 0) * 100)),
              );
              setVideoUploadProgress(percent);
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

      setVideoUploadProgress(100);
      setVideoUploadMessage("上传完成，提交处理任务...");

      const commitResponse = await fetch("/api/video/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoAssetId,
          objectKey: objectKey,
          etag: uploadResult.ETag ?? null,
        }),
      });

      const commitData = await commitResponse.json() as { status?: string; error?: string };
      if (!commitResponse.ok) {
        throw new Error(commitData.error || "视频提交失败");
      }

      setVideoStatus(normalizeVideoStatus(commitData.status));
      setVideoUploadMessage("视频转码处理中，请稍候...");
      startVideoPolling(videoAssetId);
    } catch (uploadError) {
      console.error("Video upload error:", uploadError);
      setVideoStatus("FAILED");
      setVideoUploadProgress(0);
      setVideoUploadMessage("");
      setVideoUploadError(
        uploadError instanceof Error ? uploadError.message : "视频上传失败，请稍后重试",
      );
    } finally {
      setVideoUploading(false);
      videoTaskIdRef.current = null;
    }
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadVideoBySts(file);

    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
    }
  };

  const cancelVideoUpload = () => {
    const taskId = videoTaskIdRef.current;
    const cos = videoCosRef.current;

    if (taskId && cos && typeof cos === "object" && "cancelTask" in cos) {
      try {
        (cos as { cancelTask: (id: string) => void }).cancelTask(taskId);
      } catch (cancelError) {
        console.error("Cancel video upload error:", cancelError);
      }
    }

    setVideoUploading(false);
    setVideoStatus("FAILED");
    setVideoUploadProgress(0);
    setVideoUploadMessage("");
    setVideoUploadError("视频上传已取消，请重新上传");
    videoTaskIdRef.current = null;
  };

  const handleVideoAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setError("");
    setVideoUploadError("");

    if (videoAttachments.length >= MAX_VIDEO_ATTACHMENTS) {
      setVideoUploadError(`最多只能上传 ${MAX_VIDEO_ATTACHMENTS} 个附件`);
      if (videoAttachmentInputRef.current) {
        videoAttachmentInputRef.current.value = "";
      }
      return;
    }

    setVideoAttachmentUploading(true);

    try {
      const files = Array.from(e.target.files);
      const remain = MAX_VIDEO_ATTACHMENTS - videoAttachments.length;
      const currentBatch = files.slice(0, remain);

      const uploaded = await Promise.all(currentBatch.map((file) => uploadVideoAttachment(file)));
      setVideoAttachments((prev) => [...prev, ...uploaded]);
    } catch (uploadError) {
      console.error("Video attachment upload error:", uploadError);
      setVideoUploadError(
        uploadError instanceof Error ? uploadError.message : "附件上传失败，请稍后重试",
      );
    } finally {
      setVideoAttachmentUploading(false);
      if (videoAttachmentInputRef.current) {
        videoAttachmentInputRef.current.value = "";
      }
    }
  };

  const handleCreateTextPost = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!(session as { user?: { id?: string } } | null)?.user?.id) {
      setError("请先登录才能发布帖子");
      return;
    }

    if (!content.trim() && selectedImages.length === 0 && selectedAttachments.length === 0) {
      setError("帖子内容、图片或附件不能为空");
      return;
    }

    if (selectedAttachments.length > MAX_TEXT_ATTACHMENTS) {
      setError(`最多只能上传 ${MAX_TEXT_ATTACHMENTS} 个附件`);
      return;
    }

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
          content,
          authorId: (session as { user?: { id?: string } } | null)?.user?.id,
          images: selectedImages,
          attachments: selectedAttachments,
          visibility,
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

  const handleCreateVideoPost = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setVideoUploadError("");

    if (!(session as { user?: { id?: string } } | null)?.user?.id) {
      setError("请先登录才能发布帖子");
      return;
    }

    if (!videoAssetId) {
      setVideoUploadError("请先上传视频");
      return;
    }

    if (videoStatus !== "READY") {
      setVideoUploadError("视频仍在处理中，处理完成后才能发布");
      return;
    }

    if (videoAttachments.length > MAX_VIDEO_ATTACHMENTS) {
      setVideoUploadError(`最多只能上传 ${MAX_VIDEO_ATTACHMENTS} 个附件`);
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
          postType: "VIDEO",
          visibility,
          videoAssetId,
          videoCoverUrl: videoCoverUrl?.trim() ? videoCoverUrl.trim() : undefined,
          title: videoTitle.trim() ? videoTitle.trim() : null,
          content: videoDescription,
          attachments: videoAttachments,
          topicId: videoTopicId,
        }),
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        setVideoUploadError(data.error || "发布视频失败");
      }
    } catch {
      setVideoUploadError("网络错误，发布视频失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    if (postMode === "VIDEO") {
      void handleCreateVideoPost();
      return;
    }

    void handleCreateTextPost();
  };

  const canPublishText =
    !loading
    && !isUploading
    && (content.trim().length > 0 || selectedImages.length > 0 || selectedAttachments.length > 0)
    && (!enableTitle || title.trim().length > 0);

  const canPublishVideo =
    !loading
    && !videoUploading
    && !videoCoverUploading
    && !videoAttachmentUploading
    && videoStatus === "READY"
    && Boolean(videoAssetId);

  const statusMeta = getVideoStatusMeta(videoStatus);
  const shouldShowVideoCoverUploader = Boolean(videoAssetId) && !videoUploading;
  const effectiveVideoCoverUrl = videoCoverUrl || videoMeta?.coverUrl || null;

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
            onClick={handlePublish}
            disabled={postMode === "TEXT" ? !canPublishText : !canPublishVideo}
            className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "发布中..." : "发布"}
          </button>
        </div>

        <div className="mb-4 bg-white rounded-2xl shadow-sm p-1 border border-gray-100">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setPostMode("TEXT");
                setError("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                postMode === "TEXT"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              发文本
            </button>
            <button
              type="button"
              onClick={() => {
                setPostMode("VIDEO");
                setError("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                postMode === "VIDEO"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              发视频
            </button>
          </div>
        </div>

        {postMode === "TEXT" && (
        <form onSubmit={handleCreateTextPost} className="space-y-4">
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
              maxAttachments={MAX_TEXT_ATTACHMENTS}
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
              disabled={loading || isUploading || selectedAttachments.length >= MAX_TEXT_ATTACHMENTS}
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

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">可见性</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      visibility === "PUBLIC"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium">公开</p>
                    <p className="text-xs text-gray-500 mt-0.5">会出现在首页和搜索结果中</p>
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
                    <p className="text-sm font-medium">仅链接可见（半私密）</p>
                    <p className="text-xs text-gray-500 mt-0.5">不在首页和搜索展示，仅可通过链接访问</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </form>
        )}

        {postMode === "VIDEO" && (
          <form onSubmit={handleCreateVideoPost} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">上传视频</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    仅支持视频 + 文字 + 附件。视频会先上传并转码，完成后可发布。
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 sm:p-6">
                {!videoFileName && (
                  <div className="flex flex-col items-center justify-center text-center py-8 sm:py-10">
                    <div className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
                      <UploadCloud className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-700 text-sm sm:text-base">点击按钮选择并上传视频</p>
                    <p className="text-xs text-gray-500 mt-1">支持 MP4 / MOV / AVI / WEBM，最大 2GB</p>
                    <button
                      type="button"
                      onClick={triggerVideoUpload}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      上传视频
                    </button>
                  </div>
                )}

                {videoFileName && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-gray-900 font-medium text-sm sm:text-base">
                          <VideoFileBadgeIcon />
                          <span className="truncate">{videoFileName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(videoFileSize)}
                          {videoMeta?.durationSec ? ` · ${videoMeta.durationSec.toFixed(1)} 秒` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={triggerVideoUpload}
                          disabled={videoUploading || loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          更换视频
                        </button>
                        {videoUploading && (
                          <button
                            type="button"
                            onClick={cancelVideoUpload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <X className="w-3.5 h-3.5" />
                            取消上传
                          </button>
                        )}
                      </div>
                    </div>

                    {(videoUploading || videoStatus === "PROCESSING") && (
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          {videoStatus === "PROCESSING" ? (
                            <div className="h-full w-1/3 bg-amber-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                          ) : (
                            <div
                              className="h-full bg-blue-500 transition-all duration-200"
                              style={{ width: `${videoUploadProgress}%` }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {videoUploadMessage || "处理中..."}
                        </p>
                      </div>
                    )}

                    {videoStatus === "READY" && (
                      <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        视频处理完成，可以点击右上角“发布”。
                      </p>
                    )}

                    {shouldShowVideoCoverUploader && (
                      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">视频封面（可选）</p>
                            <p className="mt-1 text-xs text-gray-500">
                              未上传将使用自动截取的第一帧。
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={triggerVideoCoverUpload}
                              disabled={videoCoverUploading || videoUploading || loading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {videoCoverUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UploadCloud className="w-3.5 h-3.5" />
                              )}
                              {videoCoverUrl ? "更换封面" : "上传封面"}
                            </button>
                            {videoCoverUrl && (
                              <button
                                type="button"
                                onClick={() => setVideoCoverUrl(null)}
                                disabled={videoCoverUploading || loading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                使用默认
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          ref={videoCoverInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleVideoCoverSelect}
                          disabled={videoCoverUploading || videoUploading || loading}
                        />

                        {effectiveVideoCoverUrl ? (
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black">
                            <Image
                              src={effectiveVideoCoverUrl}
                              alt={videoCoverUrl ? "自定义视频封面预览" : "视频封面预览"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            等待视频转码完成后，系统会自动生成封面预览。
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                className="hidden"
                onChange={handleVideoFileSelect}
                disabled={videoUploading || loading}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">基本设置</h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="video-title" className="text-sm font-medium text-gray-700">
                    标题（可选）
                  </label>
                  <span className="text-xs text-gray-400">
                    {videoTitle.length}/{MAX_VIDEO_TITLE_LENGTH}
                  </span>
                </div>
                <input
                  id="video-title"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value.slice(0, MAX_VIDEO_TITLE_LENGTH))}
                  placeholder="输入视频标题（可不填）"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="video-desc" className="text-sm font-medium text-gray-700">
                    简介
                  </label>
                  <span className="text-xs text-gray-400">
                    {videoDescription.length}/{MAX_VIDEO_DESC_LENGTH}
                  </span>
                </div>
                <textarea
                  id="video-desc"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value.slice(0, MAX_VIDEO_DESC_LENGTH))}
                  placeholder="补充一点视频说明，帮助大家更快理解内容"
                  rows={6}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">话题（可选）</label>
                <TopicSelector
                  selectedTopicId={videoTopicId}
                  onSelect={setVideoTopicId}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">可见性</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      visibility === "PUBLIC"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium">公开</p>
                    <p className="text-xs text-gray-500 mt-0.5">会出现在首页和搜索结果中</p>
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
                    <p className="text-sm font-medium">仅链接可见（半私密）</p>
                    <p className="text-xs text-gray-500 mt-0.5">不在首页和搜索展示，仅可通过链接访问</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-gray-700">附件（可选）</label>
                  <button
                    type="button"
                    onClick={triggerVideoAttachmentUpload}
                    disabled={
                      videoAttachmentUploading
                      || loading
                      || videoAttachments.length >= MAX_VIDEO_ATTACHMENTS
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {videoAttachmentUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                    添加附件
                  </button>
                </div>

                <input
                  ref={videoAttachmentInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleVideoAttachmentSelect}
                  disabled={
                    videoAttachmentUploading
                    || loading
                    || videoAttachments.length >= MAX_VIDEO_ATTACHMENTS
                  }
                />

                {videoAttachments.length > 0 && (
                  <div className="space-y-2">
                    {videoAttachments.map((attachment, index) => (
                      <div
                        key={attachment.url + index}
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
                          onClick={() => removeVideoAttachment(index)}
                          className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {videoUploadError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {videoUploadError}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

function VideoFileBadgeIcon() {
  return (
    <span className="inline-flex items-center justify-center rounded bg-blue-100 text-blue-700 w-5 h-5">
      <Video className="w-3.5 h-3.5" />
    </span>
  );
}

