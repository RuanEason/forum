import { NextRequest, NextResponse } from "next/server";
import { buildPublishPayload } from "@/lib/draft";
import { rewardActionExperience } from "@/lib/experience";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
    }

    const payload = await buildPublishPayload(user.id, id);

    const createdPostId = await prisma.$transaction(async (tx) => {
      if (payload.postType === "VIDEO") {
        if (!payload.videoAssetId) {
          throw new Error("videoAssetId is required");
        }

        const videoAsset = await tx.videoAsset.findUnique({
          where: { id: payload.videoAssetId },
          select: {
            id: true,
            ownerId: true,
            status: true,
            post: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!videoAsset || videoAsset.ownerId !== user.id) {
          throw new Error("Video asset not found");
        }
        if (videoAsset.status !== "READY") {
          throw new Error("Video is still processing");
        }
        if (videoAsset.post?.id) {
          throw new Error("Video asset has already been bound to a post");
        }

        if (payload.videoCoverUrl) {
          await tx.videoAsset.update({
            where: { id: videoAsset.id },
            data: {
              coverUrl: payload.videoCoverUrl,
            },
          });
        }
      }

      const post = await tx.post.create({
        data: {
          title: payload.title,
          content: payload.content,
          styleConfig: payload.styleConfig === null
            ? Prisma.JsonNull
            : (payload.styleConfig as Prisma.InputJsonValue),
          styleCss: payload.styleCss,
          authorId: user.id,
          postType: payload.postType,
          visibility: payload.visibility,
          videoId: payload.videoAssetId,
          topicId: payload.topicId,
          images: {
            create: payload.imageUrls.map((url) => ({ url })),
          },
          attachments: {
            create: payload.attachments.map((attachment) => ({
              url: attachment.url,
              fileName: attachment.fileName,
              fileSize: attachment.fileSize,
              mimeType: attachment.mimeType,
            })),
          },
        },
        select: {
          id: true,
        },
      });

      const deleted = await tx.postDraft.deleteMany({
        where: {
          id,
          authorId: user.id,
          publishedPostId: null,
        },
      });

      if (deleted.count === 0) {
        throw new Error("Draft remove after publish failed");
      }

      return post.id;
    });

    try {
      await rewardActionExperience(user.id, "post");
    } catch (error) {
      console.error("Failed to reward post experience:", error);
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: createdPostId,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Publish draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
