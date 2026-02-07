import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/pin
 * 设置/取消设置帖子置顶
 *
 * 请求体:
 * - postId: string - 帖子 ID
 * - pinned: boolean - 是否置顶
 *
 * 权限: 仅管理员可操作
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "无权执行此操作，仅管理员可置顶帖子" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postId, pinned } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "缺少帖子 ID" },
        { status: 400 }
      );
    }

    // 更新帖子置顶状态
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        pinned: pinned,
        pinnedAt: pinned ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        pinned: post.pinned,
        pinnedAt: post.pinnedAt,
      },
    });
  } catch (error) {
    console.error("置顶帖子失败:", error);
    return NextResponse.json(
      { error: "置顶帖子失败" },
      { status: 500 }
    );
  }
}
