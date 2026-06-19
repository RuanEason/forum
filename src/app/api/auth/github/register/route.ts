import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getUserLevel } from "@/lib/experience";
import { GITHUB_PENDING_COOKIE, readPendingGitHubLogin } from "@/lib/github";
import { toCompleteProfilePath } from "@/lib/auth-redirect";

const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
const SESSION_COOKIE_NAME = "next-auth.session-token";
const MAX_NAME_LENGTH = 50;

type RegisterBody = {
  name?: unknown;
  password?: unknown;
};

function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

export async function POST(request: NextRequest) {
  try {
    const pending = await readPendingGitHubLogin();

    if (!pending) {
      return NextResponse.json({ error: "GitHub login session expired" }, { status: 400 });
    }

    if (!pending.email) {
      return NextResponse.json(
        { error: "GitHub did not provide a verified email address" },
        { status: 400 },
      );
    }

    const existingLinkedUser = await prisma.user.findUnique({
      where: { githubUserId: pending.githubUserId },
      select: { id: true },
    });

    if (existingLinkedUser) {
      return NextResponse.json({ error: "This GitHub account is already linked" }, { status: 400 });
    }

    const body = (await request.json()) as RegisterBody;
    const providedName = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const finalName = providedName || pending.name || null;

    if (providedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Display name must be ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email: pending.email },
      select: { id: true },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "This email is already used by an existing account, please choose bind old account" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: pending.email,
        password: hashedPassword,
        githubUserId: pending.githubUserId,
        name: finalName,
        avatar: pending.avatar,
      },
    });

    const defaultToken = {
      name: user.name,
      email: user.email,
      picture: user.avatar,
      sub: user.id,
    };

    const sessionToken = await encode({
      secret: authOptions.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
      token: await authOptions.callbacks.jwt({
        token: defaultToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          postViewMode: user.postViewMode,
          showUserData: user.showUserData,
          coverImage: user.coverImage,
          experience: user.experience,
          level: getUserLevel(user.experience),
        },
        account: {
          provider: "github",
          providerAccountId: pending.githubUserId,
          type: "credentials",
        },
        trigger: "signIn",
      }),
      maxAge: authOptions.session.maxAge,
    });

    const isSecure = request.nextUrl.protocol === "https:";
    const response = NextResponse.json({
      ok: true,
      redirectPath: finalName ? pending.redirectPath : toCompleteProfilePath(pending.redirectPath),
    });

    response.cookies.set(getSessionCookieName(isSecure), sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      expires: new Date(Date.now() + authOptions.session.maxAge * 1000),
    });

    response.cookies.set(GITHUB_PENDING_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("GitHub register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
