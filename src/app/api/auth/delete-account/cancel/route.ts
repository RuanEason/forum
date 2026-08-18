import { NextRequest, NextResponse } from "next/server";
import {
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
} from "@/lib/account-security";
import { cancelAccountDeletion } from "@/lib/media-cleanup";
import { requireCurrentUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

    const result = await cancelAccountDeletion(auth.user.id, new Date(), {
      ipAddress: getClientIpFromHeaders(request.headers),
      userAgent: getUserAgentFromHeaders(request.headers),
    });
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
