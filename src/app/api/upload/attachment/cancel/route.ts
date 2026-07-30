import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import { prisma } from "@/lib/prisma";
import { cleanupAttachmentObject } from "@/lib/attachment";

type CancelRequestBody = { attachmentAssetId?: unknown };

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    await prisma.draftAsset.delete({ where: { id: asset.id } });
    await cleanupAttachmentObject(asset.objectKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Attachment cancel error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel attachment upload" },
      { status: 500 },
    );
  }
}
