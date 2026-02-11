import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/app/api/app/_shared/auth";
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

    const [targetUser, total] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, banned: true },
      }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = sessionUser?.id === userId;
    const isAdmin = sessionUser?.role === "admin";
    if (targetUser.banned && !isSelf && !isAdmin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const skip = (page - 1) * pageSize;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: [{ pinned: "desc" }, { pinnedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        content: true,
        viewCount: true,
        pinned: true,
        pinnedAt: true,
        createdAt: true,
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            url: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            downloadCount: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        reposts: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      userId,
      list: posts,
      pagination: getPaginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error("App user posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

