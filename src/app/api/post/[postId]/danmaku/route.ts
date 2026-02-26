import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_CONTENT_LENGTH = 50;
const DEFAULT_TIME_WINDOW_MS = 90_000;
const MAX_TIME_WINDOW_MS = 5 * 60_000;
const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 500;
const RATE_LIMIT_WINDOW_MS = 3_000;
const DEFAULT_DANMAKU_COLOR = "#FFFFFF";
const ANON_COOKIE_NAME = "anon_danmaku_id";
const LIGHT_BLOCKED_WORDS = ["nmsl", "cnm", "sb"] as const;

type SessionShape = {
  user?: {
    id?: string;
  };
} | null;

type DanmakuPayload = {
  content?: unknown;
  timeMs?: unknown;
  type?: unknown;
  color?: unknown;
};

function normalizeId(value: string): string {
  return value.trim();
}

function parseInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "0.0.0.0";
}

function buildAnonId(request: NextRequest): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "";
  const entropy = randomUUID();
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${entropy}`)
    .digest("hex")
    .slice(0, 32);
}

function isValidAnonId(value: string | undefined): value is string {
  if (!value) return false;
  return /^[a-zA-Z0-9_-]{12,64}$/.test(value);
}

function resolveAnonId(request: NextRequest): { anonId: string; shouldSetCookie: boolean } {
  const cookieAnonId = request.cookies.get(ANON_COOKIE_NAME)?.value?.trim();
  if (isValidAnonId(cookieAnonId)) {
    return {
      anonId: cookieAnonId,
      shouldSetCookie: false,
    };
  }

  const headerAnonId = request.headers.get("x-anon-id")?.trim();
  if (isValidAnonId(headerAnonId)) {
    return {
      anonId: headerAnonId,
      shouldSetCookie: true,
    };
  }

  return {
    anonId: buildAnonId(request),
    shouldSetCookie: true,
  };
}

function applyAnonCookie(response: NextResponse, anonId: string): void {
  response.cookies.set({
    name: ANON_COOKIE_NAME,
    value: anonId,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

function htmlEscape(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function containsLightBlockedWord(input: string): boolean {
  const normalized = input.toLowerCase();
  return LIGHT_BLOCKED_WORDS.some((word) => normalized.includes(word));
}

function normalizeContent(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  const charLength = [...trimmed].length;
  if (charLength < 1 || charLength > MAX_CONTENT_LENGTH) {
    return null;
  }

  if (containsLightBlockedWord(trimmed)) {
    return null;
  }

  return htmlEscape(trimmed);
}

function normalizeTimeMs(input: unknown): number | null {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return null;
  }

  const normalized = Math.round(input);
  if (normalized < 0) {
    return null;
  }

  return normalized;
}

function normalizeColor(input: unknown): string {
  if (typeof input !== "string") {
    return DEFAULT_DANMAKU_COLOR;
  }

  const normalized = input.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    return DEFAULT_DANMAKU_COLOR;
  }

  return normalized;
}

async function ensureVideoPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      postType: true,
    },
  });

  if (!post) {
    return { ok: false as const, response: NextResponse.json({ error: "Post not found" }, { status: 404 }) };
  }

  if (post.postType !== "VIDEO") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Danmaku is only available for video posts" }, { status: 400 }),
    };
  }

  return { ok: true as const, postId: post.id };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const normalizedPostId = normalizeId(postId);

    if (!normalizedPostId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const postGuard = await ensureVideoPost(normalizedPostId);
    if (!postGuard.ok) {
      return postGuard.response;
    }

    const { searchParams } = new URL(request.url);
    const fromMs = Math.max(0, parseInteger(searchParams.get("fromMs"), 0));
    const requestedToMs = parseInteger(searchParams.get("toMs"), fromMs + DEFAULT_TIME_WINDOW_MS);
    const limit = clamp(parseInteger(searchParams.get("limit"), DEFAULT_LIMIT), 1, MAX_LIMIT);
    const toMs = clamp(requestedToMs, fromMs, fromMs + MAX_TIME_WINDOW_MS);

    const items = await prisma.danmaku.findMany({
      where: {
        postId: normalizedPostId,
        timeMs: {
          gte: fromMs,
          lte: toMs,
        },
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        anonId: true,
        content: true,
        timeMs: true,
        type: true,
        color: true,
        fontSize: true,
        createdAt: true,
      },
      orderBy: [
        { timeMs: "asc" },
        { createdAt: "asc" },
      ],
      take: limit,
    });

    const response = NextResponse.json({
      items,
      fromMs,
      toMs,
    });

    const { anonId, shouldSetCookie } = resolveAnonId(request);
    if (shouldSetCookie) {
      applyAnonCookie(response, anonId);
    }

    return response;
  } catch (error) {
    console.error("Get danmaku error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await context.params;
    const normalizedPostId = normalizeId(postId);

    if (!normalizedPostId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const postGuard = await ensureVideoPost(normalizedPostId);
    if (!postGuard.ok) {
      return postGuard.response;
    }

    const session = (await getServerSession(authOptions)) as SessionShape;
    const payload = (await request.json()) as DanmakuPayload;

    const normalizedContent = normalizeContent(payload.content);
    if (!normalizedContent) {
      return NextResponse.json({ error: "content must be 1-50 chars and pass basic checks" }, { status: 400 });
    }

    const normalizedTimeMs = normalizeTimeMs(payload.timeMs);
    if (normalizedTimeMs === null) {
      return NextResponse.json({ error: "timeMs must be a non-negative number" }, { status: 400 });
    }

    const userId = session?.user?.id || null;
    const isLoggedIn = Boolean(userId);
    const { anonId, shouldSetCookie } = resolveAnonId(request);

    const limitedBy = isLoggedIn
      ? { userId }
      : { anonId };

    const latest = await prisma.danmaku.findFirst({
      where: limitedBy,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (latest) {
      const elapsed = Date.now() - latest.createdAt.getTime();
      if (elapsed < RATE_LIMIT_WINDOW_MS) {
        return NextResponse.json(
          { error: "Too many danmakus, please wait 3 seconds" },
          { status: 429 },
        );
      }
    }

    const normalizedType = payload.type === "SCROLL" ? "SCROLL" : "SCROLL";
    const normalizedColor = isLoggedIn ? normalizeColor(payload.color) : DEFAULT_DANMAKU_COLOR;

    const danmaku = await prisma.danmaku.create({
      data: {
        postId: normalizedPostId,
        userId,
        anonId: isLoggedIn ? null : anonId,
        content: normalizedContent,
        timeMs: normalizedTimeMs,
        type: normalizedType,
        color: normalizedColor,
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        anonId: true,
        content: true,
        timeMs: true,
        type: true,
        color: true,
        fontSize: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({ danmaku }, { status: 201 });
    if (!isLoggedIn && shouldSetCookie) {
      applyAnonCookie(response, anonId);
    }

    return response;
  } catch (error) {
    console.error("Create danmaku error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
