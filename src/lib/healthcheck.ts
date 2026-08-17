import { timingSafeEqual } from "node:crypto";

export const HEALTHCHECK_SECRET_HEADER = "x-healthcheck-secret";

export type HealthcheckPayload = {
  ok: boolean;
  responseTime: string;
  timestamp: string;
};

export function getHealthcheckSecretFromHeaders(headers: Headers) {
  const directSecret = headers.get(HEALTHCHECK_SECRET_HEADER)?.trim();
  if (directSecret) {
    return directSecret;
  }

  const authorization = headers.get("authorization")?.trim() ?? "";
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  return bearerMatch?.[1]?.trim() || null;
}

export function isHealthcheckSecretValid(
  providedSecret: string | null | undefined,
  expectedSecret: string | null | undefined,
) {
  const provided = providedSecret?.trim() ?? "";
  const expected = expectedSecret?.trim() ?? "";

  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function createHealthcheckPayload(
  ok: boolean,
  responseTime: string,
  timestamp = new Date().toISOString(),
): HealthcheckPayload {
  return {
    ok,
    responseTime,
    timestamp,
  };
}
