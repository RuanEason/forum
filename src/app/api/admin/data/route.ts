import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";
import { getMediaCleanupStats } from "@/lib/media-cleanup";
import { requireAdminUser } from "@/lib/server-auth";
import { getPageResult, parseListPageSize, parsePage } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "posts" ? "posts" : "users";
    const page = parsePage(searchParams.get("page"));
    const pageSize = parseListPageSize(searchParams.get("pageSize"));
    const skip = (page - 1) * pageSize;
    const mediaCleanup = await getMediaCleanupStats();

    if (type === "users") {
      const [total, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip,
          take: pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            banned: true,
            createdAt: true,
          },
        }),
      ]);
      const pagination = getPageResult(users, page, pageSize, total);
      return NextResponse.json({
        ...pagination,
        users,
        posts: [],
        mediaCleanup,
      });
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }),
      prisma.post.findMany({
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          content: true,
          contentJson: true,
          contentFormat: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);
    const summarizedPosts = posts.map(({ contentJson, contentFormat, ...post }) => ({
      ...post,
      content: contentFormat === "RICH_TEXT"
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : post.content,
    }));
    const pagination = getPageResult(summarizedPosts, page, pageSize, total);

    return NextResponse.json({
      ...pagination,
      users: [],
      posts: summarizedPosts,
      mediaCleanup,
    });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
