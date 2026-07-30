import { NextResponse } from "next/server";
import { cleanupStaleAttachmentUploads } from "@/lib/attachment";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") || "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cleaned = await cleanupStaleAttachmentUploads();
    return NextResponse.json({ ok: true, cleaned });
  } catch (error) {
    console.error("Attachment cleanup error:", error);
    return NextResponse.json({ error: "Failed to clean stale attachments" }, { status: 500 });
  }
}
