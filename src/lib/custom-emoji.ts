import path from "node:path";
import { randomUUID } from "node:crypto";
import { cos, deleteFromCOS, getCOSPublicUrl, uploadToCOS } from "@/lib/cos";
import { prisma } from "@/lib/prisma";
import type { CustomEmoji } from "@/types/emoji";

export const CUSTOM_EMOJI_PREFIX = "emoji/";
export const CUSTOM_EMOJI_PAGE_SIZE = 40;

const ALLOWED_EMOJI_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type COSListResult = {
  Contents?: Array<{
    Key?: string;
    Size?: string;
    LastModified?: string;
  }>;
  IsTruncated?: string | boolean;
  NextMarker?: string;
};

export interface CustomEmojiPage {
  emojis: CustomEmoji[];
  nextCursor: string | null;
}

function getCOSConfig() {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;

  if (!bucket || !region || !process.env.NEXT_PUBLIC_CDN_DOMAIN) {
    throw new Error("Missing COS configuration for custom emojis");
  }

  return { bucket, region };
}

export function getCustomEmojiPrefix(userId: string): string {
  return `${CUSTOM_EMOJI_PREFIX}${userId}/`;
}

function getExtension(key: string): string {
  return path.posix.extname(key).slice(1).toLowerCase();
}

export function isCustomEmojiObjectKey(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const key = value.trim();
  if (!key.startsWith(CUSTOM_EMOJI_PREFIX) || key.length <= CUSTOM_EMOJI_PREFIX.length) {
    return false;
  }

  if (key.includes("..") || key.startsWith("/") || key.endsWith("/")) {
    return false;
  }

  return ALLOWED_EMOJI_EXTENSIONS.has(getExtension(key));
}

export function isCustomEmojiObjectKeyForUser(value: unknown, userId: string): value is string {
  return isCustomEmojiObjectKey(value) && value.startsWith(getCustomEmojiPrefix(userId));
}

function decodeFileName(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getCustomEmojiName(key: string): string {
  const fileName = path.posix.basename(key);
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const separatorIndex = withoutExtension.indexOf("__");
  const name = separatorIndex >= 0
    ? withoutExtension.slice(separatorIndex + 2)
    : withoutExtension;

  return decodeFileName(name).trim() || "emoji";
}

function toCustomEmoji(item: {
  Key: string;
  Size?: string;
  LastModified?: string;
}): CustomEmoji {
  return {
    key: item.Key,
    name: getCustomEmojiName(item.Key),
    url: getCOSPublicUrl(item.Key),
    ...(item.Size ? { size: Number(item.Size) || 0 } : {}),
    ...(item.LastModified ? { updatedAt: item.LastModified } : {}),
  };
}

export async function listCustomEmojis(
  userId: string,
  options?: { cursor?: string; pageSize?: number; includeHidden?: boolean },
): Promise<CustomEmojiPage> {
  const { bucket, region } = getCOSConfig();
  const prefix = getCustomEmojiPrefix(userId);
  const pageSize = Math.min(Math.max(options?.pageSize ?? CUSTOM_EMOJI_PAGE_SIZE, 1), 100);
  const cursor = options?.cursor?.trim();

  if (cursor && !isCustomEmojiObjectKeyForUser(cursor, userId)) {
    throw new Error("Invalid custom emoji cursor");
  }

  const result = await cos.getBucket({
    Bucket: bucket,
    Region: region,
    Prefix: prefix,
    MaxKeys: pageSize,
    ...(cursor ? { Marker: cursor } : {}),
  }) as COSListResult;

  const allEmojis = (result.Contents || [])
    .filter((item): item is { Key: string; Size?: string; LastModified?: string } => (
      typeof item.Key === "string" && isCustomEmojiObjectKeyForUser(item.Key, userId)
    ))
    .map(toCustomEmoji);
  const nextCursor = String(result.IsTruncated) === "true" && result.NextMarker
    ? result.NextMarker
    : null;

  if (options?.includeHidden || allEmojis.length === 0) {
    return { emojis: allEmojis, nextCursor };
  }

  const hiddenEmojis = await prisma.hiddenCustomEmoji.findMany({
    where: {
      userId,
      objectKey: { in: allEmojis.map((emoji) => emoji.key) },
    },
    select: { objectKey: true },
  });
  const hiddenKeys = new Set(hiddenEmojis.map((emoji) => emoji.objectKey));

  return {
    emojis: allEmojis.filter((emoji) => !hiddenKeys.has(emoji.key)),
    nextCursor,
  };
}

function sanitizeBaseName(fileName: string): string {
  const baseName = path.posix.basename(fileName || "emoji");
  const nameWithoutExtension = baseName.replace(/\.[^.]+$/, "");
  const sanitized = nameWithoutExtension
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 80);

  return sanitized || "emoji";
}

export function getCustomEmojiExtension(fileName: string, mimeType: string): string | null {
  const mimeExtension = MIME_TO_EXTENSION[mimeType.trim().toLowerCase()];
  if (mimeExtension) {
    return mimeExtension;
  }

  const fileExtension = getExtension(fileName);
  return ALLOWED_EMOJI_EXTENSIONS.has(fileExtension) ? fileExtension : null;
}

export async function uploadCustomEmoji(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
): Promise<CustomEmoji> {
  const extension = getCustomEmojiExtension(fileName, mimeType);
  if (!extension) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are supported");
  }

  const date = new Date();
  const objectKey = [
    getCustomEmojiPrefix(userId).replace(/\/$/, ""),
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    `${randomUUID()}__${sanitizeBaseName(fileName)}.${extension}`,
  ].join("/");
  const url = await uploadToCOS(buffer, objectKey);

  return {
    key: objectKey,
    name: getCustomEmojiName(objectKey),
    url,
    size: buffer.byteLength,
  };
}

export async function deleteCustomEmoji(objectKey: string, userId: string): Promise<void> {
  if (!isCustomEmojiObjectKeyForUser(objectKey, userId)) {
    throw new Error("Invalid custom emoji key");
  }

  await deleteFromCOS(objectKey);
}

export async function hideCustomEmoji(objectKey: string, userId: string): Promise<void> {
  if (!isCustomEmojiObjectKeyForUser(objectKey, userId)) {
    throw new Error("Invalid custom emoji key");
  }

  await prisma.hiddenCustomEmoji.upsert({
    where: {
      userId_objectKey: { userId, objectKey },
    },
    update: {},
    create: { userId, objectKey },
  });
}

export async function deleteAllCustomEmojisForUser(userId: string): Promise<number> {
  const objectKeys: string[] = [];
  let cursor: string | null = null;

  do {
    const page = await listCustomEmojis(userId, {
      ...(cursor ? { cursor } : {}),
      pageSize: 100,
      includeHidden: true,
    });
    objectKeys.push(...page.emojis.map((emoji) => emoji.key));
    cursor = page.nextCursor;
  } while (cursor);

  await Promise.all(objectKeys.map((objectKey) => deleteCustomEmoji(objectKey, userId)));
  return objectKeys.length;
}
