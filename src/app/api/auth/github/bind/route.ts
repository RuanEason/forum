import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth-session";
import { buildLoginUser } from "@/lib/login-user";
import { GITHUB_PENDING_COOKIE, readPendingGitHubLogin } from "@/lib/github";

type BindBody = {
  email?: unknown;
  password?: unknown;
};

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

    const loginUser = await buildLoginUser(updatedUser.id);
    const sessionToken = await createSessionToken({
      user: loginUser,
      provider: "github",
      providerAccountId: pending.githubUserId,
    });

    const isSecure = request.nextUrl.protocol === "https:";
    const response = NextResponse.json({
      ok: true,
      redirectPath: pending.redirectPath,
    });

    setSessionCookie(response, sessionToken, isSecure);

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
