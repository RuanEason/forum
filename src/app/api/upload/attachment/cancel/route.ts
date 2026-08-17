import { NextResponse } from "next/server";
import { requireSessionUser } from "@/app/api/app/_shared/auth";
import { prisma } from "@/lib/prisma";
import { enqueueMediaCleanupTaskFromUrl } from "@/lib/media-cleanup";

type CancelRequestBody = { attachmentAssetId?: unknown };

export async function POST(request: Request) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const user = auth.user;

    const body = await request.json() as CancelRequestBody;
    const attachmentAssetId = typeof body.attachmentAssetId === "string" ? body.attachmentAssetId.trim() : "";
    if (!attachmentAssetId) {
      return NextResponse.json({ error: "attachmentAssetId is required" }, { status: 400 });
    }

    const asset = await prisma.draftAsset.findUnique({
      where: { id: attachmentAssetId },
      select: {
        id: true,
        objectKey: true,
        type: true,
        status: true,
        draft: { select: { authorId: true } },
      },
    });
    if (!asset || asset.type !== "ATTACHMENT" || asset.draft.authorId !== user.id) {
      return NextResponse.json({ error: "Attachment asset not found" }, { status: 404 });
    }

    await enqueueMediaCleanupTaskFromUrl({
      value: asset.objectKey,
      resourceType: "DRAFT_ASSET",
      reason: "UPLOAD_EXPIRED",
      ownerId: user.id,
    });
    await prisma.draftAsset.delete({ where: { id: asset.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Attachment cancel error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel attachment upload" },
      { status: 500 },
    );
  }
}
