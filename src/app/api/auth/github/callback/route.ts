import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  GITHUB_CONNECT_COOKIE,
  GITHUB_PENDING_COOKIE,
  GITHUB_REDIRECT_COOKIE,
  readGitHubConnectIntent,
  verifyGitHubState,
} from "@/lib/github";

function clearGitHubConnectCookie(response: NextResponse, isSecure: boolean) {
  response.cookies.set(GITHUB_CONNECT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 0,
  });
}

function getConnectionResultUrl(origin: string, redirectPath: string, result: string) {
  const target = new URL(redirectPath, origin);
  target.searchParams.set("section", "security");
  target.searchParams.set("github", result);
  return target;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const isSecure = url.protocol === "https:";
  const cookieStore = await cookies();
  const connectIntent = await readGitHubConnectIntent();

  const redirectPath = getAuthPageRedirectPath(
    url.searchParams.get("callbackUrl") || cookieStore.get(GITHUB_REDIRECT_COOKIE)?.value,
  );

  const connectRedirectPath = connectIntent
    ? getAuthPageRedirectPath(connectIntent.redirectPath, "/settings?section=security")
    : null;
  const createConnectResponse = (result: string) => {
    const response = NextResponse.redirect(
      getConnectionResultUrl(origin, connectRedirectPath || "/settings?section=security", result),
    );
    clearGitHubConnectCookie(response, isSecure);
    return response;
  };

  if (error) {
    if (connectIntent) {
      return createConnectResponse("cancelled");
    }
    const target = new URL(`/auth/signin?error=${encodeURIComponent(error)}`, origin);
    return NextResponse.redirect(target);
  }

  if (!code || !state) {
    if (connectIntent) {
      return createConnectResponse("error");
    }
    const target = new URL("/auth/signin?error=GitHubLoginMissingCode", origin);
    return NextResponse.redirect(target);
  }

  const stateVerified = await verifyGitHubState(state);
  if (!stateVerified) {
    if (connectIntent) {
      return createConnectResponse("error");
    }
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

    if (connectIntent) {
      const session = await getServerSession(authOptions) as { user?: { id?: string } } | null;
      if (!session?.user?.id || session.user.id !== connectIntent.userId) {
        return createConnectResponse("error");
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: connectIntent.userId },
        select: { id: true, banned: true, githubUserId: true },
      });

      if (!currentUser || currentUser.banned) {
        return createConnectResponse("error");
      }

      if (currentUser.githubUserId && currentUser.githubUserId !== identity.githubUserId) {
        return createConnectResponse("already-linked");
      }

      const existingLinkedUser = await prisma.user.findUnique({
        where: { githubUserId: identity.githubUserId },
        select: { id: true },
      });

      if (existingLinkedUser && existingLinkedUser.id !== currentUser.id) {
        return createConnectResponse("conflict");
      }

      if (!currentUser.githubUserId) {
        await prisma.user.update({
          where: { id: currentUser.id },
          data: { githubUserId: identity.githubUserId },
        });
      }

      return createConnectResponse("connected");
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
    if (connectIntent) {
      return createConnectResponse("error");
    }
    const target = new URL("/auth/signin?error=GitHubLoginFailed", origin);
    return NextResponse.redirect(target);
  }
}
