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

function firstStringFromSources(sources: unknown[], paths: string[]): string | undefined {
  for (const source of sources) {
    const value = firstString(source, paths);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function pickFirstItem(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
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

function inferStatusFromEntries(entries: Array<{ key: string; value: Primitive }>): string | undefined {
  for (const entry of entries) {
    if (typeof entry.value !== "string") {
      continue;
    }

    const key = entry.key.toLowerCase();
    const value = entry.value.trim();
    if (!value) {
      continue;
    }

    if (!/(state|status|code|result)/.test(key)) {
      continue;
    }

    if (isSuccessState(value) || isFailedState(value)) {
      return value;
    }
  }

  return undefined;
}

function isVariantPlaylist(objectKey: string): boolean {
  const normalized = objectKey.toLowerCase();
  return /(?:^|[\/_-])(144|180|240|360|480|540|720|1080|1440|2160)p(?:[._-]|$)/.test(normalized);
}

function isExplicitMasterPlaylist(objectKey: string): boolean {
  const normalized = objectKey.toLowerCase();
  return /(?:^|\/)[^/]*_master\.m3u8$/.test(normalized)
    || /(?:^|\/)master\.m3u8$/.test(normalized);
}

function hasMasterKeyword(objectKey: string): boolean {
  return /(?:^|[\/_-])master(?:[\/_.-]|$)/i.test(objectKey);
}

function selectBestHlsMasterObjectKey(values: string[]): string | undefined {
  const objectKeys = values
    .map((value) => value.trim())
    .filter((value) => /\.m3u8(?:$|\?)/i.test(value))
    .map((value) => normalizeObjectKey(value))
    .filter(Boolean);

  const uniqueObjectKeys = [...new Set(objectKeys)];
  if (!uniqueObjectKeys.length) {
    return undefined;
  }

  const nonVariantObjectKeys = uniqueObjectKeys.filter((candidate) => !isVariantPlaylist(candidate));
  if (!nonVariantObjectKeys.length) {
    return undefined;
  }

  const explicitMaster = nonVariantObjectKeys.find((candidate) => isExplicitMasterPlaylist(candidate));
  if (explicitMaster) {
    return explicitMaster;
  }

  const keywordMaster = nonVariantObjectKeys.find((candidate) =>
    hasMasterKeyword(candidate),
  );
  if (keywordMaster) {
    return keywordMaster;
  }

  if (nonVariantObjectKeys.length === 1) {
    return nonVariantObjectKeys[0];
  }

  return undefined;
}

function getWorkflowExecution(body: unknown): unknown {
  return getByPath(body, "WorkflowExecution")
    || getByPath(body, "workflowExecution")
    || getByPath(body, "Response.WorkflowExecution")
    || getByPath(body, "response.WorkflowExecution");
}

function collectWorkflowTaskResultValues(body: unknown): string[] {
  const workflowExecution = getWorkflowExecution(body);
  if (!isObject(workflowExecution)) {
    return [];
  }

  const tasksRaw = workflowExecution.Tasks;
  if (!Array.isArray(tasksRaw)) {
    return [];
  }

  const values: string[] = [];

  for (const task of tasksRaw) {
    if (!isObject(task)) {
      continue;
    }

    const state = typeof task.State === "string" ? task.State.trim() : "";
    if (state && !isSuccessState(state)) {
      continue;
    }

    const resultInfo = task.ResultInfo;
    if (!isObject(resultInfo)) {
      continue;
    }

    const objectInfoRaw = resultInfo.ObjectInfo;
    const objectInfoList = Array.isArray(objectInfoRaw)
      ? objectInfoRaw
      : objectInfoRaw ? [objectInfoRaw] : [];

    for (const objectInfo of objectInfoList) {
      if (!isObject(objectInfo)) {
        continue;
      }

      const objectName = typeof objectInfo.ObjectName === "string" ? objectInfo.ObjectName.trim() : "";
      const objectUrl = typeof objectInfo.ObjectUrl === "string" ? objectInfo.ObjectUrl.trim() : "";

      if (objectName) {
        values.push(objectName);
      }
      if (objectUrl) {
        values.push(objectUrl);
      }
    }
  }

  return values;
}

function extractCallbackPayload(body: unknown) {
  const jobsDetailRaw = getByPath(body, "JobsDetail")
    || getByPath(body, "jobsDetail")
    || getByPath(body, "Response.JobsDetail")
    || getByPath(body, "response.JobsDetail")
    || body;
  const jobsDetail = pickFirstItem(jobsDetailRaw);
  const workflowExecution = getWorkflowExecution(body);
  const sources = [body, jobsDetail, workflowExecution];
  const entries: Array<{ key: string; value: Primitive }> = [];
  collectPrimitiveValues(body, entries);
  const workflowTaskResultValues = collectWorkflowTaskResultValues(body);

  const primitiveStringValues = entries
    .map((item) => item.value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const stringValues = [...workflowTaskResultValues, ...primitiveStringValues];

  const eventName = firstStringFromSources(sources, [
    "EventName",
    "eventName",
  ]);

  const workflowRunId = firstStringFromSources(sources, [
    "WorkflowExecution.RunId",
    "workflowExecution.RunId",
    "Response.WorkflowExecution.RunId",
    "JobsDetail.WorkflowExecutionId",
    "JobsDetail.WorkflowRunId",
    "jobsDetail.WorkflowExecutionId",
    "jobsDetail.WorkflowRunId",
    "JobsDetail.Workflow.RunId",
    "jobsDetail.Workflow.RunId",
    "Response.JobsDetail.Workflow.RunId",
    "Response.JobsDetail.WorkflowExecutionId",
    "Response.JobsDetail.WorkflowRunId",
    "WorkflowExecutionId",
    "WorkflowRunId",
    "RunId",
    "JobId",
    "workflowExecutionId",
    "workflowRunId",
    "runId",
    "jobId",
  ]);

  const rawStatus = firstStringFromSources(sources, [
    "WorkflowExecution.State",
    "workflowExecution.State",
    "Response.WorkflowExecution.State",
    "JobsDetail.State",
    "JobsDetail.Status",
    "JobsDetail.Code",
    "jobsDetail.State",
    "jobsDetail.Status",
    "jobsDetail.Code",
    "Response.JobsDetail.State",
    "Response.JobsDetail.Status",
    "Response.JobsDetail.Code",
    "State",
    "Status",
    "Code",
    "Result",
    "state",
    "status",
    "code",
    "result",
  ]) || inferStatusFromEntries(entries) || "UNKNOWN";

  const sourceKey = firstStringFromSources(sources, [
    "WorkflowExecution.Object",
    "workflowExecution.Object",
    "Response.WorkflowExecution.Object",
    "JobsDetail.Object.Key",
    "JobsDetail.Input.Key",
    "JobsDetail.Input.Object",
    "JobsDetail.Input.Object.Key",
    "jobsDetail.Object.Key",
    "jobsDetail.Input.Key",
    "jobsDetail.Input.Object",
    "jobsDetail.Input.Object.Key",
    "Response.JobsDetail.Object.Key",
    "Response.JobsDetail.Input.Key",
    "Response.JobsDetail.Input.Object",
    "Response.JobsDetail.Input.Object.Key",
    "Object.Key",
    "Input.Key",
    "Input.Object",
    "Input.Object.Key",
    "Object",
    "object",
    "input.key",
    "input.object",
  ]);

  const rawPrefixSource = sourceKey
    || stringValues.find((value) => value.includes("videos/raw/"))
    || "";

  const normalizedSourceKey = normalizeObjectKey(rawPrefixSource);
  const explicitPlaylistCandidate = firstStringFromSources(sources, [
    "JobsDetail.Output.Playlist",
    "JobsDetail.Output.Object",
    "JobsDetail.Output.Key",
    "jobsDetail.Output.Playlist",
    "jobsDetail.Output.Object",
    "jobsDetail.Output.Key",
    "Response.JobsDetail.Output.Playlist",
    "Response.JobsDetail.Output.Object",
    "Response.JobsDetail.Output.Key",
    "Output.Playlist",
    "Output.Object",
    "Output.Key",
    "Playlist",
    "playlist",
  ]);
  const hlsMasterCandidate = selectBestHlsMasterObjectKey([
    ...(explicitPlaylistCandidate ? [explicitPlaylistCandidate] : []),
    ...stringValues,
  ]);
  const coverCandidate = stringValues.find((value) =>
    /\.(jpg|jpeg|png|webp)$/i.test(value),
  );

  const hlsMasterObjectKey = hlsMasterCandidate ? normalizeObjectKey(hlsMasterCandidate) : undefined;
  const coverObjectKey = coverCandidate ? normalizeObjectKey(coverCandidate) : undefined;

  const durationSec = extractNumber(entries, [/duration/, /durationsec/]);
  const width = extractNumber(entries, [/width/]);
  const height = extractNumber(entries, [/height/]);
  const bitrateKbps = extractNumber(entries, [/bitrate/, /kbps/]);

  const errorCode = firstStringFromSources(sources, [
    "JobsDetail.ErrorCode",
    "jobsDetail.ErrorCode",
    "Response.JobsDetail.ErrorCode",
    "ErrorCode",
    "errorCode",
    "Code",
    "code",
  ]);
  const errorMessage = firstStringFromSources(sources, [
    "JobsDetail.ErrorMessage",
    "JobsDetail.Message",
    "jobsDetail.ErrorMessage",
    "jobsDetail.Message",
    "Response.JobsDetail.ErrorMessage",
    "Response.JobsDetail.Message",
    "ErrorMessage",
    "Message",
    "errorMessage",
    "message",
  ]);

  const success = isSuccessState(rawStatus);
  const failed = isFailedState(rawStatus);

  return {
    eventName,
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

    if (parsed.eventName?.toLowerCase() === "workflowstart") {
      return NextResponse.json({ ok: true, message: "WorkflowStart callback ignored" });
    }

    if (videoAsset.status === "READY" && parsed.success) {
      return NextResponse.json({ ok: true, message: "Callback already applied (READY)" });
    }

    if (videoAsset.status === "FAILED" && parsed.failed) {
      return NextResponse.json({ ok: true, message: "Callback already applied (FAILED)" });
    }

    if (parsed.success && !parsed.hlsMasterObjectKey) {
      if (parsed.eventName?.toLowerCase() === "taskfinish") {
        return NextResponse.json({ ok: true, message: "TaskFinish callback without master ignored" });
      }

      await prisma.videoAsset.update({
        where: { id: videoAsset.id },
        data: {
          status: "FAILED",
          workflowRunId: parsed.workflowRunId || undefined,
          errorCode: "CALLBACK_PARSE_ERROR",
          errorMessage: "Workflow succeeded but no master m3u8 output path was found in callback payload",
        },
      });

      return NextResponse.json({ ok: false, error: "Missing master hls output in callback payload" }, { status: 400 });
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

    if (!parsed.failed) {
      await prisma.videoAsset.update({
        where: { id: videoAsset.id },
        data: {
          status: "FAILED",
          workflowRunId: parsed.workflowRunId || undefined,
          errorCode: "CALLBACK_PARSE_ERROR",
          errorMessage: `Unable to determine workflow status from callback payload`,
        },
      });

      return NextResponse.json(
        { ok: false, error: "Unable to determine workflow status from callback payload" },
        { status: 400 },
      );
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
