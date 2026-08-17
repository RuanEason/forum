import { NextResponse } from "next/server";
import { restorePost } from "@/lib/media-cleanup";
import { prisma } from "@/lib/prisma";
import { isAdminRole, requireActiveUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json() as { id?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== auth.user.id && !isAdminRole(auth.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await restorePost(id);
    if (!result.restored) {
      return NextResponse.json(
        {
          error: result.reason === "window_expired"
            ? "The post recovery window has expired"
            : "Post is not pending deletion",
        },
        { status: result.reason === "window_expired" ? 409 : 404 },
      );
    }

    return NextResponse.json({ ok: true, message: "Post restored" });
  } catch (error) {
    console.error("Restore post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
