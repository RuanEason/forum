import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { uploadToCOS } from "@/lib/cos";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi', '.sh', '.ps1'
];

const BLOCKED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
];

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

  console.log("Upload attachment:", {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!fileExt || fileExt === '.') {
    return NextResponse.json(
      { error: "Invalid file name: missing extension" },
      { status: 400 }
    );
  }

  if (BLOCKED_EXTENSIONS.includes(fileExt)) {
    return NextResponse.json(
      { error: `File type ${fileExt} is not allowed` },
      { status: 400 }
    );
  }

  if (BLOCKED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `MIME type ${file.type} is not allowed` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const sanitizedFileName = sanitizeFileName(file.name);
  const filename = `attachments/${uuidv4()}-${sanitizedFileName}`;

  try {
    const cdnUrl = await uploadToCOS(buffer, filename);
    return NextResponse.json({
      url: cdnUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error uploading file" },
      { status: 500 }
    );
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}
