import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server-auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCurrentUser();
    const { id } = await context.params;

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

    const isOwner = auth.ok && auth.user.id === videoAsset.ownerId;
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
