import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { SecurityEventType } from "@/generated";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-auth";
import {
  consumeEmailChangeRateLimit,
  createOpaqueToken,
  EMAIL_CHANGE_REQUEST_MESSAGE,
  EMAIL_CHANGE_TOKEN_TTL_MS,
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  hashOpaqueToken,
  isValidAccountEmail,
  normalizeEmail,
  recordSecurityEvent,
} from "@/lib/account-security";
import { sendEmailChangeVerificationEmail } from "@/lib/security-mailer";

type EmailChangeRequestBody = {
  newEmail?: unknown;
  currentPassword?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireActiveUser();
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as EmailChangeRequestBody;
    const newEmail = typeof body.newEmail === "string" ? normalizeEmail(body.newEmail) : "";
    const currentPassword = typeof body.currentPassword === "string"
      ? body.currentPassword
      : "";

    if (!isValidAccountEmail(newEmail)) {
      return NextResponse.json({ error: "请输入有效的新邮箱地址" }, { status: 400 });
    }

    if (!currentPassword) {
      return NextResponse.json({ error: "请输入当前密码以验证身份" }, { status: 400 });
    }

    const ipAddress = getClientIpFromHeaders(request.headers);
    const rateLimit = await consumeEmailChangeRateLimit(newEmail, ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "操作过于频繁，请稍后再试", retryAfterSeconds: rateLimit.retryAfterSeconds },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { email: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "请先设置本地密码后再修改邮箱" },
        { status: 409 },
      );
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    if (user.email && normalizeEmail(user.email) === newEmail) {
      return NextResponse.json({ error: "新邮箱不能与当前邮箱相同" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== auth.user.id) {
      return NextResponse.json({ error: "该邮箱已被其他账号使用" }, { status: 409 });
    }

    const rawToken = createOpaqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EMAIL_CHANGE_TOKEN_TTL_MS);
    const userAgent = getUserAgentFromHeaders(request.headers);
    const token = await prisma.$transaction(async (tx) => {
      await tx.emailChangeToken.updateMany({
        where: { userId: auth.user.id, usedAt: null },
        data: { usedAt: now },
      });

      const createdToken = await tx.emailChangeToken.create({
        data: {
          userId: auth.user.id,
          newEmail,
          tokenHash: hashOpaqueToken(rawToken),
          expiresAt,
          requestedIp: ipAddress,
        },
        select: { id: true },
      });

      await recordSecurityEvent(
        {
          userId: auth.user.id,
          type: SecurityEventType.EMAIL_CHANGE_REQUESTED,
          ipAddress,
          userAgent,
          metadata: { newEmail },
        },
        tx,
      );

      return createdToken;
    });

    try {
      await sendEmailChangeVerificationEmail(newEmail, rawToken);
    } catch (error) {
      await prisma.emailChangeToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });
      console.error("Send email change verification failed:", error);
      return NextResponse.json({ error: "验证邮件发送失败，请稍后重试" }, { status: 503 });
    }

    return NextResponse.json({ ok: true, message: EMAIL_CHANGE_REQUEST_MESSAGE });
  } catch (error) {
    console.error("Email change request failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
