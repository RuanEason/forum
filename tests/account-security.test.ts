import assert from "node:assert/strict";
import test from "node:test";

import {
  createOpaqueToken,
  EMAIL_CHANGE_REQUEST_MESSAGE,
  getClientIpFromHeaders,
  getEmailChangeRateLimitKeys,
  getLoginRateLimitKeys,
  getPasswordResetRateLimitKeys,
  getUserAgentFromHeaders,
  hashOpaqueToken,
  isEqualOpaqueTokenHash,
  isValidAccountEmail,
  isValidAccountPassword,
  normalizeEmail,
  PASSWORD_RESET_REQUEST_MESSAGE,
} from "../src/lib/account-security";

test("opaque tokens are random, hashed, and compared safely", () => {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);

  assert.equal(token.length > 32, true);
  assert.equal(tokenHash.length, 64);
  assert.notEqual(tokenHash, token);
  assert.equal(isEqualOpaqueTokenHash(tokenHash, hashOpaqueToken(token)), true);
  assert.equal(isEqualOpaqueTokenHash(tokenHash, hashOpaqueToken(`${token}-wrong`)), false);
  assert.equal(isEqualOpaqueTokenHash("", ""), false);
  assert.equal(isEqualOpaqueTokenHash("not-a-hash", tokenHash), false);
});

test("account email and password validation normalizes the expected inputs", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
  assert.equal(isValidAccountEmail("user@example.com"), true);
  assert.equal(isValidAccountEmail("not-an-email"), false);
  assert.equal(isValidAccountPassword("123456"), true);
  assert.equal(isValidAccountPassword("12345"), false);
  assert.equal(isValidAccountPassword("a".repeat(129)), false);
});

test("client IP and user-agent extraction prefers the first forwarded address", () => {
  const headers = new Headers({
    "x-forwarded-for": " 203.0.113.10, 10.0.0.1",
    "x-real-ip": "198.51.100.2",
    "user-agent": "account-security-test",
  });

  assert.equal(getClientIpFromHeaders(headers), "203.0.113.10");
  assert.equal(getUserAgentFromHeaders(headers), "account-security-test");
  assert.equal(getClientIpFromHeaders({ "x-real-ip": "198.51.100.3" }), "198.51.100.3");
  assert.equal(getClientIpFromHeaders(undefined), "0.0.0.0");
});

test("rate-limit keys are stable for normalized values and do not expose raw identifiers", () => {
  const resetKeys = getPasswordResetRateLimitKeys("USER@example.com", "203.0.113.10");
  const resetKeysWithDifferentCase = getPasswordResetRateLimitKeys(" user@EXAMPLE.com ", "203.0.113.10");
  const emailChangeKeys = getEmailChangeRateLimitKeys("user@example.com", "203.0.113.10");
  const loginKeys = getLoginRateLimitKeys({
    email: "USER@example.com",
    userId: "user-1",
    ip: "203.0.113.10",
  });

  assert.deepEqual(resetKeys, resetKeysWithDifferentCase);
  assert.equal(resetKeys.some((key) => key.includes("USER@example.com")), false);
  assert.equal(resetKeys.every((key) => key.includes("203.0.113.10") === false), true);
  assert.equal(emailChangeKeys[0].startsWith("auth:email-change:email:"), true);
  assert.equal(loginKeys.some((key) => key.includes(":account:")), true);
  assert.equal(loginKeys.length, 3);
});

test("password reset and email change request responses stay generic", () => {
  assert.equal(
    PASSWORD_RESET_REQUEST_MESSAGE,
    "如果该邮箱已注册，密码重置邮件将发送到该邮箱。",
  );
  assert.equal(
    EMAIL_CHANGE_REQUEST_MESSAGE,
    "验证邮件已发送，请在 30 分钟内完成邮箱变更。",
  );
});
