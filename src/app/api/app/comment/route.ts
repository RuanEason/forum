import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rewardActionExperience } from "@/lib/experience";
import { enqueueNotificationPush } from "@/lib/push";
import { getSessionUser } from "@/app/api/app/_shared/auth";

const MAX_COMMENT_LENGTH = 5000;
const MAX_COMMENT_IMAGES = 9;

type CommentBody = {
  content?: unknown;
  postId?: unknown;
  parentId?: unknown;
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      orderBy: [{ pinned: "desc" }, { pinnedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        content: true,
        postId: true,
        parentId: true,
        pinned: true,
        pinnedAt: true,
        createdAt: true,
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
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            content: true,
            postId: true,
            parentId: true,
            createdAt: true,
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
          },
        },
      },
    });

    return NextResponse.json({
      postId,
      comments,
    });
  } catch (error) {
    console.error("App comment list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CommentBody;
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    const parentId = typeof body.parentId === "string" ? body.parentId.trim() : "";
    const rawContent = typeof body.content === "string" ? body.content : "";
    const imageUrls = normalizeImageUrls(body.images);
    const content = buildMarkdownContent(rawContent, imageUrls);

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let parentCommentAuthorId: string | null = null;
    let normalizedParentId: string | null = null;

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          postId: true,
          authorId: true,
        },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json({ error: "parent comment not found" }, { status: 404 });
      }

      normalizedParentId = parentComment.id;
      parentCommentAuthorId = parentComment.authorId;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId: normalizedParentId,
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
      },
    });

    try {
      await rewardActionExperience(sessionUser.id, "comment");
    } catch (error) {
      console.error("Failed to reward comment experience:", error);
    }

    if (normalizedParentId && parentCommentAuthorId && parentCommentAuthorId !== sessionUser.id) {
      const notification = await prisma.notification.create({
        data: {
          type: "REPLY_COMMENT",
          senderId: sessionUser.id,
          receiverId: parentCommentAuthorId,
          postId,
          commentId: comment.id,
        },
        select: {
          id: true,
        },
      });

      enqueueNotificationPush(notification.id);
    }

    if (!normalizedParentId && post.authorId !== sessionUser.id) {
      const notification = await prisma.notification.create({
        data: {
          type: "REPLY_POST",
          senderId: sessionUser.id,
          receiverId: post.authorId,
          postId,
          commentId: comment.id,
        },
        select: {
          id: true,
        },
      });

      enqueueNotificationPush(notification.id);
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
    const sessionUser = await getSessionUser();

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (comment.authorId !== sessionUser.id && sessionUser.role !== "admin") {
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

