import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserNotificationIfEnabled } from "@/lib/user-notifications";
import { getSessionUser, requireSessionUser } from "@/app/api/app/_shared/auth";
import { getTrimmedParam } from "@/app/api/app/_shared/user";

type FollowBody = {
  targetUserId?: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = getTrimmedParam(searchParams, "targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (targetUserId === sessionUser.id) {
      return NextResponse.json({ isFollowing: false });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUser.id,
          followingId: targetUserId,
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("App follow status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = (await request.json()) as FollowBody;
    const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (targetUserId === sessionUser.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, banned: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.banned) {
      return NextResponse.json({ error: "Cannot follow this user" }, { status: 400 });
    }

    const existed = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUser.id,
          followingId: targetUserId,
        },
      },
      select: { id: true },
    });

    if (existed) {
      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: "Already followed",
      });
    }

    await prisma.follow.create({
      data: {
        followerId: sessionUser.id,
        followingId: targetUserId,
      },
    });

    await createUserNotificationIfEnabled({
      type: "FOLLOW_USER",
      senderId: sessionUser.id,
      receiverId: targetUserId,
    });

    return NextResponse.json({
      success: true,
      isFollowing: true,
      message: `Followed ${targetUser.name || "user"}`,
    });
  } catch (error) {
    console.error("App follow create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSessionUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = (await request.json()) as FollowBody;
    const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: sessionUser.id,
        followingId: targetUserId,
      },
    });

    await prisma.notification.deleteMany({
      where: {
        type: "FOLLOW_USER",
        senderId: sessionUser.id,
        receiverId: targetUserId,
      },
    });

    return NextResponse.json({
      success: true,
      isFollowing: false,
      deleted: deleted.count > 0,
    });
  } catch (error) {
    console.error("App follow delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
