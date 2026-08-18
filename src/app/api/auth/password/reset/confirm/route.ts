import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { SecurityEventType } from "@/generated";
import { prisma } from "@/lib/prisma";
import {
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  hashOpaqueToken,
  isValidAccountPassword,
  PASSWORD_RESET_TOKEN_INVALID_MESSAGE,
  recordSecurityEvent,
} from "@/lib/account-security";

type PasswordResetConfirmBody = {
  token?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PasswordResetConfirmBody;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string"
      ? body.confirmPassword
      : null;

    if (!token || !isValidAccountPassword(newPassword)) {
      return NextResponse.json(
        { error: "新密码长度需为 6 至 128 个字符" },
        { status: 400 },
      );
    }

    if (confirmPassword !== null && confirmPassword !== newPassword) {
      return NextResponse.json({ error: "两次输入的新密码不一致" }, { status: 400 });
    }

    const tokenHash = hashOpaqueToken(token);
    const now = new Date();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const ipAddress = getClientIpFromHeaders(request.headers);
    const userAgent = getUserAgentFromHeaders(request.headers);

    await prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
        throw new Error(PASSWORD_RESET_TOKEN_INVALID_MESSAGE);
      }

      const claimedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimedToken.count !== 1) {
        throw new Error(PASSWORD_RESET_TOKEN_INVALID_MESSAGE);
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: passwordHash,
          sessionVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      await recordSecurityEvent(
        {
          userId: resetToken.userId,
          type: SecurityEventType.PASSWORD_RESET,
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    return NextResponse.json({ ok: true, message: "密码已重置，请使用新密码登录" });
  } catch (error) {
    if (error instanceof Error && error.message === PASSWORD_RESET_TOKEN_INVALID_MESSAGE) {
      return NextResponse.json(
        { error: PASSWORD_RESET_TOKEN_INVALID_MESSAGE },
        { status: 400 },
      );
    }

    console.error("Password reset confirmation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
