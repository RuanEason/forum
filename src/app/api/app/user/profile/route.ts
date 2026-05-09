import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserLevel } from "@/lib/experience";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import { getJoinedDays, getTrimmedParam } from "@/app/api/app/_shared/user";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const queryUserId = getTrimmedParam(searchParams, "userId");
    const targetUserId = queryUserId ?? sessionUser?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "userId is required when unauthenticated" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        coverImage: true,
        experience: true,
        createdAt: true,
        showUserData: true,
        banned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = sessionUser?.id === user.id;
    const isAdmin = sessionUser?.role === "admin";

    if (user.banned && !isSelf && !isAdmin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [
      postsPublished,
      totalViewsAggregate,
      likesReceived,
      likesGiven,
      followersCount,
      followingCount,
    ] = await Promise.all([
      prisma.post.count({
        where: {
          authorId: user.id,
          visibility: "PUBLIC",
        },
      }),
      prisma.post.aggregate({
        where: {
          authorId: user.id,
          visibility: "PUBLIC",
        },
        _sum: { viewCount: true },
      }),
      prisma.postLike.count({
        where: {
          post: {
            authorId: user.id,
            visibility: "PUBLIC",
          },
        },
      }),
      prisma.postLike.count({
        where: { userId: user.id },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    let isFollowing = false;
    if (sessionUser?.id && !isSelf) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: sessionUser.id,
            followingId: user.id,
          },
        },
        select: { id: true },
      });
      isFollowing = !!follow;
    }

    const canViewStats = isSelf || user.showUserData;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        coverImage: user.coverImage,
        joinedAt: user.createdAt,
      },
      relationship: {
        isSelf,
        isFollowing,
      },
      social: {
        followersCount,
        followingCount,
      },
      statsVisibility: {
        showUserData: user.showUserData,
        canViewStats,
      },
      stats: canViewStats
        ? {
            daysJoined: getJoinedDays(user.createdAt),
            postsPublished,
            totalViews: totalViewsAggregate._sum.viewCount ?? 0,
            likesReceived,
            likesGiven,
            experience: user.experience,
            level: getUserLevel(user.experience),
          }
        : null,
    });
  } catch (error) {
    console.error("App profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
