import { NextRequest, NextResponse } from "next/server";
import { deleteDraft, getDraftById, updateDraft } from "@/lib/draft";
import { getSessionUser } from "@/app/api/app/_shared/auth";
import type { PostStyleConfig } from "@/types/post-style";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
    }

    const draft = await getDraftById(user.id, id);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Get draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
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

    const draft = await updateDraft(user.id, id, body);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Update draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Draft id is required" }, { status: 400 });
    }

    const deleted = await deleteDraft(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Delete draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
