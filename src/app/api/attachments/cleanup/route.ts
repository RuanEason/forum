import { NextResponse } from "next/server";
import { runMediaCleanup } from "@/lib/media-cleanup";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") || "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMediaCleanup({ batchSize: 100 });
    return NextResponse.json({
      ok: result.featureEnabled,
      cleaned: result.queuedExpiredMedia + result.succeeded,
      result,
    });
  } catch (error) {
    console.error("Attachment cleanup error:", error);
    return NextResponse.json({ error: "Failed to clean stale attachments" }, { status: 500 });
  }
}
