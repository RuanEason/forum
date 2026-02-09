import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UnregisterBody = {
  registrationId?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = (session as { user?: { id?: string } } | null)?.user;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
