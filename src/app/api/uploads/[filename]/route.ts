import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  // 1. 找到文件的真实路径
  const filePath = path.join(process.cwd(), "public/uploads", filename);

  // 2. 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  // 3. 读取文件内容
  const fileBuffer = fs.readFileSync(filePath);

  // 4. 获取文件类型 (简单判断)
  let contentType = "application/octet-stream";
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) contentType = "image/jpeg";
  else if (lowerFilename.endsWith(".png")) contentType = "image/png";
  else if (lowerFilename.endsWith(".gif")) contentType = "image/gif";
  else if (lowerFilename.endsWith(".webp")) contentType = "image/webp";
  else if (lowerFilename.endsWith(".svg")) contentType = "image/svg+xml";

  // 5. 返回文件流
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
