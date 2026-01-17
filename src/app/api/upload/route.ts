import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
      { status: 400 }
    );
  }

  // Validate file type (specific check)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  // Always use .webp for optimized images
  const filename = `${uuidv4()}.webp`;
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const filepath = path.join(uploadDir, filename);

  try {
    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });
    
    // Process image with sharp
    // 1. Resize if too large (max width 1920px)
    // 2. Convert to WebP
    // 3. Compress (quality 80)
    await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Ensure the URL is absolute or relative to the root, but consistent.
    // Using a relative path starting with / is correct for Next.js public folder.
    // Use the API route to serve the file to avoid caching issues in production
    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Error saving file" }, { status: 500 });
  }
}