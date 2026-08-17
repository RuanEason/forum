import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VIDEO_ALLOWED_MIME_TYPES,
  buildVideoCdnUrl,
  createBackgroundRawObjectKey,
  getBackgroundVideoPublicConstraints,
  issueBackgroundTemporaryCredential,
} from "@/lib/video";
import { requireActiveUser } from "@/lib/server-auth";

type StsRequestBody = {
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as StsRequestBody;
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.trim() : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number.NaN;
    const constraints = getBackgroundVideoPublicConstraints();

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

    const objectKey = createBackgroundRawObjectKey(auth.user.id, fileName, mimeType);
    const rawUrl = buildVideoCdnUrl(objectKey);

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
      issueBackgroundTemporaryCredential({
        userId: auth.user.id,
      }),
    ]);

    return NextResponse.json({
      backgroundVideoAssetId: videoAsset.id,
      objectKey,
      bucket: constraints.bucket,
      region: constraints.region,
      cdnBaseUrl: constraints.cdnBaseUrl,
      credentials,
      constraints: {
        rawPrefix: constraints.rawPrefix,
        maxSizeBytes: constraints.maxSizeBytes,
        allowedMimeTypes: constraints.allowedMimeTypes,
      },
    });
  } catch (error) {
    console.error("Background video STS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
