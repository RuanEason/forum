import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetType, targetId }: { targetType: "post" | "comment", targetId: string } = await request.json();

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "targetType and targetId are required" }, { status: 400 });
    }

    const userId = session.user.id;

    if (targetType === "post") {
      const existingLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: targetId,
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.postLike.delete({
          where: {
            id: existingLike.id,
          },
        });
        return NextResponse.json({ message: "Like removed successfully", liked: false }, { status: 200 });
      } else {
        const like = await prisma.postLike.create({
          data: {
            postId: targetId,
            userId,
          },
        });

        // Notification: Like Post
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { authorId: true }
        });

        if (post && post.authorId !== userId) {
          // Check for duplicate unread notification
          const existingNotif = await prisma.notification.findFirst({
            where: {
              type: "LIKE_POST",
              senderId: userId,
              receiverId: post.authorId,
              postId: targetId,
              isRead: false,
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                type: "LIKE_POST",
                senderId: userId,
                receiverId: post.authorId,
                postId: targetId,
              }
            });
          }
        }

        return NextResponse.json({ message: "Liked successfully", liked: true, like }, { status: 201 });
      }
    } else if (targetType === "comment") {
      const existingLike = await prisma.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: targetId,
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.commentLike.delete({
          where: {
            id: existingLike.id,
          },
        });
        return NextResponse.json({ message: "Like removed successfully", liked: false }, { status: 200 });
      } else {
        const like = await prisma.commentLike.create({
          data: {
            commentId: targetId,
            userId,
          },
        });

        // Notification: Like Comment
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { authorId: true, postId: true }
        });

        if (comment && comment.authorId !== userId) {
           // Check for duplicate unread notification
           const existingNotif = await prisma.notification.findFirst({
            where: {
              type: "LIKE_COMMENT",
              senderId: userId,
              receiverId: comment.authorId,
              commentId: targetId,
              isRead: false,
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                type: "LIKE_COMMENT",
                senderId: userId,
                receiverId: comment.authorId,
                postId: comment.postId,
                commentId: targetId,
              }
            });
          }
        }

        return NextResponse.json({ message: "Liked successfully", liked: true, like }, { status: 201 });
      }
    } else {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }
  } catch (error) {
    console.error("Like/Unlike error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}