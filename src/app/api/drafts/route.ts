import { NextRequest, NextResponse } from "next/server";
import { createDraft, listDrafts } from "@/lib/draft";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import type { PostStyleConfig } from "@/types/post-style";

function toUpperValue(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return value.trim().toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const persistMode = toUpperValue(searchParams.get("persistMode"));
    const limitRaw = searchParams.get("limit");
    const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : Number.NaN;

    const drafts = await listDrafts(user.id, {
      persistMode: persistMode === "ALL" || !persistMode
        ? (persistMode === "ALL" ? undefined : "SAVED")
        : (persistMode === "EPHEMERAL" ? "EPHEMERAL" : "SAVED"),
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Get drafts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      postType?: "TEXT" | "VIDEO";
      title?: string | null;
      content?: string;
      contentJson?: unknown;
      contentFormat?: "RICH_TEXT" | "PLAIN_TEXT";
      styleConfig?: PostStyleConfig | null;
      styleCss?: string | null;
      visibility?: "PUBLIC" | "UNLISTED";
      isAnnouncement?: boolean;
      topicId?: string | null;
      persistMode?: "EPHEMERAL" | "SAVED";
      assets?: Array<{
        id?: string;
        type: "IMAGE" | "ATTACHMENT" | "VIDEO" | "COVER";
        status: "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
        progress?: number;
         url?: string | null;
         objectKey?: string | null;
        fileName?: string | null;
        fileSize?: number | null;
        mimeType?: string | null;
        videoAssetId?: string | null;
        errorMessage?: string | null;
        sortOrder?: number;
      }>;
      lastError?: string | null;
    };

    const rawAnnouncement = (body as { isAnnouncement?: unknown }).isAnnouncement;
    if (rawAnnouncement !== undefined && typeof rawAnnouncement !== "boolean") {
      return NextResponse.json({ error: "isAnnouncement must be a boolean" }, { status: 400 });
    }
    if (rawAnnouncement !== undefined && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can manage forum announcements" },
        { status: 403 },
      );
    }

    const draft = await createDraft(user.id, body);
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Create draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
