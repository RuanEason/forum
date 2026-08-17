import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/server-auth";
import { requestAccountDeletion } from "@/lib/media-cleanup";

export async function DELETE() {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const deletion = await requestAccountDeletion(auth.user.id);
    if (!deletion) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: deletion.alreadyRequested
        ? "Account deletion is already scheduled"
        : "Account deletion scheduled",
      deleteScheduledAt: deletion.scheduledAt,
    }, { status: 202 });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
