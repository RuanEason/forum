import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { getSiteOriginOrThrow, resolveSiteOrigin } from "@/lib/site-url";

const GITHUB_STATE_COOKIE = "github-oauth-state";
export const GITHUB_REDIRECT_COOKIE = "github-login-redirect";
export const GITHUB_PENDING_COOKIE = "github-pending-login";
const STATE_MAX_AGE_SECONDS = 60 * 15;
const PENDING_MAX_AGE_SECONDS = 60 * 15;
const PENDING_TOKEN_SALT = "github-pending-login";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

export type GitHubUserProfile = {
  id?: number;
  login?: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

export type GitHubUserEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
};

export type GitHubIdentity = {
  githubUserId: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  login: string | null;
};

export type PendingGitHubLogin = GitHubIdentity & {
  redirectPath: string;
};

type GitHubTokenResponse = {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
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

function hashState(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getGitHubConfig() {
  const clientId = requireEnv("GITHUB_CLIENT_ID");
  const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");
  const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim()
    || `${trimTrailingSlash(getSiteOriginOrThrow())}/api/auth/github/callback`;
  const scope = process.env.GITHUB_SCOPE?.trim() || "read:user user:email";

  return {
    clientId,
    clientSecret,
    redirectUri,
    scope,
  };
}

export async function createGitHubState(secure?: boolean) {
  const state = randomBytes(24).toString("hex");
  const stateHash = hashState(state);
  const cookieStore = await cookies();
  const isSecure = secure ?? getSiteOriginOrThrow().startsWith("https://");

  cookieStore.set(GITHUB_STATE_COOKIE, stateHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return state;
}

export async function verifyGitHubState(state: string) {
  const cookieStore = await cookies();
  const storedHash = cookieStore.get(GITHUB_STATE_COOKIE)?.value;

  cookieStore.delete(GITHUB_STATE_COOKIE);

  if (!storedHash) {
    return false;
  }

  return storedHash === hashState(state);
}

export function buildGitHubAuthorizeUrl(options?: { state?: string }) {
  const config = getGitHubConfig();
  const url = new URL(GITHUB_AUTHORIZE_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("allow_signup", "true");

  if (options?.state) {
    url.searchParams.set("state", options.state);
  }

  return url.toString();
}

export async function exchangeGitHubCode(code: string) {
  const config = getGitHubConfig();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || !payload.access_token) {
    const reason = payload.error_description || payload.error || "Failed to exchange GitHub code";
    throw new Error(reason);
  }

  return {
    accessToken: payload.access_token,
    scope: payload.scope,
    tokenType: payload.token_type,
  };
}

export async function fetchGitHubUserProfile(accessToken: string) {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "slept-forum-auth",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as GitHubUserProfile;

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user profile");
  }

  return payload;
}

export async function fetchGitHubUserEmails(accessToken: string) {
  const response = await fetch(GITHUB_EMAILS_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "slept-forum-auth",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as GitHubUserEmail[];

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user emails");
  }

  return payload;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function pickVerifiedGitHubEmail(profileEmail: string | null | undefined, emails: GitHubUserEmail[]) {
  const normalizedProfileEmail = typeof profileEmail === "string" && profileEmail.trim()
    ? normalizeEmail(profileEmail)
    : null;

  if (normalizedProfileEmail) {
    const matchingVerifiedEmail = emails.find((item) => {
      return item.verified && normalizeEmail(item.email) === normalizedProfileEmail;
    });

    if (matchingVerifiedEmail) {
      return normalizeEmail(matchingVerifiedEmail.email);
    }
  }

  const primaryVerifiedEmail = emails.find((item) => item.primary && item.verified);
  if (primaryVerifiedEmail) {
    return normalizeEmail(primaryVerifiedEmail.email);
  }

  const firstVerifiedEmail = emails.find((item) => item.verified);
  if (firstVerifiedEmail) {
    return normalizeEmail(firstVerifiedEmail.email);
  }

  return null;
}

export function getRequestOrigin(request: Request) {
  return resolveSiteOrigin({ request }) ?? new URL(request.url).origin;
}

export function getGitHubIdentity(
  profile: GitHubUserProfile,
  emails: GitHubUserEmail[],
): GitHubIdentity | null {
  if (typeof profile.id !== "number") {
    return null;
  }

  const login = typeof profile.login === "string" && profile.login.trim()
    ? profile.login.trim()
    : null;
  const name = typeof profile.name === "string" && profile.name.trim()
    ? profile.name.trim()
    : login;
  const avatar = typeof profile.avatar_url === "string" && profile.avatar_url.trim()
    ? profile.avatar_url.trim()
    : null;

  return {
    githubUserId: String(profile.id),
    email: pickVerifiedGitHubEmail(profile.email, emails),
    name,
    avatar,
    login,
  };
}

export async function encodePendingGitHubLogin(payload: PendingGitHubLogin) {
  return encode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token: payload,
    maxAge: PENDING_MAX_AGE_SECONDS,
  });
}

export async function decodePendingGitHubLogin(token: string) {
  const decoded = await decode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token,
  });

  if (!decoded) {
    return null;
  }

  const githubUserId = typeof decoded.githubUserId === "string" ? decoded.githubUserId : null;
  const redirectPath = typeof decoded.redirectPath === "string" ? decoded.redirectPath : null;

  if (!githubUserId || !redirectPath) {
    return null;
  }

  return {
    githubUserId,
    redirectPath,
    email: typeof decoded.email === "string" ? decoded.email : null,
    name: typeof decoded.name === "string" ? decoded.name : null,
    avatar: typeof decoded.avatar === "string" ? decoded.avatar : null,
    login: typeof decoded.login === "string" ? decoded.login : null,
  } satisfies PendingGitHubLogin;
}

export async function readPendingGitHubLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(GITHUB_PENDING_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await decodePendingGitHubLogin(token);
  } catch {
    return null;
  }
}
