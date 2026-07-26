import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { getSiteOriginOrThrow } from "@/lib/site-url";

const WECHAT_STATE_COOKIE = "wechat-oauth-state";
export const WECHAT_REDIRECT_COOKIE = "wechat-login-redirect";
export const WECHAT_PENDING_COOKIE = "wechat-pending-login";
const STATE_MAX_AGE_SECONDS = 60 * 15;
const PENDING_MAX_AGE_SECONDS = 60 * 15;
const PENDING_TOKEN_SALT = "wechat-pending-login";
const WECHAT_AUTHORIZE_URL = "https://open.weixin.qq.com/connect/oauth2/authorize";
const WECHAT_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token";
const WECHAT_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo";

export type WeChatTokenPayload = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export type WeChatUserInfo = {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export type WeChatIdentity = {
  wechatOpenId: string;
  wechatUnionId: string | null;
  name: string | null;
  avatar: string | null;
};

export type PendingWeChatLogin = WeChatIdentity & {
  redirectPath: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
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

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function isWeChatBrowser(userAgent: string | null | undefined) {
  return /MicroMessenger/i.test(userAgent ?? "");
}

export function getWeChatConfig(request?: Request) {
  const appId = requireEnv("WECHAT_APP_ID");
  const appSecret = requireEnv("WECHAT_APP_SECRET");
  const redirectUri = process.env.WECHAT_REDIRECT_URI?.trim()
    || `${trimTrailingSlash(getSiteOriginOrThrow({ request }))}/api/auth/wechat/callback`;
  const scope = process.env.WECHAT_SCOPE?.trim() === "snsapi_userinfo"
    ? "snsapi_userinfo"
    : "snsapi_base";

  return {
    appId,
    appSecret,
    redirectUri,
    scope,
  };
}

export async function createWeChatState(secure?: boolean) {
  const state = randomBytes(24).toString("hex");
  const stateHash = hashState(state);
  const cookieStore = await cookies();
  const isSecure = secure ?? getSiteOriginOrThrow().startsWith("https://");

  cookieStore.set(WECHAT_STATE_COOKIE, stateHash, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return state;
}

export async function verifyWeChatState(state: string) {
  const cookieStore = await cookies();
  const storedHash = cookieStore.get(WECHAT_STATE_COOKIE)?.value;

  cookieStore.delete(WECHAT_STATE_COOKIE);

  if (!storedHash) {
    return false;
  }

  return storedHash === hashState(state);
}

export function buildWeChatAuthorizeUrl(options: {
  state: string;
  request?: Request;
}) {
  const config = getWeChatConfig(options.request);
  const url = new URL(WECHAT_AUTHORIZE_URL);

  url.searchParams.set("appid", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", options.state);

  return `${url.toString()}#wechat_redirect`;
}

export async function exchangeWeChatCode(code: string) {
  const config = getWeChatConfig();
  const url = new URL(WECHAT_TOKEN_URL);

  url.searchParams.set("appid", config.appId);
  url.searchParams.set("secret", config.appSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });
  const payload = (await response.json()) as WeChatTokenPayload;

  if (!response.ok || payload.errcode || !payload.openid) {
    throw new Error(payload.errmsg || "Failed to exchange WeChat code");
  }

  return payload;
}

export async function fetchWeChatUserInfo(accessToken: string, openId: string) {
  const url = new URL(WECHAT_USERINFO_URL);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("openid", openId);
  url.searchParams.set("lang", "zh_CN");

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });
  const payload = (await response.json()) as WeChatUserInfo;

  if (!response.ok || payload.errcode) {
    throw new Error(payload.errmsg || "Failed to fetch WeChat user info");
  }

  return payload;
}

export async function encodePendingWeChatLogin(payload: PendingWeChatLogin) {
  return encode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token: payload,
    maxAge: PENDING_MAX_AGE_SECONDS,
  });
}

export async function decodePendingWeChatLogin(token: string) {
  const decoded = await decode({
    secret: getJwtSecret(),
    salt: PENDING_TOKEN_SALT,
    token,
  });

  if (!decoded) {
    return null;
  }

  const wechatOpenId = typeof decoded.wechatOpenId === "string" ? decoded.wechatOpenId : null;
  const redirectPath = typeof decoded.redirectPath === "string" ? decoded.redirectPath : null;

  if (!wechatOpenId || !redirectPath) {
    return null;
  }

  return {
    wechatOpenId,
    redirectPath,
    wechatUnionId: typeof decoded.wechatUnionId === "string" ? decoded.wechatUnionId : null,
    name: typeof decoded.name === "string" ? decoded.name : null,
    avatar: typeof decoded.avatar === "string" ? decoded.avatar : null,
  } satisfies PendingWeChatLogin;
}

export async function readPendingWeChatLogin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WECHAT_PENDING_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await decodePendingWeChatLogin(token);
  } catch {
    return null;
  }
}
