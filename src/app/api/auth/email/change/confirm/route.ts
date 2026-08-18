import { Prisma, SecurityEventType } from "@/generated";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";
import {
  EMAIL_CHANGE_TOKEN_INVALID_MESSAGE,
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  hashOpaqueToken,
  recordSecurityEvent,
} from "@/lib/account-security";

type EmailChangeConfirmBody = {
  token?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as EmailChangeConfirmBody;
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: EMAIL_CHANGE_TOKEN_INVALID_MESSAGE },
        { status: 400 },
      );
    }

    const tokenHash = hashOpaqueToken(token);
    const now = new Date();
    const ipAddress = getClientIpFromHeaders(request.headers);
    const userAgent = getUserAgentFromHeaders(request.headers);

    await prisma.$transaction(async (tx) => {
      const changeToken = await tx.emailChangeToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          newEmail: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (
        !changeToken
        || changeToken.userId !== auth.user.id
        || changeToken.usedAt
        || changeToken.expiresAt <= now
      ) {
        throw new Error(EMAIL_CHANGE_TOKEN_INVALID_MESSAGE);
      }

      const claimedToken = await tx.emailChangeToken.updateMany({
        where: {
          id: changeToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimedToken.count !== 1) {
        throw new Error(EMAIL_CHANGE_TOKEN_INVALID_MESSAGE);
      }

      const user = await tx.user.findUnique({
        where: { id: changeToken.userId },
        select: { id: true, email: true },
      });
      if (!user) {
        throw new Error(EMAIL_CHANGE_TOKEN_INVALID_MESSAGE);
      }

      const existingUser = await tx.user.findUnique({
        where: { email: changeToken.newEmail },
        select: { id: true },
      });
      if (existingUser && existingUser.id !== changeToken.userId) {
        throw new Error("EMAIL_CHANGE_EMAIL_CONFLICT");
      }

      await tx.user.update({
        where: { id: changeToken.userId },
        data: {
          email: changeToken.newEmail,
          sessionVersion: { increment: 1 },
        },
      });

      await tx.emailChangeToken.updateMany({
        where: {
          userId: changeToken.userId,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      await recordSecurityEvent(
        {
          userId: changeToken.userId,
          type: SecurityEventType.EMAIL_CHANGED,
          ipAddress,
          userAgent,
          metadata: {
            previousEmail: user.email,
            newEmail: changeToken.newEmail,
          },
        },
        tx,
      );
    });

    return NextResponse.json({ ok: true, message: "邮箱已更新，请使用新邮箱登录" });
  } catch (error) {
    if (error instanceof Error && error.message === EMAIL_CHANGE_TOKEN_INVALID_MESSAGE) {
      return NextResponse.json(
        { error: EMAIL_CHANGE_TOKEN_INVALID_MESSAGE },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "EMAIL_CHANGE_EMAIL_CONFLICT") {
      return NextResponse.json({ error: "该邮箱已被其他账号使用" }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "该邮箱已被其他账号使用" }, { status: 409 });
    }

    console.error("Email change confirmation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
