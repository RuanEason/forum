import { NextRequest, NextResponse } from "next/server";
import { getPostsPage } from "@/lib/post";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import {
  DEFAULT_LIST_PAGE_SIZE,
  InvalidCursorError,
  parseListPageSize,
} from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId")?.trim() || undefined;
    const cursor = searchParams.get("cursor");
    const limit = parseListPageSize(searchParams.get("limit"), DEFAULT_LIST_PAGE_SIZE);
    const viewer = await getSessionUser();
    const page = await getPostsPage({
      topicId,
      cursor,
      limit,
      viewerId: viewer?.id,
    });

    // Keep a bounded array response for older App clients that have not opted
    // into the cursor contract yet. First-party clients pass `limit`.
    return NextResponse.json(
      searchParams.get("legacy") === "1" || (!searchParams.has("cursor") && !searchParams.has("limit"))
        ? page.items
        : page,
    );
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      return NextResponse.json(
        { error: "Invalid cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }

    console.error("Get posts error (App):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
