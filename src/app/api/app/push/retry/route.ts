import { NextResponse } from "next/server";
import { processPendingPushLogs } from "@/lib/push";
import { requireAdminUser } from "@/lib/server-auth";

export async function POST() {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return auth.response;
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
