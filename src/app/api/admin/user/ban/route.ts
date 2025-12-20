import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, banned }: { userId: string, banned: boolean } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned },
    });

    return NextResponse.json({ message: `User ${banned ? "banned" : "unbanned"} successfully`, user }, { status: 200 });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}