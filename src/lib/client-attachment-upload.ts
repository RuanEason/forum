"use client";

import COS from "cos-js-sdk-v5";
import type { UploadedAttachment } from "@/components/editor/types";

type UploadProgress = (percent: number) => void;

type StsResponse = {
  attachmentAssetId?: string;
  objectKey?: string;
  bucket?: string;
  region?: string;
  credentials?: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
    startTime: number;
    expiredTime: number;
  };
  url?: string;
  error?: string;
};

type CommitResponse = {
  asset?: UploadedAttachment & { objectKey?: string | null };
  error?: string;
};

export type AttachmentUploadTask = {
  promise: Promise<UploadedAttachment>;
  cancel: () => void;
};

export function startAttachmentUpload(
  file: File,
  draftId: string,
  onProgress: UploadProgress,
): AttachmentUploadTask {
  let cos: COS | null = null;
  let taskId: string | null = null;
  let attachmentAssetId: string | null = null;
  let cancelled = false;
  let cancelSent = false;
  const stsAbortController = new AbortController();

  const cancelServerAsset = () => {
    if (!attachmentAssetId || cancelSent) {
      return;
    }
    cancelSent = true;
    void fetch("/api/upload/attachment/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentAssetId }),
      keepalive: true,
    });
  };

  const promise = (async () => {
    const stsResponse = await fetch("/api/upload/attachment/sts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        draftId,
      }),
      signal: stsAbortController.signal,
    });
    const sts = await stsResponse.json() as StsResponse;
    if (!stsResponse.ok || !sts.attachmentAssetId || !sts.objectKey || !sts.bucket || !sts.region || !sts.credentials) {
      throw new Error(sts.error || "Failed to get attachment upload credentials");
    }

    attachmentAssetId = sts.attachmentAssetId;
    if (cancelled) {
      cancelServerAsset();
      throw new Error("Upload cancelled");
    }

    cos = new COS({
      SecretId: sts.credentials.tmpSecretId,
      SecretKey: sts.credentials.tmpSecretKey,
      SecurityToken: sts.credentials.sessionToken,
      StartTime: sts.credentials.startTime,
      ExpiredTime: sts.credentials.expiredTime,
    });

    onProgress(0);
    const uploadResult = await new Promise<{ ETag?: string }>((resolve, reject) => {
      cos?.sliceUploadFile(
        {
          Bucket: sts.bucket as string,
          Region: sts.region as string,
          Key: sts.objectKey as string,
          Body: file,
          Headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          onTaskReady: (nextTaskId) => {
            taskId = nextTaskId;
            if (cancelled) {
              cos?.cancelTask(nextTaskId);
            }
          },
          onProgress: (progressData) => {
            onProgress(Math.max(0, Math.min(100, Math.round((progressData.percent || 0) * 100))));
          },
        },
        (uploadError, data) => {
          if (uploadError) {
            reject(uploadError);
            return;
          }
          resolve(data || {});
        },
      );
    });

    if (cancelled) {
      cancelServerAsset();
      throw new Error("Upload cancelled");
    }

    const commitResponse = await fetch("/api/upload/attachment/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachmentAssetId,
        objectKey: sts.objectKey,
        etag: uploadResult.ETag || null,
      }),
    });
    const commit = await commitResponse.json() as CommitResponse;
    if (!commitResponse.ok || !commit.asset) {
      cancelServerAsset();
      throw new Error(commit.error || "Failed to commit attachment upload");
    }

    onProgress(100);
    return commit.asset;
  })().catch((error) => {
    if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
      cancelServerAsset();
      throw new Error("Upload cancelled");
    }
    cancelServerAsset();
    throw error;
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      stsAbortController.abort();
      if (cos && taskId) {
        cos.cancelTask(taskId);
      }
      cancelServerAsset();
    },
  };
}
