"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import EditorOutline from "@/components/editor/EditorOutline";
import EditorSidebar, { type SidebarTab } from "@/components/editor/EditorSidebar";
import EditorStatusbar from "@/components/editor/EditorStatusbar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import MarkdownDocEditor from "@/components/editor/MarkdownDocEditor";
import MobileEditorRedirect from "@/components/editor/MobileEditorRedirect";
import {
  buildOutlineItems,
  formatEditorTime,
  getDraftDisplayTitle,
  getSaveStateLabel,
  groupDraftsByDate,
} from "@/components/editor/editor-utils";
import type {
  EditorDraftAsset,
  EditorDraftDetail,
  EditorDraftSummary,
  PostVisibility,
  SaveState,
  UploadedAttachment,
} from "@/components/editor/types";

type DraftListResponse = {
  drafts?: EditorDraftSummary[];
  error?: string;
};

type DraftResponse = {
  draft?: EditorDraftDetail;
  error?: string;
};

type PublishResponse = {
  ok?: boolean;
  error?: string;
  post?: {
    id?: string;
  };
};

export default function EditorWorkspace() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialDraftId = searchParams.get("draftId");

  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [booting, setBooting] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [draftLoading, setDraftLoading] = useState(false);
  const [drafts, setDrafts] = useState<EditorDraftSummary[]>([]);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [draftStatus, setDraftStatus] = useState<EditorDraftDetail["status"]>("EDITING");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<UploadedAttachment[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("history");
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeLineNumber, setActiveLineNumber] = useState(1);
  const [jumpLineNumber, setJumpLineNumber] = useState<number | null>(null);
  const [didMountEditor, setDidMountEditor] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const initialQueryDraftHandledRef = useRef(false);
  const dirtyRef = useRef(false);
  const persistedSnapshotRef = useRef({
    draftId: null as string | null,
    title: "",
    content: "",
    visibility: "PUBLIC" as PostVisibility,
    topicId: null as string | null,
    imageSignature: "[]",
    attachmentSignature: "[]",
  });
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const draftIdRef = useRef<string | null>(draftId);
  const visibilityRef = useRef<PostVisibility>(visibility);
  const selectedTopicIdRef = useRef<string | null>(selectedTopicId);
  const selectedImagesRef = useRef<string[]>(selectedImages);
  const selectedAttachmentsRef = useRef<UploadedAttachment[]>(selectedAttachments);

  titleRef.current = title;
  contentRef.current = content;
  draftIdRef.current = draftId;
  visibilityRef.current = visibility;
  selectedTopicIdRef.current = selectedTopicId;
  selectedImagesRef.current = selectedImages;
  selectedAttachmentsRef.current = selectedAttachments;

  const historyGroups = useMemo(() => groupDraftsByDate(drafts), [drafts]);
  const outlineItems = useMemo(() => buildOutlineItems(content), [content]);
  const wordCount = useMemo(() => content.trim().length, [content]);
  const saveStateLabel = getSaveStateLabel(saveState, errorMessage);
  const currentTitle = title.trim() || getDraftDisplayTitle({ title, content });
  const imageSignature = useMemo(() => JSON.stringify(selectedImages), [selectedImages]);
  const attachmentSignature = useMemo(() => JSON.stringify(selectedAttachments), [selectedAttachments]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  useEffect(() => {
    const update = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const hydrateDraft = useCallback((draft: EditorDraftDetail) => {
    const assets = Array.isArray(draft.assets) ? draft.assets : [];
    const imageAssets = assets
      .filter((asset) => asset.type === "IMAGE" && asset.url)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((asset) => asset.url as string);
    const attachmentAssets = assets
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
        url: asset.url as string,
        fileName: asset.fileName as string,
        fileSize: asset.fileSize as number,
        mimeType: asset.mimeType as string,
      }));

    setDraftId(draft.id);
    draftIdRef.current = draft.id;
    setTitle(draft.title ?? "");
    setContent(draft.content ?? "");
    setDraftStatus(draft.status);
    setVisibility((draft.visibility as PostVisibility | undefined) ?? "PUBLIC");
    setSelectedTopicId(draft.topicId ?? null);
    setSelectedImages(imageAssets);
    setSelectedAttachments(attachmentAssets);
    setLastSavedAt(draft.updatedAt);
    setSaveState("saved");
    setErrorMessage("");
    setUploadError("");
    setUploadStatus("");
    setUploadProgress(0);
    setIsUploadingAssets(false);
    setActiveLineNumber(1);
    dirtyRef.current = false;
    persistedSnapshotRef.current = {
      draftId: draft.id,
      title: draft.title ?? "",
      content: draft.content ?? "",
      visibility: (draft.visibility as PostVisibility | undefined) ?? "PUBLIC",
      topicId: draft.topicId ?? null,
      imageSignature: JSON.stringify(imageAssets),
      attachmentSignature: JSON.stringify(attachmentAssets),
    };
    hasHydratedRef.current = true;
    setDidMountEditor(true);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/drafts?persistMode=SAVED&limit=50", {
        cache: "no-store",
      });
      const data = await response.json() as DraftListResponse;
      if (!response.ok) {
        throw new Error(data.error || "加载历史草稿失败");
      }
      const nextDrafts = Array.isArray(data.drafts)
        ? data.drafts.filter((draft) => draft.postType === "TEXT")
        : [];
      setDrafts(nextDrafts);
      return nextDrafts;
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载历史草稿失败";
      setErrorMessage(message);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDraft = useCallback(async (id: string) => {
    setDraftLoading(true);
    setSwitchingId(id);
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json() as DraftResponse;
      if (!response.ok || !data.draft) {
        throw new Error(data.error || "加载草稿失败");
      }

      if (data.draft.postType !== "TEXT") {
        throw new Error("编辑器当前仅支持文本草稿");
      }

      hydrateDraft(data.draft);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "加载草稿失败");
    } finally {
      setDraftLoading(false);
      setSwitchingId(null);
    }
  }, [hydrateDraft]);

  useEffect(() => {
    if (status !== "authenticated" || isDesktop == null) {
      return;
    }

    if (!isDesktop) {
      setBooting(false);
      return;
    }

    let cancelled = false;

    const prepare = async () => {
      const history = await loadHistory();

      if (cancelled) {
        return;
      }

      const targetDraftId = initialDraftId || history[0]?.id || null;
      if (targetDraftId) {
        await loadDraft(targetDraftId);
      } else {
        setSaveState("idle");
        hasHydratedRef.current = true;
        setDidMountEditor(true);
      }

      if (!cancelled) {
        setBooting(false);
        initialQueryDraftHandledRef.current = true;
      }
    };

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [initialDraftId, isDesktop, loadDraft, loadHistory, status]);

  useEffect(() => {
    if (!booting && !initialQueryDraftHandledRef.current && initialDraftId && status === "authenticated" && isDesktop) {
      void loadDraft(initialDraftId);
      initialQueryDraftHandledRef.current = true;
    }
  }, [booting, initialDraftId, isDesktop, loadDraft, status]);

  const createDraftIfNeeded = useCallback(async () => {
    if (draftIdRef.current) {
      return draftIdRef.current;
    }

    const response = await fetch("/api/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postType: "TEXT",
        title: titleRef.current.trim() || null,
        content: contentRef.current,
        visibility: visibilityRef.current,
        topicId: selectedTopicIdRef.current,
        persistMode: "SAVED",
      }),
    });
    const data = await response.json() as DraftResponse;
    if (!response.ok || !data.draft) {
      throw new Error(data.error || "创建草稿失败");
    }

    setDraftId(data.draft.id);
    draftIdRef.current = data.draft.id;
    if (!searchParams.get("draftId")) {
      router.replace(`/editor?draftId=${data.draft.id}`);
    }
    return data.draft.id;
  }, [router, searchParams]);

  const buildDraftAssets = useCallback((): EditorDraftAsset[] => {
    const imageAssets = selectedImagesRef.current.map((url, index) => ({
      id: "",
      type: "IMAGE" as const,
      status: "READY" as const,
      progress: 100,
      url,
      fileName: null,
      fileSize: null,
      mimeType: null,
      videoAssetId: null,
      errorMessage: null,
      sortOrder: index,
    }));

    const attachmentAssets = selectedAttachmentsRef.current.map((attachment, index) => ({
      id: "",
      type: "ATTACHMENT" as const,
      status: "READY" as const,
      progress: 100,
      url: attachment.url,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      videoAssetId: null,
      errorMessage: null,
      sortOrder: index,
    }));

    return [...imageAssets, ...attachmentAssets];
  }, []);

  const saveDraft = useCallback(async () => {
    if (isSavingRef.current) {
      return draftIdRef.current;
    }

    isSavingRef.current = true;
    setSaveState("saving");
    setErrorMessage("");

    try {
      const currentDraftId = await createDraftIfNeeded();
      const response = await fetch(`/api/drafts/${currentDraftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postType: "TEXT",
          title: titleRef.current.trim() || null,
          content: contentRef.current,
          visibility: visibilityRef.current,
          topicId: selectedTopicIdRef.current,
          persistMode: "SAVED",
          assets: buildDraftAssets().map((asset) => ({
            type: asset.type,
            status: asset.status,
            progress: asset.progress,
            url: asset.url,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            mimeType: asset.mimeType,
            videoAssetId: asset.videoAssetId,
            errorMessage: asset.errorMessage,
            sortOrder: asset.sortOrder,
          })),
        }),
      });
      const data = await response.json() as DraftResponse;
      if (!response.ok || !data.draft) {
        throw new Error(data.error || "保存草稿失败");
      }

      hydrateDraft(data.draft);
      await loadHistory();
      return data.draft.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存草稿失败";
      setSaveState("error");
      setErrorMessage(message);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [buildDraftAssets, createDraftIfNeeded, hydrateDraft, loadHistory]);

  const handleManualSave = useCallback(() => {
    if (!titleRef.current.trim() && !contentRef.current.trim() && !draftIdRef.current) {
      return;
    }

    void saveDraft();
  }, [saveDraft]);

  const handlePublish = useCallback(async () => {
    if (
      !titleRef.current.trim()
      && !contentRef.current.trim()
      && selectedImagesRef.current.length === 0
      && selectedAttachmentsRef.current.length === 0
    ) {
      setErrorMessage("请先输入一些内容再发布");
      return;
    }

    setIsPublishing(true);
    setErrorMessage("");

    try {
      const currentDraftId = await saveDraft();
      if (!currentDraftId) {
        throw new Error("未能获取草稿 ID");
      }

      const response = await fetch(`/api/drafts/${currentDraftId}/publish`, {
        method: "POST",
      });
      const data = await response.json() as PublishResponse;

      if (!response.ok || !data.ok || !data.post?.id) {
        throw new Error(data.error || "发布失败");
      }

      router.push(`/post/${data.post.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "发布失败");
    } finally {
      setIsPublishing(false);
    }
  }, [router, saveDraft]);

  const handleSelectDraft = useCallback(async (draft: EditorDraftSummary) => {
    if (switchingId || draft.id === draftIdRef.current) {
      return;
    }

    if (dirtyRef.current) {
      try {
        await saveDraft();
      } catch {
        return;
      }
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("draftId", draft.id);
    router.replace(`/editor?${params.toString()}`);
    await loadDraft(draft.id);
  }, [loadDraft, router, saveDraft, searchParams, switchingId]);

  const handleCreateNew = useCallback(async () => {
    if (dirtyRef.current) {
      try {
        await saveDraft();
      } catch {
        return;
      }
    }

    setDraftId(null);
    draftIdRef.current = null;
    setTitle("");
    setContent("");
    setDraftStatus("EDITING");
    setVisibility("PUBLIC");
    setSelectedTopicId(null);
    setSelectedImages([]);
    setSelectedAttachments([]);
    setSaveState("idle");
    setLastSavedAt("");
    setErrorMessage("");
    setUploadError("");
    setUploadStatus("");
    setUploadProgress(0);
    setIsUploadingAssets(false);
    setActiveLineNumber(1);
    dirtyRef.current = false;
    persistedSnapshotRef.current = {
      draftId: null,
      title: "",
      content: "",
      visibility: "PUBLIC",
      topicId: null,
      imageSignature: "[]",
      attachmentSignature: "[]",
    };
    hasHydratedRef.current = true;
    setDidMountEditor(true);
    router.replace("/editor");
  }, [router, saveDraft]);

  const uploadFile = useCallback(async (
    file: File,
    endpoint: string,
    onProgress: (percent: number, statusLabel: string) => void,
  ) => {
    const currentDraftId = await createDraftIfNeeded();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("draftId", currentDraftId);

    return await new Promise<unknown>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) {
          return;
        }
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent, "上传中...");
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response"));
          }
        } else {
          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(parsed.error || `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
      xhr.open("POST", endpoint);
      xhr.send(formData);
    });
  }, [createDraftIfNeeded]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        return;
      }

      setActiveSidebarTab("properties");
      setIsUploadingAssets(true);
      setUploadError("");
      setUploadProgress(0);
      setUploadStatus("");

      try {
        const files = Array.from(input.files);
        const uploadedUrls: string[] = [];

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          setUploadStatus(`正在上传第 ${index + 1}/${files.length} 张图片...`);
          const result = await uploadFile(file, "/api/upload", (percent, label) => {
            const overallProgress = ((index + percent / 100) / files.length) * 100;
            setUploadProgress(Math.round(overallProgress));
            setUploadStatus(`第 ${index + 1}/${files.length} 张图片: ${label}`);
          }) as { url: string };
          uploadedUrls.push(result.url);
        }

        setSelectedImages((prev) => [...prev, ...uploadedUrls]);
        setUploadStatus("图片上传完成");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "图片上传失败");
      } finally {
        setIsUploadingAssets(false);
      }
    };
    input.click();
  }, [uploadFile]);

  const handleAttachmentUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        return;
      }

      setActiveSidebarTab("properties");
      setIsUploadingAssets(true);
      setUploadError("");
      setUploadProgress(0);
      setUploadStatus("");

      try {
        const files = Array.from(input.files);
        const uploadedFiles: UploadedAttachment[] = [];

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          setUploadStatus(`正在上传第 ${index + 1}/${files.length} 个附件...`);
          const result = await uploadFile(file, "/api/upload/attachment", (percent, label) => {
            const overallProgress = ((index + percent / 100) / files.length) * 100;
            setUploadProgress(Math.round(overallProgress));
            setUploadStatus(`第 ${index + 1}/${files.length} 个附件: ${label}`);
          }) as UploadedAttachment;
          uploadedFiles.push(result);
        }

        setSelectedAttachments((prev) => [...prev, ...uploadedFiles]);
        setUploadStatus("附件上传完成");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "附件上传失败");
      } finally {
        setIsUploadingAssets(false);
      }
    };
    input.click();
  }, [uploadFile]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current || !didMountEditor) {
      return;
    }

    const unchanged = (
      persistedSnapshotRef.current.draftId === draftIdRef.current
      && persistedSnapshotRef.current.title === title
      && persistedSnapshotRef.current.content === content
      && persistedSnapshotRef.current.visibility === visibility
      && persistedSnapshotRef.current.topicId === selectedTopicId
      && persistedSnapshotRef.current.imageSignature === imageSignature
      && persistedSnapshotRef.current.attachmentSignature === attachmentSignature
    );

    if (unchanged) {
      dirtyRef.current = false;
      setSaveState("saved");
      return;
    }

    if (
      !title.trim()
      && !content.trim()
      && selectedImages.length === 0
      && selectedAttachments.length === 0
      && !selectedTopicId
      && visibility === "PUBLIC"
      && !draftIdRef.current
    ) {
      setSaveState("idle");
      dirtyRef.current = false;
      return;
    }

    dirtyRef.current = true;
    setSaveState("idle");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void saveDraft();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    attachmentSignature,
    content,
    didMountEditor,
    imageSignature,
    saveDraft,
    selectedAttachments.length,
    selectedImages.length,
    selectedTopicId,
    title,
    visibility,
  ]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  if (status === "loading" || isDesktop == null || booting) {
    return <EditorBootScreen />;
  }

  if (status !== "authenticated") {
    return <EditorBootScreen />;
  }

  if (!isDesktop) {
    return <MobileEditorRedirect />;
  }

  const canPublish = Boolean(
    (content.trim() || selectedImages.length > 0 || selectedAttachments.length > 0)
    && !isPublishing
    && !draftLoading
    && !historyLoading,
  );
  const draftStatusLabel = draftStatus === "READY"
    ? "可发布"
    : draftStatus === "FAILED"
      ? "失败"
      : draftStatus === "PROCESSING"
        ? "处理中"
        : draftStatus === "UPLOADING"
          ? "上传中"
          : "编辑中";

  return (
    <div className="flex h-screen flex-col bg-[#eef3f9] text-slate-900">
      <EditorTopbar
        title={currentTitle}
        draftStatusLabel={draftStatusLabel}
        saveState={saveState}
        saveStateLabel={saveStateLabel}
        savedAtLabel={formatEditorTime(lastSavedAt)}
        canPublish={canPublish}
        isPublishing={isPublishing}
        onSave={handleManualSave}
        onPublish={handlePublish}
      />

      {errorMessage ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="min-h-0 flex flex-1">
        <EditorSidebar
          activeTab={activeSidebarTab}
          groups={historyGroups}
          activeDraftId={draftId}
          loading={historyLoading}
          switchingId={switchingId}
          visibility={visibility}
          selectedTopicId={selectedTopicId}
          selectedImages={selectedImages}
          selectedAttachments={selectedAttachments}
          uploadError={uploadError}
          isUploadingAssets={isUploadingAssets}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          onCreateNew={handleCreateNew}
          onTabChange={setActiveSidebarTab}
          onSelectDraft={handleSelectDraft}
          onVisibilityChange={setVisibility}
          onTopicChange={setSelectedTopicId}
          onImageUpload={handleImageUpload}
          onAttachmentUpload={handleAttachmentUpload}
          onRemoveImage={removeImage}
          onRemoveAttachment={removeAttachment}
        />

        <MarkdownDocEditor
          documentKey={draftId ?? "new"}
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onSave={handleManualSave}
          onPublish={handlePublish}
          activeLineNumber={activeLineNumber}
          setActiveLineNumber={setActiveLineNumber}
          externalJumpLine={jumpLineNumber}
          onExternalJumpHandled={() => setJumpLineNumber(null)}
        />

        <EditorOutline
          items={outlineItems}
          activeLineNumber={activeLineNumber}
          onSelectLine={(lineNumber) => setJumpLineNumber(lineNumber)}
        />
      </div>

      <EditorStatusbar
        wordCount={wordCount}
        headingCount={outlineItems.length}
        saveStateLabel={saveStateLabel}
      />
    </div>
  );
}
