import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getUserLevel } from "@/lib/experience";
import { GITHUB_PENDING_COOKIE, readPendingGitHubLogin } from "@/lib/github";

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
    const pending = await readPendingGitHubLogin();

    if (!pending) {
      return NextResponse.json({ error: "GitHub 登录会话已过期，请重新登录" }, { status: 400 });
    }

    const body = (await request.json()) as BindBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 400 });
    }

    if (user.banned) {
      return NextResponse.json({ error: "该账号已被禁用" }, { status: 403 });
    }

    if (user.githubUserId && user.githubUserId !== pending.githubUserId) {
      return NextResponse.json({ error: "这个论坛账号已经绑定了其他 GitHub 账号" }, { status: 400 });
    }

    const duplicateLinkedUser = await prisma.user.findUnique({
      where: { githubUserId: pending.githubUserId },
      select: { id: true },
    });

    if (duplicateLinkedUser && duplicateLinkedUser.id !== user.id) {
      return NextResponse.json({ error: "这个 GitHub 账号已经绑定过论坛账号" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        githubUserId: pending.githubUserId,
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
          level: getUserLevel(updatedUser.experience),
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
      redirectPath: pending.redirectPath,
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
    console.error("GitHub bind error:", error);
    return NextResponse.json({ error: "服务器开小差了，请稍后再试" }, { status: 500 });
  }
}
