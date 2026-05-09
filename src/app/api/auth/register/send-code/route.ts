import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkSendCodeLimits,
  clearEmailVerificationState,
  createAndStoreEmailVerificationCode,
  emailCodeConfig,
  isValidEmail,
} from "@/lib/emailVerification";
import { isMailConfigured, sendVerificationCodeEmail } from "@/lib/mailer";

type SendCodeBody = {
  email?: unknown;
};

const MAX_EMAIL_LENGTH = 254;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "0.0.0.0";
}

function buildLimitErrorMessage(reason?: "COOLDOWN" | "EMAIL_DAILY_LIMIT" | "IP_HOURLY_LIMIT"): string {
  if (reason === "COOLDOWN") {
    return "发送过于频繁，请稍后再试";
  }

  if (reason === "EMAIL_DAILY_LIMIT") {
    return "该邮箱今日验证码发送次数已达上限";
  }

  if (reason === "IP_HOURLY_LIMIT") {
    return "当前网络请求过于频繁，请稍后再试";
  }

  return "请求过于频繁，请稍后再试";
}

export async function POST(request: NextRequest) {
  try {
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "邮件服务未配置，请联系管理员" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SendCodeBody;
    const rawEmail = body.email;

    if (typeof rawEmail !== "string") {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    if (!email || email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已注册，请直接登录" },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const limitResult = await checkSendCodeLimits(email, ip);

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: buildLimitErrorMessage(limitResult.reason),
          retryAfterSeconds: limitResult.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    const code = await createAndStoreEmailVerificationCode(email, ip);

    try {
      await sendVerificationCodeEmail(email, code);
    } catch (sendError) {
      await clearEmailVerificationState(email);
      console.error("Send verification email error:", sendError);
      return NextResponse.json({ error: "验证码发送失败，请稍后重试" }, { status: 500 });
    }

    return NextResponse.json({
      message: "验证码已发送",
      cooldownSeconds: emailCodeConfig.SEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Send email verification code error:", error);
    return NextResponse.json({ error: "验证码发送失败，请稍后重试" }, { status: 500 });
  }
}
