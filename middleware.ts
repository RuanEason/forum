import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthPageRedirectPath, toSignInPath } from "@/lib/auth-redirect";

const AUTH_PAGES = new Set(["/auth/signin", "/auth/signup"]);
const COMPLETE_PROFILE_PATH = "/auth/complete-profile";

const SESSION_COOKIE_PREFIXES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const NEXT_AUTH_COOKIE_PREFIXES = [
  ...SESSION_COOKIE_PREFIXES,
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

function getAuthCookieNames(request: NextRequest): string[] {
  return request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((cookieName) =>
      NEXT_AUTH_COOKIE_PREFIXES.some(
        (prefix) => cookieName === prefix || cookieName.startsWith(`${prefix}.`)
      )
    );
}

function hasSessionCookies(cookieNames: string[]): boolean {
  return cookieNames.some((cookieName) =>
    SESSION_COOKIE_PREFIXES.some(
      (prefix) => cookieName === prefix || cookieName.startsWith(`${prefix}.`)
    )
  );
}

function clearAuthCookies(response: NextResponse, cookieNames: string[]) {
  for (const name of new Set(cookieNames)) {
    response.cookies.delete(name);
  }
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const signInUrl = new URL(toSignInPath(redirectPath), request.url);
  return NextResponse.redirect(signInUrl);
}

export default withAuth(
  function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;
    const isAuthPage = AUTH_PAGES.has(pathname);
    const isCompleteProfilePage = pathname === COMPLETE_PROFILE_PATH;
    const token = request.nextauth.token;
    const isAuthenticated = Boolean(token);
    const authCookieNames = getAuthCookieNames(request);
    const hasInvalidSession =
      !isAuthenticated && authCookieNames.length > 0 && hasSessionCookies(authCookieNames);

    if (hasInvalidSession) {
      const response = isAuthPage ? NextResponse.next() : redirectToSignIn(request);
      clearAuthCookies(response, authCookieNames);
      return response;
    }

    if (isAuthenticated && isAuthPage) {
      const fallbackRedirect = searchParams.get("redirect");
      const safeRedirect = getAuthPageRedirectPath(fallbackRedirect, COMPLETE_PROFILE_PATH);
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }

    if (!isAuthenticated && isCompleteProfilePage) {
      return redirectToSignIn(request);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
