import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isValidEmail, verifyEmailCode } from "@/lib/emailVerification";

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  code?: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const rawEmail = body.email;
    const rawPassword = body.password;
    const rawCode = body.code;

    if (typeof rawEmail !== "string" || typeof rawPassword !== "string" || typeof rawCode !== "string") {
      return NextResponse.json({ error: "邮箱、密码和验证码均为必填项" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    const password = rawPassword.trim();
    const code = rawCode.trim();

    if (!email || !password || !code) {
      return NextResponse.json({ error: "邮箱、密码和验证码均为必填项" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少需要6个字符" }, { status: 400 });
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "验证码格式不正确" }, { status: 400 });
    }

    const verifyResult = await verifyEmailCode(email, code);
    if (!verifyResult.ok) {
      if (verifyResult.reason === "NOT_FOUND") {
        return NextResponse.json({ error: "验证码不存在或已过期" }, { status: 400 });
      }

      if (verifyResult.reason === "ATTEMPTS_EXCEEDED") {
        return NextResponse.json({ error: "验证码错误次数过多，请重新获取" }, { status: 400 });
      }

      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
