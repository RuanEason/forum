import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VIDEO_ALLOWED_MIME_TYPES,
  buildVideoCdnUrl,
  createVideoRawObjectKey,
  getVideoPublicConstraints,
  issueVideoTemporaryCredential,
} from "@/lib/video";
import { isVideoUploadEnabled } from "@/lib/feature-flags";
import { requireActiveUser } from "@/lib/server-auth";

type StsRequestBody = {
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
  draftId?: unknown;
};

const VIDEO_UPLOAD_DISABLED_MESSAGE = "视频上传已暂时关闭，当前仅支持图文与附件帖子";

export async function POST(request: Request) {
  try {
    // 视频上传是本站最大的流量与转码成本来源，可通过环境变量整体关闭。
    // 关闭后不再签发上传凭证，但历史视频资源不受影响，仍可正常播放与观看。
    if (!isVideoUploadEnabled()) {
      return NextResponse.json(
        { error: VIDEO_UPLOAD_DISABLED_MESSAGE },
        { status: 403 },
      );
    }

    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as StsRequestBody;
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.trim() : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number.NaN;
    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
    const constraints = getVideoPublicConstraints();

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "fileSize must be a positive number" }, { status: 400 });
    }

    if (fileSize > constraints.maxSizeBytes) {
      return NextResponse.json(
        { error: `fileSize exceeds max size ${constraints.maxSizeBytes}` },
        { status: 400 },
      );
    }

    if (!VIDEO_ALLOWED_MIME_TYPES.includes(mimeType as (typeof VIDEO_ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { error: `mimeType not allowed: ${mimeType}` },
        { status: 400 },
      );
    }

    const objectKey = createVideoRawObjectKey(auth.user.id, fileName, mimeType);
    const rawUrl = buildVideoCdnUrl(objectKey);

    let linkedDraftId: string | null = null;
    if (draftId) {
      const draft = await prisma.postDraft.findFirst({
        where: {
          id: draftId,
          authorId: auth.user.id,
        },
        select: {
          id: true,
        },
      });
      if (!draft) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }
      linkedDraftId = draft.id;
    }

    const [videoAsset, credentials] = await Promise.all([
      prisma.videoAsset.create({
        data: {
          ownerId: auth.user.id,
          bucket: constraints.bucket,
          region: constraints.region,
          rawObjectKey: objectKey,
          rawUrl,
          mimeType,
          fileSize: BigInt(Math.trunc(fileSize)),
          status: "UPLOADING",
        },
      }),
      issueVideoTemporaryCredential({
        userId: auth.user.id,
      }),
    ]);

    if (linkedDraftId) {
      await prisma.$transaction(async (tx) => {
        await tx.draftAsset.deleteMany({
          where: {
            draftId: linkedDraftId as string,
            type: "VIDEO",
          },
        });
        await tx.draftAsset.create({
          data: {
            draftId: linkedDraftId as string,
            type: "VIDEO",
            status: "UPLOADING",
            progress: 0,
            videoAssetId: videoAsset.id,
            fileName,
            fileSize: Number.isFinite(fileSize) ? Math.trunc(fileSize) : null,
            mimeType,
            sortOrder: 0,
          },
        });
      });
    }

    return NextResponse.json({
      videoAssetId: videoAsset.id,
      objectKey,
      bucket: constraints.bucket,
      region: constraints.region,
      cdnBaseUrl: constraints.cdnBaseUrl,
      credentials,
      constraints: {
        maxSizeBytes: constraints.maxSizeBytes,
        allowedMimeTypes: constraints.allowedMimeTypes,
      },
    });
  } catch (error) {
    console.error("Video STS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
