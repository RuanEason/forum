import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/api/app/_shared/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_ATTACHMENT_COUNT,
  buildAttachmentCdnUrl,
  createAttachmentObjectKey,
  getAttachmentPublicConstraints,
  issueAttachmentTemporaryCredential,
  validateAttachmentMetadata,
} from "@/lib/attachment";
import { enqueueMediaCleanupTaskFromUrl } from "@/lib/media-cleanup";

type StsRequestBody = {
  fileName?: unknown;
  fileSize?: unknown;
  mimeType?: unknown;
  draftId?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const user = auth.user;

    const body = await request.json() as StsRequestBody;
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number.NaN;
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.trim() : "";
    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
    const constraints = getAttachmentPublicConstraints();

    if (!draftId) {
      return NextResponse.json({ error: "draftId is required" }, { status: 400 });
    }

    const validationError = validateAttachmentMetadata(fileName, mimeType, fileSize);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const draft = await prisma.postDraft.findFirst({
      where: { id: draftId, authorId: user.id, publishedPostId: null },
      select: { id: true },
    });
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const attachmentCount = await prisma.draftAsset.count({
      where: { draftId: draft.id, type: "ATTACHMENT", status: { not: "FAILED" } },
    });
    if (attachmentCount >= MAX_ATTACHMENT_COUNT) {
      return NextResponse.json({ error: `Maximum ${MAX_ATTACHMENT_COUNT} attachments allowed` }, { status: 400 });
    }

    const objectKey = createAttachmentObjectKey(user.id, fileName);
    const asset = await prisma.draftAsset.create({
      data: {
        draftId: draft.id,
        type: "ATTACHMENT",
        status: "UPLOADING",
        progress: 0,
        objectKey,
        fileName: fileName.slice(0, 191),
        fileSize: Math.trunc(fileSize),
        mimeType: mimeType.slice(0, 191),
        sortOrder: attachmentCount,
      },
      select: { id: true },
    });

    let credentials;
    try {
      credentials = await issueAttachmentTemporaryCredential(user.id);
    } catch (error) {
      await enqueueMediaCleanupTaskFromUrl({
        value: objectKey,
        resourceType: "DRAFT_ASSET",
        reason: "UPLOAD_EXPIRED",
        ownerId: user.id,
      });
      await prisma.draftAsset.delete({ where: { id: asset.id } });
      throw error;
    }

    return NextResponse.json({
      attachmentAssetId: asset.id,
      objectKey,
      bucket: constraints.bucket,
      region: constraints.region,
      cdnBaseUrl: constraints.cdnBaseUrl,
      credentials,
      constraints: {
        maxSizeBytes: constraints.maxSizeBytes,
        maxAttachments: constraints.allowedCount,
      },
      url: buildAttachmentCdnUrl(objectKey),
    }, { status: 201 });
  } catch (error) {
    console.error("Attachment STS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to issue attachment upload credentials" },
      { status: 500 },
    );
  }
}
