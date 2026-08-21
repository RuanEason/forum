import { createHash } from "crypto";
import {
  cos,
  deleteFromCOS,
} from "@/lib/cos";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import {
  MediaCleanupReason,
  MediaCleanupResourceType,
  MediaCleanupStatus,
  Prisma,
  SecurityEventType,
} from "@/generated";
import { recordSecurityEvent } from "@/lib/account-security";
import { deleteAllCustomEmojisForUser } from "@/lib/custom-emoji";

export const MEDIA_CLEANUP_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MEDIA_CLEANUP_DEFAULT_BATCH_SIZE = 50;
export const MEDIA_CLEANUP_DEFAULT_MAX_RETRIES = 5;
export const MEDIA_CLEANUP_STALE_UPLOAD_MS = 24 * 60 * 60 * 1000;
export const MEDIA_CLEANUP_STALE_DRAFT_MS = 30 * 24 * 60 * 60 * 1000;

type CleanupDb = typeof prisma | Prisma.TransactionClient;

export type VideoMediaSnapshot = {
  rawObjectKey: string;
  hlsMasterObjectKey: string | null;
  coverObjectKey: string | null;
};

type PostMediaSnapshot = {
  id: string;
  authorId: string;
  deletedAt: Date | null;
  deleteScheduledAt: Date | null;
  deletionReason: "POST_REQUEST" | "ACCOUNT_REQUEST" | null;
  images: Array<{ url: string }>;
  attachments: Array<{ url: string }>;
  video: VideoMediaSnapshot | null;
};

export type MediaCleanupTaskInput = {
  objectKey: string;
  resourceType: MediaCleanupResourceType;
  reason: MediaCleanupReason;
  ownerId?: string | null;
  postId?: string | null;
  executeAfter?: Date;
  maxRetries?: number;
};

export type MediaCleanupTaskSummary = {
  id: string;
  objectKey: string;
  resourceType: MediaCleanupResourceType;
  reason: MediaCleanupReason;
  status: MediaCleanupStatus;
};

type AccountSecurityContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type MediaCleanupRunResult = {
  featureEnabled: boolean;
  dryRun: boolean;
  queuedExpiredMedia: number;
  recoveredLocks: number;
  requeuedFailed: number;
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
  hardDeletedPosts: number;
  hardDeletedAccounts: number;
  dueTasks: number;
};

function normalizePrefix(raw: string): string {
  const normalized = raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized ? `${normalized}/` : "";
}

function isBackgroundObjectKey(objectKey: string): boolean {
  const prefix = normalizePrefix(
    process.env.TENCENT_BACKGROUND_VIDEO_RAW_PREFIX || "backgrounds/",
  );
  return Boolean(prefix) && objectKey.startsWith(prefix);
}

function clampPositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(max, Math.trunc(value as number)));
}

function truncateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 4000);
}

/**
 * Convert a stored CDN URL or a raw COS key to a safe object key.
 * External URLs and local upload routes are intentionally ignored.
 */
export function extractCOSObjectKey(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  let candidate = value.trim();
  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    try {
      const parsed = new URL(candidate);
      const configuredCdn = process.env.NEXT_PUBLIC_CDN_DOMAIN;
      if (configuredCdn) {
        const cdnHost = new URL(configuredCdn).host;
        if (parsed.host !== cdnHost) {
          return null;
        }
      }
      candidate = parsed.pathname;
    } catch {
      return null;
    }
  }

  candidate = candidate.split("?")[0].split("#")[0];
  candidate = candidate.replace(/^\/+/, "");

  const bucket = process.env.TENCENT_COS_BUCKET;
  if (bucket && candidate.startsWith(`${bucket}/`)) {
    candidate = candidate.slice(bucket.length + 1);
  }

  if (!candidate || candidate.startsWith("api/uploads/")) {
    return null;
  }

  try {
    return decodeURIComponent(candidate);
  } catch {
    return candidate;
  }
}

export function createMediaCleanupDedupeKey(
  resourceType: MediaCleanupResourceType,
  objectKey: string,
): string {
  return createHash("sha256")
    .update(`${resourceType}:${objectKey}`)
    .digest("hex");
}

export async function enqueueMediaCleanupTask(
  input: MediaCleanupTaskInput,
  db: CleanupDb = prisma,
): Promise<MediaCleanupTaskSummary | null> {
  const objectKey = extractCOSObjectKey(input.objectKey);
  if (!objectKey) {
    return null;
  }

  const dedupeKey = createMediaCleanupDedupeKey(input.resourceType, objectKey);
  const executeAfter = input.executeAfter ?? new Date();
  const maxRetries = clampPositiveInt(
    input.maxRetries,
    MEDIA_CLEANUP_DEFAULT_MAX_RETRIES,
    20,
  );
  const existing = await db.mediaCleanupTask.findUnique({
    where: { dedupeKey },
    select: { id: true, status: true, executeAfter: true },
  });

  if (existing?.status === MediaCleanupStatus.SUCCEEDED) {
    return db.mediaCleanupTask.findUniqueOrThrow({
      where: { dedupeKey },
      select: {
        id: true,
        objectKey: true,
        resourceType: true,
        reason: true,
        status: true,
      },
    });
  }

  const data = {
    objectKey,
    resourceType: input.resourceType,
    reason: input.reason,
    ownerId: input.ownerId ?? undefined,
    postId: input.postId ?? undefined,
    executeAfter: existing && existing.status !== MediaCleanupStatus.CANCELLED
      && existing.executeAfter < executeAfter
      ? existing.executeAfter
      : executeAfter,
    maxRetries,
  };

  if (existing) {
    return db.mediaCleanupTask.update({
      where: { dedupeKey },
        data: existing.status === MediaCleanupStatus.CANCELLED
        ? {
            ...data,
            status: MediaCleanupStatus.PENDING,
            retryCount: 0,
            lastError: null,
            lockedAt: null,
            completedAt: null,
          }
        : {
            ...data,
            status: existing.status === MediaCleanupStatus.FAILED
              ? MediaCleanupStatus.RETRYING
              : undefined,
            retryCount: existing.status === MediaCleanupStatus.FAILED ? 0 : undefined,
          },
      select: {
        id: true,
        objectKey: true,
        resourceType: true,
        reason: true,
        status: true,
      },
    });
  }

  return db.mediaCleanupTask.create({
    data: {
      dedupeKey,
      ...data,
    },
    select: {
      id: true,
      objectKey: true,
      resourceType: true,
      reason: true,
      status: true,
    },
  });
}

export async function enqueueMediaCleanupTaskFromUrl(
  input: Omit<MediaCleanupTaskInput, "objectKey"> & { value: string | null | undefined },
  db: CleanupDb = prisma,
) {
  const objectKey = extractCOSObjectKey(input.value);
  if (!objectKey) {
    return null;
  }

  return enqueueMediaCleanupTask(
    {
      ...input,
      objectKey,
    },
    db,
  );
}

async function enqueueVideoMedia(
  video: VideoMediaSnapshot,
  options: {
    ownerId?: string | null;
    postId?: string | null;
    reason: MediaCleanupReason;
    executeAfter: Date;
  },
  db: CleanupDb,
) {
  const entries: Array<MediaCleanupTaskInput> = [];
  if (video.rawObjectKey) {
    entries.push({
      objectKey: video.rawObjectKey,
      resourceType: isBackgroundObjectKey(video.rawObjectKey)
        ? MediaCleanupResourceType.BACKGROUND_VIDEO_RAW
        : MediaCleanupResourceType.VIDEO_RAW,
      ...options,
    });
  }
  if (video.hlsMasterObjectKey) {
    entries.push({
      objectKey: video.hlsMasterObjectKey,
      resourceType: MediaCleanupResourceType.VIDEO_HLS,
      ...options,
    });
  }
  if (video.coverObjectKey) {
    entries.push({
      objectKey: video.coverObjectKey,
      resourceType: isBackgroundObjectKey(video.rawObjectKey)
        ? MediaCleanupResourceType.BACKGROUND_VIDEO_COVER
        : MediaCleanupResourceType.VIDEO_COVER,
      ...options,
    });
  }

  for (const entry of entries) {
    await enqueueMediaCleanupTask(entry, db);
  }
  return entries.length;
}

export async function enqueueVideoAssetCleanup(
  video: VideoMediaSnapshot,
  options: {
    ownerId?: string | null;
    postId?: string | null;
    reason: MediaCleanupReason;
    executeAfter: Date;
  },
  db: CleanupDb = prisma,
) {
  return enqueueVideoMedia(video, options, db);
}

async function enqueuePostMedia(
  post: PostMediaSnapshot,
  options: {
    reason: MediaCleanupReason;
    executeAfter: Date;
  },
  db: CleanupDb,
) {
  let queued = 0;

  for (const image of post.images) {
    const task = await enqueueMediaCleanupTaskFromUrl(
      {
        value: image.url,
        resourceType: MediaCleanupResourceType.POST_IMAGE,
        ownerId: post.authorId,
        postId: post.id,
        ...options,
      },
      db,
    );
    if (task) queued += 1;
  }

  for (const attachment of post.attachments) {
    const task = await enqueueMediaCleanupTaskFromUrl(
      {
        value: attachment.url,
        resourceType: MediaCleanupResourceType.POST_ATTACHMENT,
        ownerId: post.authorId,
        postId: post.id,
        ...options,
      },
      db,
    );
    if (task) queued += 1;
  }

  if (post.video) {
    queued += await enqueueVideoMedia(
      post.video,
      {
        ownerId: post.authorId,
        postId: post.id,
        ...options,
      },
      db,
    );
  }

  return queued;
}

function getPostMediaSelect() {
  return {
    id: true,
    authorId: true,
    deletedAt: true,
    deleteScheduledAt: true,
    deletionReason: true,
    images: { select: { url: true } },
    attachments: { select: { url: true } },
    video: {
      select: {
        rawObjectKey: true,
        hlsMasterObjectKey: true,
        coverObjectKey: true,
      },
    },
  } as const;
}

export async function requestPostDeletion(
  postId: string,
  options?: { now?: Date; ownerId?: string },
) {
  const now = options?.now ?? new Date();
  const scheduledAt = new Date(now.getTime() + MEDIA_CLEANUP_WINDOW_MS);

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { id: postId },
      select: getPostMediaSelect(),
    });

    if (!post) {
      return null;
    }

    if (post.deletedAt) {
      return {
        alreadyDeleted: true,
        postId: post.id,
        scheduledAt: post.deleteScheduledAt,
      };
    }

    await enqueuePostMedia(
      post,
      {
        reason: MediaCleanupReason.POST_DELETE,
        executeAfter: scheduledAt,
      },
      tx,
    );

    await tx.post.update({
      where: { id: postId },
      data: {
        deletedAt: now,
        deleteScheduledAt: scheduledAt,
        deletionReason: "POST_REQUEST",
        pinned: false,
        isAnnouncement: false,
        announcementAt: null,
      },
    });

    return {
      alreadyDeleted: false,
      postId: post.id,
      scheduledAt,
      ownerId: options?.ownerId ?? post.authorId,
    };
  });
}

export async function restorePost(postId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true, deleteScheduledAt: true },
    });

    if (!post || !post.deletedAt) {
      return { restored: false, reason: "not_deleted" as const };
    }
    if (!post.deleteScheduledAt || post.deleteScheduledAt <= now) {
      return { restored: false, reason: "window_expired" as const };
    }

    await tx.post.update({
      where: { id: postId },
      data: {
        deletedAt: null,
        deleteScheduledAt: null,
        deletionReason: null,
      },
    });
    await tx.mediaCleanupTask.updateMany({
      where: {
        postId,
        status: {
          in: [
            MediaCleanupStatus.PENDING,
            MediaCleanupStatus.RETRYING,
            MediaCleanupStatus.PROCESSING,
          ],
        },
      },
      data: {
        status: MediaCleanupStatus.CANCELLED,
        lockedAt: null,
      },
    });

    return { restored: true, reason: "restored" as const };
  });
}

export async function requestAccountDeletion(
  userId: string,
  now = new Date(),
  securityContext?: AccountSecurityContext,
) {
  const scheduledAt = new Date(now.getTime() + MEDIA_CLEANUP_WINDOW_MS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatar: true,
        coverImage: true,
        deletionRequestedAt: true,
        deletionScheduledAt: true,
        posts: { select: getPostMediaSelect() },
        videoAssets: {
          select: {
            rawObjectKey: true,
            hlsMasterObjectKey: true,
            coverObjectKey: true,
          },
        },
        drafts: {
          select: {
            assets: {
              select: {
                objectKey: true,
                url: true,
                type: true,
                videoAsset: {
                  select: {
                    rawObjectKey: true,
                    hlsMasterObjectKey: true,
                    coverObjectKey: true,
                  },
                },
              },
            },
          },
        },
        editorImageAssets: {
          select: { objectKey: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    if (user.deletionRequestedAt && user.deletionScheduledAt) {
      return {
        alreadyRequested: true,
        scheduledAt: user.deletionScheduledAt,
      };
    }

    await enqueueMediaCleanupTaskFromUrl(
      {
        value: user.avatar,
        resourceType: MediaCleanupResourceType.USER_AVATAR,
        ownerId: user.id,
        reason: MediaCleanupReason.ACCOUNT_DELETE,
        executeAfter: scheduledAt,
      },
      tx,
    );
    await enqueueMediaCleanupTaskFromUrl(
      {
        value: user.coverImage,
        resourceType: MediaCleanupResourceType.USER_COVER,
        ownerId: user.id,
        reason: MediaCleanupReason.ACCOUNT_DELETE,
        executeAfter: scheduledAt,
      },
      tx,
    );

    for (const post of user.posts) {
      await enqueuePostMedia(
        post,
        {
          reason: MediaCleanupReason.ACCOUNT_DELETE,
          executeAfter: scheduledAt,
        },
        tx,
      );

      if (!post.deletedAt) {
        await tx.post.update({
          where: { id: post.id },
          data: {
            deletedAt: now,
            deleteScheduledAt: scheduledAt,
            deletionReason: "ACCOUNT_REQUEST",
            pinned: false,
            isAnnouncement: false,
            announcementAt: null,
          },
        });
      }
    }

    for (const video of user.videoAssets) {
      await enqueueVideoMedia(
        video,
        {
          ownerId: user.id,
          reason: MediaCleanupReason.ACCOUNT_DELETE,
          executeAfter: scheduledAt,
        },
        tx,
      );
    }

    for (const draft of user.drafts) {
      for (const asset of draft.assets) {
        await enqueueMediaCleanupTaskFromUrl(
          {
            value: asset.objectKey || asset.url,
            resourceType: MediaCleanupResourceType.DRAFT_ASSET,
            ownerId: user.id,
            reason: MediaCleanupReason.ACCOUNT_DELETE,
            executeAfter: scheduledAt,
          },
          tx,
        );
        if (asset.videoAsset) {
          await enqueueVideoMedia(
            asset.videoAsset,
            {
              ownerId: user.id,
              reason: MediaCleanupReason.ACCOUNT_DELETE,
              executeAfter: scheduledAt,
            },
            tx,
          );
        }
      }
    }

    for (const asset of user.editorImageAssets) {
      await enqueueMediaCleanupTask({
        objectKey: asset.objectKey,
        resourceType: MediaCleanupResourceType.EDITOR_IMAGE,
        ownerId: user.id,
        reason: MediaCleanupReason.ACCOUNT_DELETE,
        executeAfter: scheduledAt,
      }, tx);
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        deletionRequestedAt: now,
        deletionScheduledAt: scheduledAt,
        sessionVersion: { increment: 1 },
      },
    });

    await recordSecurityEvent(
      {
        userId: user.id,
        type: SecurityEventType.ACCOUNT_DELETION_REQUESTED,
        ipAddress: securityContext?.ipAddress,
        userAgent: securityContext?.userAgent,
        metadata: { scheduledAt: scheduledAt.toISOString() },
      },
      tx,
    );

    return {
      alreadyRequested: false,
      scheduledAt,
    };
  });
}

export async function cancelAccountDeletion(
  userId: string,
  now = new Date(),
  securityContext?: AccountSecurityContext,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deletionRequestedAt: true,
        deletionScheduledAt: true,
      },
    });

    if (!user?.deletionRequestedAt || !user.deletionScheduledAt) {
      return { cancelled: false, reason: "not_pending" as const };
    }
    if (user.deletionScheduledAt <= now) {
      return { cancelled: false, reason: "window_expired" as const };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: null,
        deletionScheduledAt: null,
      },
    });
    await tx.post.updateMany({
      where: {
        authorId: userId,
        deletionReason: "ACCOUNT_REQUEST",
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
        deleteScheduledAt: null,
        deletionReason: null,
      },
    });
    await tx.mediaCleanupTask.updateMany({
      where: {
        ownerId: userId,
        reason: MediaCleanupReason.ACCOUNT_DELETE,
        status: {
          in: [
            MediaCleanupStatus.PENDING,
            MediaCleanupStatus.RETRYING,
            MediaCleanupStatus.PROCESSING,
          ],
        },
      },
      data: {
        status: MediaCleanupStatus.CANCELLED,
        lockedAt: null,
      },
    });

    await recordSecurityEvent(
      {
        userId,
        type: SecurityEventType.ACCOUNT_DELETION_CANCELLED,
        ipAddress: securityContext?.ipAddress,
        userAgent: securityContext?.userAgent,
      },
      tx,
    );

    return { cancelled: true, reason: "cancelled" as const };
  });
}

async function recoverStaleLocks(now: Date): Promise<number> {
  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
  const result = await prisma.mediaCleanupTask.updateMany({
    where: {
      status: MediaCleanupStatus.PROCESSING,
      lockedAt: { lt: staleBefore },
    },
    data: {
      status: MediaCleanupStatus.RETRYING,
      executeAfter: now,
      lockedAt: null,
    },
  });
  return result.count;
}

async function scheduleExpiredDraftAssets(now: Date): Promise<number> {
  const staleBefore = new Date(now.getTime() - MEDIA_CLEANUP_STALE_DRAFT_MS);
  const assets = await prisma.draftAsset.findMany({
    where: {
      draft: {
        publishedPostId: null,
        updatedAt: { lt: staleBefore },
      },
      status: { not: "UPLOADING" },
    },
    select: {
      id: true,
      objectKey: true,
      url: true,
      type: true,
      videoAssetId: true,
      draft: { select: { authorId: true } },
      videoAsset: {
        select: {
          rawObjectKey: true,
          hlsMasterObjectKey: true,
          coverObjectKey: true,
        },
      },
    },
    take: 500,
  });

  let scheduled = 0;
  for (const asset of assets) {
    const changed = await prisma.$transaction(async (tx) => {
      const removed = await tx.draftAsset.deleteMany({
        where: { id: asset.id },
      });
      if (removed.count === 0) {
        return false;
      }

      await enqueueMediaCleanupTaskFromUrl(
        {
          value: asset.objectKey || asset.url,
          resourceType: MediaCleanupResourceType.DRAFT_ASSET,
          ownerId: asset.draft.authorId,
          reason: MediaCleanupReason.UPLOAD_EXPIRED,
          executeAfter: now,
        },
        tx,
      );
      if (asset.videoAsset) {
        await enqueueVideoMedia(
          asset.videoAsset,
          {
            ownerId: asset.draft.authorId,
            reason: MediaCleanupReason.UPLOAD_EXPIRED,
            executeAfter: now,
          },
          tx,
        );
      }
      return true;
    });
    if (changed) scheduled += 1;
  }

  return scheduled;
}

async function scheduleStaleUploads(now: Date): Promise<number> {
  const staleBefore = new Date(now.getTime() - MEDIA_CLEANUP_STALE_UPLOAD_MS);
  const assets = await prisma.draftAsset.findMany({
    where: {
      status: "UPLOADING",
      updatedAt: { lt: staleBefore },
    },
    select: {
      id: true,
      objectKey: true,
      url: true,
      type: true,
      videoAsset: {
        select: {
          id: true,
          rawObjectKey: true,
          hlsMasterObjectKey: true,
          coverObjectKey: true,
        },
      },
      draft: { select: { authorId: true } },
    },
    take: 500,
  });

  let scheduled = 0;
  for (const asset of assets) {
    const changed = await prisma.$transaction(async (tx) => {
      const removed = await tx.draftAsset.deleteMany({
        where: { id: asset.id, status: "UPLOADING" },
      });
      if (removed.count === 0) {
        return false;
      }

      await enqueueMediaCleanupTaskFromUrl(
        {
          value: asset.objectKey || asset.url,
          resourceType: MediaCleanupResourceType.DRAFT_ASSET,
          ownerId: asset.draft.authorId,
          reason: MediaCleanupReason.UPLOAD_EXPIRED,
          executeAfter: now,
        },
        tx,
      );
      if (asset.videoAsset) {
        await enqueueVideoMedia(
          asset.videoAsset,
          {
            ownerId: asset.draft.authorId,
            reason: MediaCleanupReason.UPLOAD_EXPIRED,
            executeAfter: now,
          },
          tx,
        );
        await tx.videoAsset.updateMany({
          where: { id: asset.videoAsset.id, status: { in: ["INIT", "UPLOADING", "PROCESSING"] } },
          data: { status: "DELETED" },
        });
      }
      return true;
    });
    if (changed) scheduled += 1;
  }

  const staleVideos = await prisma.videoAsset.findMany({
    where: {
      status: { in: ["INIT", "UPLOADING", "PROCESSING", "FAILED"] },
      updatedAt: { lt: staleBefore },
      post: null,
    },
    select: {
      id: true,
      ownerId: true,
      rawObjectKey: true,
      hlsMasterObjectKey: true,
      coverObjectKey: true,
      status: true,
    },
    take: 500,
  });

  for (const video of staleVideos) {
    await prisma.$transaction(async (tx) => {
      await enqueueVideoMedia(
        video,
        {
          ownerId: video.ownerId,
          reason: MediaCleanupReason.UPLOAD_EXPIRED,
          executeAfter: now,
        },
        tx,
      );
      await tx.videoAsset.updateMany({
        where: { id: video.id, status: { in: ["INIT", "UPLOADING", "PROCESSING", "FAILED"] } },
        data: { status: "DELETED" },
      });
    });
    scheduled += 1;
  }

  return scheduled;
}

async function finalizeDuePosts(now: Date, batchSize: number): Promise<number> {
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: { not: null, lte: now },
      deleteScheduledAt: { lte: now },
    },
    select: { id: true },
    take: batchSize,
  });

  let deleted = 0;
  for (const post of posts) {
    const result = await prisma.post.deleteMany({
      where: {
        id: post.id,
        deletedAt: { not: null },
        deleteScheduledAt: { lte: now },
      },
    });
    deleted += result.count;
  }
  return deleted;
}

async function finalizeDueAccounts(now: Date, batchSize: number): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      deletionRequestedAt: { not: null },
      deletionScheduledAt: { lte: now },
    },
    select: { id: true },
    take: batchSize,
  });

  let deleted = 0;
  for (const user of users) {
    try {
      await deleteAllCustomEmojisForUser(user.id);
    } catch (error) {
      // Keep the account until the next cleanup run if its owned emoji cannot
      // be removed, so a transient COS failure does not leave an untracked
      // emoji prefix behind.
      console.error("Failed to delete account custom emojis", {
        userId: user.id,
        error,
      });
      continue;
    }

    const result = await prisma.user.deleteMany({
      where: {
        id: user.id,
        deletionRequestedAt: { not: null },
        deletionScheduledAt: { lte: now },
      },
    });
    deleted += result.count;
  }
  return deleted;
}

async function processTask(task: {
  id: string;
  objectKey: string;
  resourceType: MediaCleanupResourceType;
  retryCount: number;
  maxRetries: number;
}) {
  const claimed = await prisma.mediaCleanupTask.updateMany({
    where: {
      id: task.id,
      status: { in: [MediaCleanupStatus.PENDING, MediaCleanupStatus.RETRYING] },
    },
    data: {
      status: MediaCleanupStatus.PROCESSING,
      lockedAt: new Date(),
    },
  });
  if (claimed.count === 0) {
    return "skipped" as const;
  }

  try {
    if (
      task.resourceType === MediaCleanupResourceType.DRAFT_ASSET
      || task.resourceType === MediaCleanupResourceType.POST_ATTACHMENT
    ) {
      try {
        const { abortAttachmentMultipartUploads } = await import("@/lib/attachment");
        await abortAttachmentMultipartUploads(task.objectKey);
      } catch (error) {
        console.warn("Failed to abort stale multipart upload before media cleanup", {
          objectKey: task.objectKey,
          error,
        });
      }
    }

    await deleteFromCOS(task.objectKey);
    await prisma.mediaCleanupTask.update({
      where: { id: task.id },
      data: {
        status: MediaCleanupStatus.SUCCEEDED,
        lockedAt: null,
        completedAt: new Date(),
        lastError: null,
      },
    });
    return "succeeded" as const;
  } catch (error) {
    const nextRetryCount = task.retryCount + 1;
    const exhausted = nextRetryCount >= task.maxRetries;
    await prisma.mediaCleanupTask.update({
      where: { id: task.id },
      data: {
        status: exhausted ? MediaCleanupStatus.FAILED : MediaCleanupStatus.RETRYING,
        retryCount: nextRetryCount,
        executeAfter: new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** nextRetryCount * 1000)),
        lockedAt: null,
        lastError: truncateError(error),
      },
    });
    return exhausted ? "failed" as const : "retried" as const;
  }
}

export async function runMediaCleanup(options?: {
  batchSize?: number;
  dryRun?: boolean;
  retryFailed?: boolean;
  now?: Date;
}): Promise<MediaCleanupRunResult> {
  const now = options?.now ?? new Date();
  const dryRun = options?.dryRun === true;
  const batchSize = clampPositiveInt(
    options?.batchSize,
    MEDIA_CLEANUP_DEFAULT_BATCH_SIZE,
    500,
  );
  const featureEnabled = isFeatureEnabled("mediaCleanup");

  const baseResult: MediaCleanupRunResult = {
    featureEnabled,
    dryRun,
    queuedExpiredMedia: 0,
    recoveredLocks: 0,
    requeuedFailed: 0,
    processed: 0,
    succeeded: 0,
    retried: 0,
    failed: 0,
    hardDeletedPosts: 0,
    hardDeletedAccounts: 0,
    dueTasks: 0,
  };

  if (!featureEnabled && !dryRun) {
    return baseResult;
  }

  if (!dryRun) {
    baseResult.recoveredLocks = await recoverStaleLocks(now);
    baseResult.queuedExpiredMedia = await scheduleStaleUploads(now);
    baseResult.queuedExpiredMedia += await scheduleExpiredDraftAssets(now);
    if (options?.retryFailed) {
      const requeued = await prisma.mediaCleanupTask.updateMany({
        where: {
          status: MediaCleanupStatus.FAILED,
          retryCount: { lt: 20 },
        },
        data: {
          status: MediaCleanupStatus.RETRYING,
          executeAfter: now,
          lockedAt: null,
        },
      });
      baseResult.requeuedFailed = requeued.count;
    }
  }

  const dueWhere: Prisma.MediaCleanupTaskWhereInput = {
    status: { in: [MediaCleanupStatus.PENDING, MediaCleanupStatus.RETRYING] },
    executeAfter: { lte: now },
  };
  const dueTasks = await prisma.mediaCleanupTask.findMany({
    where: dueWhere,
    orderBy: [{ executeAfter: "asc" }, { createdAt: "asc" }],
    take: batchSize,
    select: {
      id: true,
      objectKey: true,
      resourceType: true,
      retryCount: true,
      maxRetries: true,
    },
  });
  baseResult.dueTasks = dueTasks.length;

  if (dryRun) {
    return baseResult;
  }

  for (const task of dueTasks) {
    const result = await processTask(task);
    if (result === "skipped") continue;
    baseResult.processed += 1;
    if (result === "succeeded") baseResult.succeeded += 1;
    if (result === "retried") baseResult.retried += 1;
    if (result === "failed") baseResult.failed += 1;
  }

  baseResult.hardDeletedPosts = await finalizeDuePosts(now, batchSize);
  baseResult.hardDeletedAccounts = await finalizeDueAccounts(now, batchSize);
  return baseResult;
}

export async function getMediaCleanupStats() {
  const [pending, processing, retrying, failed, succeeded, latestFailure] = await Promise.all([
    prisma.mediaCleanupTask.count({ where: { status: MediaCleanupStatus.PENDING } }),
    prisma.mediaCleanupTask.count({ where: { status: MediaCleanupStatus.PROCESSING } }),
    prisma.mediaCleanupTask.count({ where: { status: MediaCleanupStatus.RETRYING } }),
    prisma.mediaCleanupTask.count({ where: { status: MediaCleanupStatus.FAILED } }),
    prisma.mediaCleanupTask.count({ where: { status: MediaCleanupStatus.SUCCEEDED } }),
    prisma.mediaCleanupTask.findFirst({
      where: { status: MediaCleanupStatus.FAILED },
      orderBy: { updatedAt: "desc" },
      select: { objectKey: true, resourceType: true, lastError: true, updatedAt: true },
    }),
  ]);

  return {
    pending,
    processing,
    retrying,
    failed,
    succeeded,
    latestFailure,
  };
}

type COSListResult = {
  Contents?: Array<{ Key?: string }>;
  IsTruncated?: string;
  NextMarker?: string;
};

async function listCOSKeys(prefix: string): Promise<string[]> {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  if (!bucket || !region) {
    throw new Error("Missing COS bucket configuration for orphan audit");
  }

  const keys: string[] = [];
  let marker: string | undefined;
  do {
    const result = await cos.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: prefix,
      MaxKeys: 1000,
      ...(marker ? { Marker: marker } : {}),
    }) as COSListResult;
    for (const item of result.Contents || []) {
      if (item.Key) keys.push(item.Key);
    }
    marker = result.IsTruncated === "true" ? result.NextMarker : undefined;
  } while (marker);
  return keys;
}

export function getCOSOrphanAuditPrefixes(): string[] {
  const configured = process.env.COS_ORPHAN_AUDIT_PREFIXES;
  if (configured) {
    return configured
      .split(",")
      .map((value) => normalizePrefix(value))
      .filter(Boolean);
  }
  return ["images/", "attachments/", "videos/", "backgrounds/", "editor-pool/", "emoji/"];
}

export async function auditCOSOrphans(options?: { limit?: number }) {
  const limit = clampPositiveInt(options?.limit, 200, 2000);
  const [users, images, attachments, videos, drafts, editorAssets, cleanupTasks] = await Promise.all([
    prisma.user.findMany({ select: { avatar: true, coverImage: true } }),
    prisma.postImage.findMany({ select: { url: true } }),
    prisma.postAttachment.findMany({ select: { url: true } }),
    prisma.videoAsset.findMany({
      where: { status: { not: "DELETED" } },
      select: { rawObjectKey: true, hlsMasterObjectKey: true, coverObjectKey: true },
    }),
    prisma.draftAsset.findMany({ select: { objectKey: true, url: true } }),
    prisma.editorImageAsset.findMany({ select: { objectKey: true } }),
    prisma.mediaCleanupTask.findMany({
      where: { status: { notIn: [MediaCleanupStatus.SUCCEEDED, MediaCleanupStatus.CANCELLED] } },
      select: { objectKey: true },
    }),
  ]);

  const referenced = new Set<string>();
  const add = (value: string | null | undefined) => {
    const key = extractCOSObjectKey(value);
    if (key) referenced.add(key);
  };

  for (const user of users) {
    add(user.avatar);
    add(user.coverImage);
  }
  for (const image of images) add(image.url);
  for (const attachment of attachments) add(attachment.url);
  for (const video of videos) {
    add(video.rawObjectKey);
    add(video.hlsMasterObjectKey);
    add(video.coverObjectKey);
  }
  for (const draft of drafts) {
    add(draft.objectKey);
    add(draft.url);
  }
  for (const asset of editorAssets) add(asset.objectKey);
  for (const task of cleanupTasks) add(task.objectKey);

  const prefixes = getCOSOrphanAuditPrefixes();
  const allKeys: string[] = [];
  for (const prefix of prefixes) {
    allKeys.push(...await listCOSKeys(prefix));
  }

  // Custom emojis are catalogued directly from COS rather than referenced by a
  // database row, so valid objects in the emoji prefix are not orphan media.
  for (const key of allKeys) {
    if (key.startsWith("emoji/")) {
      referenced.add(key);
    }
  }

  const orphanKeys = allKeys.filter((key) => !referenced.has(key)).slice(0, limit);
  return {
    mode: "report-only" as const,
    prefixes,
    scannedObjects: allKeys.length,
    referencedObjects: referenced.size,
    orphanCount: orphanKeys.length,
    orphanKeys,
  };
}
