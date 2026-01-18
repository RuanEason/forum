import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 处理点赞和取消点赞
 * 支持对帖子或评论进行点赞或取消点赞，并发送通知
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {"post" | "comment"} request.body.targetType - 点赞对象类型
 * @param {string} request.body.targetId - 帖子或评论 ID
 * @returns {Promise<NextResponse>} 点赞状态
 * @throws {401} Unauthorized - 用户未登录
 * @throws {400} Bad Request - 参数无效
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * // 点赞帖子
 * POST /api/like
 * {
 *   "targetType": "post",
 *   "targetId": "post123"
 * }
 *
 * // 取消点赞（相同的请求）
 * POST /api/like
 * {
 *   "targetType": "post",
 *   "targetId": "post123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId }: { targetType: "post" | "comment", targetId: string } = await request.json();

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
    }

    const userId = session.user.id;

    if (targetType === "post") {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: targetId,
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.postLike.delete({
          where: {
            id: existingLike.id,
          },
        });
        return NextResponse.json({ message: "Like removed successfully", liked: false }, { status: 200 });
      } else {
        const like = await prisma.postLike.create({
          data: {
            postId: targetId,
            userId,
          },
        });

        // Notification: Like Post
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { authorId: true }
        });

        if (post && post.authorId !== userId) {
          // Use findFirst to check for existing notification
          const existingNotif = await prisma.notification.findFirst({
            where: {
              type: "LIKE_POST",
              senderId: userId,
              receiverId: post.authorId,
              postId: targetId,
              isRead: false,
            }
          });

          if (!existingNotif) {
            // Create notification only if doesn't exist
            await prisma.notification.create({
              data: {
                type: "LIKE_POST",
                senderId: userId,
                receiverId: post.authorId,
                postId: targetId,
              }
            });
          }
        }

        return NextResponse.json({ message: "Liked successfully", liked: true, like }, { status: 201 });
      }
    } else if (targetType === "comment") {
      const existingLike = await prisma.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: targetId,
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.commentLike.delete({
          where: {
            id: existingLike.id,
          },
        });
        return NextResponse.json({ message: "Like removed successfully", liked: false }, { status: 200 });
      } else {
        const like = await prisma.commentLike.create({
          data: {
            commentId: targetId,
            userId,
          },
        });

        // Notification: Like Comment
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { authorId: true, postId: true }
        });

        if (comment && comment.authorId !== userId) {
           // Check for duplicate unread notification
           const existingNotif = await prisma.notification.findFirst({
            where: {
              type: "LIKE_COMMENT",
              senderId: userId,
              receiverId: comment.authorId,
              commentId: targetId,
              isRead: false,
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                type: "LIKE_COMMENT",
                senderId: userId,
                receiverId: comment.authorId,
                postId: comment.postId,
                commentId: targetId,
              }
            });
          }
        }

        return NextResponse.json({ message: "Liked successfully", liked: true, like }, { status: 201 });
      }
    } else {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }
  } catch (error) {
    console.error("Like/Unlike error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}