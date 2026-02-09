import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { processPendingPushLogs } from "@/lib/push";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = (session as { user?: { id?: string; role?: string } } | null)?.user;

    if (!sessionUser?.id || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const processed = await processPendingPushLogs(100);

    return NextResponse.json({
      success: true,
      processed,
    }, { status: 200 });
  } catch (error) {
    console.error("Push retry process error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
