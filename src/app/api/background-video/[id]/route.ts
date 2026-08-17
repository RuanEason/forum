import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBackgroundVideoPublicConstraints } from "@/lib/video";
import { requireCurrentUser } from "@/lib/server-auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

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
        rawObjectKey: true,
        rawUrl: true,
        coverUrl: true,
        coverObjectKey: true,
        durationSec: true,
        width: true,
        height: true,
        bitrateKbps: true,
        errorCode: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!videoAsset || videoAsset.ownerId !== auth.user.id) {
      return NextResponse.json({ error: "Background video asset not found" }, { status: 404 });
    }

    const constraints = getBackgroundVideoPublicConstraints();
    if (!videoAsset.rawObjectKey.startsWith(constraints.rawPrefix)) {
      return NextResponse.json({ error: "Background video asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: videoAsset.id,
      status: videoAsset.status,
      rawUrl: videoAsset.rawUrl,
      videoUrl: videoAsset.coverUrl,
      videoObjectKey: videoAsset.coverObjectKey,
      durationSec: videoAsset.durationSec,
      width: videoAsset.width,
      height: videoAsset.height,
      bitrateKbps: videoAsset.bitrateKbps,
      errorCode: videoAsset.errorCode,
      errorMessage: videoAsset.errorMessage,
      createdAt: videoAsset.createdAt,
      updatedAt: videoAsset.updatedAt,
    });
  } catch (error) {
    console.error("Get background video status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
