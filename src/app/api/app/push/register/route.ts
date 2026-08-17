import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePushPlatform } from "@/lib/push";
import { requireActiveUser } from "@/lib/server-auth";

type RegisterBody = {
  registrationId?: unknown;
  platform?: unknown;
  appPackage?: unknown;
  appVersion?: unknown;
};

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }
    const sessionUser = auth.user;

    const body = await request.json() as RegisterBody;
    const registrationId = typeof body.registrationId === "string" ? body.registrationId.trim() : "";
    const platformValue = typeof body.platform === "string" ? body.platform : "";
    const appPackage = typeof body.appPackage === "string" ? body.appPackage.trim() : "";
    const appVersion = typeof body.appVersion === "string" ? body.appVersion.trim() : "";

    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    if (!appPackage) {
      return NextResponse.json({ error: "appPackage is required" }, { status: 400 });
    }

    const platform = normalizePushPlatform(platformValue);
    if (!platform) {
      return NextResponse.json({ error: "platform must be ios/android/harmony/other" }, { status: 400 });
    }

    const now = new Date();
    const device = await prisma.pushDevice.upsert({
      where: {
        registrationId,
      },
      update: {
        userId: sessionUser.id,
        platform,
        appPackage,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: now,
      },
      create: {
        userId: sessionUser.id,
        registrationId,
        platform,
        appPackage,
        appVersion: appVersion || null,
        isActive: true,
        lastSeenAt: now,
      },
      select: {
        id: true,
        userId: true,
        registrationId: true,
        platform: true,
        appPackage: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      device,
    }, { status: 200 });
  } catch (error) {
    console.error("Push register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
