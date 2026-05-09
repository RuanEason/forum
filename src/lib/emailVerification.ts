import { createHash, timingSafeEqual } from "node:crypto";
import { connectRedis, redis } from "@/lib/redis";

const CODE_EXPIRE_SECONDS = 5 * 60;
const SEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_EMAIL_PER_DAY = 10;
const MAX_SENDS_PER_IP_PER_HOUR = 30;
const MAX_VERIFY_ATTEMPTS = 5;

export type SendCodeLimitResult = {
  allowed: boolean;
  reason?: "COOLDOWN" | "EMAIL_DAILY_LIMIT" | "IP_HOURLY_LIMIT";
  retryAfterSeconds?: number;
};

export type VerifyCodeResult = {
  ok: boolean;
  reason?: "NOT_FOUND" | "MISMATCH" | "ATTEMPTS_EXCEEDED";
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getCodeKey(email: string): string {
  return `auth:register:email_code:${normalizeEmail(email)}`;
}

function getAttemptsKey(email: string): string {
  return `auth:register:email_code_attempts:${normalizeEmail(email)}`;
}

function getCooldownKey(email: string): string {
  return `auth:register:email_cooldown:${normalizeEmail(email)}`;
}

function getEmailDayCountKey(email: string): string {
  return `auth:register:email_day_count:${normalizeEmail(email)}`;
}

function getIpHourCountKey(ip: string): string {
  return `auth:register:ip_hour_count:${ip}`;
}

function createVerificationCode(): string {
  const num = Math.floor(Math.random() * 1_000_000);
  return num.toString().padStart(6, "0");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export async function checkSendCodeLimits(email: string, ip: string): Promise<SendCodeLimitResult> {
  await connectRedis();

  const cooldownTtl = await redis.ttl(getCooldownKey(email));
  if (cooldownTtl > 0) {
    return {
      allowed: false,
      reason: "COOLDOWN",
      retryAfterSeconds: cooldownTtl,
    };
  }

  const emailSendCountRaw = await redis.get(getEmailDayCountKey(email));
  const emailSendCount = Number.parseInt(emailSendCountRaw || "0", 10);
  if (emailSendCount >= MAX_SENDS_PER_EMAIL_PER_DAY) {
    return {
      allowed: false,
      reason: "EMAIL_DAILY_LIMIT",
      retryAfterSeconds: 24 * 60 * 60,
    };
  }

  const ipSendCountRaw = await redis.get(getIpHourCountKey(ip));
  const ipSendCount = Number.parseInt(ipSendCountRaw || "0", 10);
  if (ipSendCount >= MAX_SENDS_PER_IP_PER_HOUR) {
    return {
      allowed: false,
      reason: "IP_HOURLY_LIMIT",
      retryAfterSeconds: 60 * 60,
    };
  }

  return { allowed: true };
}

export async function createAndStoreEmailVerificationCode(email: string, ip: string): Promise<string> {
  await connectRedis();

  const code = createVerificationCode();
  const hash = sha256Hex(code);

  await redis.set(getCodeKey(email), hash, {
    EX: CODE_EXPIRE_SECONDS,
  });

  await redis.del(getAttemptsKey(email));

  await redis.set(getCooldownKey(email), "1", {
    EX: SEND_COOLDOWN_SECONDS,
  });

  const emailDayCountKey = getEmailDayCountKey(email);
  const emailCount = await redis.incr(emailDayCountKey);
  if (emailCount === 1) {
    await redis.expire(emailDayCountKey, 24 * 60 * 60);
  }

  const ipHourCountKey = getIpHourCountKey(ip);
  const ipCount = await redis.incr(ipHourCountKey);
  if (ipCount === 1) {
    await redis.expire(ipHourCountKey, 60 * 60);
  }

  return code;
}

export async function verifyEmailCode(email: string, code: string): Promise<VerifyCodeResult> {
  await connectRedis();

  const codeKey = getCodeKey(email);
  const attemptsKey = getAttemptsKey(email);

  const savedHash = await redis.get(codeKey);
  if (!savedHash) {
    return {
      ok: false,
      reason: "NOT_FOUND",
    };
  }

  const attemptsRaw = await redis.get(attemptsKey);
  const attempts = Number.parseInt(attemptsRaw || "0", 10);

  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      ok: false,
      reason: "ATTEMPTS_EXCEEDED",
    };
  }

  const inputHash = sha256Hex(code.trim());
  const isMatched = safeCompare(savedHash, inputHash);

  if (!isMatched) {
    const nextAttempts = await redis.incr(attemptsKey);
    if (nextAttempts === 1) {
      await redis.expire(attemptsKey, CODE_EXPIRE_SECONDS);
    }

    return {
      ok: false,
      reason: "MISMATCH",
    };
  }

  await redis.del(codeKey);
  await redis.del(attemptsKey);

  return {
    ok: true,
  };
}

export async function clearEmailVerificationState(email: string): Promise<void> {
  await connectRedis();

  await redis.del(getCodeKey(email));
  await redis.del(getAttemptsKey(email));
  await redis.del(getCooldownKey(email));
}

export const emailCodeConfig = {
  CODE_EXPIRE_SECONDS,
  SEND_COOLDOWN_SECONDS,
  MAX_SENDS_PER_EMAIL_PER_DAY,
  MAX_SENDS_PER_IP_PER_HOUR,
  MAX_VERIFY_ATTEMPTS,
};
