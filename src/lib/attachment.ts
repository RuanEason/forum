import { randomUUID } from "crypto";
import path from "path";
import COS from "cos-nodejs-sdk-v5";
import STS from "qcloud-cos-sts";
import { prisma } from "@/lib/prisma";

export const MAX_ATTACHMENT_COUNT = 5;
export const DEFAULT_ATTACHMENT_MAX_SIZE_BYTES = 1024 * 1024 * 1024;

const DEFAULT_ATTACHMENT_PREFIX = "attachments/";
const STALE_ATTACHMENT_UPLOAD_MS = 24 * 60 * 60 * 1000;

export const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar",
  ".app", ".deb", ".rpm", ".dmg", ".pkg", ".msi", ".sh", ".ps1",
]);

export const BLOCKED_ATTACHMENT_MIME_TYPES = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-sh",
  "application/x-bat",
]);

export type AttachmentTemporaryCredential = {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
};

export type AttachmentObjectMetadata = {
  contentLength: number;
  contentType: string;
  etag?: string;
};

type AttachmentConfig = {
  bucket: string;
  region: string;
  cdnBaseUrl: string;
  prefix: string;
  maxSizeBytes: number;
  stsDurationSeconds: number;
  secretId: string;
  secretKey: string;
};

let cachedCosClient: COS | null = null;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function normalizePrefix(raw: string): string {
  const normalized = raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized ? `${normalized}/` : DEFAULT_ATTACHMENT_PREFIX;
}

function sanitizeUserId(userId: string): string {
  return userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function sanitizeFileName(fileName: string): string {
  const baseName = path.basename(fileName || "attachment");
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");

  return sanitized.slice(0, 180) || "attachment";
}

function extractAppIdFromBucket(bucket: string): string {
  const index = bucket.lastIndexOf("-");
  if (index < 0 || index === bucket.length - 1) {
    throw new Error(`Invalid COS bucket format: ${bucket}`);
  }
  return bucket.slice(index + 1);
}

export function getAttachmentConfig(): AttachmentConfig {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  const secretId = process.env.TENCENT_SECRET_ID || process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY || process.env.TENCENT_COS_SECRET_KEY;

  if (!bucket || !region || !cdnBaseUrl || !secretId || !secretKey) {
    throw new Error(
      "Missing attachment COS config: TENCENT_COS_BUCKET, TENCENT_COS_REGION, NEXT_PUBLIC_CDN_DOMAIN, and Tencent secret keys are required",
    );
  }

  return {
    bucket,
    region,
    cdnBaseUrl: normalizeBaseUrl(cdnBaseUrl),
    prefix: normalizePrefix(process.env.TENCENT_ATTACHMENT_PREFIX || DEFAULT_ATTACHMENT_PREFIX),
    maxSizeBytes: parsePositiveInt(
      process.env.TENCENT_ATTACHMENT_MAX_SIZE_BYTES,
      DEFAULT_ATTACHMENT_MAX_SIZE_BYTES,
    ),
    stsDurationSeconds: parsePositiveInt(
      process.env.TENCENT_STS_DURATION_SECONDS,
      1800,
    ),
    secretId,
    secretKey,
  };
}

export function getAttachmentPublicConstraints() {
  const config = getAttachmentConfig();
  return {
    bucket: config.bucket,
    region: config.region,
    cdnBaseUrl: config.cdnBaseUrl,
    maxSizeBytes: config.maxSizeBytes,
    allowedCount: MAX_ATTACHMENT_COUNT,
  };
}

export function createAttachmentObjectKey(userId: string, fileName: string): string {
  const config = getAttachmentConfig();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${config.prefix}${sanitizeUserId(userId)}/${year}/${month}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function buildAttachmentCdnUrl(objectKey: string): string {
  const config = getAttachmentConfig();
  return `${config.cdnBaseUrl}/${objectKey.replace(/^\/+/, "")}`;
}

export function validateAttachmentMetadata(fileName: string, mimeType: string, fileSize: number): string | null {
  const extension = path.extname(fileName || "").toLowerCase();
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!extension) {
    return "Invalid file name: missing extension";
  }
  if (BLOCKED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return `File type ${extension} is not allowed`;
  }
  if (BLOCKED_ATTACHMENT_MIME_TYPES.has(normalizedMimeType)) {
    return `MIME type ${normalizedMimeType} is not allowed`;
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return "File size must be greater than zero";
  }

  const config = getAttachmentConfig();
  if (fileSize > config.maxSizeBytes) {
    return `File size exceeds maximum of ${config.maxSizeBytes / (1024 * 1024 * 1024)}GB`;
  }

  return null;
}

export async function issueAttachmentTemporaryCredential(userId: string): Promise<AttachmentTemporaryCredential> {
  const config = getAttachmentConfig();
  const appId = extractAppIdFromBucket(config.bucket);
  const userPrefix = `${config.prefix}${sanitizeUserId(userId)}/`;
  const policy = {
    version: "2.0",
    statement: [
      {
        action: [
          "name/cos:PostObject",
          "name/cos:PutObject",
          "name/cos:InitiateMultipartUpload",
          "name/cos:ListMultipartUploads",
          "name/cos:ListParts",
          "name/cos:UploadPart",
          "name/cos:CompleteMultipartUpload",
          "name/cos:AbortMultipartUpload",
        ],
        effect: "allow",
        resource: [
          `qcs::cos:${config.region}:uid/${appId}:${config.bucket}/${userPrefix}*`,
          `qcs::cos:${config.region}:uid/${appId}:${config.bucket}`,
        ],
      },
    ],
  };

  return new Promise((resolve, reject) => {
    STS.getCredential(
      {
        secretId: config.secretId,
        secretKey: config.secretKey,
        durationSeconds: config.stsDurationSeconds,
        policy,
      },
      (error, result) => {
        if (error || !result?.credentials) {
          reject(error || new Error("Failed to issue attachment temporary credential"));
          return;
        }

        resolve({
          tmpSecretId: result.credentials.tmpSecretId,
          tmpSecretKey: result.credentials.tmpSecretKey,
          sessionToken: result.credentials.sessionToken,
          startTime: Number(result.startTime),
          expiredTime: Number(result.expiredTime),
        });
      },
    );
  });
}

function getAttachmentCosClient(): COS {
  if (!cachedCosClient) {
    const config = getAttachmentConfig();
    cachedCosClient = new COS({ SecretId: config.secretId, SecretKey: config.secretKey });
  }
  return cachedCosClient;
}

export async function headAttachmentObject(objectKey: string): Promise<AttachmentObjectMetadata> {
  const config = getAttachmentConfig();
  return new Promise((resolve, reject) => {
    getAttachmentCosClient().headObject(
      { Bucket: config.bucket, Region: config.region, Key: objectKey },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        const headers = (data as { headers?: Record<string, string | undefined> }).headers || {};
        resolve({
          contentLength: Number.parseInt(headers["content-length"] || headers["Content-Length"] || "0", 10),
          contentType: (headers["content-type"] || headers["Content-Type"] || "").split(";")[0].trim().toLowerCase(),
          etag: headers.etag || headers.ETag,
        });
      },
    );
  });
}

export async function deleteAttachmentObject(objectKey: string): Promise<void> {
  const config = getAttachmentConfig();
  await getAttachmentCosClient().deleteObject({
    Bucket: config.bucket,
    Region: config.region,
    Key: objectKey,
  });
}

export async function abortAttachmentMultipartUploads(objectKey: string): Promise<void> {
  const config = getAttachmentConfig();
  const cos = getAttachmentCosClient();
  let keyMarker: string | undefined;
  let uploadIdMarker: string | undefined;

  do {
    const result = await cos.multipartList({
      Bucket: config.bucket,
      Region: config.region,
      Prefix: objectKey,
      Delimiter: "",
      MaxUploads: 1000,
      ...(keyMarker ? { KeyMarker: keyMarker } : {}),
      ...(uploadIdMarker ? { UploadIdMarker: uploadIdMarker } : {}),
    });

    for (const upload of result.Upload || []) {
      if (upload.Key === objectKey) {
        await cos.multipartAbort({
          Bucket: config.bucket,
          Region: config.region,
          Key: objectKey,
          UploadId: upload.UploadId,
        });
      }
    }

    if (result.IsTruncated !== "true") {
      break;
    }
    keyMarker = result.NextKeyMarker;
    uploadIdMarker = result.NextUploadIdMarker;
  } while (keyMarker || uploadIdMarker);
}

export async function cleanupAttachmentObject(objectKey: string | null | undefined): Promise<void> {
  if (!objectKey) {
    return;
  }

  try {
    await abortAttachmentMultipartUploads(objectKey);
  } catch (error) {
    console.error("Failed to abort attachment multipart uploads", { objectKey, error });
  }

  try {
    await deleteAttachmentObject(objectKey);
  } catch (error) {
    console.error("Failed to delete attachment object", { objectKey, error });
  }
}

export async function cleanupStaleAttachmentUploads(): Promise<number> {
  const staleBefore = new Date(Date.now() - STALE_ATTACHMENT_UPLOAD_MS);
  const staleAssets = await prisma.draftAsset.findMany({
    where: {
      type: "ATTACHMENT",
      status: "UPLOADING",
      updatedAt: { lt: staleBefore },
    },
    select: { id: true, objectKey: true },
  });

  let cleaned = 0;
  for (const asset of staleAssets) {
    const deleted = await prisma.draftAsset.deleteMany({
      where: { id: asset.id, type: "ATTACHMENT", status: "UPLOADING" },
    });
    if (deleted.count > 0) {
      await cleanupAttachmentObject(asset.objectKey);
      cleaned += 1;
    }
  }

  return cleaned;
}
