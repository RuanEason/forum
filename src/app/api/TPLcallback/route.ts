import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";
import {
  CASDOOR_PENDING_COOKIE,
  CASDOOR_REDIRECT_COOKIE,
  encodePendingCasdoorLogin,
  exchangeCasdoorCode,
  fetchCasdoorUserInfo,
  getCasdoorIdentity,
  verifyCasdoorState,
} from "@/lib/casdoor";
const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
const SESSION_COOKIE_NAME = "next-auth.session-token";

function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const redirectFromCasdoor = url.searchParams.get("redirect");
  const isSecure = url.protocol === "https:";
  const cookieStore = await cookies();

  const redirectPath = getAuthPageRedirectPath(
    redirectFromCasdoor
      || url.searchParams.get("callbackUrl")
      || cookieStore.get(CASDOOR_REDIRECT_COOKIE)?.value,
  );

  if (error) {
    const target = new URL(`/auth/signin?error=${encodeURIComponent(error)}`, url.origin);
    return NextResponse.redirect(target);
  }

  if (!code || !state) {
    const target = new URL("/auth/signin?error=ThirdPartyLoginMissingCode", url.origin);
    return NextResponse.redirect(target);
  }

  const stateVerified = await verifyCasdoorState(state);
  if (!stateVerified) {
    const target = new URL("/auth/signin?error=ThirdPartyLoginState", url.origin);
    return NextResponse.redirect(target);
  }

  try {
    const tokenPayload = await exchangeCasdoorCode(code);
    const profile = await fetchCasdoorUserInfo(tokenPayload.access_token);
    const identity = getCasdoorIdentity(profile);

    if (!identity) {
      throw new Error("Casdoor user id is missing");
    }

    if (!identity.email) {
      const target = new URL("/auth/signin?error=ThirdPartyEmailMissing", url.origin);
      return NextResponse.redirect(target);
    }

    const authorize = authOptions.providers.find((provider: { id?: string; authorize?: unknown }) => provider.id === "casdoor")?.authorize;

    if (typeof authorize !== "function") {
      throw new Error("Casdoor auth provider is not configured");
    }

    const user = await authorize(
      {
        identity: JSON.stringify(identity),
      },
      {
        query: Object.fromEntries(url.searchParams),
        body: undefined,
        headers: Object.fromEntries(request.headers),
        method: "GET",
      },
    );

    if (!user) {
      const pendingToken = await encodePendingCasdoorLogin({
        ...identity,
        redirectPath,
      });
      const bindTarget = new URL("/auth/casdoor", url.origin);
      const response = NextResponse.redirect(bindTarget);

      response.cookies.set(CASDOOR_PENDING_COOKIE, pendingToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 60 * 15,
      });

      response.cookies.set(CASDOOR_REDIRECT_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    const defaultToken = {
      name: user.name,
      email: user.email,
      picture: user.avatar,
      sub: user.id,
    };

    const sessionToken = await encode({
      secret: authOptions.secret ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
      token: await authOptions.callbacks.jwt({
        token: defaultToken,
        user,
        account: {
          provider: "casdoor",
          providerAccountId: user.id,
          type: "credentials",
        },
        isNewUser: false,
        trigger: "signIn",
      }),
      maxAge: authOptions.session.maxAge,
    });

    const cookieName = getSessionCookieName(isSecure);
    const expires = new Date(Date.now() + authOptions.session.maxAge * 1000);
    const target = new URL(redirectPath, url.origin);
    const response = NextResponse.redirect(target);

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      expires,
    });

    response.cookies.set(CASDOOR_REDIRECT_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    response.cookies.set(CASDOOR_PENDING_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (loginError) {
    console.error("Third-party login callback failed:", loginError);
    const target = new URL("/auth/signin?error=ThirdPartyLoginFailed", url.origin);
    return NextResponse.redirect(target);
  }
}
