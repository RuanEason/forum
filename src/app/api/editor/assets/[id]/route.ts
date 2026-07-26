import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteFromCOS } from "@/lib/cos";
import { prisma } from "@/lib/prisma";

type SessionShape = { user?: { id?: string } } | null;

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions) as SessionShape;
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const asset = await prisma.editorImageAsset.findFirst({
      where: { id, userId, status: "READY" },
      select: { id: true, url: true, objectKey: true, fileSize: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Image pool item not found" }, { status: 404 });
    }

    const [postReference, draftReference] = await Promise.all([
      prisma.post.findFirst({
        where: { content: { contains: asset.url } },
        select: { id: true },
      }),
      prisma.postDraft.findFirst({
        where: { content: { contains: asset.url } },
        select: { id: true },
      }),
    ]);

    if (postReference || draftReference) {
      return NextResponse.json(
        { error: "This image is used by an article or draft and cannot be deleted" },
        { status: 409 },
      );
    }

    await deleteFromCOS(asset.objectKey);
    const user = await prisma.$transaction(async (tx) => {
      await tx.editorImageAsset.delete({ where: { id: asset.id } });
      return tx.user.update({
        where: { id: userId },
        data: { editorImageBytesUsed: { decrement: asset.fileSize } },
        select: { editorImageBytesUsed: true },
      });
    });

    return NextResponse.json({ usedBytes: user.editorImageBytesUsed });
  } catch (error) {
    console.error("Delete editor image asset error", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
