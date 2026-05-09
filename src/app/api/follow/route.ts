import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationPush } from "@/lib/push";

/**
 * POST /api/follow
 * 关注或取消关注用户
 *
 * 请求体:
 * - followingId: string - 被关注用户的 ID
 * - - follow: boolean - true 关注, false 取消关注
 *
 * 权限: 已登录用户
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { followingId, follow } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "缺少被关注用户 ID" },
        { status: 400 }
      );
    }

    const followerId = session.user.id;

    // 不能关注自己
    if (followerId === followingId) {
      return NextResponse.json(
        { error: "不能关注自己" },
        { status: 400 }
      );
    }

    // 检查被关注的用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true, banned: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    if (targetUser.banned) {
      return NextResponse.json(
        { error: "无法关注被封禁的用户" },
        { status: 400 }
      );
    }

    if (follow) {
      // 关注用户
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existingFollow) {
        return NextResponse.json(
          { error: "已经关注了该用户" },
          { status: 400 }
        );
      }

      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // 创建关注通知
      const notification = await prisma.notification.create({
        data: {
          type: "FOLLOW_USER",
          senderId: followerId,
          receiverId: followingId,
        },
      });

      enqueueNotificationPush(notification.id);

      return NextResponse.json({
        success: true,
        following: true,
        message: `已关注 ${targetUser.name || "用户"}`,
      });
    } else {
      // 取消关注
      const deleted = await prisma.follow.deleteMany({
        where: {
          followerId,
          followingId,
        },
      });

      if (deleted.count === 0) {
        return NextResponse.json(
          { error: "尚未关注该用户" },
          { status: 400 }
        );
      }

      // 删除相关的关注通知
      await prisma.notification.deleteMany({
        where: {
          type: "FOLLOW_USER",
          senderId: followerId,
          receiverId: followingId,
        },
      });

      return NextResponse.json({
        success: true,
        following: false,
        message: `已取消关注 ${targetUser.name || "用户"}`,
      });
    }
  } catch (error) {
    console.error("关注操作失败:", error);
    return NextResponse.json(
      { error: "关注操作失败" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/follow
 * 检查是否已关注某个用户
 *
 * 查询参数:
 * - followingId: string - 被关注用户的 ID
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
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json(
        { error: "缺少被关注用户 ID" },
        { status: 400 }
      );
    }

    const followerId = session.user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({
      following: !!follow,
    });
  } catch (error) {
    console.error("查询关注状态失败:", error);
    return NextResponse.json(
      { error: "查询关注状态失败" },
      { status: 500 }
    );
  }
}
