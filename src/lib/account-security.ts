import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { Prisma, SecurityEventType } from "@/generated";
import { prisma } from "@/lib/prisma";
import { connectRedis, redis } from "@/lib/redis";

export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
export const EMAIL_CHANGE_TOKEN_TTL_MS = 30 * 60 * 1000;

export const LOGIN_RATE_LIMIT = {
  windowSeconds: 15 * 60,
  maxAttempts: 5,
} as const;

export const PASSWORD_RESET_RATE_LIMIT = {
  windowSeconds: 60 * 60,
  maxAttempts: 5,
} as const;

export const EMAIL_CHANGE_RATE_LIMIT = {
  windowSeconds: 60 * 60,
  maxAttempts: 5,
} as const;

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "如果该邮箱已注册，密码重置邮件将发送到该邮箱。";

export const EMAIL_CHANGE_REQUEST_MESSAGE =
  "验证邮件已发送，请在 30 分钟内完成邮箱变更。";

export const EMAIL_CHANGE_TOKEN_INVALID_MESSAGE =
  "邮箱变更链接无效或已过期。";

export const PASSWORD_RESET_TOKEN_INVALID_MESSAGE =
  "密码重置链接无效或已过期。";

export type ClientHeaders = Headers | Record<string, unknown> | undefined;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type SecurityEventInput = {
  userId?: string | null;
  type: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

function readHeader(headers: ClientHeaders, name: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) {
    return typeof raw[0] === "string" ? raw[0] : null;
  }

  return typeof raw === "string" ? raw : null;
}

export function getClientIpFromHeaders(headers: ClientHeaders): string {
  const forwarded = readHeader(headers, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }

  return readHeader(headers, "x-real-ip")?.trim() || "0.0.0.0";
}

export function getUserAgentFromHeaders(headers: ClientHeaders): string | null {
  return readHeader(headers, "user-agent")?.slice(0, 2000) || null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAccountEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidAccountPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 128;
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isEqualOpaqueTokenHash(left: string, right: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}

function hashKeyPart(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32);
}

export function getLoginRateLimitKeys(input: {
  email: string;
  userId?: string | null;
  ip: string;
}): string[] {
  const keys = [
    `auth:login:failed:email:${hashKeyPart(normalizeEmail(input.email))}`,
    `auth:login:failed:ip:${hashKeyPart(input.ip || "0.0.0.0")}`,
  ];

  if (input.userId) {
    keys.push(`auth:login:failed:account:${hashKeyPart(input.userId)}`);
  }

  return keys;
}

function getEmailRateLimitKey(prefix: string, email: string): string {
  return `auth:${prefix}:email:${hashKeyPart(normalizeEmail(email))}`;
}

function getIpRateLimitKey(prefix: string, ip: string): string {
  return `auth:${prefix}:ip:${hashKeyPart(ip || "0.0.0.0")}`;
}

export async function getLoginRateLimitState(input: {
  email: string;
  userId?: string | null;
  ip: string;
}): Promise<RateLimitResult> {
  try {
    const client = await connectRedis();
    const keys = getLoginRateLimitKeys(input);
    const values = await Promise.all(keys.map((key) => client.get(key)));
    const counts = values.map((value) => Number.parseInt(value || "0", 10));
    const blocked = counts.some((count) => count >= LOGIN_RATE_LIMIT.maxAttempts);

    if (!blocked) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const ttls = await Promise.all(keys.map((key) => client.ttl(key)));
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, ...ttls.filter((ttl) => ttl > 0)),
    };
  } catch (error) {
    console.error("Login rate-limit check failed:", error);
    return { allowed: false, retryAfterSeconds: 60 };
  }
}

export async function recordLoginFailure(input: {
  email: string;
  userId?: string | null;
  ip: string;
}): Promise<void> {
  const client = await connectRedis();
  await Promise.all(getLoginRateLimitKeys(input).map(async (key) => {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, LOGIN_RATE_LIMIT.windowSeconds);
    }
  }));
}

export async function clearLoginFailureCounters(input: {
  email: string;
  userId?: string | null;
  ip?: string;
}): Promise<void> {
  const keys = getLoginRateLimitKeys({
    email: input.email,
    userId: input.userId,
    ip: input.ip || "0.0.0.0",
  }).filter((key) => !key.includes(":ip:"));

  if (keys.length === 0) {
    return;
  }

  const client = await connectRedis();
  await client.del(keys);
}

async function consumeRateLimit(
  keys: string[],
  maxAttempts: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const client = await connectRedis();
    const counts = await Promise.all(keys.map((key) => client.incr(key)));
    await Promise.all(keys.map(async (key, index) => {
      if (counts[index] === 1) {
        await client.expire(key, windowSeconds);
      }
    }));

    const blocked = counts.some((count) => count > maxAttempts);
    if (!blocked) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const ttls = await Promise.all(keys.map((key) => client.ttl(key)));
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, ...ttls.filter((ttl) => ttl > 0)),
    };
  } catch (error) {
    console.error("Account security rate-limit failed:", error);
    return { allowed: false, retryAfterSeconds: 60 };
  }
}

export function getPasswordResetRateLimitKeys(email: string, ip: string): string[] {
  return [
    getEmailRateLimitKey("password-reset", email),
    getIpRateLimitKey("password-reset", ip),
  ];
}

export function getEmailChangeRateLimitKeys(email: string, ip: string): string[] {
  return [
    getEmailRateLimitKey("email-change", email),
    getIpRateLimitKey("email-change", ip),
  ];
}

export async function consumePasswordResetRateLimit(
  email: string,
  ip: string,
): Promise<RateLimitResult> {
  return consumeRateLimit(
    getPasswordResetRateLimitKeys(email, ip),
    PASSWORD_RESET_RATE_LIMIT.maxAttempts,
    PASSWORD_RESET_RATE_LIMIT.windowSeconds,
  );
}

export async function consumeEmailChangeRateLimit(
  email: string,
  ip: string,
): Promise<RateLimitResult> {
  return consumeRateLimit(
    getEmailChangeRateLimitKeys(email, ip),
    EMAIL_CHANGE_RATE_LIMIT.maxAttempts,
    EMAIL_CHANGE_RATE_LIMIT.windowSeconds,
  );
}

export async function recordSecurityEvent(
  input: SecurityEventInput,
  db: typeof prisma | Prisma.TransactionClient = prisma,
) {
  return db.securityEvent.create({
    data: {
      userId: input.userId ?? undefined,
      type: input.type,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      metadata: input.metadata,
    },
  });
}

export async function recordSecurityEventSafely(input: SecurityEventInput): Promise<void> {
  try {
    await recordSecurityEvent(input);
  } catch (error) {
    console.error("Record security event failed:", error);
  }
}

export async function clearExpiredAccountSecurityTokens(now = new Date()): Promise<void> {
  await Promise.all([
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.emailChangeToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}

export function getRedisClientForTesting() {
  return redis;
}
