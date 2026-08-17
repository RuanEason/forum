import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewardActionExperience } from "@/lib/experience";
import { createUserNotificationIfEnabled } from "@/lib/user-notifications";
import { linkMarkdownMentions } from "@/lib/mentions";
import { requireActiveUser, isAdminRole } from "@/lib/server-auth";

const MAX_COMMENT_IMAGES = 9;

function normalizeImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image): image is string => typeof image === "string")
    .map((image) => image.trim())
    .filter(Boolean)
    .slice(0, MAX_COMMENT_IMAGES);
}

function buildCommentContent(content: string, imageUrls: string[]): string {
  const text = content.trim();

  if (imageUrls.length === 0) {
    return text;
  }

  const imageMarkdown = imageUrls
    .map((url, index) => `![comment-image-${index + 1}](${url})`)
    .join("\n");

  return text ? `${text}\n${imageMarkdown}` : imageMarkdown;
}

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
    const auth = await requireActiveUser();

    if (!auth.ok) {
      return auth.response;
    }

    const {
      content,
      images,
      postId,
      parentId,
      replyToId,
    }: {
      content?: string;
      images?: unknown;
      postId: string;
      parentId?: string | null;
      replyToId?: string | null;
    } = await request.json();

    const commentContent = await linkMarkdownMentions(buildCommentContent(
      typeof content === "string" ? content : "",
      normalizeImageUrls(images),
    ));

    if (!commentContent || !postId) {
      return NextResponse.json({ error: "Content and postId are required" }, { status: 400 });
    }

    const authorId = auth.user.id;

    const activePost = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, author: { deletionRequestedAt: null } },
      select: { id: true },
    });
    if (!activePost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let normalizedParentId: string | null = null;
    let normalizedReplyToId: string | null = null;
    let replyReceiverId: string | null = null;

    const normalizedInputParentId = typeof parentId === "string" ? parentId.trim() : "";
    const normalizedInputReplyToId = typeof replyToId === "string" ? replyToId.trim() : "";
    const replyTargetId = normalizedInputReplyToId || normalizedInputParentId;

    if (replyTargetId) {
      const targetComment = await prisma.comment.findUnique({
        where: { id: replyTargetId },
        select: { id: true, postId: true, parentId: true, authorId: true },
      });

      if (!targetComment || targetComment.postId !== postId) {
        return NextResponse.json({ error: "Reply target not found" }, { status: 404 });
      }

      // Keep only two levels in structure:
      // - top-level comment (parentId = null)
      // - replies under top-level comment
      // When replying to a reply, parentId points to the top-level root,
      // and replyToId points to the specific reply/user being replied to.
      normalizedParentId = targetComment.parentId ?? targetComment.id;
      normalizedReplyToId = targetComment.id;
      replyReceiverId = targetComment.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        content: commentContent,
        postId,
        authorId,
        parentId: normalizedParentId,
        replyToId: normalizedReplyToId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      }
    });

    try {
      await rewardActionExperience(authorId, "comment");
    } catch (error) {
      console.error("Failed to reward comment experience:", error);
    }

    // Notification Logic
    // 1. If reply to comment (parentId exists), notify comment author
    // 2. If reply to post (top-level), notify post author

    if (normalizedParentId) {
      if (replyReceiverId && replyReceiverId !== authorId) {
        await createUserNotificationIfEnabled({
          type: "REPLY_COMMENT",
          senderId: authorId,
          receiverId: replyReceiverId,
          postId,
          commentId: comment.id,
        });
      }
    } else {
      const post = await prisma.post.findFirst({
        where: { id: postId, deletedAt: null, author: { deletionRequestedAt: null } },
        select: { authorId: true }
      });
      
      if (post && post.authorId !== authorId) {
        await createUserNotificationIfEnabled({
          type: "REPLY_POST",
          senderId: authorId,
          receiverId: post.authorId,
          postId,
          commentId: comment.id,
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
    const auth = await requireActiveUser();

    if (!auth.ok) {
      return auth.response;
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
    if (comment.authorId !== auth.user.id && !isAdminRole(auth.user.role)) {
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
