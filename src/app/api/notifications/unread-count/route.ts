import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 200 }); // Return 0 if not logged in
    }

    const count = await prisma.notification.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Get unread count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
