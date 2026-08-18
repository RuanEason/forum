import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server-auth";

export async function POST() {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

    const result = await prisma.emailChangeToken.updateMany({
      where: {
        userId: auth.user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      cancelled: result.count > 0,
      message: result.count > 0 ? "邮箱变更已取消" : "没有待确认的邮箱变更",
    });
  } catch (error) {
    console.error("Email change cancellation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
