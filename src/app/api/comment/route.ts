import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * 创建评论或回复
 * 支持创建新评论或对现有评论进行回复
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {string} request.body.content - 评论内容
 * @param {string} request.body.postId - 帖子 ID
 * @param {string} [request.body.parentId] - 父评论 ID（回复时使用）
 * @returns {Promise<NextResponse>} 201 评论创建成功
 * @throws {401} Unauthorized - 用户未登录
 * @throws {400} Bad Request - 参数验证失败
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * // 创建顶层评论
 * POST /api/comment
 * {
 *   "content": "这是一条评论",
 *   "postId": "post123"
 * }
 *
 * // 回复评论
 * POST /api/comment
 * {
 *   "content": "这是回复内容",
 *   "postId": "post123",
 *   "parentId": "comment456"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, postId, parentId }: { content: string, postId: string, parentId?: string | null } = await request.json();

    if (!content || !postId) {
      return NextResponse.json({ error: "Content and postId are required" }, { status: 400 });
    }

    const authorId = session.user.id;

    const data: {
      content: string;
      postId: string;
      authorId: string;
      parentId?: string | null;
    } = {
      content,
      postId,
      authorId,
    };

    if (parentId !== undefined && parentId !== null) {
      // 这是一个回复
      data.parentId = parentId;
    } else {
      // 这是一个顶层评论
      data.parentId = null;
    }

    const comment = await prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        likes: true,
        replies: true,
      }
    });

    // Notification Logic
    // 1. If reply to comment (parentId exists), notify comment author
    // 2. If reply to post (top-level), notify post author

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      });
      
      if (parentComment && parentComment.authorId !== authorId) {
        await prisma.notification.create({
          data: {
            type: "REPLY_COMMENT",
            senderId: authorId,
            receiverId: parentComment.authorId,
            postId: postId,
            commentId: comment.id,
          }
        });
      }
    } else {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
      });
      
      if (post && post.authorId !== authorId) {
        await prisma.notification.create({
          data: {
            type: "REPLY_POST",
            senderId: authorId,
            receiverId: post.authorId,
            postId: postId,
            commentId: comment.id,
          }
        });
      }
    }

    return NextResponse.json({ message: "Comment created successfully", comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 删除评论
 * 只有评论作者或管理员可以删除评论
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {string} request.body.id - 要删除的评论 ID
 * @returns {Promise<NextResponse>} 200 删除成功
 * @throws {401} Unauthorized - 用户未登录
 * @throws {403} Forbidden - 无权限删除（非作者且非管理员）
 * @throws {404} Not Found - 评论不存在
 * @throws {400} Bad Request - 参数无效
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * DELETE /api/comment
 * {
 *   "id": "comment123"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: id },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only author or admin can delete
    if (comment.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}