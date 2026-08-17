import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCOSPublicUrl, uploadToCOS } from "@/lib/cos";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";
import { enqueueMediaCleanupTask } from "@/lib/media-cleanup";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_STORAGE_BYTES = 1024 * 1024 * 1024;
const PAGE_SIZE = 30;
const STALE_PENDING_MS = 60 * 60 * 1000;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function jsonAsset(asset: {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  createdAt: Date;
}) {
  return {
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  };
}

async function cleanupStalePendingAssets(userId: string) {
  const staleBefore = new Date(Date.now() - STALE_PENDING_MS);
  const staleAssets = await prisma.editorImageAsset.findMany({
    where: {
      userId,
      status: "PENDING",
      createdAt: { lt: staleBefore },
    },
    select: { id: true, objectKey: true, fileSize: true },
  });

  await Promise.all(staleAssets.map(async (asset) => {
    const removed = await prisma.$transaction(async (tx) => {
      const result = await tx.editorImageAsset.deleteMany({
        where: { id: asset.id, userId, status: "PENDING" },
      });

      if (result.count > 0) {
        await enqueueMediaCleanupTask({
          objectKey: asset.objectKey,
          resourceType: "EDITOR_IMAGE",
          reason: "UPLOAD_EXPIRED",
          ownerId: userId,
        }, tx);
        await tx.user.update({
          where: { id: userId },
          data: { editorImageBytesUsed: { decrement: asset.fileSize } },
        });
      }

      return result.count > 0;
    });

    if (removed) {
      console.info("Queued stale editor image asset for COS cleanup", { objectKey: asset.objectKey });
    }
  }));
}

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.user.id;

  try {
    await cleanupStalePendingAssets(userId);

    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const [user, assets] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { editorImageBytesUsed: true },
      }),
      prisma.editorImageAsset.findMany({
        where: { userId, status: "READY" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          url: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const hasMore = assets.length > PAGE_SIZE;
    const page = hasMore ? assets.slice(0, PAGE_SIZE) : assets;
    const usedBytes = user?.editorImageBytesUsed ?? 0;

    return NextResponse.json({
      assets: page.map(jsonAsset),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
      usedBytes,
      maxBytes: MAX_STORAGE_BYTES,
    });
  } catch (error) {
    console.error("List editor image assets error", error);
    return NextResponse.json({ error: "Failed to load image pool" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return auth.response;
  }
  const userId = auth.user.id;

  try {
    await cleanupStalePendingAssets(userId);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are supported" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Each image must be between 1 byte and 10 MiB" },
        { status: 400 },
      );
    }

    const id = randomUUID();
    const date = new Date();
    const objectKey = [
      "editor-pool",
      userId,
      String(date.getUTCFullYear()),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      `${id}.${extension}`,
    ].join("/");
    const url = getCOSPublicUrl(objectKey);

    const reserved = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE \`User\`
        SET \`editorImageBytesUsed\` = \`editorImageBytesUsed\` + ${file.size}
        WHERE \`id\` = ${userId}
          AND \`editorImageBytesUsed\` <= ${MAX_STORAGE_BYTES - file.size}
      `;

      if (updated === 0) {
        return null;
      }

      return tx.editorImageAsset.create({
        data: {
          id,
          userId,
          objectKey,
          url,
          fileName: file.name.slice(0, 191),
          fileSize: file.size,
          mimeType: file.type,
          status: "PENDING",
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          status: true,
          createdAt: true,
        },
      });
    });

    if (!reserved) {
      return NextResponse.json({ error: "Image pool storage limit reached" }, { status: 413 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await uploadToCOS(buffer, objectKey);
      const asset = await prisma.editorImageAsset.update({
        where: { id },
        data: { status: "READY" },
        select: {
          id: true,
          url: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          status: true,
          createdAt: true,
        },
      });
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { editorImageBytesUsed: true },
      });

      return NextResponse.json({
        asset: jsonAsset(asset),
        usedBytes: user.editorImageBytesUsed,
        maxBytes: MAX_STORAGE_BYTES,
      }, { status: 201 });
    } catch (error) {
      console.error("Upload editor image asset error", error);
      await prisma.$transaction(async (tx) => {
        const deleted = await tx.editorImageAsset.deleteMany({ where: { id, userId } });
        if (deleted.count > 0) {
          await enqueueMediaCleanupTask({
            objectKey,
            resourceType: "EDITOR_IMAGE",
            reason: "UPLOAD_EXPIRED",
            ownerId: userId,
          }, tx);
          await tx.user.update({
            where: { id: userId },
            data: { editorImageBytesUsed: { decrement: file.size } },
          });
        }
      });

      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
  } catch (error) {
    console.error("Create editor image asset error", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
