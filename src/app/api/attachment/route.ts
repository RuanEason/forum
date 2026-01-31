import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromCOS } from "@/lib/cos";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    if (attachment.post.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(attachment.url);
    const filename = url.pathname.slice(1);

    try {
      await deleteFromCOS(filename);
    } catch (cosError) {
      console.error("Failed to delete from COS:", cosError);
    }

    await prisma.postAttachment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
