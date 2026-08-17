import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import { isAdminRole } from "@/lib/server-auth";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  getPaginationMeta,
  getTrimmedParam,
  parsePositiveInt,
} from "@/app/api/app/_shared/user";

type FollowListType = "followers" | "following";

function parseListType(value: string | null): FollowListType {
  return value === "followers" ? "followers" : "following";
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);

    const targetUserId = getTrimmedParam(searchParams, "userId") ?? sessionUser?.id;
    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required when unauthenticated" },
        { status: 400 },
      );
    }

    const type = parseListType(searchParams.get("type"));
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE, { min: 1 });
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, {
      min: 1,
      max: MAX_PAGE_SIZE,
    });
    const skip = (page - 1) * pageSize;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, banned: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = sessionUser?.id === targetUser.id;
    const isAdmin = sessionUser ? isAdminRole(sessionUser.role) : false;
    if (targetUser.banned && !isSelf && !isAdmin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where =
      type === "followers"
        ? { followingId: targetUserId }
        : { followerId: targetUserId };

    const total = await prisma.follow.count({ where });

    const users =
      type === "followers"
        ? (
            await prisma.follow.findMany({
              where,
              orderBy: { createdAt: "desc" },
              skip,
              take: pageSize,
              select: {
                createdAt: true,
                follower: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    bio: true,
                  },
                },
              },
            })
          ).map((row) => ({
            user: row.follower,
            followedAt: row.createdAt,
          }))
        : (
            await prisma.follow.findMany({
              where,
              orderBy: { createdAt: "desc" },
              skip,
              take: pageSize,
              select: {
                createdAt: true,
                following: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    bio: true,
                  },
                },
              },
            })
          ).map((row) => ({
            user: row.following,
            followedAt: row.createdAt,
          }));

    let followingSet = new Set<string>();
    if (sessionUser?.id && users.length > 0) {
      const ids = users.map((item) => item.user.id);
      const links = await prisma.follow.findMany({
        where: {
          followerId: sessionUser.id,
          followingId: {
            in: ids,
          },
        },
        select: {
          followingId: true,
        },
      });
      followingSet = new Set(links.map((item) => item.followingId));
    }

    const list = users.map((item) => ({
      ...item,
      isFollowingByMe: sessionUser?.id
        ? followingSet.has(item.user.id)
        : false,
    }));

    return NextResponse.json({
      userId: targetUserId,
      type,
      list,
      pagination: getPaginationMeta(page, pageSize, total),
    });
  } catch (error) {
    console.error("App follows list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
