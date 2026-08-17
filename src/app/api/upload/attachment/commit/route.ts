import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/api/app/_shared/auth";
import { prisma } from "@/lib/prisma";
import {
  buildAttachmentCdnUrl,
  getAttachmentConfig,
  headAttachmentObject,
  validateAttachmentMetadata,
} from "@/lib/attachment";

type CommitRequestBody = {
  attachmentAssetId?: unknown;
  objectKey?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const user = auth.user;

    const body = await request.json() as CommitRequestBody;
    const attachmentAssetId = typeof body.attachmentAssetId === "string" ? body.attachmentAssetId.trim() : "";
    const objectKey = typeof body.objectKey === "string" ? body.objectKey.trim().replace(/^\/+/, "") : "";

    if (!attachmentAssetId || !objectKey) {
      return NextResponse.json({ error: "attachmentAssetId and objectKey are required" }, { status: 400 });
    }

    const asset = await prisma.draftAsset.findUnique({
      where: { id: attachmentAssetId },
      select: {
        id: true,
        draftId: true,
        type: true,
        status: true,
        objectKey: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        draft: { select: { authorId: true, publishedPostId: true } },
      },
    });

    if (!asset || asset.type !== "ATTACHMENT" || asset.draft.authorId !== user.id) {
      return NextResponse.json({ error: "Attachment asset not found" }, { status: 404 });
    }
    if (asset.draft.publishedPostId) {
      return NextResponse.json({ error: "Published draft cannot be changed" }, { status: 409 });
    }
    if (asset.objectKey !== objectKey) {
      return NextResponse.json({ error: "objectKey mismatch" }, { status: 400 });
    }
    if (asset.status !== "UPLOADING") {
      return NextResponse.json({ error: `Invalid attachment status: ${asset.status}` }, { status: 409 });
    }
    if (!asset.fileName || !asset.mimeType || !asset.fileSize) {
      return NextResponse.json({ error: "Attachment metadata is incomplete" }, { status: 400 });
    }

    const config = getAttachmentConfig();
    const expectedPrefix = `${config.prefix}${user.id.replace(/[^a-zA-Z0-9_-]/g, "_")}/`;
    if (!objectKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "objectKey is outside the user attachment prefix" }, { status: 400 });
    }

    const metadata = await headAttachmentObject(objectKey);
    if (asset.mimeType && metadata.contentType && metadata.contentType !== asset.mimeType.toLowerCase()) {
      return NextResponse.json({ error: "Uploaded object MIME type does not match attachment metadata" }, { status: 400 });
    }
    const validationError = validateAttachmentMetadata(asset.fileName, asset.mimeType, metadata.contentLength);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    if (!Number.isFinite(metadata.contentLength) || metadata.contentLength <= 0) {
      return NextResponse.json({ error: "Invalid uploaded object size" }, { status: 400 });
    }

    const updated = await prisma.draftAsset.updateMany({
      where: { id: asset.id, status: "UPLOADING", type: "ATTACHMENT" },
      data: {
        status: "READY",
        progress: 100,
        url: buildAttachmentCdnUrl(objectKey),
        fileSize: metadata.contentLength,
        errorMessage: null,
      },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Attachment was changed before commit" }, { status: 409 });
    }

    const readyAsset = await prisma.draftAsset.findUniqueOrThrow({
      where: { id: asset.id },
      select: { id: true, url: true, objectKey: true, fileName: true, fileSize: true, mimeType: true },
    });

    return NextResponse.json({ asset: readyAsset });
  } catch (error) {
    console.error("Attachment commit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to commit attachment upload" },
      { status: 500 },
    );
  }
}
