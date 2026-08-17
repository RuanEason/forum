import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageUser, requireAdminUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json() as { userId?: unknown; banned?: unknown };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const banned = body.banned;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (typeof banned !== "boolean") {
      return NextResponse.json({ error: "banned must be a boolean" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageUser(auth.user, targetUser)) {
      return NextResponse.json({ error: "You cannot manage this administrator" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
      },
    });

    return NextResponse.json({ message: `User ${banned ? "banned" : "unbanned"} successfully`, user }, { status: 200 });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
