type RequestLike = {
  headers?: Headers;
  url?: string;
  nextUrl?: {
    origin?: string;
  };
};

type ResolveSiteOriginOptions = {
  request?: RequestLike;
  allowLocalhost?: boolean;
};

const DEFAULT_LOCAL_ORIGIN = "http://localhost:3000";
const ORIGIN_ENV_KEYS = [
  "SITE_URL",
  "NEXTAUTH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function pickFirstHeaderValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .find(Boolean) || "";
}

function looksLikeLocalhost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (LOCAL_HOSTNAMES.has(normalized)) {
    return true;
  }

  return normalized.endsWith(".localhost");
}

function sanitizeOrigin(
  value: string,
  allowLocalhost: boolean,
  fallbackProtocol: "http" | "https" = "https",
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `${fallbackProtocol}://${trimmed.replace(/^\/\//, "")}`;

  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  if (!allowLocalhost && looksLikeLocalhost(parsed.hostname)) {
    return null;
  }

  return parsed.origin;
}

function getEnvOrigin(allowLocalhost: boolean): string | null {
  for (const key of ORIGIN_ENV_KEYS) {
    const raw = process.env[key];
    if (!raw) {
      continue;
    }

    const protocolHint =
      raw.includes("localhost") || raw.includes("127.0.0.1") || raw.includes("::1")
        ? "http"
        : "https";

    const resolved = sanitizeOrigin(raw, allowLocalhost, protocolHint);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function getRequestOrigin(request: RequestLike, allowLocalhost: boolean): string | null {
  const forwardedProto = pickFirstHeaderValue(request.headers?.get("x-forwarded-proto"));
  const forwardedHost = pickFirstHeaderValue(request.headers?.get("x-forwarded-host"))
    || pickFirstHeaderValue(request.headers?.get("host"));

  if (forwardedHost) {
    const protocol = forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : "https";
    const forwardedOrigin = sanitizeOrigin(
      `${protocol}://${forwardedHost}`,
      allowLocalhost,
      protocol,
    );
    if (forwardedOrigin) {
      return forwardedOrigin;
    }
  }

  const nextUrlOrigin = request.nextUrl?.origin;
  if (nextUrlOrigin) {
    const resolved = sanitizeOrigin(nextUrlOrigin, allowLocalhost, "https");
    if (resolved) {
      return resolved;
    }
  }

  if (request.url) {
    const resolved = sanitizeOrigin(request.url, allowLocalhost, "https");
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export function resolveSiteOrigin(options: ResolveSiteOriginOptions = {}): string | null {
  const allowLocalhost = options.allowLocalhost ?? process.env.NODE_ENV !== "production";

  const envOrigin = getEnvOrigin(allowLocalhost);
  if (envOrigin) {
    return envOrigin;
  }

  if (options.request) {
    const requestOrigin = getRequestOrigin(options.request, allowLocalhost);
    if (requestOrigin) {
      return requestOrigin;
    }
  }

  return allowLocalhost ? DEFAULT_LOCAL_ORIGIN : null;
}

export function getSiteOriginOrThrow(options: ResolveSiteOriginOptions = {}): string {
  const origin = resolveSiteOrigin(options);
  if (origin) {
    return origin;
  }

  throw new Error("Site origin is not configured. Set SITE_URL or NEXTAUTH_URL for production.");
}

