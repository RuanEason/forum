import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";
import { isAdminRole } from "@/lib/server-auth";
import { toPublicUser } from "@/lib/public-user";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  getPaginationMeta,
  getTrimmedParam,
  parsePositiveInt,
} from "@/app/api/app/_shared/user";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const userId = getTrimmedParam(searchParams, "userId") ?? sessionUser?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required when unauthenticated" },
        { status: 400 },
      );
    }

    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE, { min: 1 });
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, {
      min: 1,
      max: MAX_PAGE_SIZE,
    });
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, banned: true, deletionRequestedAt: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = sessionUser?.id === userId;
    const isAdmin = sessionUser ? isAdminRole(sessionUser.role) : false;
    if ((targetUser.banned || targetUser.deletionRequestedAt) && !isSelf && !isAdmin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where = {
      authorId: userId,
      ...(isSelf || isAdmin ? {} : { visibility: "PUBLIC" as const }),
      deletedAt: null,
      author: { deletionRequestedAt: null },
    };
    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [
          { pinned: "desc" },
          { pinnedAt: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          content: true,
          contentJson: true,
          contentFormat: true,
          postType: true,
          visibility: true,
          viewCount: true,
          pinned: true,
          pinnedAt: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          _count: {
            select: { likes: true, reposts: true, comments: true },
          },
          images: {
            select: { url: true },
          },
          topic: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const postIds = posts.map((post) => post.id);
    const likedIds = sessionUser && postIds.length > 0
      ? new Set((await prisma.postLike.findMany({
          where: { userId: sessionUser.id, postId: { in: postIds } },
          select: { postId: true },
        })).map((like) => like.postId))
      : new Set<string>();

    const list = posts.map(({ contentJson, contentFormat, _count, author, ...post }) => ({
      ...post,
      author: toPublicUser(author),
      contentFormat,
      content: contentFormat === "RICH_TEXT"
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : post.content,
      likeCount: _count.likes,
      repostCount: _count.reposts,
      commentCount: _count.comments,
      likedByMe: likedIds.has(post.id),
      repostedByMe: false,
    }));

    return NextResponse.json({
      userId,
      list,
      pagination: getPaginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error("App user posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
