"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Video,
} from "lucide-react";

type DraftStatus = "EDITING" | "UPLOADING" | "PROCESSING" | "FAILED" | "READY" | "PUBLISHED";
type PostType = "TEXT" | "VIDEO";
type PersistMode = "EPHEMERAL" | "SAVED";

type DraftItem = {
  id: string;
  postType: PostType;
  title: string | null;
  content: string;
  status: DraftStatus;
  persistMode: PersistMode;
  updatedAt: string;
  uploadSummary: {
    total: number;
    uploading: number;
    processing: number;
    failed: number;
    ready: number;
  };
  assets: Array<{
    id: string;
    type: "IMAGE" | "ATTACHMENT" | "VIDEO" | "COVER";
  }>;
};

type DraftListResponse = {
  drafts?: DraftItem[];
  error?: string;
};

type DraftDeleteResponse = {
  ok?: boolean;
  error?: string;
};

type DraftRow = DraftItem & {
  titleText: string;
  summary: string;
  isVideo: boolean;
  mediaCounters: {
    image: number;
    attachment: number;
    video: number;
  };
};

type PendingPress = {
  id: string;
  titleText: string;
  pointerId: number;
  startX: number;
  startY: number;
  rect: DOMRect;
};

type DraggingState = {
  id: string;
  titleText: string;
  pointerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

const LONG_PRESS_DURATION_MS = 320;
const LONG_PRESS_MOVE_TOLERANCE_PX = 8;

const statusLabel: Record<DraftStatus, string> = {
  EDITING: "编辑中",
  UPLOADING: "上传中",
  PROCESSING: "处理中",
  FAILED: "失败",
  READY: "可发布",
  PUBLISHED: "已发布",
};

function formatTime(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return dateText;
  }
  return date.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function computeDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [trashHot, setTrashHot] = useState(false);

  const trashZoneRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPressRef = useRef<PendingPress | null>(null);
  const suppressNextClickRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimerRef.current) {
      return;
    }
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const isInTrashZone = useCallback((clientX: number, clientY: number) => {
    const trashNode = trashZoneRef.current;
    if (!trashNode) {
      return false;
    }
    const rect = trashNode.getBoundingClientRect();
    return (
      clientX >= rect.left
      && clientX <= rect.right
      && clientY >= rect.top
      && clientY <= rect.bottom
    );
  }, []);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      pendingPressRef.current = null;
    };
  }, [clearLongPressTimer]);

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/drafts?persistMode=SAVED&limit=50", {
          cache: "no-store",
        });
        const data = await response.json() as DraftListResponse;
        if (!response.ok) {
          throw new Error(data.error || "加载草稿失败");
        }
        setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "加载草稿失败");
      } finally {
        setLoading(false);
      }
    };

    void fetchDrafts();
  }, []);

  const removeDraft = useCallback(async (draftId: string) => {
    if (deletingId) {
      return;
    }

    setDeletingId(draftId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: "DELETE",
      });
      const data = await response.json() as DraftDeleteResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "删除草稿失败");
      }

      setDrafts((prev) => prev.filter((item) => item.id !== draftId));
      setNotice("草稿已删除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除草稿失败");
    } finally {
      setDeletingId(null);
    }
  }, [deletingId]);

  const rows = useMemo<DraftRow[]>(() => drafts.map((draft) => {
    const titleText = draft.title?.trim() || (draft.postType === "VIDEO" ? "未命名视频草稿" : "未命名文本草稿");
    const summary = draft.content?.trim() || "暂无内容";
    const isVideo = draft.postType === "VIDEO";
    const mediaCounters = {
      image: draft.assets.filter((asset) => asset.type === "IMAGE").length,
      attachment: draft.assets.filter((asset) => asset.type === "ATTACHMENT").length,
      video: draft.assets.filter((asset) => asset.type === "VIDEO").length,
    };

    return {
      ...draft,
      titleText,
      summary,
      isVideo,
      mediaCounters,
    };
  }), [drafts]);

  const handleCardPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, draft: DraftRow) => {
    if (event.button !== 0 || deletingId) {
      return;
    }

    suppressNextClickRef.current = false;
    setNotice("");
    setError("");

    const rect = event.currentTarget.getBoundingClientRect();
    pendingPressRef.current = {
      id: draft.id,
      titleText: draft.titleText,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    clearLongPressTimer();

    longPressTimerRef.current = setTimeout(() => {
      const pending = pendingPressRef.current;
      if (!pending || pending.pointerId !== event.pointerId) {
        return;
      }

      suppressNextClickRef.current = true;
      setDragging({
        id: pending.id,
        titleText: pending.titleText,
        pointerId: pending.pointerId,
        width: pending.rect.width,
        height: pending.rect.height,
        offsetX: pending.startX - pending.rect.left,
        offsetY: pending.startY - pending.rect.top,
        x: pending.rect.left,
        y: pending.rect.top,
      });
      setTrashHot(isInTrashZone(pending.startX, pending.startY));
      pendingPressRef.current = null;
    }, LONG_PRESS_DURATION_MS);
  }, [clearLongPressTimer, deletingId, isInTrashZone]);

  const handleCardPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const pending = pendingPressRef.current;
    if (pending && pending.pointerId === event.pointerId && !dragging) {
      const movedDistance = computeDistance(event.clientX, event.clientY, pending.startX, pending.startY);
      if (movedDistance > LONG_PRESS_MOVE_TOLERANCE_PX) {
        clearLongPressTimer();
        pendingPressRef.current = null;
      }
      return;
    }

    if (!dragging || dragging.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextX = event.clientX - dragging.offsetX;
    const nextY = event.clientY - dragging.offsetY;
    const nextTrashHot = isInTrashZone(event.clientX, event.clientY);

    setDragging((prev) => {
      if (!prev || prev.pointerId !== event.pointerId) {
        return prev;
      }
      return {
        ...prev,
        x: nextX,
        y: nextY,
      };
    });
    setTrashHot(nextTrashHot);
  }, [clearLongPressTimer, dragging, isInTrashZone]);

  const handleCardPointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    clearLongPressTimer();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const pending = pendingPressRef.current;
    if (pending && pending.pointerId === event.pointerId) {
      pendingPressRef.current = null;
      suppressNextClickRef.current = true;
      router.push(`/post/create?draftId=${pending.id}`);
      return;
    }

    if (!dragging || dragging.pointerId !== event.pointerId) {
      return;
    }

    suppressNextClickRef.current = true;
    const shouldDelete = isInTrashZone(event.clientX, event.clientY);
    const dragDraftId = dragging.id;
    setDragging(null);
    setTrashHot(false);

    if (shouldDelete) {
      void removeDraft(dragDraftId);
    }
  }, [clearLongPressTimer, dragging, isInTrashZone, removeDraft, router]);

  const handleCardPointerCancel = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clearLongPressTimer();
    pendingPressRef.current = null;
    setDragging(null);
    setTrashHot(false);
    suppressNextClickRef.current = true;
  }, [clearLongPressTimer]);

  const handleCardClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>, draftId: string) => {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClickRef.current = false;
      return;
    }
    router.push(`/post/create?draftId=${draftId}`);
  }, [router]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在加载草稿...
        </div>
      </main>
    );
  }

  return (
    <main className={`max-w-3xl mx-auto px-4 py-8 space-y-4 ${dragging ? "select-none" : ""}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">草稿箱</h1>
        <button
          type="button"
          onClick={() => router.push("/post/create")}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          新建发布
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notice}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className="p-6 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
          暂无已保存草稿，去发布页开始编辑吧。
        </div>
      )}

      {!error && rows.length > 0 && (
        <div className="text-xs text-gray-500">
          提示：短按进入草稿，长按后拖到左侧垃圾桶可以删除。
        </div>
      )}

      <div className="space-y-3">
        {rows.map((draft) => {
          const isDeleting = deletingId === draft.id;
          const isDraggingCard = dragging?.id === draft.id;

          return (
            <button
              key={draft.id}
              type="button"
              onPointerDown={(event) => handleCardPointerDown(event, draft)}
              onPointerMove={handleCardPointerMove}
              onPointerUp={handleCardPointerUp}
              onPointerCancel={handleCardPointerCancel}
              onClick={(event) => handleCardClick(event, draft.id)}
              className={`w-full text-left p-4 rounded-xl border bg-white transition-all ${
                isDraggingCard
                  ? "opacity-20 border-blue-300"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
              } ${isDeleting ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={isDeleting}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{draft.titleText}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{draft.summary}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600">
                  {statusLabel[draft.status]}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  {draft.isVideo ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {draft.isVideo ? "视频" : "文本"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {draft.mediaCounters.image}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  {draft.mediaCounters.attachment}
                </span>
                {draft.mediaCounters.video > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    {draft.mediaCounters.video}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  更新于 {formatTime(draft.updatedAt)}
                </span>
              </div>

              {draft.uploadSummary.total > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  上传状态：上传中 {draft.uploadSummary.uploading}，处理中 {draft.uploadSummary.processing}，失败 {draft.uploadSummary.failed}，就绪 {draft.uploadSummary.ready}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {dragging && (
        <>
          <div className="fixed inset-0 z-40 pointer-events-none">
            <div
              ref={trashZoneRef}
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-28 h-36 rounded-2xl border-2 shadow-lg transition-colors ${
                trashHot
                  ? "border-red-600 bg-red-100 text-red-700"
                  : "border-red-300 bg-red-50 text-red-500"
              } flex flex-col items-center justify-center`}
            >
              <Trash2 className="w-8 h-8" />
              <span className="mt-2 text-xs font-medium">拖到此处删除</span>
            </div>
          </div>
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: dragging.x,
              top: dragging.y,
              width: dragging.width,
              height: dragging.height,
            }}
          >
            <div className={`h-full rounded-xl border-2 shadow-xl p-4 ${
              trashHot ? "border-red-500 bg-red-50" : "border-blue-400 bg-white"
            }`}>
              <p className="text-sm font-semibold text-gray-900 truncate">{dragging.titleText}</p>
              <p className="mt-1 text-xs text-gray-500">松开可放下，拖到左侧可删除</p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
