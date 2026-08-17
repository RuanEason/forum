import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";

/**
 * POST /api/pin/comment
 * 设置/取消设置评论置顶
 *
 * 请求体:
 * - commentId: string - 评论 ID
 * - pinned: boolean - 是否置顶
 *
 * 权限: 仅帖子作者可操作
 */
export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }
    const session = { user: { id: auth.user.id } };

    if (!session?.user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { commentId, pinned } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "缺少评论 ID" },
        { status: 400 }
      );
    }

    // 获取评论信息，检查权限
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "评论不存在" },
        { status: 404 }
      );
    }

    // 只有帖子作者可以置顶评论
    if (comment.post.authorId !== auth.user.id) {
      return NextResponse.json(
        { error: "无权执行此操作，仅帖子作者可置顶评论" },
        { status: 403 }
      );
    }

    // 更新评论置顶状态
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        pinned: pinned,
        pinnedAt: pinned ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: updatedComment.id,
        pinned: updatedComment.pinned,
        pinnedAt: updatedComment.pinnedAt,
      },
    });
  } catch (error) {
    console.error("置顶评论失败:", error);
    return NextResponse.json(
      { error: "置顶评论失败" },
      { status: 500 }
    );
  }
}
