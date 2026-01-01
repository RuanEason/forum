import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 200 }); // Return 0 if not logged in
    }

    const count = await prisma.notification.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Get unread count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
