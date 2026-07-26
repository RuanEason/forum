import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";
import { createSessionToken, setSessionCookie } from "@/lib/auth-session";
import { findGitHubLinkedLoginUser } from "@/lib/github-auth";
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

    const user = await findGitHubLinkedLoginUser(identity);

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

    const sessionToken = await createSessionToken({
      user,
      provider: "github",
      providerAccountId: identity.githubUserId,
    });

    const target = new URL(redirectPath, origin);
    const response = NextResponse.redirect(target);

    setSessionCookie(response, sessionToken, isSecure);

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
