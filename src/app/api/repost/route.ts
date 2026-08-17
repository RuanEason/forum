import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveUser();

    if (!auth.ok) {
      return auth.response;
    }

    const { postId }: { postId: string } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const userId = auth.user.id;

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, author: { deletionRequestedAt: null } },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 检查是否已经转发
    const existingRepost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingRepost) {
      // 如果已经转发，则取消转发
      await prisma.repost.delete({
        where: {
          id: existingRepost.id,
        },
      });
      return NextResponse.json({ message: "Repost removed successfully", reposted: false }, { status: 200 });
    } else {
      // 否则创建转发
      const repost = await prisma.repost.create({
        data: {
          postId,
          userId,
        },
      });
      return NextResponse.json({ message: "Reposted successfully", reposted: true, repost }, { status: 201 });
    }
  } catch (error) {
    console.error("Repost error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
