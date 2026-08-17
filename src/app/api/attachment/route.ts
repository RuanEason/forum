import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueMediaCleanupTaskFromUrl } from "@/lib/media-cleanup";
import { isAdminRole, requireActiveUser } from "@/lib/server-auth";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      );
    }

    const attachment = await prisma.postAttachment.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    if (attachment.post.authorId !== auth.user.id && !isAdminRole(auth.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await enqueueMediaCleanupTaskFromUrl({
      value: attachment.url,
      resourceType: "POST_ATTACHMENT",
      reason: "POST_DELETE",
      ownerId: attachment.post.authorId,
      postId: attachment.postId,
    });

    await prisma.postAttachment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
