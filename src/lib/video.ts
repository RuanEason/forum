import { randomUUID } from "crypto";
import path from "path";
import COS from "cos-nodejs-sdk-v5";
import STS from "qcloud-cos-sts";

export const VIDEO_ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
] as const;

const MIME_EXTENSIONS: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/webm": ".webm",
};

const DEFAULT_STS_DURATION_SECONDS = 1800;
const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
const DEFAULT_RAW_PREFIX = "videos/raw/";

type VideoConfig = {
  bucket: string;
  region: string;
  cdnBaseUrl: string;
  rawPrefix: string;
  stsDurationSeconds: number;
  maxSizeBytes: number;
  secretId: string;
  secretKey: string;
};

type HeadObjectResult = {
  contentLength: number;
  contentType: string;
  etag?: string;
};

type TemporaryCredential = {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
};

let cachedCosClient: COS | null = null;

function normalizeCdnBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function normalizePrefix(raw: string): string {
  const normalized = raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized.length > 0 ? `${normalized}/` : DEFAULT_RAW_PREFIX;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getVideoSecrets() {
  const secretId = process.env.TENCENT_SECRET_ID || process.env.TENCENT_COS_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY || process.env.TENCENT_COS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error(
      "Missing video secret keys: set TENCENT_SECRET_ID/TENCENT_SECRET_KEY or TENCENT_COS_SECRET_ID/TENCENT_COS_SECRET_KEY",
    );
  }

  return { secretId, secretKey };
}

export function getVideoConfig(): VideoConfig {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_DOMAIN;

  if (!bucket || !region || !cdnBaseUrl) {
    throw new Error(
      "Missing video COS config: TENCENT_COS_BUCKET, TENCENT_COS_REGION, NEXT_PUBLIC_CDN_DOMAIN",
    );
  }

  const rawPrefix = normalizePrefix(process.env.TENCENT_VIDEO_RAW_PREFIX || DEFAULT_RAW_PREFIX);
  const stsDurationSeconds = parseIntEnv("TENCENT_STS_DURATION_SECONDS", DEFAULT_STS_DURATION_SECONDS);
  const maxSizeBytes = parseIntEnv("TENCENT_VIDEO_MAX_SIZE_BYTES", DEFAULT_MAX_SIZE_BYTES);
  const secrets = getVideoSecrets();

  return {
    bucket,
    region,
    cdnBaseUrl: normalizeCdnBaseUrl(cdnBaseUrl),
    rawPrefix,
    stsDurationSeconds,
    maxSizeBytes,
    secretId: secrets.secretId,
    secretKey: secrets.secretKey,
  };
}

function getVideoCosClient(): COS {
  if (cachedCosClient) {
    return cachedCosClient;
  }

  const { secretId, secretKey } = getVideoConfig();
  cachedCosClient = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });
  return cachedCosClient;
}

function sanitizeUserId(userId: string): string {
  return userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function inferFileExtension(fileName: string, mimeType: string): string {
  const fromName = path.extname(fileName || "").toLowerCase();
  if (fromName) {
    return fromName;
  }

  return MIME_EXTENSIONS[mimeType] || ".mp4";
}

function extractAppIdFromBucket(bucket: string): string {
  const index = bucket.lastIndexOf("-");
  if (index < 0 || index === bucket.length - 1) {
    throw new Error(`Invalid COS bucket format: ${bucket}`);
  }

  return bucket.slice(index + 1);
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeObjectKey(input: string): string {
  const { bucket } = getVideoConfig();
  let value = (input || "").trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      value = new URL(value).pathname;
    } catch {
      // ignore URL parse failure and continue with raw value
    }
  }

  value = value.replace(/^\/+/, "");
  const bucketPrefix = new RegExp(`^${escapeRegExp(bucket)}/`);
  value = value.replace(bucketPrefix, "");
  return value;
}

export function createVideoRawObjectKey(userId: string, fileName: string, mimeType: string): string {
  const { rawPrefix } = getVideoConfig();
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const safeUserId = sanitizeUserId(userId);
  const ext = inferFileExtension(fileName, mimeType);
  return `${rawPrefix}${safeUserId}/${yyyy}/${mm}/${randomUUID()}${ext}`;
}

export function buildVideoCdnUrl(objectKey: string): string {
  const { cdnBaseUrl } = getVideoConfig();
  return `${cdnBaseUrl}/${normalizeObjectKey(objectKey)}`;
}

export async function issueVideoTemporaryCredential(params: {
  userId: string;
}): Promise<TemporaryCredential> {
  const config = getVideoConfig();
  const appId = extractAppIdFromBucket(config.bucket);
  const userPrefix = `${config.rawPrefix}${sanitizeUserId(params.userId)}/`;

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
          reject(error || new Error("Failed to issue temporary credential"));
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

export async function headVideoObject(objectKey: string): Promise<HeadObjectResult> {
  const config = getVideoConfig();
  const normalizedKey = normalizeObjectKey(objectKey);

  return new Promise((resolve, reject) => {
    getVideoCosClient().headObject(
      {
        Bucket: config.bucket,
        Region: config.region,
        Key: normalizedKey,
      },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        const headers = (data as { headers?: Record<string, string | undefined> })?.headers || {};
        const lengthHeader = headers["content-length"] || headers["Content-Length"];
        const contentType = headers["content-type"] || headers["Content-Type"] || "";
        const etag = headers.etag || headers.ETag;

        resolve({
          contentLength: Number.parseInt(lengthHeader || "0", 10),
          contentType,
          etag,
        });
      },
    );
  });
}

export function getVideoCallbackToken(): string {
  return process.env.TENCENT_CI_CALLBACK_TOKEN || "";
}

export function getVideoPublicConstraints() {
  const config = getVideoConfig();
  return {
    bucket: config.bucket,
    region: config.region,
    cdnBaseUrl: config.cdnBaseUrl,
    maxSizeBytes: config.maxSizeBytes,
    allowedMimeTypes: [...VIDEO_ALLOWED_MIME_TYPES],
  };
}
