import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = (await getServerSession(authOptions)) as { user?: { id?: string } } | null;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const videoAsset = await prisma.videoAsset.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
        rawUrl: true,
        hlsMasterUrl: true,
        coverUrl: true,
        durationSec: true,
        width: true,
        height: true,
        bitrateKbps: true,
        errorCode: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        post: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!videoAsset) {
      return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
    }

    const isOwner = Boolean(session?.user?.id && session.user.id === videoAsset.ownerId);
    if (isOwner) {
      return NextResponse.json(videoAsset);
    }

    const canReadPublicReadyVideo = videoAsset.status === "READY" && Boolean(videoAsset.post?.id);
    if (!canReadPublicReadyVideo) {
      return NextResponse.json({ error: "Video asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: videoAsset.id,
      status: videoAsset.status,
      hlsMasterUrl: videoAsset.hlsMasterUrl,
      coverUrl: videoAsset.coverUrl,
      durationSec: videoAsset.durationSec,
      width: videoAsset.width,
      height: videoAsset.height,
      bitrateKbps: videoAsset.bitrateKbps,
    });
  } catch (error) {
    console.error("Get video status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
