import { NextRequest, NextResponse } from "next/server";
import {
  hideCustomEmoji,
  isCustomEmojiObjectKeyForUser,
  listCustomEmojis,
  uploadCustomEmoji,
} from "@/lib/custom-emoji";
import { requireActiveUser } from "@/lib/server-auth";
import { CUSTOM_EMOJI_MAX_FILE_SIZE } from "@/types/emoji";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return auth.response;
  }

  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;

  try {
    const page = await listCustomEmojis(auth.user.id, { cursor });
    return NextResponse.json(page, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid custom emoji cursor") {
      return NextResponse.json({ error: "Invalid custom emoji cursor" }, { status: 400 });
    }

    console.error("List custom emojis error:", error);
    return NextResponse.json({ error: "Failed to load custom emojis" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > CUSTOM_EMOJI_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Each custom emoji must be between 1 byte and 20 MiB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const emoji = await uploadCustomEmoji(buffer, file.name, file.type, auth.user.id);

    return NextResponse.json({ emoji }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Only JPEG, PNG, WebP, and GIF images are supported") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Upload custom emoji error:", error);
    return NextResponse.json({ error: "Failed to upload custom emoji" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireActiveUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json() as { key?: unknown };
    const key = typeof body.key === "string" ? body.key.trim() : "";
    if (!isCustomEmojiObjectKeyForUser(key, auth.user.id)) {
      return NextResponse.json({ error: "无效的自定义表情" }, { status: 400 });
    }

    await hideCustomEmoji(key, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete custom emoji error:", error);
    return NextResponse.json({ error: "删除自定义表情失败" }, { status: 500 });
  }
}
