import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { uploadToCOS } from "@/lib/cos";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { requireActiveUser } from "@/lib/server-auth";
import { enqueueMediaCleanupTask } from "@/lib/media-cleanup";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_COMPRESS_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/gif'];

interface ProcessedUploadResult {
  url: string;
  previewUrl?: string;
  type: 'image' | 'video';
}

async function processImage(file: File, filename: string): Promise<ProcessedUploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.size <= MAX_IMAGE_COMPRESS_SIZE) {
    const originalExt = file.type.split('/')[1];
    const originalFilename = `${filename}.${originalExt}`;
    const cdnUrl = await uploadToCOS(buffer, originalFilename);
    return { url: cdnUrl, type: 'image' };
  }

  const optimizedBuffer = await sharp(buffer)
    .resize(1920, 500, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toBuffer();

  const optimizedFilename = `${filename}_compressed.webp`;
  const cdnUrl = await uploadToCOS(optimizedBuffer, optimizedFilename);
  return { url: cdnUrl, type: 'image' };
}

async function processVideo(file: File, filename: string, ownerId: string): Promise<ProcessedUploadResult> {
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error("因服务器资源紧缺，不支持上传高于100MB视频作为背景，请自行压缩后上传");
  }

  // Only initialize FFmpeg for actual video uploads so image uploads are not blocked by FFmpeg startup issues.
  const { ffmpegInstance } = await import("@/lib/ffmpeg");

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bg-upload-'));
  const inputPath = path.join(tempDir, `input_${filename}${path.extname(file.name)}`);
  const outputPath = path.join(tempDir, `output_${filename}.mp4`);
  const rawPreviewPath = path.join(tempDir, `raw_preview_${filename}.mjpeg`);

  try {
    const bytes = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(bytes));

    await new Promise<void>((resolve, reject) => {
      ffmpegInstance(inputPath)
        .size('1920x?')
        .videoBitrate('2000k')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset medium',
          '-movflags +faststart'
        ])
        .format('mp4')
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(outputPath);
    });

    await new Promise<void>((resolve, reject) => {
      ffmpegInstance(inputPath)
        .outputOptions(['-frames:v 1'])
        .format('mjpeg')
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .save(rawPreviewPath);
    });

    const rawPreviewBuffer = await fs.readFile(rawPreviewPath);
    const previewBuffer = await sharp(rawPreviewBuffer)
      .resize(1920, 500, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();

    const videoBuffer = await fs.readFile(outputPath);

    const videoFilename = `backgrounds/${filename}.mp4`;
    const previewFilename = `backgrounds/${filename}_preview.webp`;

    let videoUrl: string;
    let previewUrl: string;
    try {
      [videoUrl, previewUrl] = await Promise.all([
        uploadToCOS(videoBuffer, videoFilename),
        uploadToCOS(previewBuffer, previewFilename),
      ]);
    } catch (error) {
      await Promise.all([
        enqueueMediaCleanupTask({
          objectKey: videoFilename,
          resourceType: "BACKGROUND_VIDEO_RAW",
          reason: "UPLOAD_EXPIRED",
          ownerId,
        }),
        enqueueMediaCleanupTask({
          objectKey: previewFilename,
          resourceType: "BACKGROUND_VIDEO_COVER",
          reason: "UPLOAD_EXPIRED",
          ownerId,
        }),
      ]);
      throw error;
    }

    return { url: videoUrl, previewUrl, type: 'video' };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();

  if (!auth.ok) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "不支持的文件类型。请上传图片（JPEG、PNG、WebP、GIF）或视频（MP4、MOV）" },
      { status: 400 }
    );
  }

  try {
    const fileId = uuidv4();
    let result: ProcessedUploadResult;

    if (isImage) {
      result = await processImage(file, fileId);
    } else {
      result = await processVideo(file, fileId, auth.user.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading background:", error);
    const errorMessage = error instanceof Error ? error.message : "上传失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
