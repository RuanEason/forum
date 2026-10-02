import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated";
import { prisma } from "@/lib/prisma";
import { rewardActionExperience } from "@/lib/experience";
import { createUserNotificationIfEnabled } from "@/lib/user-notifications";

import { requireActiveUser } from "@/lib/server-auth";

/**
 * 判断是否为唯一约束冲突。
 *
 * 并发点赞时，两个请求可能同时通过存在性检查并各自尝试 create，
 * 后到的那个会因 [postId, userId] / [commentId, userId] 唯一索引而失败。
 * 这属于正常的竞争结果，不应作为 500 抛给用户。
 */
function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * 处理点赞和取消点赞（幂等）。
 *
 * 与旧实现的区别：
 * 客户端显式传入期望状态 `liked`，而不是让服务端"翻转"。
 * 服务端据此把结果收敛到目标状态，因此重复请求、并发请求、
 * 超时重试都不会造成状态反转，天然幂等。
 *
 * @param {NextRequest} request - Next.js 请求对象
 * @param {Object} request.body - 请求体
 * @param {"post" | "comment"} request.body.targetType - 点赞对象类型
 * @param {string} request.body.targetId - 帖子或评论 ID
 * @param {boolean} [request.body.liked] - 期望状态；省略时回退为"翻转"以兼容旧客户端
 * @returns {Promise<NextResponse>} 点赞后的权威状态
 * @throws {401} Unauthorized - 用户未登录
 * @throws {400} Bad Request - 参数无效
 * @throws {404} Not Found - 目标不存在
 * @throws {500} Internal Server Error - 服务器内部错误
 *
 * @example
 * // 点赞（重复调用结果一致，不会变成取消点赞）
 * POST /api/like
 * { "targetType": "post", "targetId": "post123", "liked": true }
 *
 * @example
 * // 取消点赞（重复调用结果一致）
 * POST /api/like
 * { "targetType": "post", "targetId": "post123", "liked": false }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveUser();

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json() as {
      targetType?: unknown;
      targetId?: unknown;
      liked?: unknown;
    };

    const targetType = body.targetType;
    const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";

    if (targetType !== "post" && targetType !== "comment") {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }

    if (!targetId) {
      return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
    }

    if (body.liked !== undefined && typeof body.liked !== "boolean") {
      return NextResponse.json({ error: "liked must be a boolean" }, { status: 400 });
    }

    const userId = auth.user.id;
    const requestedLiked = body.liked as boolean | undefined;

    if (targetType === "post") {
      const post = await prisma.post.findFirst({
        where: { id: targetId, deletedAt: null, author: { deletionRequestedAt: null } },
        select: { id: true, authorId: true },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const existingLike = await prisma.postLike.findUnique({
        where: { postId_userId: { postId: targetId, userId } },
        select: { id: true },
      });

      // 未显式指定目标状态时保持旧的"翻转"语义，兼容尚未升级的客户端。
      const shouldLike = requestedLiked ?? !existingLike;

      if (!shouldLike) {
        // deleteMany 对不存在的记录是安全的空操作，重复调用不会报错。
        await prisma.postLike.deleteMany({ where: { postId: targetId, userId } });
        return NextResponse.json(
          { message: "Like removed successfully", liked: false },
          { status: 200 },
        );
      }

      // 已经是目标状态：直接返回，避免重复发通知与重复加经验。
      if (existingLike) {
        return NextResponse.json(
          { message: "Already liked", liked: true },
          { status: 200 },
        );
      }

      let like;
      try {
        like = await prisma.postLike.create({
          data: { postId: targetId, userId },
        });
      } catch (error) {
        // 并发下已有同一条点赞记录：目标状态已达成，直接返回成功。
        if (isUniqueConstraintError(error)) {
          return NextResponse.json(
            { message: "Already liked", liked: true },
            { status: 200 },
          );
        }
        throw error;
      }

      if (post.authorId !== userId) {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            type: "LIKE_POST",
            senderId: userId,
            receiverId: post.authorId,
            postId: targetId,
            isRead: false,
          },
          select: { id: true },
        });

        if (!existingNotif) {
          await createUserNotificationIfEnabled({
            type: "LIKE_POST",
            senderId: userId,
            receiverId: post.authorId,
            postId: targetId,
          });
        }
      }

      try {
        await rewardActionExperience(userId, "like");
      } catch (error) {
        console.error("Failed to reward post-like experience:", error);
      }

      return NextResponse.json(
        { message: "Liked successfully", liked: true, like },
        { status: 201 },
      );
    }

    // targetType === "comment"
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true, postId: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existingCommentLike = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: targetId, userId } },
      select: { id: true },
    });

    const shouldLikeComment = requestedLiked ?? !existingCommentLike;

    if (!shouldLikeComment) {
      await prisma.commentLike.deleteMany({ where: { commentId: targetId, userId } });
      return NextResponse.json(
        { message: "Like removed successfully", liked: false },
        { status: 200 },
      );
    }

    if (existingCommentLike) {
      return NextResponse.json(
        { message: "Already liked", liked: true },
        { status: 200 },
      );
    }

    let like;
    try {
      like = await prisma.commentLike.create({
        data: { commentId: targetId, userId },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json(
          { message: "Already liked", liked: true },
          { status: 200 },
        );
      }
      throw error;
    }

    if (comment.authorId !== userId) {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          type: "LIKE_COMMENT",
          senderId: userId,
          receiverId: comment.authorId,
          commentId: targetId,
          isRead: false,
        },
        select: { id: true },
      });

      if (!existingNotif) {
        await createUserNotificationIfEnabled({
          type: "LIKE_COMMENT",
          senderId: userId,
          receiverId: comment.authorId,
          postId: comment.postId,
          commentId: targetId,
        });
      }
    }

    try {
      await rewardActionExperience(userId, "like");
    } catch (error) {
      console.error("Failed to reward comment-like experience:", error);
    }

    return NextResponse.json(
      { message: "Liked successfully", liked: true, like },
      { status: 201 },
    );
  } catch (error) {
    console.error("Like/Unlike error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
