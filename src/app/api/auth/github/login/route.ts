import { NextRequest, NextResponse } from "next/server";
import { buildGitHubAuthorizeUrl, createGitHubState, GITHUB_REDIRECT_COOKIE } from "@/lib/github";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  try {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const redirectPath = getAuthPageRedirectPath(redirect);
    const isSecure = request.nextUrl.protocol === "https:";
    const state = await createGitHubState(isSecure);
    const authorizeUrl = buildGitHubAuthorizeUrl({ state });
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(GITHUB_REDIRECT_COOKIE, redirectPath, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 60 * 15,
    });

    return response;
  } catch (error) {
    console.error("Failed to start GitHub login:", error);
    const fallback = new URL("/auth/signin?error=GitHubLoginStart", request.url);
    return NextResponse.redirect(fallback);
  }
}
