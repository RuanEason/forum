import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth-session";
import { buildLoginUser } from "@/lib/login-user";
import { GITHUB_PENDING_COOKIE, readPendingGitHubLogin } from "@/lib/github";
import { toCompleteProfilePath } from "@/lib/auth-redirect";
const MAX_NAME_LENGTH = 50;

type RegisterBody = {
  name?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const pending = await readPendingGitHubLogin();

    if (!pending) {
      return NextResponse.json({ error: "GitHub 登录会话已过期，请重新登录" }, { status: 400 });
    }

    if (!pending.email) {
      return NextResponse.json(
        { error: "GitHub 未提供已验证的邮箱地址，暂时无法创建新账号" },
        { status: 400 },
      );
    }

    const existingLinkedUser = await prisma.user.findUnique({
      where: { githubUserId: pending.githubUserId },
      select: { id: true },
    });

    if (existingLinkedUser) {
      return NextResponse.json({ error: "这个 GitHub 账号已经绑定过论坛账号" }, { status: 400 });
    }

    const body = (await request.json()) as RegisterBody;
    const providedName = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const finalName = providedName || pending.name || null;

    if (providedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `显示名称不能超过 ${MAX_NAME_LENGTH} 个字符` },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度不能少于 6 位" }, { status: 400 });
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email: pending.email },
      select: { id: true },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "这个邮箱已经注册过账号，请选择绑定已有账号" },
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

    const loginUser = await buildLoginUser(user.id);
    const sessionToken = await createSessionToken({
      user: loginUser,
      provider: "github",
      providerAccountId: pending.githubUserId,
    });

    const isSecure = request.nextUrl.protocol === "https:";
    const response = NextResponse.json({
      ok: true,
      redirectPath: finalName ? pending.redirectPath : toCompleteProfilePath(pending.redirectPath),
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
    console.error("GitHub register error:", error);
    return NextResponse.json({ error: "服务器开小差了，请稍后再试" }, { status: 500 });
  }
}
