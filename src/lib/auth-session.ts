import { encode } from "next-auth/jwt";
import type { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { LoginUser } from "@/lib/login-user";

export const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
export const SESSION_COOKIE_NAME = "next-auth.session-token";

function getSessionSecret() {
  const secret = authOptions.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET or AUTH_SECRET");
  }

  return secret;
}

export function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

export async function createSessionToken(options: {
  user: LoginUser;
  provider: string;
  providerAccountId: string;
}) {
  const { user, provider, providerAccountId } = options;
  const defaultToken = {
    name: user.name ?? undefined,
    email: user.email ?? undefined,
    picture: user.avatar ?? undefined,
    sub: user.id,
  };

  return encode({
    secret: getSessionSecret(),
    token: await authOptions.callbacks.jwt({
      token: defaultToken,
      user,
      account: {
        provider,
        providerAccountId,
        type: "credentials",
      },
      trigger: "signIn",
    }),
    maxAge: authOptions.session.maxAge,
  });
}

export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  isSecure: boolean,
) {
  response.cookies.set(getSessionCookieName(isSecure), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    expires: new Date(Date.now() + authOptions.session.maxAge * 1000),
  });
}
