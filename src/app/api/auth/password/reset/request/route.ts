import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  consumePasswordResetRateLimit,
  createOpaqueToken,
  getClientIpFromHeaders,
  hashOpaqueToken,
  isValidAccountEmail,
  normalizeEmail,
  PASSWORD_RESET_REQUEST_MESSAGE,
} from "@/lib/account-security";
import { sendPasswordResetEmail } from "@/lib/security-mailer";

type PasswordResetRequestBody = {
  email?: unknown;
};

export async function POST(request: NextRequest) {
  const genericResponse = () => NextResponse.json(
    { message: PASSWORD_RESET_REQUEST_MESSAGE },
    { status: 202 },
  );

  try {
    const body = (await request.json()) as PasswordResetRequestBody;
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!isValidAccountEmail(email)) {
      return genericResponse();
    }

    const ip = getClientIpFromHeaders(request.headers);
    const rateLimit = await consumePasswordResetRateLimit(email, ip);
    if (!rateLimit.allowed) {
      return genericResponse();
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return genericResponse();
    }

    const rawToken = createOpaqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const token = await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });

      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashOpaqueToken(rawToken),
          expiresAt,
          requestedIp: ip,
        },
        select: { id: true },
      });
    });

    try {
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (error) {
      await prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });
      console.error("Send password reset email failed:", error);
    }

    return genericResponse();
  } catch (error) {
    console.error("Password reset request failed:", error);
    return genericResponse();
  }
}
