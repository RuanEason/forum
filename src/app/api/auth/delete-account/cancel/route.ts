import { NextResponse } from "next/server";
import { cancelAccountDeletion } from "@/lib/media-cleanup";
import { requireCurrentUser } from "@/lib/server-auth";

export async function POST() {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

    const result = await cancelAccountDeletion(auth.user.id);
    if (!result.cancelled) {
      return NextResponse.json(
        {
          error: result.reason === "window_expired"
            ? "The account deletion window has expired"
            : "No pending account deletion",
        },
        { status: result.reason === "window_expired" ? 409 : 404 },
      );
    }

    return NextResponse.json({ ok: true, message: "Account deletion cancelled" });
  } catch (error) {
    console.error("Cancel account deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
