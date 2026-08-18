import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewardActionExperience } from "@/lib/experience";
import { createUserNotificationIfEnabled } from "@/lib/user-notifications";
import { getSessionUser, requireSessionUser } from "@/app/api/app/_shared/auth";
import { linkMarkdownMentions } from "@/lib/mentions";
import { isAdminRole } from "@/lib/server-auth";
import { getCommentsPage } from "@/lib/post";
import {
  DEFAULT_LIST_PAGE_SIZE,
  InvalidCursorError,
  parseListPageSize,
} from "@/lib/pagination";

const MAX_COMMENT_LENGTH = 5000;
const MAX_COMMENT_IMAGES = 9;

type CommentBody = {
  content?: unknown;
  postId?: unknown;
  parentId?: unknown;
  replyToId?: unknown;
  images?: unknown;
};

function normalizeImageUrls(images: unknown): string[] {
  if (!images) {
    return [];
  }

  if (!Array.isArray(images)) {
    return [];
  }

  const list = images
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return list.slice(0, MAX_COMMENT_IMAGES);
}

function buildMarkdownContent(rawContent: string, imageUrls: string[]): string {
  const trimmed = rawContent.trim();

  if (imageUrls.length === 0) {
    return trimmed;
  }

  const imageBlocks = imageUrls
    .map((url, index) => `![comment-image-${index + 1}](${url})`)
    .join("\n");

  return trimmed ? `${trimmed}\n${imageBlocks}` : imageBlocks;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId")?.trim();

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, author: { deletionRequestedAt: null } },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const parentIdParam = searchParams.get("parentId");
    const parentId = parentIdParam ? parentIdParam.trim() || null : null;
    const viewer = await getSessionUser();
    const page = await getCommentsPage({
      postId,
      parentId,
      cursor: searchParams.get("cursor"),
      limit: parseListPageSize(searchParams.get("limit"), DEFAULT_LIST_PAGE_SIZE),
      viewerId: viewer?.id,
    });

    return NextResponse.json({ postId, ...page, comments: page.items });

  } catch (error) {
    if (error instanceof InvalidCursorError) {
      return NextResponse.json(
        { error: "Invalid cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }
    console.error("App comment list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = (await request.json()) as CommentBody;
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    const parentId = typeof body.parentId === "string" ? body.parentId.trim() : "";
    const replyToId = typeof body.replyToId === "string" ? body.replyToId.trim() : "";
    const rawContent = typeof body.content === "string" ? body.content : "";
    const imageUrls = normalizeImageUrls(body.images);
    const content = await linkMarkdownMentions(buildMarkdownContent(rawContent, imageUrls));

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json(
        { error: "content is required (or provide images)" },
        { status: 400 },
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be less than ${MAX_COMMENT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null, author: { deletionRequestedAt: null } },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let normalizedParentId: string | null = null;
    let normalizedReplyToId: string | null = null;
    let replyReceiverId: string | null = null;

    const replyTargetId = replyToId || parentId;

    if (replyTargetId) {
      const targetComment = await prisma.comment.findUnique({
        where: { id: replyTargetId },
        select: {
          id: true,
          postId: true,
          parentId: true,
          authorId: true,
        },
      });

      if (!targetComment || targetComment.postId !== postId) {
        return NextResponse.json({ error: "reply target comment not found" }, { status: 404 });
      }

      normalizedParentId = targetComment.parentId ?? targetComment.id;
      normalizedReplyToId = targetComment.id;
      replyReceiverId = targetComment.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId: normalizedParentId,
        replyToId: normalizedReplyToId,
        authorId: sessionUser.id,
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
      },
    });

    try {
      await rewardActionExperience(sessionUser.id, "comment");
    } catch (error) {
      console.error("Failed to reward comment experience:", error);
    }

    if (normalizedParentId && replyReceiverId && replyReceiverId !== sessionUser.id) {
      await createUserNotificationIfEnabled({
        type: "REPLY_COMMENT",
        senderId: sessionUser.id,
        receiverId: replyReceiverId,
        postId,
        commentId: comment.id,
      });
    }

    if (!normalizedParentId && post.authorId !== sessionUser.id) {
      await createUserNotificationIfEnabled({
        type: "REPLY_POST",
        senderId: sessionUser.id,
        receiverId: post.authorId,
        postId,
        commentId: comment.id,
      });
    }

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("App comment create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = (await request.json()) as { id?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== sessionUser.id && !isAdminRole(sessionUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("App comment delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
