import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { uploadToCOS } from "@/lib/cos";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `backgrounds/${uuidv4()}`;

    const optimizedBuffer = await sharp(buffer)
      .resize(1920, 500, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();

    const optimizedFilename = `${filename}_optimized.webp`;

    const cdnUrl = await uploadToCOS(optimizedBuffer, optimizedFilename);

    return NextResponse.json({ url: cdnUrl });
  } catch (error) {
    console.error("Error uploading background:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error uploading background" },
      { status: 500 }
    );
  }
}
