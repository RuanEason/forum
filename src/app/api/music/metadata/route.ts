import { NextRequest, NextResponse } from "next/server";
import { parseWebStream } from "music-metadata";

export const runtime = "nodejs";

const MUSIC_BASE_URL = "https://cdn.zyg2024.top/music";
const DEFAULT_COVER = "https://cdn.zyg2024.top/act/musicback.png";

function extensionFor(index: number): "flac" | "mp3" {
  return index === 1 || index === 3 ? "flac" : "mp3";
}

function fallbackPayload(index: number, extension: string) {
  return {
    title: `Track ${index}`,
    artist: "Slept Music Project",
    cover: DEFAULT_COVER,
    source: `${index}.${extension}`,
  };
}

export async function GET(req: NextRequest) {
  const indexParam = req.nextUrl.searchParams.get("index");
  const index = Number(indexParam);

  if (!Number.isInteger(index) || index < 1 || index > 4) {
    return NextResponse.json(
      { error: "index must be an integer between 1 and 4" },
      { status: 400 }
    );
  }

  const extension = extensionFor(index);
  const url = `${MUSIC_BASE_URL}/${index}.${extension}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok || !response.body) {
      return NextResponse.json(fallbackPayload(index, extension));
    }

    const contentType = response.headers.get("content-type") || undefined;
    const contentLength = response.headers.get("content-length");
    const size = contentLength ? Number(contentLength) : undefined;
    const fileInfo = {
      mimeType: contentType,
      size,
    };

    const metadata = await parseWebStream(response.body, fileInfo);

    const title = metadata.common.title?.trim() || `Track ${index}`;
    const artist =
      metadata.common.artist?.trim() ||
      metadata.common.artists?.filter(Boolean).join(", ") ||
      "Slept Music Project";

    let cover = DEFAULT_COVER;
    const picture = metadata.common.picture?.[0];

    if (picture?.data?.length) {
      const mimeType = picture.format || "image/jpeg";
      const coverBytes = Uint8Array.from(picture.data);
      const base64 = Buffer.from(coverBytes).toString("base64");
      cover = `data:${mimeType};base64,${base64}`;
    }

    return NextResponse.json({
      title,
      artist,
      cover,
      source: `${index}.${extension}`,
    });
  } catch {
    return NextResponse.json(fallbackPayload(index, extension));
  }
}
