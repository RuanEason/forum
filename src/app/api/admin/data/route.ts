import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";
import { getMediaCleanupStats } from "@/lib/media-cleanup";
import { requireAdminUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return auth.response;
    }

    const [users, posts, mediaCleanup] = await Promise.all([
      prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      }),
      prisma.post.findMany({
        where: { deletedAt: null },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      getMediaCleanupStats(),
    ]);

    const summarizedPosts = posts.map(({ contentJson, contentFormat, ...post }) => ({
      ...post,
      content: contentFormat === "RICH_TEXT"
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : post.content,
    }));

    return NextResponse.json({ users, posts: summarizedPosts, mediaCleanup }, { status: 200 });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
