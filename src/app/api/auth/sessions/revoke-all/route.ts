import { SecurityEventType } from "@/generated";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  recordSecurityEvent,
} from "@/lib/account-security";
import { requireActiveUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.user.id },
        data: { sessionVersion: { increment: 1 } },
      });

      await recordSecurityEvent(
        {
          userId: auth.user.id,
          type: SecurityEventType.SESSIONS_REVOKED,
          ipAddress: getClientIpFromHeaders(request.headers),
          userAgent: getUserAgentFromHeaders(request.headers),
        },
        tx,
      );
    });

    const response = NextResponse.json({
      ok: true,
      message: "已退出所有设备",
    });
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  } catch (error) {
    console.error("Revoke all sessions failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
