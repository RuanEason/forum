import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireCurrentUser } from "@/lib/server-auth";

type PasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

type GitHubDisconnectBody = {
  currentPassword?: unknown;
};

export async function GET() {
  try {
    const auth = await requireCurrentUser();
    if (!auth.ok) {
      return auth.response;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        email: true,
        password: true,
        githubUserId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      hasPassword: Boolean(user.password),
      githubLinked: Boolean(user.githubUserId),
    });
  } catch (error) {
    console.error("Get security settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as PasswordBody;
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少需要 6 个字符" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: user.password ? "密码已更新" : "密码已设置",
      hasPassword: true,
    });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as GitHubDisconnectBody;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true, githubUserId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.githubUserId) {
      return NextResponse.json({ error: "GitHub 尚未绑定" }, { status: 400 });
    }
    if (!user.password) {
      return NextResponse.json({ error: "请先设置本地密码后再解绑 GitHub" }, { status: 409 });
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        githubUserId: null,
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ message: "GitHub 已解绑", githubLinked: false });
  } catch (error) {
    console.error("Disconnect GitHub error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
