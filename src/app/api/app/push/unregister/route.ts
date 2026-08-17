import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";

type UnregisterBody = {
  registrationId?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = await request.json() as UnregisterBody;
    const registrationId = typeof body.registrationId === "string" ? body.registrationId.trim() : "";

    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    const result = await prisma.pushDevice.updateMany({
      where: {
        registrationId,
        userId: sessionUser.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    }, { status: 200 });
  } catch (error) {
    console.error("Push unregister error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
