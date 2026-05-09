import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/follow/connections
 * 获取用户的关注列表或粉丝列表
 *
 * 查询参数:
 * - userId: string - 目标用户 ID（可选，默认为当前用户）
 * - type: "following" | "followers" - 列表类型（必填）
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const type = searchParams.get("type"); // "following" or "followers"

    if (!type || (type !== "following" && type !== "followers")) {
      return NextResponse.json(
        { error: "无效的列表类型" },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;
    const isOwnProfile = currentUserId === userId;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    let connections: any[] = [];
    let total = 0;

    if (type === "following") {
      // 获取关注列表
      const result = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      connections = result.map((follow) => ({
        user: follow.following,
        followedAt: follow.createdAt,
      }));
      total = result.length;
    } else {
      // 获取粉丝列表
      const result = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      connections = result.map((follow) => ({
        user: follow.follower,
        followedAt: follow.createdAt,
      }));
      total = result.length;
    }

    // 获取当前用户对这些用户的关注状态
    let followStatus: Record<string, boolean> = {};
    if (isOwnProfile && connections.length > 0) {
      const userIds = connections.map((c) => c.user.id);
      const follows = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: userIds },
        },
      });

      followStatus = follows.reduce((acc, follow) => {
        acc[follow.followingId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    const connectionsWithStatus = connections.map((c) => ({
      ...c,
      isFollowing: followStatus[c.user.id] || false,
    }));

    return NextResponse.json({
      user,
      type,
      connections: connectionsWithStatus,
      total,
      isOwnProfile,
    });
  } catch (error) {
    console.error("获取关注列表失败:", error);
    return NextResponse.json(
      { error: "获取关注列表失败" },
      { status: 500 }
    );
  }
}
