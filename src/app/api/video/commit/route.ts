import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_ALLOWED_MIME_TYPES, headVideoObject, normalizeObjectKey } from "@/lib/video";

type CommitRequestBody = {
  videoAssetId?: unknown;
  objectKey?: unknown;
  etag?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CommitRequestBody;
    const videoAssetId = typeof body.videoAssetId === "string" ? body.videoAssetId.trim() : "";
    const objectKey = typeof body.objectKey === "string" ? normalizeObjectKey(body.objectKey) : "";
    const etag = typeof body.etag === "string" ? body.etag.trim() : undefined;

    if (!videoAssetId || !objectKey) {
      return NextResponse.json(
        { error: "videoAssetId and objectKey are required" },
        { status: 400 },
      );
    }

    const videoAsset = await prisma.videoAsset.findUnique({
      where: { id: videoAssetId },
      select: {
        id: true,
        ownerId: true,
        rawObjectKey: true,
        status: true,
      },
    });

    if (!videoAsset || videoAsset.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
    }

    if (videoAsset.rawObjectKey !== objectKey) {
      return NextResponse.json({ error: "objectKey mismatch" }, { status: 400 });
    }

    if (!["UPLOADING", "FAILED"].includes(videoAsset.status)) {
      return NextResponse.json(
        { error: `invalid video status: ${videoAsset.status}` },
        { status: 400 },
      );
    }

    const metadata = await headVideoObject(objectKey);

    if (!Number.isFinite(metadata.contentLength) || metadata.contentLength <= 0) {
      return NextResponse.json({ error: "Invalid object size" }, { status: 400 });
    }

    const normalizedHeadMimeType = metadata.contentType.split(";")[0].trim().toLowerCase();

    if (
      normalizedHeadMimeType
      && !VIDEO_ALLOWED_MIME_TYPES.includes(normalizedHeadMimeType as (typeof VIDEO_ALLOWED_MIME_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: `Invalid object mimeType: ${metadata.contentType}` },
        { status: 400 },
      );
    }

    const updated = await prisma.videoAsset.update({
      where: { id: videoAsset.id },
      data: {
        status: "PROCESSING",
        fileSize: BigInt(metadata.contentLength),
        mimeType: normalizedHeadMimeType || undefined,
        errorCode: null,
        errorMessage: null,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      etag: metadata.etag || etag || null,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Video commit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
