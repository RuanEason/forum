"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import EditorBootScreen from "@/components/editor/EditorBootScreen";
import EditorDocumentTabs from "@/components/editor/EditorDocumentTabs";
import EditorHistoryPanel from "@/components/editor/EditorHistoryPanel";
import EditorOutline from "@/components/editor/EditorOutline";
import EditorResizeHandle from "@/components/editor/EditorResizeHandle";
import EditorSidebar, { type SidebarTab } from "@/components/editor/EditorSidebar";
import EditorStatusbar from "@/components/editor/EditorStatusbar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import RichTextDocumentEditor from "@/components/editor/RichTextDocumentEditor";
import MobileEditorRedirect from "@/components/editor/MobileEditorRedirect";
import StyleCodeEditor, { DEFAULT_STYLE_TEMPLATE } from "@/components/editor/StyleCodeEditor";
import {
  buildOutlineItems,
  formatEditorTime,
  getSaveStateLabel,
  groupDraftsByDate,
  normalizeDraftTitle,
} from "@/components/editor/editor-utils";
import type {
  EditorDraftAsset,
  EditorDocumentTab,
  EditorDraftDetail,
  EditorDraftSummary,
  EditorImageAsset,
  EditorImageInsertRequest,
  PostVisibility,
  SaveState,
  UploadedAttachment,
} from "@/components/editor/types";
import { startAttachmentUpload, type AttachmentUploadTask } from "@/lib/client-attachment-upload";
import {
  createEmptyRichTextDocument,
  getRichTextPlainText,
  hasRichTextContent,
  parseRichTextDocument,
  plainTextToRichTextDocument,
  serializeRichTextDocument,
} from "@/lib/rich-text/content";

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

type EditorImagePoolResponse = {
  assets?: EditorImageAsset[];
  nextCursor?: string | null;
  usedBytes?: number;
  maxBytes?: number;
  error?: string;
};

type EditorImageUploadResponse = {
  asset?: EditorImageAsset;
  usedBytes?: number;
  maxBytes?: number;
  error?: string;
};

const EDITOR_LEFT_WIDTH_KEY = "forum:editor:left-width";
const EDITOR_RIGHT_WIDTH_KEY = "forum:editor:right-width";
const DEFAULT_LEFT_WIDTH = 360;
const DEFAULT_RIGHT_WIDTH = 300;
const MIN_LEFT_WIDTH = 240;
const MAX_LEFT_WIDTH = 520;
const MIN_RIGHT_WIDTH = 220;
const MAX_RIGHT_WIDTH = 480;

function clampWidth(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readStoredWidth(key: string, fallback: number, min: number, max: number) {
  try {
    const stored = Number(window.localStorage.getItem(key));
    return Number.isFinite(stored) ? clampWidth(stored, min, max) : fallback;
  } catch {
    return fallback;
  }
}

const EMPTY_RICH_TEXT_JSON = serializeRichTextDocument(createEmptyRichTextDocument());

function getRichTextJsonPayload(value: string) {
  return parseRichTextDocument(value) ?? createEmptyRichTextDocument();
}

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
  const [editorDocumentKey, setEditorDocumentKey] = useState(initialDraftId ?? "new");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(EMPTY_RICH_TEXT_JSON);
  const [styleCss, setStyleCss] = useState("");
  const [draftStatus, setDraftStatus] = useState<EditorDraftDetail["status"]>("EDITING");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<UploadedAttachment[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("properties");
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [activeDocumentTab, setActiveDocumentTab] = useState<EditorDocumentTab>("content");
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [imagePoolAssets, setImagePoolAssets] = useState<EditorImageAsset[]>([]);
  const [imagePoolUsedBytes, setImagePoolUsedBytes] = useState(0);
  const [imagePoolMaxBytes, setImagePoolMaxBytes] = useState(1024 * 1024 * 1024);
  const [imagePoolNextCursor, setImagePoolNextCursor] = useState<string | null>(null);
  const [imagePoolLoaded, setImagePoolLoaded] = useState(false);
  const [imagePoolLoading, setImagePoolLoading] = useState(false);
  const [imagePoolUploading, setImagePoolUploading] = useState(false);
  const [imagePoolError, setImagePoolError] = useState("");
  const [imageInsertRequest, setImageInsertRequest] = useState<EditorImageInsertRequest | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [activePosition, setActivePosition] = useState(1);
  const [jumpPosition, setJumpPosition] = useState<number | null>(null);
  const [didMountEditor, setDidMountEditor] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_WIDTH);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDraftRef = useRef<(() => Promise<string | null>) | null>(null);
  const isSavingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const initialQueryDraftHandledRef = useRef(false);
  const dirtyRef = useRef(false);
  const persistedSnapshotRef = useRef({
    draftId: null as string | null,
    title: "",
    content: EMPTY_RICH_TEXT_JSON,
    styleCss: "",
    visibility: "PUBLIC" as PostVisibility,
    topicId: null as string | null,
    imageSignature: "[]",
    attachmentSignature: "[]",
  });
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const styleCssRef = useRef(styleCss);
  const draftIdRef = useRef<string | null>(draftId);
  const visibilityRef = useRef<PostVisibility>(visibility);
  const selectedTopicIdRef = useRef<string | null>(selectedTopicId);
  const selectedImagesRef = useRef<string[]>(selectedImages);
  const selectedAttachmentsRef = useRef<UploadedAttachment[]>(selectedAttachments);
  const attachmentUploadTaskRef = useRef<AttachmentUploadTask | null>(null);
  const activeDocumentTabRef = useRef<EditorDocumentTab>(activeDocumentTab);
  const imageInsertIdRef = useRef(0);
  const leftPanelWidthRef = useRef(DEFAULT_LEFT_WIDTH);
  const rightPanelWidthRef = useRef(DEFAULT_RIGHT_WIDTH);

  titleRef.current = title;
  contentRef.current = content;
  styleCssRef.current = styleCss;
  draftIdRef.current = draftId;
  visibilityRef.current = visibility;
  selectedTopicIdRef.current = selectedTopicId;
  selectedImagesRef.current = selectedImages;
  selectedAttachmentsRef.current = selectedAttachments;
  activeDocumentTabRef.current = activeDocumentTab;
  leftPanelWidthRef.current = leftPanelWidth;
  rightPanelWidthRef.current = rightPanelWidth;

  useEffect(() => {
    setLeftPanelWidth(readStoredWidth(
      EDITOR_LEFT_WIDTH_KEY,
      DEFAULT_LEFT_WIDTH,
      MIN_LEFT_WIDTH,
      MAX_LEFT_WIDTH,
    ));
    setRightPanelWidth(readStoredWidth(
      EDITOR_RIGHT_WIDTH_KEY,
      DEFAULT_RIGHT_WIDTH,
      MIN_RIGHT_WIDTH,
      MAX_RIGHT_WIDTH,
    ));
  }, []);

  const resizeLeftPanel = useCallback((deltaX: number) => {
    setLeftPanelWidth(clampWidth(
      leftPanelWidthRef.current + deltaX,
      MIN_LEFT_WIDTH,
      MAX_LEFT_WIDTH,
    ));
  }, []);

  const resizeRightPanel = useCallback((deltaX: number) => {
    setRightPanelWidth(clampWidth(
      rightPanelWidthRef.current - deltaX,
      MIN_RIGHT_WIDTH,
      MAX_RIGHT_WIDTH,
    ));
  }, []);

  const persistLeftPanelWidth = useCallback(() => {
    try {
      window.localStorage.setItem(EDITOR_LEFT_WIDTH_KEY, String(leftPanelWidthRef.current));
    } catch {
      // Ignore storage failures so resizing remains usable.
    }
  }, []);

  const persistRightPanelWidth = useCallback(() => {
    try {
      window.localStorage.setItem(EDITOR_RIGHT_WIDTH_KEY, String(rightPanelWidthRef.current));
    } catch {
      // Ignore storage failures so resizing remains usable.
    }
  }, []);

  const historyGroups = useMemo(() => groupDraftsByDate(drafts), [drafts]);
  const contentDocument = useMemo(() => parseRichTextDocument(content), [content]);
  const contentText = useMemo(() => getRichTextPlainText(contentDocument), [contentDocument]);
  const outlineItems = useMemo(() => buildOutlineItems(content), [content]);
  const wordCount = useMemo(
    () => (activeDocumentTab === "content" ? contentText.length : styleCss.trim().length),
    [activeDocumentTab, contentText, styleCss],
  );
  const saveStateLabel = getSaveStateLabel(saveState, errorMessage);
  const currentTitle = normalizeDraftTitle(title) || "文件";
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

  const hydrateDraft = useCallback((
    draft: EditorDraftDetail,
    options?: { activeDocumentTab?: EditorDocumentTab },
  ) => {
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
        id: asset.id,
        url: asset.url as string,
        objectKey: asset.objectKey,
        fileName: asset.fileName as string,
        fileSize: asset.fileSize as number,
        mimeType: asset.mimeType as string,
      }));

    setDraftId(draft.id);
    setEditorDocumentKey(draft.id);
    draftIdRef.current = draft.id;
    const normalizedTitle = normalizeDraftTitle(draft.title);
    setTitle(normalizedTitle);
    const legacyDocument = draft.contentFormat === "PLAIN_TEXT" && draft.content
      ? plainTextToRichTextDocument(draft.content)
      : parseRichTextDocument(draft.content);
    const nextContent = draft.contentJson
      ? serializeRichTextDocument(draft.contentJson)
      : legacyDocument
        ? serializeRichTextDocument(legacyDocument)
        : EMPTY_RICH_TEXT_JSON;
    setContent(nextContent);
    setStyleCss(draft.styleCss ?? "");
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
    setActivePosition(1);
    setActiveDocumentTab(options?.activeDocumentTab ?? "content");
    dirtyRef.current = false;
    persistedSnapshotRef.current = {
      draftId: draft.id,
      title: normalizedTitle,
      content: nextContent,
      styleCss: draft.styleCss ?? "",
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

  const loadImagePool = useCallback(async (options?: { cursor?: string; append?: boolean }) => {
    setImagePoolLoading(true);
    setImagePoolError("");

    try {
      const params = new URLSearchParams();
      if (options?.cursor) {
        params.set("cursor", options.cursor);
      }
      const response = await fetch(`/api/editor/assets${params.size > 0 ? `?${params.toString()}` : ""}`, {
        cache: "no-store",
      });
      const data = await response.json() as EditorImagePoolResponse;
      if (!response.ok) {
        throw new Error(data.error || "加载图片池失败");
      }

      const assets = Array.isArray(data.assets) ? data.assets : [];
      setImagePoolAssets((current) => {
        if (!options?.append) {
          return assets;
        }

        const known = new Set(current.map((asset) => asset.id));
        return [...current, ...assets.filter((asset) => !known.has(asset.id))];
      });
      setImagePoolNextCursor(data.nextCursor ?? null);
      setImagePoolUsedBytes(data.usedBytes ?? 0);
      setImagePoolMaxBytes(data.maxBytes ?? 1024 * 1024 * 1024);
      setImagePoolLoaded(true);
    } catch (error) {
      setImagePoolError(error instanceof Error ? error.message : "加载图片池失败");
    } finally {
      setImagePoolLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSidebarTab === "assets" && !imagePoolLoaded) {
      void loadImagePool();
    }
  }, [activeSidebarTab, imagePoolLoaded, loadImagePool]);

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
        content: "",
        contentJson: getRichTextJsonPayload(contentRef.current),
        contentFormat: "RICH_TEXT",
        styleConfig: null,
        styleCss: styleCssRef.current || null,
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
      objectKey: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      videoAssetId: null,
      errorMessage: null,
      sortOrder: index,
    }));

    const attachmentAssets = selectedAttachmentsRef.current.map((attachment, index) => ({
      id: attachment.id ?? "",
      type: "ATTACHMENT" as const,
      status: "READY" as const,
      progress: 100,
      url: attachment.url,
      objectKey: attachment.objectKey ?? null,
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

    // Keep a stable payload so an older response cannot replace newer editor input.
    const saveSnapshot = {
      title: titleRef.current,
      content: contentRef.current,
      styleCss: styleCssRef.current,
      visibility: visibilityRef.current,
      topicId: selectedTopicIdRef.current,
      imageSignature: JSON.stringify(selectedImagesRef.current),
      attachmentSignature: JSON.stringify(selectedAttachmentsRef.current),
    };
    const draftAssets = buildDraftAssets();

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
          title: saveSnapshot.title.trim() || null,
          content: "",
          contentJson: getRichTextJsonPayload(saveSnapshot.content),
          contentFormat: "RICH_TEXT",
          styleConfig: null,
          styleCss: saveSnapshot.styleCss || null,
          visibility: saveSnapshot.visibility,
          topicId: saveSnapshot.topicId,
          persistMode: "SAVED",
          assets: draftAssets.map((asset) => ({
            id: asset.id || undefined,
            type: asset.type,
            status: asset.status,
            progress: asset.progress,
            url: asset.url,
            objectKey: asset.objectKey,
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

      await loadHistory();

      const hasChangedSinceSaveStarted = (
        titleRef.current !== saveSnapshot.title
        || contentRef.current !== saveSnapshot.content
        || styleCssRef.current !== saveSnapshot.styleCss
        || visibilityRef.current !== saveSnapshot.visibility
        || selectedTopicIdRef.current !== saveSnapshot.topicId
        || JSON.stringify(selectedImagesRef.current) !== saveSnapshot.imageSignature
        || JSON.stringify(selectedAttachmentsRef.current) !== saveSnapshot.attachmentSignature
      );

      // A save acknowledgement must not rehydrate the controlled editor or reset its selection.
      setDraftId(data.draft.id);
      draftIdRef.current = data.draft.id;
      setDraftStatus(data.draft.status);
      setLastSavedAt(data.draft.updatedAt);
      setSaveState(hasChangedSinceSaveStarted ? "idle" : "saved");
      persistedSnapshotRef.current = {
        draftId: data.draft.id,
        ...saveSnapshot,
      };
      dirtyRef.current = hasChangedSinceSaveStarted;

      if (hasChangedSinceSaveStarted) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
          void saveDraftRef.current?.();
        }, 3000);
      }

      return data.draft.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存草稿失败";
      setSaveState("error");
      setErrorMessage(message);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [buildDraftAssets, createDraftIfNeeded, loadHistory]);

  saveDraftRef.current = saveDraft;

  const handleManualSave = useCallback(() => {
    if (
      !titleRef.current.trim()
      && !getRichTextPlainText(parseRichTextDocument(contentRef.current))
      && !hasRichTextContent(parseRichTextDocument(contentRef.current))
      && !styleCssRef.current.trim()
      && !draftIdRef.current
    ) {
      return;
    }

    void saveDraft();
  }, [saveDraft]);

  const handlePublish = useCallback(async () => {
    const currentContentDocument = parseRichTextDocument(contentRef.current);
    if (
      !titleRef.current.trim()
      && !getRichTextPlainText(currentContentDocument)
      && !hasRichTextContent(currentContentDocument)
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

  const handleOpenHistory = useCallback(() => {
    setIsHistoryPanelOpen(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryPanelOpen(false);
  }, []);

  const handleCreateNew = useCallback(async () => {
    if (dirtyRef.current) {
      try {
        await saveDraft();
      } catch {
        return;
      }
    }

    setDraftId(null);
    setEditorDocumentKey("new");
    draftIdRef.current = null;
    setTitle("");
    setContent(EMPTY_RICH_TEXT_JSON);
    setStyleCss("");
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
    setActivePosition(1);
    setActiveDocumentTab("content");
    dirtyRef.current = false;
    persistedSnapshotRef.current = {
      draftId: null,
      title: "",
      content: EMPTY_RICH_TEXT_JSON,
      styleCss: "",
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
    if (endpoint === "/api/upload/attachment") {
      const currentDraftId = await createDraftIfNeeded();
      const task = startAttachmentUpload(file, currentDraftId, (percent) => {
        onProgress(percent, `Attachment upload ${percent}%`);
      });
      attachmentUploadTaskRef.current = task;
      try {
        return await task.promise;
      } finally {
        attachmentUploadTaskRef.current = null;
      }
    }

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
        const files = Array.from(input.files).slice(0, Math.max(0, 5 - selectedAttachmentsRef.current.length));

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          setUploadStatus(`正在上传第 ${index + 1}/${files.length} 个附件...`);
          const result = await uploadFile(file, "/api/upload/attachment", (percent, label) => {
            const overallProgress = ((index + percent / 100) / files.length) * 100;
            setUploadProgress(Math.round(overallProgress));
            setUploadStatus(`第 ${index + 1}/${files.length} 个附件: ${label}`);
          }) as UploadedAttachment;
          const nextAttachments = [...selectedAttachmentsRef.current, result].slice(0, 5);
          selectedAttachmentsRef.current = nextAttachments;
          setSelectedAttachments(nextAttachments);
        }

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
    const attachment = selectedAttachmentsRef.current[index];
    setSelectedAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    if (attachment?.id) {
      void fetch("/api/upload/attachment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentAssetId: attachment.id }),
      });
    }
  }, []);

  const cancelAttachmentUpload = useCallback(() => {
    attachmentUploadTaskRef.current?.cancel();
    attachmentUploadTaskRef.current = null;
  }, []);

  const handleImagePoolUpload = useCallback((files: File[]) => {
    void (async () => {
      setActiveSidebarTab("assets");
      setImagePoolUploading(true);
      setImagePoolError("");

      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/editor/assets", { method: "POST", body: formData });
          const data = await response.json() as EditorImageUploadResponse;
          if (!response.ok || !data.asset) {
            throw new Error(data.error || "上传图片失败");
          }

          setImagePoolAssets((current) => [data.asset as EditorImageAsset, ...current]);
          setImagePoolUsedBytes(data.usedBytes ?? 0);
          setImagePoolMaxBytes(data.maxBytes ?? 1024 * 1024 * 1024);
          setImagePoolLoaded(true);
        }
      } catch (error) {
        setImagePoolError(error instanceof Error ? error.message : "上传图片失败");
      } finally {
        setImagePoolUploading(false);
      }
    })();
  }, []);

  const handleImagePoolDelete = useCallback(async (asset: EditorImageAsset) => {
    setImagePoolError("");
    const response = await fetch(`/api/editor/assets/${asset.id}`, { method: "DELETE" });
    const data = await response.json() as { usedBytes?: number; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "删除图片失败");
    }

    setImagePoolAssets((current) => current.filter((item) => item.id !== asset.id));
    setImagePoolUsedBytes(data.usedBytes ?? 0);
  }, []);

  const handleImagePoolInsert = useCallback((asset: EditorImageAsset) => {
    imageInsertIdRef.current += 1;
    setActiveDocumentTab("content");
    setImageInsertRequest({ id: imageInsertIdRef.current, url: asset.url });
  }, []);

  const handleOpenStyleEditor = useCallback(async () => {
    if (!draftIdRef.current) {
      try {
        await createDraftIfNeeded();
      } catch {
        return;
      }
    }

    if (!styleCssRef.current.trim()) {
      setStyleCss(DEFAULT_STYLE_TEMPLATE);
    }

    setActiveDocumentTab("style");
  }, [createDraftIfNeeded]);

  useEffect(() => {
    if (activeDocumentTab !== "style") {
      return;
    }

    if (!styleCssRef.current.trim()) {
      setStyleCss(DEFAULT_STYLE_TEMPLATE);
    }
  }, [activeDocumentTab]);

  useEffect(() => {
    if (!hasHydratedRef.current || !didMountEditor) {
      return;
    }

    const unchanged = (
      persistedSnapshotRef.current.draftId === draftIdRef.current
      && persistedSnapshotRef.current.title === title
      && persistedSnapshotRef.current.content === content
      && persistedSnapshotRef.current.styleCss === styleCss
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
      && !getRichTextPlainText(parseRichTextDocument(content))
      && !styleCss.trim()
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
    styleCss,
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
    (getRichTextPlainText(contentDocument) || hasRichTextContent(contentDocument) || selectedImages.length > 0 || selectedAttachments.length > 0)
    && !isPublishing
    && !isUploadingAssets
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
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#f3f5f7] text-slate-900">
      <EditorTopbar
        title={currentTitle}
        draftStatusLabel={draftStatusLabel}
        saveState={saveState}
        saveStateLabel={saveStateLabel}
        savedAtLabel={formatEditorTime(lastSavedAt)}
        canPublish={canPublish}
        isPublishing={isPublishing}
        historyLoading={historyLoading}
        switchingId={switchingId}
        activeDraftId={draftId}
        recentDrafts={drafts}
        onCreateNew={handleCreateNew}
        onSave={handleManualSave}
        onOpenHistory={handleOpenHistory}
        onSelectDraft={handleSelectDraft}
        onPublish={handlePublish}
      />

      <EditorHistoryPanel
        open={isHistoryPanelOpen}
        groups={historyGroups}
        activeDraftId={draftId}
        loading={historyLoading}
        switchingId={switchingId}
        onClose={handleCloseHistory}
        onSelectDraft={handleSelectDraft}
      />

      {errorMessage ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="min-h-0 flex flex-1">
        <EditorSidebar
          style={{ width: leftPanelWidth }}
          activeTab={activeSidebarTab}
          visibility={visibility}
          selectedTopicId={selectedTopicId}
          selectedImages={selectedImages}
          selectedAttachments={selectedAttachments}
          uploadError={uploadError}
          isUploadingAssets={isUploadingAssets}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          imagePoolAssets={imagePoolAssets}
          imagePoolUsedBytes={imagePoolUsedBytes}
          imagePoolMaxBytes={imagePoolMaxBytes}
          imagePoolLoading={imagePoolLoading}
          imagePoolUploading={imagePoolUploading}
          imagePoolError={imagePoolError}
          imagePoolHasMore={Boolean(imagePoolNextCursor)}
          onTabChange={setActiveSidebarTab}
          onVisibilityChange={setVisibility}
          onTopicChange={setSelectedTopicId}
          onImageUpload={handleImageUpload}
          onAttachmentUpload={handleAttachmentUpload}
          onRemoveImage={removeImage}
          onRemoveAttachment={removeAttachment}
          onCancelUpload={cancelAttachmentUpload}
          onOpenStyleEditor={handleOpenStyleEditor}
          onImagePoolUpload={handleImagePoolUpload}
          onImagePoolLoadMore={() => {
            if (imagePoolNextCursor) {
              void loadImagePool({ cursor: imagePoolNextCursor, append: true });
            }
          }}
          onImagePoolInsert={handleImagePoolInsert}
          onImagePoolDelete={handleImagePoolDelete}
        />

        <EditorResizeHandle
          direction="left"
          onResize={resizeLeftPanel}
          onResizeEnd={persistLeftPanelWidth}
        />

        <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          <EditorDocumentTabs
            activeTab={activeDocumentTab}
            onChange={setActiveDocumentTab}
          />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {activeDocumentTab === "content" ? (
              <RichTextDocumentEditor
                documentKey={editorDocumentKey}
                title={title}
                content={content}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onSave={handleManualSave}
                onPublish={handlePublish}
                setActivePosition={setActivePosition}
                externalJumpPosition={jumpPosition}
                onExternalJumpHandled={() => setJumpPosition(null)}
                imageInsertRequest={imageInsertRequest}
                onImageInsertHandled={() => setImageInsertRequest(null)}
              />
            ) : (
              <StyleCodeEditor
                styleConfig={null}
                value={styleCss}
                previewTitle={title}
                previewContent={content}
                previewPostId={draftId ?? "style-preview"}
                onChange={setStyleCss}
              />
            )}
          </div>
        </div>

        {activeDocumentTab === "content" ? (
          <EditorOutline
            width={rightPanelWidth}
            items={outlineItems}
            activePosition={activePosition}
            onSelectPosition={(position) => setJumpPosition(position)}
            onResize={resizeRightPanel}
            onResizeEnd={persistRightPanelWidth}
          />
        ) : (
          <>
          <EditorResizeHandle
            direction="right"
            className="hidden xl:block"
            onResize={resizeRightPanel}
            onResizeEnd={persistRightPanelWidth}
          />
          <aside
            className="hidden shrink-0 border-l border-slate-200 bg-white/80 xl:flex xl:flex-col"
            style={{ width: rightPanelWidth }}
          >
            <div className="border-b border-slate-200 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              样式说明
            </div>
            <div className="space-y-4 px-5 py-5 text-sm leading-6 text-slate-600">
              <p>模板里已经放了常用选择器，直接在花括号里补充样式声明即可。</p>
              <p>如果某个规则块是空的，发布后不会真正对详情页产生影响。</p>
              <p>这里写的 CSS 只作用于当前帖子正文，不会影响站点其他页面。</p>
            </div>
          </aside>
          </>
        )}
      </div>

      <EditorStatusbar
        wordCount={wordCount}
        headingCount={activeDocumentTab === "content" ? outlineItems.length : 0}
        saveStateLabel={saveStateLabel}
        documentLabel={activeDocumentTab === "content" ? "正文" : "样式.css"}
      />
    </div>
  );
}
