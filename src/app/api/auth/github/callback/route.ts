import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";
import {
  encodePendingGitHubLogin,
  fetchGitHubUserEmails,
  fetchGitHubUserProfile,
  getGitHubIdentity,
  getRequestOrigin,
  exchangeGitHubCode,
  GITHUB_PENDING_COOKIE,
  GITHUB_REDIRECT_COOKIE,
  verifyGitHubState,
} from "@/lib/github";

const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";
const SESSION_COOKIE_NAME = "next-auth.session-token";

function getSessionCookieName(isSecure: boolean) {
  return isSecure ? SESSION_COOKIE_NAME_SECURE : SESSION_COOKIE_NAME;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const isSecure = url.protocol === "https:";
  const cookieStore = await cookies();

  const redirectPath = getAuthPageRedirectPath(
    url.searchParams.get("callbackUrl") || cookieStore.get(GITHUB_REDIRECT_COOKIE)?.value,
  );

  if (error) {
    const target = new URL(`/auth/signin?error=${encodeURIComponent(error)}`, origin);
    return NextResponse.redirect(target);
  }

  if (!code || !state) {
    const target = new URL("/auth/signin?error=GitHubLoginMissingCode", origin);
    return NextResponse.redirect(target);
  }

  const stateVerified = await verifyGitHubState(state);
  if (!stateVerified) {
    const target = new URL("/auth/signin?error=GitHubLoginState", origin);
    return NextResponse.redirect(target);
  }

  try {
    const tokenPayload = await exchangeGitHubCode(code);
    const profile = await fetchGitHubUserProfile(tokenPayload.accessToken);
    const emails = await fetchGitHubUserEmails(tokenPayload.accessToken);
    const identity = getGitHubIdentity(profile, emails);

    if (!identity) {
      throw new Error("GitHub user id is missing");
    }

    if (!identity.email) {
      const target = new URL("/auth/signin?error=GitHubEmailMissing", origin);
      return NextResponse.redirect(target);
    }

    const authorize = authOptions.providers.find((provider: { id?: string; authorize?: unknown }) => provider.id === "github")?.authorize;

    if (typeof authorize !== "function") {
      throw new Error("GitHub auth provider is not configured");
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
      const pendingToken = await encodePendingGitHubLogin({
        ...identity,
        redirectPath,
      });
      const bindTarget = new URL("/auth/github", origin);
      const response = NextResponse.redirect(bindTarget);

      response.cookies.set(GITHUB_PENDING_COOKIE, pendingToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 60 * 15,
      });

      response.cookies.set(GITHUB_REDIRECT_COOKIE, "", {
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
          provider: "github",
          providerAccountId: identity.githubUserId,
          type: "credentials",
        },
        isNewUser: false,
        trigger: "signIn",
      }),
      maxAge: authOptions.session.maxAge,
    });

    const cookieName = getSessionCookieName(isSecure);
    const expires = new Date(Date.now() + authOptions.session.maxAge * 1000);
    const target = new URL(redirectPath, origin);
    const response = NextResponse.redirect(target);

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      expires,
    });

    response.cookies.set(GITHUB_REDIRECT_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    response.cookies.set(GITHUB_PENDING_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (loginError) {
    console.error("GitHub login callback failed:", loginError);
    const target = new URL("/auth/signin?error=GitHubLoginFailed", origin);
    return NextResponse.redirect(target);
  }
}
