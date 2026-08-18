import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";
import { getPageResult, parseListPageSize, parsePage } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") === "users" ? "users" : "posts";
    const page = parsePage(searchParams.get("page"));
    const pageSize = parseListPageSize(searchParams.get("pageSize"));

    if (!query) {
      return NextResponse.json(getPageResult([], page, pageSize, 0));
    }

    if (type === "users") {
      const where = {
        name: { contains: query },
        banned: false,
        deletionRequestedAt: null,
      };
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            name: true,
            avatar: true,
            experience: true,
            _count: { select: { posts: true } },
          },
        }),
      ]);
      return NextResponse.json(getPageResult(users, page, pageSize, total));
    }

    const where = {
      visibility: "PUBLIC" as const,
      deletedAt: null,
      author: { deletionRequestedAt: null },
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
      ],
    };
    const viewer = await getCurrentUser();
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
            select: { id: true, name: true, avatar: true, experience: true },
          },
          _count: { select: { likes: true, reposts: true, comments: true } },
          images: { select: { url: true } },
          topic: { select: { id: true, name: true } },
          video: { select: { coverUrl: true } },
        },
      }),
    ]);

    const postIds = posts.map((post) => post.id);
    const likedIds = viewer && postIds.length > 0
      ? new Set((await prisma.postLike.findMany({
          where: { userId: viewer.id, postId: { in: postIds } },
          select: { postId: true },
        })).map((like) => like.postId))
      : new Set<string>();
    const items = posts.map(({ contentJson, contentFormat, _count, ...post }) => ({
      ...post,
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

    return NextResponse.json(getPageResult(items, page, pageSize, total));
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

