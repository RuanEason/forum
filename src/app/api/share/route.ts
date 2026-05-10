import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SHARE_SOURCES = {
  copy: "copy_web",
  wechat: "wechat_web",
  qq: "qq_web",
  system: "system_web",
  poster: "poster_web",
  download_poster: "download_poster_web",
} as const;

type ShareChannel = keyof typeof SHARE_SOURCES;

type SessionShape = {
  user?: {
    id?: string;
  };
} | null;

function normalizeChannel(channel: unknown): ShareChannel {
  return typeof channel === "string" && channel in SHARE_SOURCES
    ? (channel as ShareChannel)
    : "copy";
}

function createUserVdSource(userId: string) {
  return createHash("sha256").update(`user:${userId}`).digest("hex").slice(0, 32);
}

function createAnonymousVdSource(request: NextRequest) {
  const existing = request.cookies.get("vd_source")?.value;
  if (existing && /^[a-f0-9]{32,64}$/i.test(existing)) {
    return existing.slice(0, 64).toLowerCase();
  }

  return randomBytes(16).toString("hex");
}

function getShareTitle(post: { title: string | null; author: { name: string | null } }) {
  const title = post.title?.trim();
  if (title) {
    return title;
  }

  return `${post.author.name?.trim() || "匿名用户"} 的帖子`;
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as SessionShape;
    const body = await request.json().catch(() => ({}));
    const postId = typeof body.postId === "string" ? body.postId.trim() : "";
    const channel = normalizeChannel(body.channel);

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = session?.user?.id;
    const vdSource = userId ? createUserVdSource(userId) : createAnonymousVdSource(request);
    const shareSource = SHARE_SOURCES[channel];
    const shareUrl = new URL(`/post/${post.id}`, request.nextUrl.origin);
    shareUrl.searchParams.set("share_source", shareSource);
    shareUrl.searchParams.set("vd_source", vdSource);

    const title = getShareTitle(post);
    const text = `${title}\n${shareUrl.toString()}`;

    try {
      await prisma.shareEvent.create({
        data: {
          postId: post.id,
          userId: userId || null,
          channel,
          shareSource,
          vdSource,
          shareUrl: shareUrl.toString(),
          userAgent: request.headers.get("user-agent"),
          referer: request.headers.get("referer"),
        },
      });
    } catch (error) {
      console.error("Failed to record share event:", error);
    }

    const response = NextResponse.json({
      url: shareUrl.toString(),
      title,
      text,
      channel,
      shareSource,
      vdSource,
    });

    response.cookies.set("vd_source", vdSource, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });

    return response;
  } catch (error) {
    console.error("Share API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
