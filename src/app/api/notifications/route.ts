import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
          }
        },
        // We can't directly include comment because the relation isn't defined in the Notification model strictly with full relation fields
        // But we added commentId to Notification. 
        // Let's add relation to Notification model for comment if possible, OR fetch manually if not.
        // Looking at schema: `commentId String?` but no relation defined.
        // Let's rely on postId for navigation mainly, but for context (e.g. "reply to your comment: [content]"), we might want comment content.
        // Since we didn't add relation for comment in schema (just commentId), we won't include it directly. 
        // Wait, the prompt asked for "post/comment abstract". 
        // Ideally we should have a relation, but I didn't add it in Phase 1 to avoid complexity if not requested.
        // Actually, let's just fetch notifications first. 
        // If I need comment content, I should have added relation. 
        // Let's check schema again. 
        // `commentId` is there. No relation.
        // I will fetch comments separately or modify schema? 
        // Modifying schema again is Phase 1. 
        // Let's stick to what we have. If we need comment summary, we can do a second query or just show "comment".
        // Actually, for "REPLY_COMMENT", it's nice to show the comment text.
        // But for now let's return what we have.
      },
      take: 20, // Limit to 20 for now
    });
    
    // To get comment details effectively without N+1, we might want to fetch comments if needed.
    // Or just let frontend handle it? No, backend should provide summary.
    // Let's manually fetch related comments if we have commentIds.
    const commentIds = notifications
      .map(n => n.commentId)
      .filter((id): id is string => !!id);
      
    let commentsMap: Record<string, { content: string }> = {};
    if (commentIds.length > 0) {
      const comments = await prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, content: true }
      });
      commentsMap = comments.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
    }

    const enrichedNotifications = notifications.map(n => ({
      ...n,
      comment: n.commentId ? commentsMap[n.commentId] : null
    }));

    return NextResponse.json({ notifications: enrichedNotifications }, { status: 200 });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
