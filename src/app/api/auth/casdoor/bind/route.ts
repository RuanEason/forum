import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  CASDOOR_PENDING_COOKIE,
  readPendingCasdoorLogin,
} from "@/lib/casdoor";

const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
const SESSION_COOKIE_NAME = "next-auth.session-token";

type BindBody = {
  email?: unknown;
  password?: unknown;
};

function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

export async function POST(request: NextRequest) {
  try {
    const pending = await readPendingCasdoorLogin();

    if (!pending) {
      return NextResponse.json({ error: "Third-party login session expired" }, { status: 400 });
    }

    const body = (await request.json()) as BindBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    if (user.banned) {
      return NextResponse.json({ error: "This account has been disabled" }, { status: 403 });
    }

    if (user.casdoorUserId && user.casdoorUserId !== pending.casdoorUserId) {
      return NextResponse.json({ error: "This account is already linked to another third-party identity" }, { status: 400 });
    }

    const duplicateLinkedUser = await prisma.user.findUnique({
      where: { casdoorUserId: pending.casdoorUserId },
      select: { id: true },
    });

    if (duplicateLinkedUser && duplicateLinkedUser.id !== user.id) {
      return NextResponse.json({ error: "This third-party account is already linked" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        casdoorUserId: pending.casdoorUserId,
        ...(user.name ? {} : { name: pending.name }),
        ...(user.avatar ? {} : { avatar: pending.avatar }),
      },
    });

    const defaultToken = {
      name: updatedUser.name,
      email: updatedUser.email,
      picture: updatedUser.avatar,
      sub: updatedUser.id,
    };

    const sessionToken = await encode({
      secret: authOptions.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
      token: await authOptions.callbacks.jwt({
        token: defaultToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          postViewMode: updatedUser.postViewMode,
          showUserData: updatedUser.showUserData,
          coverImage: updatedUser.coverImage,
          experience: updatedUser.experience,
          level: 1,
        },
        trigger: "signIn",
      }),
      maxAge: authOptions.session.maxAge,
    });

    const isSecure = request.nextUrl.protocol === "https:";
    const response = NextResponse.json({
      ok: true,
      redirectPath: pending.redirectPath,
    });

    response.cookies.set(getSessionCookieName(isSecure), sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      expires: new Date(Date.now() + authOptions.session.maxAge * 1000),
    });

    response.cookies.set(CASDOOR_PENDING_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Casdoor bind error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
