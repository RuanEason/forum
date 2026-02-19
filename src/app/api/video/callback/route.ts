import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVideoCdnUrl, getVideoCallbackToken, normalizeObjectKey } from "@/lib/video";

type Primitive = string | number | boolean | null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getByPath(source: unknown, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (!isObject(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function firstString(source: unknown, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function collectPrimitiveValues(source: unknown, bucket: Array<{ key: string; value: Primitive }>, parentKey = "") {
  if (Array.isArray(source)) {
    source.forEach((item, index) => {
      collectPrimitiveValues(item, bucket, `${parentKey}[${index}]`);
    });
    return;
  }

  if (isObject(source)) {
    for (const [key, value] of Object.entries(source)) {
      const nextKey = parentKey ? `${parentKey}.${key}` : key;
      collectPrimitiveValues(value, bucket, nextKey);
    }
    return;
  }

  bucket.push({ key: parentKey, value: source as Primitive });
}

function isSuccessState(rawState: string): boolean {
  const value = rawState.toLowerCase();
  return value.includes("success")
    || value.includes("succeed")
    || value.includes("finish")
    || value === "ok"
    || value === "ready";
}

function isFailedState(rawState: string): boolean {
  const value = rawState.toLowerCase();
  return value.includes("fail") || value.includes("error");
}

function extractNumber(
  entries: Array<{ key: string; value: Primitive }>,
  keyMatchers: RegExp[],
): number | undefined {
  for (const entry of entries) {
    if (typeof entry.value !== "number") {
      continue;
    }

    if (keyMatchers.some((matcher) => matcher.test(entry.key.toLowerCase()))) {
      return entry.value;
    }
  }
  return undefined;
}

function extractCallbackPayload(body: unknown) {
  const jobsDetail = getByPath(body, "JobsDetail") || getByPath(body, "jobsDetail") || body;
  const entries: Array<{ key: string; value: Primitive }> = [];
  collectPrimitiveValues(body, entries);

  const stringValues = entries
    .map((item) => item.value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  const workflowRunId = firstString(body, [
    "JobsDetail.WorkflowExecutionId",
    "JobsDetail.WorkflowRunId",
    "jobsDetail.WorkflowExecutionId",
    "jobsDetail.WorkflowRunId",
    "WorkflowExecutionId",
    "WorkflowRunId",
    "RunId",
  ]);

  const rawStatus = firstString(body, [
    "JobsDetail.State",
    "JobsDetail.Status",
    "JobsDetail.Code",
    "jobsDetail.State",
    "jobsDetail.Status",
    "jobsDetail.Code",
    "State",
    "Status",
    "Code",
    "Result",
  ]) || "UNKNOWN";

  const sourceKey = firstString(body, [
    "JobsDetail.Object.Key",
    "JobsDetail.Input.Key",
    "JobsDetail.Input.Object",
    "jobsDetail.Object.Key",
    "jobsDetail.Input.Key",
    "jobsDetail.Input.Object",
    "Object.Key",
    "Input.Key",
    "Input.Object",
  ]);

  const rawPrefixSource = sourceKey
    || stringValues.find((value) => value.includes("videos/raw/"))
    || "";

  const normalizedSourceKey = normalizeObjectKey(rawPrefixSource);
  const hlsMasterCandidate = stringValues.find((value) => value.toLowerCase().endsWith(".m3u8"));
  const coverCandidate = stringValues.find((value) =>
    /\.(jpg|jpeg|png|webp)$/i.test(value),
  );

  const hlsMasterObjectKey = hlsMasterCandidate ? normalizeObjectKey(hlsMasterCandidate) : undefined;
  const coverObjectKey = coverCandidate ? normalizeObjectKey(coverCandidate) : undefined;

  const durationSec = extractNumber(entries, [/duration/, /durationsec/]);
  const width = extractNumber(entries, [/width/]);
  const height = extractNumber(entries, [/height/]);
  const bitrateKbps = extractNumber(entries, [/bitrate/, /kbps/]);

  const errorCode = firstString(body, [
    "JobsDetail.ErrorCode",
    "jobsDetail.ErrorCode",
    "ErrorCode",
  ]);
  const errorMessage = firstString(body, [
    "JobsDetail.ErrorMessage",
    "JobsDetail.Message",
    "jobsDetail.ErrorMessage",
    "jobsDetail.Message",
    "ErrorMessage",
    "Message",
  ]);

  const success = isSuccessState(rawStatus);
  const failed = isFailedState(rawStatus);

  return {
    jobsDetail,
    workflowRunId,
    rawStatus,
    success,
    failed,
    normalizedSourceKey,
    hlsMasterObjectKey,
    coverObjectKey,
    durationSec,
    width,
    height,
    bitrateKbps,
    errorCode,
    errorMessage,
  };
}

export async function POST(request: Request) {
  try {
    const callbackToken = getVideoCallbackToken();
    if (!callbackToken) {
      return NextResponse.json(
        { error: "TENCENT_CI_CALLBACK_TOKEN is not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token || token !== callbackToken) {
      return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
    }

    const rawBody = await request.text();
    let body: unknown;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON callback payload" }, { status: 400 });
    }

    const parsed = extractCallbackPayload(body);
    if (!parsed.normalizedSourceKey) {
      return NextResponse.json({ error: "Unable to locate source object key" }, { status: 400 });
    }

    const videoAsset = await prisma.videoAsset.findUnique({
      where: { rawObjectKey: parsed.normalizedSourceKey },
      select: {
        id: true,
        status: true,
      },
    });

    if (!videoAsset) {
      return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
    }

    if (videoAsset.status === "READY" && parsed.success) {
      return NextResponse.json({ ok: true, message: "Callback already applied (READY)" });
    }

    if (videoAsset.status === "FAILED" && parsed.failed) {
      return NextResponse.json({ ok: true, message: "Callback already applied (FAILED)" });
    }

    if (parsed.success && !parsed.hlsMasterObjectKey) {
      await prisma.videoAsset.update({
        where: { id: videoAsset.id },
        data: {
          status: "FAILED",
          workflowRunId: parsed.workflowRunId || undefined,
          errorCode: "CALLBACK_PARSE_ERROR",
          errorMessage: "Workflow succeeded but no m3u8 output path was found in callback payload",
        },
      });

      return NextResponse.json({ ok: false, error: "Missing hls output in callback payload" }, { status: 400 });
    }

    if (parsed.success) {
      await prisma.videoAsset.update({
        where: { id: videoAsset.id },
        data: {
          status: "READY",
          workflowRunId: parsed.workflowRunId || undefined,
          hlsMasterObjectKey: parsed.hlsMasterObjectKey,
          hlsMasterUrl: parsed.hlsMasterObjectKey ? buildVideoCdnUrl(parsed.hlsMasterObjectKey) : undefined,
          coverObjectKey: parsed.coverObjectKey,
          coverUrl: parsed.coverObjectKey ? buildVideoCdnUrl(parsed.coverObjectKey) : undefined,
          durationSec: parsed.durationSec,
          width: parsed.width ? Math.trunc(parsed.width) : undefined,
          height: parsed.height ? Math.trunc(parsed.height) : undefined,
          bitrateKbps: parsed.bitrateKbps ? Math.trunc(parsed.bitrateKbps) : undefined,
          errorCode: null,
          errorMessage: null,
        },
      });

      return NextResponse.json({ ok: true, status: "READY" });
    }

    await prisma.videoAsset.update({
      where: { id: videoAsset.id },
      data: {
        status: "FAILED",
        workflowRunId: parsed.workflowRunId || undefined,
        errorCode: parsed.errorCode || "WORKFLOW_FAILED",
        errorMessage: parsed.errorMessage || `Workflow failed with status: ${parsed.rawStatus}`,
      },
    });

    return NextResponse.json({ ok: true, status: "FAILED" });
  } catch (error) {
    console.error("Video callback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
