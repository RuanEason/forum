import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { getSiteOriginOrThrow } from "@/lib/site-url";

const CASDOOR_STATE_COOKIE = "casdoor-oauth-state";
export const CASDOOR_REDIRECT_COOKIE = "casdoor-login-redirect";
export const CASDOOR_PENDING_COOKIE = "casdoor-pending-login";
const STATE_MAX_AGE_SECONDS = 60 * 15;
const PENDING_MAX_AGE_SECONDS = 60 * 15;
const PENDING_TOKEN_SALT = "casdoor-pending-login";

export type CasdoorUserInfo = {
  sub?: string;
  id?: string;
  email?: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  picture?: string;
  permanentAvatar?: string;
  [key: string]: unknown;
};

export type CasdoorIdentity = {
  casdoorUserId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

export type PendingCasdoorLogin = CasdoorIdentity & {
  redirectPath: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET or AUTH_SECRET");
  }

  return secret;
}

export function getCasdoorConfig() {
  const baseUrl = trimTrailingSlash(requireEnv("CASDOOR_BASE_URL"));
  const clientId = requireEnv("CASDOOR_CLIENT_ID");
  const clientSecret = requireEnv("CASDOOR_CLIENT_SECRET");
  const redirectUri = process.env.CASDOOR_REDIRECT_URI?.trim()
    || `${getSiteOriginOrThrow()}/api/TPLcallback`;
  const scope = process.env.CASDOOR_SCOPE?.trim() || "openid profile email";

  return {
    baseUrl,
    clientId,
    clientSecret,
    redirectUri,
    scope,
    authorizationEndpoint: `${baseUrl}/login/oauth/authorize`,
    tokenEndpoint: `${baseUrl}/api/login/oauth/access_token`,
    userinfoEndpoint: `${baseUrl}/api/userinfo`,
  };
}

function hashState(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createCasdoorState(secure?: boolean) {
  const state = randomBytes(24).toString("hex");
  const stateHash = hashState(state);
  const cookieStore = await cookies();
  const isSecure = secure ?? getSiteOriginOrThrow().startsWith("https://");

  cookieStore.set(CASDOOR_STATE_COOKIE, stateHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return state;
}

export async function verifyCasdoorState(state: string) {
  const cookieStore = await cookies();
  const storedHash = cookieStore.get(CASDOOR_STATE_COOKIE)?.value;

  cookieStore.delete(CASDOOR_STATE_COOKIE);

  if (!storedHash) {
    return false;
  }

  return storedHash === hashState(state);
}

export function buildCasdoorAuthorizeUrl(options?: { state?: string; redirectPath?: string }) {
  const config = getCasdoorConfig();
  const url = new URL(config.authorizationEndpoint);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scope);

  if (options?.state) {
    url.searchParams.set("state", options.state);
  }

  if (options?.redirectPath) {
    url.searchParams.set("redirect", options.redirectPath);
  }

  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type CasdoorAccessTokenResponse = {
  access_token: string;
  token_type?: string;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
};

export async function exchangeCasdoorCode(code: string): Promise<CasdoorAccessTokenResponse> {
  const config = getCasdoorConfig();

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    const reason = payload.error_description || payload.error || "Failed to exchange Casdoor code";
    throw new Error(reason);
  }

  return {
    access_token: payload.access_token,
    token_type: payload.token_type,
    id_token: payload.id_token,
    refresh_token: payload.refresh_token,
    scope: payload.scope,
  };
}

export async function fetchCasdoorUserInfo(accessToken: string) {
  const config = getCasdoorConfig();

  const response = await fetch(config.userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as CasdoorUserInfo;

  if (!response.ok) {
    throw new Error("Failed to fetch Casdoor user info");
  }

  return payload;
}

export function getCasdoorStableUserId(profile: CasdoorUserInfo): string | null {
  const rawId = profile.sub ?? profile.id;
  if (typeof rawId !== "string") {
    return null;
  }

  const normalized = rawId.trim();
  return normalized || null;
}

export function getCasdoorProfileName(profile: CasdoorUserInfo): string | null {
  const candidates = [profile.displayName, profile.name];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function getCasdoorProfileAvatar(profile: CasdoorUserInfo): string | null {
  const candidates = [profile.avatar, profile.picture, profile.permanentAvatar];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function getCasdoorIdentity(profile: CasdoorUserInfo): CasdoorIdentity | null {
  const casdoorUserId = getCasdoorStableUserId(profile);
  if (!casdoorUserId) {
    return null;
  }

  const email = typeof profile.email === "string" && profile.email.trim()
    ? profile.email.trim().toLowerCase()
    : null;

  return {
    casdoorUserId,
    email,
    name: getCasdoorProfileName(profile),
    avatar: getCasdoorProfileAvatar(profile),
  };
}

export async function encodePendingCasdoorLogin(payload: PendingCasdoorLogin) {
  return encode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token: payload,
    maxAge: PENDING_MAX_AGE_SECONDS,
  });
}

export async function decodePendingCasdoorLogin(token: string) {
  const decoded = await decode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token,
  });

  if (!decoded) {
    return null;
  }

  const casdoorUserId = typeof decoded.casdoorUserId === "string" ? decoded.casdoorUserId : null;
  const redirectPath = typeof decoded.redirectPath === "string" ? decoded.redirectPath : null;

  if (!casdoorUserId || !redirectPath) {
    return null;
  }

  return {
    casdoorUserId,
    redirectPath,
    email: typeof decoded.email === "string" ? decoded.email : null,
    name: typeof decoded.name === "string" ? decoded.name : null,
    avatar: typeof decoded.avatar === "string" ? decoded.avatar : null,
  } satisfies PendingCasdoorLogin;
}

export async function readPendingCasdoorLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CASDOOR_PENDING_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await decodePendingCasdoorLogin(token);
  } catch {
    return null;
  }
}
