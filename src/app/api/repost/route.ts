import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId }: { postId: string } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const userId = session.user.id;

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