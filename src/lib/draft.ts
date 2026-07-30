import { prisma } from "@/lib/prisma";
import { cleanupAttachmentObject } from "@/lib/attachment";
import { Prisma } from "@/generated";
import {
  normalizePostStyleConfig,
  normalizePostStyleCss,
} from "@/lib/post-style";
import type { PostStyleConfig } from "@/types/post-style";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const MAX_TEXT_IMAGES = 10;
const MAX_ATTACHMENTS = 5;
const MAX_VIDEO_ATTACHMENTS = 5;

type DraftAssetType = "IMAGE" | "ATTACHMENT" | "VIDEO" | "COVER";
type DraftAssetStatus = "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
type DraftStatus = "EDITING" | "UPLOADING" | "PROCESSING" | "FAILED" | "READY" | "PUBLISHED";
type DraftPersistMode = "EPHEMERAL" | "SAVED";
type PostType = "TEXT" | "VIDEO";
type PostVisibility = "PUBLIC" | "UNLISTED";

export type DraftAssetInput = {
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
  errorMessage?: string | null;
  sortOrder?: number;
};

export type DraftUpsertInput = {
  postType?: PostType;
  title?: string | null;
  content?: string;
  styleConfig?: PostStyleConfig | null;
  styleCss?: string | null;
  visibility?: PostVisibility;
  topicId?: string | null;
  persistMode?: DraftPersistMode;
  assets?: DraftAssetInput[];
  lastError?: string | null;
};

type DraftPublishPayload = {
  title: string | null;
  content: string;
  styleConfig: PostStyleConfig | null;
  styleCss: string | null;
  visibility: PostVisibility;
  topicId: string | null;
  postType: PostType;
  imageUrls: string[];
  attachments: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  videoAssetId: string | null;
  videoCoverUrl: string | null;
};

const draftArgs = Prisma.validator<Prisma.PostDraftDefaultArgs>()({
  select: {
    id: true,
    postType: true,
    title: true,
    content: true,
    styleConfig: true,
    styleCss: true,
    visibility: true,
    topicId: true,
    persistMode: true,
    status: true,
    lastError: true,
    publishedPostId: true,
    createdAt: true,
    updatedAt: true,
    topic: {
      select: {
        id: true,
        name: true,
      },
    },
    assets: {
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        type: true,
        status: true,
        progress: true,
        url: true,
        objectKey: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        videoAssetId: true,
        errorMessage: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        videoAsset: {
          select: {
            id: true,
            status: true,
            coverUrl: true,
          },
        },
      },
    },
  },
});

type DraftWithAssets = Prisma.PostDraftGetPayload<typeof draftArgs>;
type DraftAssetInDraft = DraftWithAssets["assets"][number];

function clampProgress(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.trunc(value as number)));
}

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeContent(value: string | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.slice(0, MAX_CONTENT_LENGTH);
}

function toNullableJsonInput(
  value: PostStyleConfig | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function normalizeTitle(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, MAX_TITLE_LENGTH);
}

function normalizePostType(value: string | undefined): PostType {
  return value === "VIDEO" ? "VIDEO" : "TEXT";
}

function normalizeVisibility(value: string | undefined): PostVisibility {
  return value === "UNLISTED" ? "UNLISTED" : "PUBLIC";
}

function normalizePersistMode(value: string | undefined): DraftPersistMode {
  return value === "SAVED" ? "SAVED" : "EPHEMERAL";
}

function normalizeAssetType(value: string): DraftAssetType {
  if (value === "IMAGE" || value === "ATTACHMENT" || value === "VIDEO" || value === "COVER") {
    return value;
  }
  throw new Error("Invalid asset type");
}

function normalizeAssetStatus(value: string): DraftAssetStatus {
  if (
    value === "PENDING"
    || value === "UPLOADING"
    || value === "PROCESSING"
    || value === "READY"
    || value === "FAILED"
  ) {
    return value;
  }
  throw new Error("Invalid asset status");
}

function getEffectiveAssetStatus(asset: DraftAssetInDraft): DraftAssetStatus {
  if (asset.type === "VIDEO" && asset.videoAsset) {
    if (asset.videoAsset.status === "READY") {
      return "READY";
    }
    if (asset.videoAsset.status === "FAILED" || asset.videoAsset.status === "DELETED") {
      return "FAILED";
    }
    if (asset.videoAsset.status === "PROCESSING") {
      return "PROCESSING";
    }
    return "UPLOADING";
  }

  return asset.status as DraftAssetStatus;
}

function summarizeAssets(assets: DraftWithAssets["assets"]) {
  let hasUploading = false;
  let hasProcessing = false;
  let hasFailed = false;
  let allReady = assets.length > 0;

  for (const asset of assets) {
    const effectiveStatus = getEffectiveAssetStatus(asset);

    if (effectiveStatus === "UPLOADING" || effectiveStatus === "PENDING") {
      hasUploading = true;
    } else if (effectiveStatus === "PROCESSING") {
      hasProcessing = true;
    } else if (effectiveStatus === "FAILED") {
      hasFailed = true;
    }

    if (effectiveStatus !== "READY") {
      allReady = false;
    }
  }

  return {
    hasUploading,
    hasProcessing,
    hasFailed,
    allReady,
  };
}

export function resolveDraftStatus(draft: Pick<DraftWithAssets, "postType" | "publishedPostId" | "assets">): DraftStatus {
  if (draft.publishedPostId) {
    return "PUBLISHED";
  }

  const stats = summarizeAssets(draft.assets);

  if (stats.hasUploading) {
    return "UPLOADING";
  }
  if (stats.hasProcessing) {
    return "PROCESSING";
  }
  if (stats.hasFailed) {
    return "FAILED";
  }

  if (draft.postType === "VIDEO") {
    if (draft.assets.length === 0) {
      return "EDITING";
    }
    return stats.allReady ? "READY" : "EDITING";
  }

  return "READY";
}

function buildDraftMeta(draft: DraftWithAssets) {
  const status = resolveDraftStatus(draft);
  const stats = summarizeAssets(draft.assets);
  const uploadSummary = {
    total: draft.assets.length,
    uploading: 0,
    processing: 0,
    failed: 0,
    ready: 0,
  };

  for (const asset of draft.assets) {
    const effectiveStatus = getEffectiveAssetStatus(asset);

    if (effectiveStatus === "UPLOADING" || effectiveStatus === "PENDING") {
      uploadSummary.uploading += 1;
    } else if (effectiveStatus === "PROCESSING") {
      uploadSummary.processing += 1;
    } else if (effectiveStatus === "FAILED") {
      uploadSummary.failed += 1;
    } else if (effectiveStatus === "READY") {
      uploadSummary.ready += 1;
    }
  }

  return {
    status,
    hasUploading: stats.hasUploading,
    hasProcessing: stats.hasProcessing,
    hasFailed: stats.hasFailed,
    canPublish: status === "READY",
    uploadSummary,
  };
}

function validateDraftPayload(postType: PostType, assets: DraftAssetInput[], content: string, title: string | null) {
  if (title && title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content must be less than ${MAX_CONTENT_LENGTH} characters`);
  }

  const imageAssets = assets.filter((asset) => asset.type === "IMAGE");
  const attachmentAssets = assets.filter((asset) => asset.type === "ATTACHMENT");
  const videoAssets = assets.filter((asset) => asset.type === "VIDEO");

  if (postType === "TEXT") {
    if (imageAssets.length > MAX_TEXT_IMAGES) {
      throw new Error(`Maximum ${MAX_TEXT_IMAGES} images allowed`);
    }
    if (attachmentAssets.length > MAX_ATTACHMENTS) {
      throw new Error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
    }
    if (videoAssets.length > 0) {
      throw new Error("Text draft does not support video asset");
    }
  } else {
    if (videoAssets.length > 1) {
      throw new Error("Video draft only supports one video asset");
    }
    if (imageAssets.length > 0) {
      throw new Error("Video draft does not support image assets");
    }
    if (attachmentAssets.length > MAX_VIDEO_ATTACHMENTS) {
      throw new Error(`Maximum ${MAX_VIDEO_ATTACHMENTS} attachments allowed`);
    }
  }
}

async function setDraftComputedStatus(draftId: string) {
  const draft = await prisma.postDraft.findUnique({
    where: { id: draftId },
    select: {
      id: true,
      postType: true,
      publishedPostId: true,
      assets: {
        select: {
          id: true,
          type: true,
          status: true,
          progress: true,
          url: true,
          objectKey: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          videoAssetId: true,
          errorMessage: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          videoAsset: {
            select: {
              id: true,
              status: true,
              coverUrl: true,
            },
          },
        },
      },
    },
  });

  if (!draft) {
    return;
  }

  const computed = resolveDraftStatus({
    postType: draft.postType as PostType,
    publishedPostId: draft.publishedPostId,
    assets: draft.assets as DraftWithAssets["assets"],
  });

  await prisma.postDraft.update({
    where: { id: draftId },
    data: {
      status: computed,
      lastError: computed === "FAILED" ? undefined : null,
    },
  });
}

export async function createDraft(authorId: string, input: DraftUpsertInput = {}) {
  const postType = normalizePostType(input.postType);
  const title = normalizeTitle(input.title);
  const content = normalizeContent(input.content);
  const styleConfig = normalizePostStyleConfig(input.styleConfig ?? null);
  const styleCss = normalizePostStyleCss(input.styleCss ?? null);
  const visibility = normalizeVisibility(input.visibility);
  const topicId = normalizeText(input.topicId ?? null);
  const persistMode = normalizePersistMode(input.persistMode);
  const assets = Array.isArray(input.assets) ? input.assets : [];

  if (assets.some((asset) => asset.type === "ATTACHMENT")) {
    throw new Error("Attachment assets must be created by the upload service");
  }

  validateDraftPayload(postType, assets, content, title);

  const created = await prisma.postDraft.create({
    data: {
      authorId,
      postType,
      title,
      content,
      styleConfig: toNullableJsonInput(styleConfig),
      styleCss,
      visibility,
      topicId,
      persistMode,
      lastError: normalizeText(input.lastError ?? null),
      assets: {
        create: assets.map((asset, index) => ({
          type: normalizeAssetType(asset.type),
          status: normalizeAssetStatus(asset.status),
          progress: clampProgress(asset.progress),
          url: normalizeText(asset.url ?? null),
          objectKey: normalizeText(asset.objectKey ?? null),
          fileName: normalizeText(asset.fileName ?? null),
          fileSize: typeof asset.fileSize === "number" ? Math.max(0, Math.trunc(asset.fileSize)) : null,
          mimeType: normalizeText(asset.mimeType ?? null),
          videoAssetId: normalizeText(asset.videoAssetId ?? null),
          errorMessage: normalizeText(asset.errorMessage ?? null),
          sortOrder: Number.isFinite(asset.sortOrder) ? Math.max(0, Math.trunc(asset.sortOrder as number)) : index,
        })),
      },
    },
    ...draftArgs,
  });

  await setDraftComputedStatus(created.id);
  return getDraftById(authorId, created.id);
}

export async function getDraftById(authorId: string, draftId: string) {
  const draft = await prisma.postDraft.findFirst({
    where: {
      id: draftId,
      authorId,
    },
    ...draftArgs,
  });

  if (!draft) {
    return null;
  }

  const meta = buildDraftMeta(draft);
  return {
    ...draft,
    ...meta,
  };
}

export async function listDrafts(authorId: string, options?: { persistMode?: DraftPersistMode; limit?: number }) {
  const take = Number.isFinite(options?.limit) ? Math.max(1, Math.min(100, Math.trunc(options?.limit as number))) : 30;
  const where: {
    authorId: string;
    persistMode?: DraftPersistMode;
    publishedPostId: null;
  } = {
    authorId,
    publishedPostId: null,
  };

  if (options?.persistMode) {
    where.persistMode = options.persistMode;
  }

  const drafts = await prisma.postDraft.findMany({
    where,
    ...draftArgs,
    orderBy: {
      updatedAt: "desc",
    },
    take,
  });

  return drafts.map((draft) => {
    const meta = buildDraftMeta(draft);
    return {
      ...draft,
      ...meta,
    };
  });
}

async function syncDraftAssets(draftId: string, assets: DraftAssetInput[]) {
  const existingAssets = await prisma.draftAsset.findMany({
    where: { draftId },
    select: {
      id: true,
      type: true,
      status: true,
      progress: true,
      url: true,
      objectKey: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      videoAssetId: true,
      errorMessage: true,
      sortOrder: true,
    },
  });
  const existingAssetById = new Map(existingAssets.map((asset) => [asset.id, asset]));

  const normalizedAssets = assets.map((asset, index) => {
    const clientPayload = {
      type: normalizeAssetType(asset.type),
      status: normalizeAssetStatus(asset.status),
      progress: clampProgress(asset.progress),
      url: normalizeText(asset.url ?? null),
      fileName: normalizeText(asset.fileName ?? null),
      fileSize: typeof asset.fileSize === "number" ? Math.max(0, Math.trunc(asset.fileSize)) : null,
      mimeType: normalizeText(asset.mimeType ?? null),
      videoAssetId: normalizeText(asset.videoAssetId ?? null),
      errorMessage: normalizeText(asset.errorMessage ?? null),
      sortOrder: Number.isFinite(asset.sortOrder) ? Math.max(0, Math.trunc(asset.sortOrder as number)) : index,
    };

    const id = normalizeText(asset.id ?? null);
    const existing = id ? existingAssetById.get(id) : undefined;
    if (clientPayload.type === "ATTACHMENT") {
      if (!id || !existing || existing.type !== "ATTACHMENT") {
        throw new Error("Attachment asset must be created by the upload service");
      }

      return {
        id,
        data: {
          ...clientPayload,
          status: existing.status as DraftAssetStatus,
          progress: existing.progress,
          url: existing.url,
          objectKey: existing.objectKey,
          fileName: existing.fileName,
          fileSize: existing.fileSize,
          mimeType: existing.mimeType,
          videoAssetId: existing.videoAssetId,
          errorMessage: existing.errorMessage,
        },
        create: false,
      };
    }

    if (id && existing) {
      return {
        id,
        data: clientPayload,
        create: false,
      };
    }

    return {
      id: null,
      data: clientPayload,
      create: true,
    };
  });

  const keepIds = normalizedAssets
    .map((asset) => asset.id)
    .filter((id): id is string => Boolean(id));

  const removedAssets = existingAssets.filter((asset) => !keepIds.includes(asset.id));

  if (keepIds.length > 0) {
    await prisma.draftAsset.deleteMany({
      where: {
        draftId,
        id: {
          notIn: keepIds,
        },
      },
    });
  } else {
    await prisma.draftAsset.deleteMany({
      where: { draftId },
    });
  }

  await Promise.all(
    removedAssets
      .filter((asset) => asset.type === "ATTACHMENT" && asset.objectKey)
      .map((asset) => cleanupAttachmentObject(asset.objectKey)),
  );

  for (const asset of normalizedAssets) {
    if (asset.create) {
      await prisma.draftAsset.create({
        data: {
          draftId,
          ...asset.data,
        },
      });
      continue;
    }

    await prisma.draftAsset.update({
      where: {
        id: asset.id as string,
      },
      data: asset.data,
    });
  }
}

export async function updateDraft(authorId: string, draftId: string, input: DraftUpsertInput) {
  const existing = await prisma.postDraft.findFirst({
    where: {
      id: draftId,
      authorId,
    },
    select: {
      id: true,
      postType: true,
      title: true,
      content: true,
      styleConfig: true,
      styleCss: true,
      visibility: true,
      topicId: true,
      persistMode: true,
      status: true,
      assets: {
        select: {
          id: true,
          type: true,
          status: true,
          progress: true,
          url: true,
          objectKey: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          videoAssetId: true,
          errorMessage: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!existing) {
    return null;
  }

  const nextPostType = input.postType ? normalizePostType(input.postType) : (existing.postType as PostType);
  const nextTitle = input.title !== undefined ? normalizeTitle(input.title) : existing.title;
  const nextContent = input.content !== undefined ? normalizeContent(input.content) : existing.content;
  const nextStyleConfig = input.styleConfig !== undefined
    ? normalizePostStyleConfig(input.styleConfig ?? null)
    : normalizePostStyleConfig(existing.styleConfig);
  const nextStyleCss = input.styleCss !== undefined
    ? normalizePostStyleCss(input.styleCss ?? null)
    : normalizePostStyleCss(existing.styleCss);
  const nextVisibility = input.visibility ? normalizeVisibility(input.visibility) : (existing.visibility as PostVisibility);
  const nextTopicId = input.topicId !== undefined ? normalizeText(input.topicId ?? null) : existing.topicId;
  const requestedPersistMode = input.persistMode ? normalizePersistMode(input.persistMode) : null;
  const nextPersistMode = requestedPersistMode
    ? ((existing.persistMode as DraftPersistMode) === "SAVED" && requestedPersistMode === "EPHEMERAL"
      ? "SAVED"
      : requestedPersistMode)
    : (existing.persistMode as DraftPersistMode);
  const nextAssets = input.assets
    ? input.assets
    : existing.assets.map((asset) => ({
        id: asset.id,
        type: asset.type as DraftAssetType,
        status: asset.status as DraftAssetStatus,
        progress: asset.progress,
        url: asset.url,
        objectKey: asset.objectKey,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        videoAssetId: asset.videoAssetId,
        errorMessage: asset.errorMessage,
        sortOrder: asset.sortOrder,
      }));

  validateDraftPayload(nextPostType, nextAssets, nextContent, nextTitle);

  await prisma.postDraft.update({
    where: { id: draftId },
    data: {
      postType: nextPostType,
      title: nextTitle,
      content: nextContent,
      styleConfig: toNullableJsonInput(nextStyleConfig),
      styleCss: nextStyleCss,
      visibility: nextVisibility,
      topicId: nextTopicId,
      persistMode: nextPersistMode,
      lastError: input.lastError === undefined ? undefined : normalizeText(input.lastError ?? null),
    },
  });

  if (input.assets) {
    await syncDraftAssets(draftId, nextAssets);
  }

  await setDraftComputedStatus(draftId);
  return getDraftById(authorId, draftId);
}

export async function deleteDraft(authorId: string, draftId: string) {
  const existing = await prisma.postDraft.findFirst({
    where: {
      id: draftId,
      authorId,
    },
    select: {
      id: true,
      publishedPostId: true,
      assets: {
        select: { type: true, objectKey: true },
      },
    },
  });

  if (!existing) {
    return false;
  }

  if (existing.publishedPostId) {
    throw new Error("Published draft cannot be deleted");
  }

  await prisma.postDraft.delete({
    where: {
      id: draftId,
    },
  });

  await Promise.all(
    existing.assets
      .filter((asset) => asset.type === "ATTACHMENT" && asset.objectKey)
      .map((asset) => cleanupAttachmentObject(asset.objectKey)),
  );

  return true;
}

function pickReadyTextAssets(draft: DraftWithAssets) {
  const imageUrls = draft.assets
    .filter((asset) => asset.type === "IMAGE" && asset.status === "READY" && asset.url)
    .map((asset) => asset.url as string);
  const attachments = draft.assets
    .filter(
      (asset) =>
        asset.type === "ATTACHMENT"
        && asset.status === "READY"
        && asset.url
        && asset.fileName
        && Number.isFinite(asset.fileSize)
        && asset.mimeType,
    )
    .map((asset) => ({
      url: asset.url as string,
      fileName: asset.fileName as string,
      fileSize: asset.fileSize as number,
      mimeType: asset.mimeType as string,
    }));

  return {
    imageUrls,
    attachments,
  };
}

function pickVideoPayload(draft: DraftWithAssets) {
  const videoAsset = draft.assets.find((asset) => asset.type === "VIDEO");
  if (!videoAsset || !videoAsset.videoAssetId) {
    throw new Error("videoAssetId is required for video draft");
  }

  if (!videoAsset.videoAsset || videoAsset.videoAsset.status !== "READY") {
    throw new Error("Video is still processing");
  }

  const coverAsset = draft.assets.find((asset) => asset.type === "COVER" && asset.status === "READY" && asset.url);
  const videoAttachments = draft.assets
    .filter(
      (asset) =>
        asset.type === "ATTACHMENT"
        && asset.status === "READY"
        && asset.url
        && asset.fileName
        && Number.isFinite(asset.fileSize)
        && asset.mimeType,
    )
    .map((asset) => ({
      url: asset.url as string,
      fileName: asset.fileName as string,
      fileSize: asset.fileSize as number,
      mimeType: asset.mimeType as string,
    }));

  return {
    videoAssetId: videoAsset.videoAssetId,
    videoCoverUrl: coverAsset?.url ?? null,
    attachments: videoAttachments,
  };
}

export async function buildPublishPayload(authorId: string, draftId: string): Promise<DraftPublishPayload> {
  const draft = await prisma.postDraft.findFirst({
    where: {
      id: draftId,
      authorId,
    },
    ...draftArgs,
  });

  if (!draft) {
    throw new Error("Draft not found");
  }

  if (draft.publishedPostId) {
    throw new Error("Draft already published");
  }

  const status = resolveDraftStatus(draft);
  if (status !== "READY") {
    throw new Error("Draft is not ready to publish");
  }

  const normalizedTitle = normalizeTitle(draft.title);
  const normalizedContent = normalizeContent(draft.content);
  const normalizedStyleConfig = normalizePostStyleConfig(draft.styleConfig);
  const normalizedStyleCss = normalizePostStyleCss(draft.styleCss);

  if (draft.postType === "TEXT") {
    const textAssets = pickReadyTextAssets(draft);
    if (!normalizedContent.trim() && textAssets.imageUrls.length === 0 && textAssets.attachments.length === 0) {
      throw new Error("Content, images, or attachments are required");
    }

    return {
      title: normalizedTitle,
      content: normalizedContent,
      styleConfig: normalizedStyleConfig,
      styleCss: normalizedStyleCss,
      visibility: draft.visibility as PostVisibility,
      topicId: draft.topicId,
      postType: "TEXT",
      imageUrls: textAssets.imageUrls,
      attachments: textAssets.attachments,
      videoAssetId: null,
      videoCoverUrl: null,
    };
  }

  const videoPayload = pickVideoPayload(draft);
  return {
    title: normalizedTitle,
    content: normalizedContent,
    styleConfig: normalizedStyleConfig,
    styleCss: normalizedStyleCss,
    visibility: draft.visibility as PostVisibility,
    topicId: draft.topicId,
    postType: "VIDEO",
    imageUrls: [],
    attachments: videoPayload.attachments,
    videoAssetId: videoPayload.videoAssetId,
    videoCoverUrl: videoPayload.videoCoverUrl,
  };
}

export async function markDraftPublished(authorId: string, draftId: string, postId: string) {
  const updated = await prisma.postDraft.updateMany({
    where: {
      id: draftId,
      authorId,
      publishedPostId: null,
    },
    data: {
      status: "PUBLISHED",
      publishedPostId: postId,
      persistMode: "SAVED",
      lastError: null,
    },
  });

  return updated.count > 0;
}
