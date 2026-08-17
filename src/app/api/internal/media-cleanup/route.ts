import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  auditCOSOrphans,
  runMediaCleanup,
} from "@/lib/media-cleanup";

function hasValidCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const provided = request.headers.get("x-cron-secret")?.trim() || bearer?.trim() || "";
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      batchSize?: unknown;
      dryRun?: unknown;
      retryFailed?: unknown;
      auditOrphans?: unknown;
      orphanLimit?: unknown;
    };
    const batchSize = typeof body.batchSize === "number" ? body.batchSize : undefined;
    const dryRun = body.dryRun === true;
    const retryFailed = body.retryFailed === true;
    const result = await runMediaCleanup({ batchSize, dryRun, retryFailed });
    const audit = body.auditOrphans === true
      ? await auditCOSOrphans({
          limit: typeof body.orphanLimit === "number" ? body.orphanLimit : undefined,
        })
      : undefined;

    if (!result.featureEnabled && !dryRun) {
      return NextResponse.json(
        { error: "Media cleanup feature is disabled", result, audit },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, result, audit });
  } catch (error) {
    console.error("Media cleanup task error:", error);
    return NextResponse.json({ error: "Failed to run media cleanup" }, { status: 500 });
  }
}
