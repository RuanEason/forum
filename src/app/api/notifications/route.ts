import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";
import { requireCurrentUser } from "@/lib/server-auth";
import {
  getPageResult,
  parseListPageSize,
  parsePage,
} from "@/lib/pagination";
import { toPublicUser } from "@/lib/public-user";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams.get("page"));
    const pageSize = parseListPageSize(searchParams.get("pageSize"));
    const where = { receiverId: auth.user.id };
    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              contentJson: true,
              contentFormat: true,
            },
          },
        },
      }),
    ]);

    const commentIds = notifications
      .map((notification) => notification.commentId)
      .filter((id): id is string => Boolean(id));
    const comments = commentIds.length > 0
      ? await prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: { id: true, content: true },
        })
      : [];
    const commentsMap = new Map(comments.map((comment) => [comment.id, comment]));

    const items = notifications.map((notification) => {
      const post = notification.post
        ? (() => {
            const { contentJson, contentFormat, ...postData } = notification.post;
            return {
              ...postData,
              content: contentFormat === "RICH_TEXT"
                ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
                : postData.content,
            };
          })()
        : null;

      return {
        ...notification,
        sender: toPublicUser(notification.sender),
        post,
        comment: notification.commentId ? commentsMap.get(notification.commentId) ?? null : null,
      };
    });
    const pagination = getPageResult(items, page, pageSize, total);

    return NextResponse.json({
      ...pagination,
      notifications: items,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
