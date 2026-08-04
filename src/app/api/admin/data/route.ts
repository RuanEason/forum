import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRichTextSummary, parseRichTextDocument } from "@/lib/rich-text/content";

type AdminSession = {
  user?: {
    id?: string;
    role?: string;
  };
} | null;

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as AdminSession;

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const posts = await prisma.post.findMany({
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
    });

    const summarizedPosts = posts.map(({ contentJson, contentFormat, ...post }) => ({
      ...post,
      content: contentFormat === "RICH_TEXT"
        ? getRichTextSummary(parseRichTextDocument(contentJson), 300)
        : post.content,
    }));

    return NextResponse.json({ users, posts: summarizedPosts }, { status: 200 });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
