import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { uploadToCOS } from "@/lib/cos";
import { prisma } from "@/lib/prisma";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * 上传图片接口
 * 支持格式: JPEG, PNG, WebP, GIF
 * 处理流程:
 * - 文件 ≤10MB: 保持原图质量，直接上传到腾讯云 COS
 * - 文件 >10MB: 同时上传原图和缩略图（压缩图）
 * 返回格式: { url: string, thumbnailUrl?: string }
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/upload \
 *   -H "Authorization: Bearer <token>" \
 *   -F "file=@image.jpg"
 * ```
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const draftIdRaw = formData.get("draftId");
  const draftId = typeof draftIdRaw === "string" ? draftIdRaw.trim() : "";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  console.log("Upload image:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let linkedDraftId: string | null = null;
  if (draftId) {
    const draft = await prisma.postDraft.findFirst({
      where: {
        id: draftId,
        authorId: session.user.id,
      },
      select: {
        id: true,
      },
    });
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    linkedDraftId = draft.id;
  }

  // Generate unique filenames
  const filename = `images/${uuidv4()}`;
  const originalExt = file.type.split('/')[1]; // 保留原始文件扩展名
  const originalFilename = `${filename}.${originalExt}`;
  const thumbnailFilename = `${filename}_thumbnail.webp`;

  try {
    if (file.size <= MAX_FILE_SIZE) {
      // 文件 ≤10MB: 直接上传原图
      let uploadBuffer = buffer;
      let uploadFilename = originalFilename;

      // 对于非WebP格式，保持原始格式上传
      // 这里可以根据需要调整，现在保持原始格式

      const cdnUrl = await uploadToCOS(uploadBuffer, uploadFilename);
      if (linkedDraftId) {
        const sortOrder = await prisma.draftAsset.count({
          where: {
            draftId: linkedDraftId,
            type: "IMAGE",
          },
        });
        await prisma.draftAsset.create({
          data: {
            draftId: linkedDraftId,
            type: "IMAGE",
            status: "READY",
            progress: 100,
            url: cdnUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            sortOrder,
          },
        });
      }
      return NextResponse.json({ url: cdnUrl });
    } else {
      // 文件 >10MB: 上传原图 + 缩略图

      // 1. 上传原图
      const originalUrl = await uploadToCOS(buffer, originalFilename);

      // 2. 生成并上传缩略图（压缩至80%质量，最大宽度1920px）
      const thumbnailBuffer = await sharp(buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailUrl = await uploadToCOS(thumbnailBuffer, thumbnailFilename);

      if (linkedDraftId) {
        const sortOrder = await prisma.draftAsset.count({
          where: {
            draftId: linkedDraftId,
            type: "IMAGE",
          },
        });
        await prisma.draftAsset.create({
          data: {
            draftId: linkedDraftId,
            type: "IMAGE",
            status: "READY",
            progress: 100,
            url: originalUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            sortOrder,
          },
        });
      }

      return NextResponse.json({
        url: originalUrl,
        thumbnailUrl: thumbnailUrl
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error uploading file" },
      { status: 500 }
    );
  }
}
