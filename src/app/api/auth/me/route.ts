import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserLevel } from "@/lib/experience";
import { requireCurrentUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET() {
  const auth = await requireCurrentUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        postViewMode: true,
        coverImage: true,
        showUserData: true,
        notifyReplies: true,
        notifyLikes: true,
        notifyFollows: true,
        experience: true,
        role: true,
        banned: true,
        sessionVersion: true,
        deletionRequestedAt: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      ...user,
      level: getUserLevel(user.experience),
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
