"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import COS from "cos-js-sdk-v5";
import type { JSONContent } from "@tiptap/core";
import RichTextEditor from "@/components/editor/RichTextEditor";
import TopicSelector from "@/components/TopicSelector";
import CreatePostSheet from "@/components/CreatePostSheet";
import { usePageLoadProgress } from "@/components/PageLoadProgressProvider";
import { startAttachmentUpload, type AttachmentUploadTask } from "@/lib/client-attachment-upload";
import {
  createEmptyRichTextDocument,
  getRichTextPlainText,
  hasRichTextContent,
  parseRichTextDocument,
  plainTextToRichTextDocument,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";
import {
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Archive,
  Settings,
  Paperclip,
  Save,
  UploadCloud,
  Video,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Type,
} from "lucide-react";

type PostMode = "TEXT" | "VIDEO";
type PostVisibility = "PUBLIC" | "UNLISTED";
type VideoWorkflowStatus = "IDLE" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

type UploadedAttachment = {
  id?: string;
  url: string;
  objectKey?: string | null;
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

type CreatePostResponse = {
  error?: string;
  post?: {
    id?: string;
  };
};

type DraftPersistMode = "EPHEMERAL" | "SAVED";
type DraftAssetType = "IMAGE" | "ATTACHMENT" | "VIDEO" | "COVER";
type DraftAssetStatus = "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

type DraftAsset = {
  id: string;
  type: DraftAssetType;
  status: DraftAssetStatus;
  progress: number;
  url: string | null;
  objectKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  videoAssetId: string | null;
  errorMessage: string | null;
  sortOrder: number;
  videoAsset: {
    id: string;
    status: "INIT" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED" | "DELETED";
    coverUrl: string | null;
  } | null;
};

type DraftDetail = {
  id: string;
  postType: PostMode;
  title: string | null;
  content: string;
  contentJson?: JSONContent | null;
  contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
  visibility: PostVisibility;
  topicId: string | null;
  persistMode: DraftPersistMode;
  assets: DraftAsset[];
  status: "EDITING" | "UPLOADING" | "PROCESSING" | "FAILED" | "READY" | "PUBLISHED";
  canPublish: boolean;
  uploadSummary: {
    total: number;
    uploading: number;
    processing: number;
    failed: number;
    ready: number;
  };
};

type DraftResponse = {
  error?: string;
  draft?: DraftDetail;
};

const EMPTY_RICH_TEXT_JSON = serializeRichTextDocument(createEmptyRichTextDocument());

type DraftPublishResponse = {
  ok?: boolean;
  error?: string;
  post?: {
    id?: string;
  };
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

export type CreatePostPresentation = "page" | "sheet";

type CreatePostWorkspaceProps = {
  presentation?: CreatePostPresentation;
};

export default function CreatePostWorkspace({
  presentation = "page",
}: CreatePostWorkspaceProps) {
  return (
    <Suspense fallback={<CreatePostPageFallback presentation={presentation} />}>
      <CreatePostPageContent presentation={presentation} />
    </Suspense>
  );
}

function CreatePostPageFallback({ presentation }: { presentation: CreatePostPresentation }) {
  const fallback = (
    <div className={presentation === "sheet" ? "flex h-full min-h-0 items-center justify-center bg-gray-50" : "flex min-h-screen items-center justify-center bg-gray-50"}>
      <div className="text-gray-500">加载中...</div>
    </div>
  );

  if (presentation === "sheet") {
    return (
      <CreatePostSheet onRequestClose={() => window.history.back()}>
        {fallback}
      </CreatePostSheet>
    );
  }

  return fallback;
}

function CreatePostPageContent({ presentation }: { presentation: CreatePostPresentation }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startTask } = usePageLoadProgress();
  const draftIdFromUrl = searchParams.get("draftId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoAttachmentInputRef = useRef<HTMLInputElement>(null);
  const videoCoverInputRef = useRef<HTMLInputElement>(null);
  const videoPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoCosRef = useRef<unknown>(null);
  const videoTaskIdRef = useRef<string | null>(null);
  const pendingNavigationTaskRef = useRef<(() => void) | null>(null);
  const navigationTaskTimeoutRef = useRef<number | null>(null);
  const pendingPostNavigationRef = useRef<string | null>(null);
  const [postMode, setPostMode] = useState<PostMode>("TEXT");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [content, setContent] = useState(EMPTY_RICH_TEXT_JSON);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [cancelRequested, setCancelRequested] = useState(false);
  const [error, setError] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const attachmentUploadTaskRef = useRef<AttachmentUploadTask | null>(null);
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [sheetCloseRequest, setSheetCloseRequest] = useState(0);
  const [autoSaveAt, setAutoSaveAt] = useState<string>("");
  const selectedAttachmentsRef = useRef<UploadedAttachment[]>(selectedAttachments);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSavingRef = useRef(false);
  const imageInsertIdRef = useRef(0);
  const [imageInsertRequest, setImageInsertRequest] = useState<{ id: number; url: string; alt?: string } | null>(null);
  const hasAnyContentRef = useRef(false);
  selectedAttachmentsRef.current = selectedAttachments;

  const finishPendingNavigationTask = useCallback(() => {
    if (navigationTaskTimeoutRef.current !== null) {
      window.clearTimeout(navigationTaskTimeoutRef.current);
      navigationTaskTimeoutRef.current = null;
    }

    if (pendingNavigationTaskRef.current) {
      const finishTask = pendingNavigationTaskRef.current;
      pendingNavigationTaskRef.current = null;
      finishTask();
    }
  }, []);

  const navigateToDrafts = useCallback(() => {
    finishPendingNavigationTask();
    pendingNavigationTaskRef.current = startTask("navigation");
    navigationTaskTimeoutRef.current = window.setTimeout(() => {
      finishPendingNavigationTask();
    }, 10000);
    router.push("/post/drafts");
  }, [finishPendingNavigationTask, router, startTask]);

  const navigateAfterPublish = useCallback((createdPostId?: string) => {
    const destination = createdPostId ? `/post/${createdPostId}` : "/";

    if (presentation === "sheet") {
      pendingPostNavigationRef.current = destination;
      setSheetCloseRequest((request) => request + 1);
      return;
    }

    router.push(destination);
    router.refresh();
  }, [presentation, router]);

  useEffect(() => {
    finishPendingNavigationTask();
  }, [finishPendingNavigationTask, pathname]);

  useEffect(() => {
    return () => {
      finishPendingNavigationTask();
    };
  }, [finishPendingNavigationTask]);

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

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  const normalizeVideoWorkflowStatus = useCallback((statusValue?: string): VideoWorkflowStatus => {
    return normalizeVideoStatus(statusValue);
  }, []);

  const hydrateFromDraft = useCallback((draft: DraftDetail) => {
    setPostMode(draft.postType);
    setVisibility(draft.visibility);
    setTitle(draft.title ?? "");
    setEnableTitle(Boolean(draft.title));
    setSelectedTopicId(draft.topicId);
    setVideoTopicId(draft.topicId);

    const imageAssets = draft.assets
      .filter((asset) => asset.type === "IMAGE" && asset.url)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((asset) => asset.url as string);
    const attachmentAssets = draft.assets
      .filter(
        (asset) =>
          asset.type === "ATTACHMENT"
          && asset.url
          && asset.fileName
          && typeof asset.fileSize === "number"
          && asset.mimeType,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((asset) => ({
        id: asset.id,
        objectKey: asset.objectKey,
        url: asset.url as string,
        fileName: asset.fileName as string,
        fileSize: asset.fileSize as number,
        mimeType: asset.mimeType as string,
      }));

    const videoAsset = draft.assets.find((asset) => asset.type === "VIDEO");
    const coverAsset = draft.assets.find((asset) => asset.type === "COVER" && asset.url);

    if (draft.postType === "TEXT") {
      const legacyDocument = draft.contentFormat === "PLAIN_TEXT" && draft.content
        ? plainTextToRichTextDocument(draft.content)
        : parseRichTextDocument(draft.content);
      setContent(draft.contentJson
        ? serializeRichTextDocument(draft.contentJson)
        : legacyDocument
          ? serializeRichTextDocument(legacyDocument)
          : EMPTY_RICH_TEXT_JSON);
      setSelectedImages(imageAssets);
      setSelectedAttachments(attachmentAssets);
      return;
    }

    setVideoTitle(draft.title ?? "");
    setVideoDescription(draft.content ?? "");
    setVideoAttachments(attachmentAssets);
    setVideoAssetId(videoAsset?.videoAssetId ?? null);
    setVideoCoverUrl(coverAsset?.url ?? null);
    const normalizedHydrateVideoStatus = videoAsset?.videoAsset
      ? normalizeVideoWorkflowStatus(videoAsset.videoAsset.status)
      : undefined;
    setVideoMeta(videoAsset?.videoAsset
      ? {
          id: videoAsset.videoAsset.id,
          status: normalizedHydrateVideoStatus === "IDLE" ? undefined : normalizedHydrateVideoStatus,
          coverUrl: videoAsset.videoAsset.coverUrl,
        }
      : null);
    setVideoFileName(videoAsset?.fileName ?? "");
    setVideoFileSize(typeof videoAsset?.fileSize === "number" ? videoAsset.fileSize : 0);
    setVideoStatus(normalizeVideoWorkflowStatus(videoAsset?.videoAsset?.status || videoAsset?.status));
  }, [normalizeVideoWorkflowStatus]);

  const fetchDraftDetail = useCallback(async (id: string) => {
    setDraftLoading(true);
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json() as DraftResponse;
      if (!response.ok || !data.draft) {
        throw new Error(data.error || "加载草稿失败");
      }
      setDraftId(data.draft.id);
      hydrateFromDraft(data.draft);
    } catch (loadError) {
      console.error("Load draft error:", loadError);
      setError(loadError instanceof Error ? loadError.message : "加载草稿失败");
    } finally {
      setDraftLoading(false);
    }
  }, [hydrateFromDraft]);

  const ensureDraftId = useCallback(async (persistMode: DraftPersistMode = "EPHEMERAL") => {
    if (draftId) {
      return draftId;
    }

    const payload = postMode === "VIDEO"
      ? {
          postType: "VIDEO" as const,
          title: videoTitle.trim() || null,
          content: videoDescription,
          visibility,
          topicId: videoTopicId,
          persistMode,
        }
      : {
          postType: "TEXT" as const,
          title: enableTitle ? title.trim() || null : null,
          content: "",
          contentJson: parseRichTextDocument(content) ?? createEmptyRichTextDocument(),
          contentFormat: "RICH_TEXT" as const,
          visibility,
          topicId: selectedTopicId,
          persistMode,
        };

    const response = await fetch("/api/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as DraftResponse;
    if (!response.ok || !data.draft) {
      throw new Error(data.error || "创建草稿失败");
    }

    setDraftId(data.draft.id);
    return data.draft.id;
  }, [
    content,
    draftId,
    enableTitle,
    postMode,
    selectedTopicId,
    title,
    videoDescription,
    videoTitle,
    videoTopicId,
    visibility,
  ]);

  const buildDraftAssets = useCallback(() => {
    const assets: Array<{
      id?: string;
      type: DraftAssetType;
      status: DraftAssetStatus;
      progress?: number;
      url?: string | null;
      objectKey?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      mimeType?: string | null;
      videoAssetId?: string | null;
      sortOrder?: number;
    }> = [];

    if (postMode === "TEXT") {
      selectedImages.forEach((url, index) => {
        assets.push({
          type: "IMAGE",
          status: "READY",
          progress: 100,
          url,
          sortOrder: index,
        });
      });

      selectedAttachments.forEach((attachment, index) => {
        assets.push({
          id: attachment.id,
          type: "ATTACHMENT",
          status: "READY",
          progress: 100,
          url: attachment.url,
          objectKey: attachment.objectKey ?? null,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          sortOrder: index,
        });
      });

      return assets;
    }

    if (videoAssetId) {
      const videoAssetStatus: DraftAssetStatus = videoStatus === "READY"
        ? "READY"
        : videoStatus === "FAILED"
          ? "FAILED"
          : videoStatus === "PROCESSING"
            ? "PROCESSING"
            : "UPLOADING";
      assets.push({
        type: "VIDEO",
        status: videoAssetStatus,
        progress: videoUploadProgress,
        videoAssetId,
        fileName: videoFileName || null,
        fileSize: videoFileSize || null,
        sortOrder: 0,
      });
    }

    if (videoCoverUrl) {
      assets.push({
        type: "COVER",
        status: "READY",
        progress: 100,
        url: videoCoverUrl,
        sortOrder: 0,
      });
    }

    videoAttachments.forEach((attachment, index) => {
      assets.push({
        id: attachment.id,
        type: "ATTACHMENT",
        status: "READY",
        progress: 100,
        url: attachment.url,
        objectKey: attachment.objectKey ?? null,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        sortOrder: index,
      });
    });

    return assets;
  }, [
    postMode,
    selectedImages,
    selectedAttachments,
    videoAssetId,
    videoAttachments,
    videoCoverUrl,
    videoFileName,
    videoFileSize,
    videoStatus,
    videoUploadProgress,
  ]);

  const saveDraft = useCallback(async (persistMode: DraftPersistMode = "SAVED") => {
    setDraftSaving(true);
    try {
      const currentDraftId = await ensureDraftId(persistMode);
      const persistPatch: { persistMode?: DraftPersistMode } = persistMode === "SAVED"
        ? { persistMode: "SAVED" }
        : {};
      const payload = postMode === "VIDEO"
        ? {
            postType: "VIDEO" as const,
            title: videoTitle.trim() || null,
            content: videoDescription,
            visibility,
            topicId: videoTopicId,
            ...persistPatch,
            assets: buildDraftAssets(),
          }
        : {
            postType: "TEXT" as const,
            title: enableTitle ? title.trim() || null : null,
            content: "",
            contentJson: parseRichTextDocument(content) ?? createEmptyRichTextDocument(),
            contentFormat: "RICH_TEXT" as const,
            visibility,
            topicId: selectedTopicId,
            ...persistPatch,
            assets: buildDraftAssets(),
          };

      const response = await fetch(`/api/drafts/${currentDraftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as DraftResponse;
      if (!response.ok || !data.draft) {
        throw new Error(data.error || "保存草稿失败");
      }
      setDraftId(data.draft.id);
      return data.draft.id;
    } finally {
      setDraftSaving(false);
    }
  }, [
    buildDraftAssets,
    content,
    enableTitle,
    ensureDraftId,
    postMode,
    selectedTopicId,
    title,
    videoDescription,
    videoTitle,
    videoTopicId,
    visibility,
  ]);

  const hasAnyContent = useMemo(() => {
    if (postMode === "VIDEO") {
      return Boolean(
        videoTitle.trim()
        || videoDescription.trim()
        || videoAssetId
        || videoAttachments.length > 0
        || videoCoverUrl,
      );
    }

    return Boolean(
      getRichTextPlainText(parseRichTextDocument(content))
      || hasRichTextContent(parseRichTextDocument(content))
      || (enableTitle && title.trim())
      || selectedImages.length > 0
      || selectedAttachments.length > 0,
    );
  }, [
    content,
    enableTitle,
    postMode,
    selectedAttachments.length,
    selectedImages.length,
    title,
    videoAssetId,
    videoAttachments.length,
    videoCoverUrl,
    videoDescription,
    videoTitle,
  ]);

  const unsavedChanges = hasAnyContent;

  useEffect(() => {
    hasAnyContentRef.current = hasAnyContent;
    if (!hasAnyContent) {
      setAutoSaveAt("");
    }
  }, [hasAnyContent]);

  useEffect(() => {
    if (!draftIdFromUrl || status !== "authenticated") {
      return;
    }
    void fetchDraftDetail(draftIdFromUrl);
  }, [draftIdFromUrl, fetchDraftDetail, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    if (!unsavedChanges) {
      return;
    }
    if (loading || isUploading || videoUploading || videoAttachmentUploading || videoCoverUploading || draftLoading || draftSaving) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (autoSavingRef.current) {
        return;
      }
      if (!hasAnyContentRef.current) {
        return;
      }
      autoSavingRef.current = true;
      void saveDraft("SAVED")
        .then(() => {
          setAutoSaveAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
        })
        .catch((saveError) => {
          console.error("Auto save failed:", saveError);
        })
        .finally(() => {
          autoSavingRef.current = false;
        });
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    draftLoading,
    draftSaving,
    isUploading,
    loading,
    saveDraft,
    status,
    unsavedChanges,
    videoAttachmentUploading,
    videoCoverUploading,
    videoUploading,
  ]);

  useEffect(() => {
    if (!unsavedChanges) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [unsavedChanges]);

  const uploadFile = async (
    file: File,
    endpoint: string,
    onProgress: (percent: number, status: string) => void,
    bindDraftId?: string,
  ) => {
    if (endpoint === "/api/upload/attachment") {
      const directDraftId = bindDraftId || await ensureDraftId("EPHEMERAL");
      const task = startAttachmentUpload(file, directDraftId, (percent) => {
        onProgress(percent, `Attachment upload ${percent}%`);
      });
      attachmentUploadTaskRef.current = task;
      try {
        return await task.promise;
      } finally {
        attachmentUploadTaskRef.current = null;
      }
    }

    const formData = new FormData();
    formData.append("file", file);
    if (bindDraftId) {
      formData.append("draftId", bindDraftId);
    }

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
      const bindDraftId = await ensureDraftId("EPHEMERAL");
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
          },
          bindDraftId,
        ) as { url: string };

        uploadedUrls.push(result.url);
      }

      setSelectedImages((prev) => [...prev, ...uploadedUrls]);
      const lastUploadedUrl = uploadedUrls[uploadedUrls.length - 1];
      if (lastUploadedUrl) {
        imageInsertIdRef.current += 1;
        setImageInsertRequest({ id: imageInsertIdRef.current, url: lastUploadedUrl, alt: "图片" });
      }
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
      const files = Array.from(e.target.files).slice(0, Math.max(0, MAX_TEXT_ATTACHMENTS - selectedAttachments.length));
      const bindDraftId = await ensureDraftId("EPHEMERAL");
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
          },
          bindDraftId,
        ) as UploadedAttachment;

        const nextAttachments = [...selectedAttachmentsRef.current, result].slice(0, MAX_TEXT_ATTACHMENTS);
        selectedAttachmentsRef.current = nextAttachments;
        setSelectedAttachments(nextAttachments);
      }

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
    const attachment = selectedAttachments[indexToRemove];
    setSelectedAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    if (attachment?.id) {
      void fetch("/api/upload/attachment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentAssetId: attachment.id }),
      });
    }
  };

  const removeVideoAttachment = (indexToRemove: number) => {
    const attachment = videoAttachments[indexToRemove];
    setVideoAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    if (attachment?.id) {
      void fetch("/api/upload/attachment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentAssetId: attachment.id }),
      });
    }
  };

  const openEditorWorkspace = useCallback(async () => {
    if (postMode !== "TEXT") {
      window.open("/editor", "_blank", "noopener,noreferrer");
      return;
    }

    const hasAnyTextDraftContent = Boolean(
      getRichTextPlainText(parseRichTextDocument(content))
      || hasRichTextContent(parseRichTextDocument(content))
      || (enableTitle && title.trim())
      || selectedImages.length > 0
      || selectedAttachments.length > 0
      || selectedTopicId
      || visibility === "UNLISTED",
    );

    if (!hasAnyTextDraftContent) {
      window.open("/editor", "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const savedDraftId = await saveDraft("SAVED");
      window.open(`/editor?draftId=${savedDraftId}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Open editor workspace failed:", error);
      setError(error instanceof Error ? error.message : "打开编辑器失败");
    }
  }, [
    content,
    enableTitle,
    postMode,
    saveDraft,
    selectedAttachments.length,
    selectedImages.length,
    selectedTopicId,
    title,
    visibility,
  ]);

  const cancelUpload = () => {
    setCancelRequested(true);
    setUploadStatus("正在取消上传...");
    
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    attachmentUploadTaskRef.current?.cancel();
    attachmentUploadTaskRef.current = null;
  };

  const uploadVideoAttachment = async (file: File): Promise<UploadedAttachment> => {
    const bindDraftId = await ensureDraftId("EPHEMERAL");
    const task = startAttachmentUpload(file, bindDraftId, (percent) => {
      setVideoUploadError(`Attachment upload ${percent}%`);
    });
    attachmentUploadTaskRef.current = task;
    try {
      return await task.promise;
    } finally {
      attachmentUploadTaskRef.current = null;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (bindDraftId) {
      formData.append("draftId", bindDraftId);
    }

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
    const bindDraftId = await ensureDraftId("EPHEMERAL");
    const formData = new FormData();
    formData.append("file", file);
    if (bindDraftId) {
      formData.append("draftId", bindDraftId);
    }

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
    const bindDraftId = await ensureDraftId("EPHEMERAL");
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
          draftId: bindDraftId,
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
          draftId: bindDraftId,
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

      for (const file of currentBatch) {
        const uploaded = await uploadVideoAttachment(file);
        setVideoAttachments((prev) => [...prev, uploaded].slice(0, MAX_VIDEO_ATTACHMENTS));
      }
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
      setError("请先登录后再发布。");
      return;
    }

    const contentDocument = parseRichTextDocument(content);
    if (!hasRichTextContent(contentDocument) && selectedImages.length === 0 && selectedAttachments.length === 0) {
      setError("正文、图片或附件至少需要填写一项。");
      return;
    }

    if (selectedAttachments.length > MAX_TEXT_ATTACHMENTS) {
      setError(`最多只能上传 ${MAX_TEXT_ATTACHMENTS} 个附件。`);
      return;
    }

    if (enableTitle && !title.trim()) {
      setError("请输入标题。");
      return;
    }

    setLoading(true);
    try {
      if (draftId) {
        const patchedDraftId = await saveDraft("SAVED");
        const draftPublishResponse = await fetch(`/api/drafts/${patchedDraftId}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const draftPublishData = await draftPublishResponse.json() as DraftPublishResponse;
        if (!draftPublishResponse.ok) {
          throw new Error(draftPublishData.error || "草稿发布失败");
        }
        const createdPostId = draftPublishData.post?.id;
        navigateAfterPublish(createdPostId);
        return;
      }

      const response = await fetch("/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: enableTitle ? title : null,
          content: "",
          contentJson: contentDocument ?? createEmptyRichTextDocument(),
          contentFormat: "RICH_TEXT",
          authorId: (session as { user?: { id?: string } } | null)?.user?.id,
          images: selectedImages,
          attachments: selectedAttachments,
          visibility,
          topicId: selectedTopicId,
        }),
      });

      const data = await response.json() as CreatePostResponse;

      if (response.ok) {
        const createdPostId = data.post?.id;
        navigateAfterPublish(createdPostId);
      } else {
        await saveDraft("SAVED");
        setError(data.error || "发布失败，已为你保存到草稿箱。");
      }
    } catch (postError) {
      await saveDraft("SAVED");
      setError(
        postError instanceof Error
          ? `发布失败，已保存到草稿箱：${postError.message}`
          : "网络异常，已保存到草稿箱。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideoPost = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setVideoUploadError("");

    if (!(session as { user?: { id?: string } } | null)?.user?.id) {
      setError("请先登录后再发布。");
      return;
    }

    if (!videoAssetId) {
      await saveDraft("SAVED");
      setVideoUploadError("视频尚未上传完成，已保存到草稿箱。");
      return;
    }

    if (videoStatus !== "READY") {
      await saveDraft("SAVED");
      setVideoUploadError("视频仍在处理中，已保存到草稿箱，稍后可继续发布。");
      return;
    }

    if (videoAttachments.length > MAX_VIDEO_ATTACHMENTS) {
      setVideoUploadError(`最多只能上传 ${MAX_VIDEO_ATTACHMENTS} 个附件。`);
      return;
    }

    setLoading(true);
    try {
      if (draftId) {
        const patchedDraftId = await saveDraft("SAVED");
        const draftPublishResponse = await fetch(`/api/drafts/${patchedDraftId}/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const draftPublishData = await draftPublishResponse.json() as DraftPublishResponse;
        if (!draftPublishResponse.ok) {
          throw new Error(draftPublishData.error || "草稿发布失败");
        }
        const createdPostId = draftPublishData.post?.id;
        navigateAfterPublish(createdPostId);
        return;
      }

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

      const data = await response.json() as CreatePostResponse;

      if (response.ok) {
        const createdPostId = data.post?.id;
        navigateAfterPublish(createdPostId);
      } else {
        await saveDraft("SAVED");
        setVideoUploadError(data.error || "视频发布失败，已为你保存到草稿箱。");
      }
    } catch (postError) {
      await saveDraft("SAVED");
      setVideoUploadError(
        postError instanceof Error
          ? `视频发布失败，已保存到草稿箱：${postError.message}`
          : "网络异常，已保存到草稿箱。",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraftClick = async () => {
    try {
      const savedDraftId = await saveDraft("SAVED");
      setAutoSaveAt(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      setError("");
      setVideoUploadError("");
      router.replace(savedDraftId ? `/post/create?draftId=${savedDraftId}` : "/post/create");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存草稿失败";
      if (postMode === "VIDEO") {
        setVideoUploadError(message);
      } else {
        setError(message);
      }
    }
  };

  const handlePublish = () => {
    if (postMode === "VIDEO") {
      void handleCreateVideoPost();
      return;
    }

    void handleCreateTextPost();
  };

  const handleCancel = useCallback(async () => {
    if (!unsavedChanges) {
      router.back();
      return;
    }

    try {
      await saveDraft("EPHEMERAL");
    } catch (saveError) {
      console.error("Save draft before leave failed:", saveError);
    } finally {
      router.back();
    }
  }, [router, saveDraft, unsavedChanges]);

  const handleSheetRequestClose = useCallback(async () => {
    const pendingPostNavigation = pendingPostNavigationRef.current;
    if (pendingPostNavigation) {
      pendingPostNavigationRef.current = null;
      router.push(pendingPostNavigation);
      router.refresh();
      return;
    }

    await handleCancel();
  }, [handleCancel, router]);

  const canPublishText =
    !loading
    && !isUploading
    && (getRichTextPlainText(parseRichTextDocument(content)).length > 0
      || hasRichTextContent(parseRichTextDocument(content))
      || selectedImages.length > 0
      || selectedAttachments.length > 0)
    && (!enableTitle || title.trim().length > 0);

  const canPublishVideo =
    !loading
    && !videoUploading
    && !videoCoverUploading
    && !videoAttachmentUploading
    && (videoStatus === "READY" || Boolean(draftId));

  const statusMeta = getVideoStatusMeta(videoStatus);
  const shouldShowVideoCoverUploader = Boolean(videoAssetId) && !videoUploading;
  const effectiveVideoCoverUrl = videoCoverUrl || videoMeta?.coverUrl || null;
  const draftStatus = draftSaving
    ? { label: "保存中", className: "text-amber-500" }
    : unsavedChanges && autoSaveAt
      ? { label: `已保存 ${autoSaveAt}`, className: "text-emerald-500" }
      : unsavedChanges
        ? { label: "未保存", className: "text-orange-500" }
        : null;

  if (status === "loading") {
    const loadingContent = (
      <div className={presentation === "sheet" ? "flex h-full min-h-0 items-center justify-center bg-gray-50" : "flex min-h-screen items-center justify-center bg-gray-50"}>
        <div className="text-gray-500">加载中...</div>
      </div>
    );

    if (presentation === "sheet") {
      return (
        <CreatePostSheet onRequestClose={handleSheetRequestClose} closeRequest={sheetCloseRequest}>
          {loadingContent}
        </CreatePostSheet>
      );
    }

    return loadingContent;
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  const pageContent = (
    <div className={presentation === "sheet" ? "h-full min-h-0 overflow-y-auto overscroll-contain bg-[#f7f9fc]" : "min-h-screen bg-[#f7f9fc]"}>
      <main className={`mx-auto w-full max-w-[880px] px-4 py-6 sm:px-6 sm:py-8 ${presentation === "sheet" ? "h-full" : ""}`}>
        {/* 顶部标题栏 */}
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-1.5 text-sm text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
            取消
          </button>
          <h1 className="text-center text-xl font-semibold tracking-normal text-slate-950">发布动态</h1>
          <div aria-hidden="true" />
        </div>

        <div className="mx-auto mb-6 flex w-full max-w-xs rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setPostMode("TEXT");
              setError("");
            }}
            className={`min-w-0 flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
              postMode === "TEXT"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
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
            className={`min-w-0 flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${
              postMode === "VIDEO"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            发视频
          </button>
        </div>

        {postMode === "TEXT" && (
          <form onSubmit={handleCreateTextPost} className="space-y-4">
            <RichTextEditor
              value={content}
              onChange={setContent}
              imageInsertRequest={imageInsertRequest}
              onImageInsertHandled={() => setImageInsertRequest(null)}
              placeholder="分享你的想法..."
              minHeight={250}
              showToolbarToggle={true}
              variant="composer"
              contentSlot={
                selectedImages.length > 0 || selectedAttachments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {selectedImages.map((url, index) => (
                          <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image
                              src={url}
                              alt={`Upload preview ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 28vw, 160px"
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              aria-label={`移除图片 ${index + 1}`}
                              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/65 text-white opacity-0 transition-opacity hover:bg-slate-950 group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAttachments.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                              <Paperclip className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">{attachment.fileName}</p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              aria-label={`移除附件 ${attachment.fileName}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null
              }
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
              onOpenEditor={openEditorWorkspace}
              footerRight={
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublishText}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "发布中..." : "发布"}
                </button>
              }
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
              disabled={loading || isUploading || selectedImages.length >= 9}
            />

            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentSelect}
              disabled={loading || isUploading || selectedAttachments.length >= MAX_TEXT_ATTACHMENTS}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={navigateToDrafts}
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  title="打开草稿箱"
                >
                  <Archive className="h-4 w-4" strokeWidth={1.8} />
                  草稿箱
                </button>
                {draftStatus && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${draftStatus.className}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {draftStatus.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveDraftClick}
                  disabled={loading || draftSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  title="保存草稿"
                  aria-label="保存草稿"
                >
                  <Save className="h-4 w-4" strokeWidth={1.8} />
                  <span className="hidden sm:inline">保存草稿</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                aria-expanded={showAdvanced}
                aria-controls="text-advanced-options"
                className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              >
                <Settings className="h-4 w-4" strokeWidth={1.8} />
                <span>高级选项</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {showAdvanced && (
              <div
                id="text-advanced-options"
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <label className="flex cursor-pointer items-center gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-500">
                        <Type className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">添加标题</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-400">为动态添加一个可选标题</span>
                      </span>
                      <span className="relative inline-flex h-6 w-11 shrink-0">
                        <input
                          type="checkbox"
                          checked={enableTitle}
                          onChange={(e) => setEnableTitle(e.target.checked)}
                          className="peer sr-only"
                        />
                        <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-200" />
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                      </span>
                    </label>
                    {enableTitle && (
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="请输入标题（可选）"
                        maxLength={200}
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                  </div>

                  <div className="create-post-topic-setting flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <span className="text-sm font-semibold text-slate-800">话题</span>
                    <TopicSelector
                      selectedTopicId={selectedTopicId}
                      onSelect={setSelectedTopicId}
                      variant="settings"
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-500">
                      <Eye className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <label htmlFor="text-visibility" className="block text-sm font-semibold text-slate-800">可见范围</label>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                        {visibility === "PUBLIC" ? "会出现在首页和搜索结果中" : "不在首页和搜索展示，仅可通过链接访问"}
                      </span>
                    </span>
                    <select
                      id="text-visibility"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                      className="max-w-[42%] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="PUBLIC">公开可见</option>
                      <option value="UNLISTED">仅链接可见</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span>内容: {getRichTextPlainText(parseRichTextDocument(content)).length}</span>
                  {enableTitle && <span>标题: {title.length} / 200</span>}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
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
                        视频处理完成，可以点击下方“发布”。
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

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={navigateToDrafts}
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  title="打开草稿箱"
                >
                  <Archive className="h-4 w-4" strokeWidth={1.8} />
                  草稿箱
                </button>
                {draftStatus && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${draftStatus.className}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {draftStatus.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveDraftClick}
                  disabled={loading || draftSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                  title="保存草稿"
                  aria-label="保存草稿"
                >
                  <Save className="h-4 w-4" strokeWidth={1.8} />
                  <span className="hidden sm:inline">保存草稿</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePublish}
                disabled={!canPublishVideo}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "发布中..." : "发布"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );

  if (presentation === "sheet") {
    return (
      <CreatePostSheet onRequestClose={handleSheetRequestClose} closeRequest={sheetCloseRequest}>
        {pageContent}
      </CreatePostSheet>
    );
  }

  return pageContent;
}

function VideoFileBadgeIcon() {
  return (
    <span className="inline-flex items-center justify-center rounded bg-blue-100 text-blue-700 w-5 h-5">
      <Video className="w-3.5 h-3.5" />
    </span>
  );
}

