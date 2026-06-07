import { NextRequest, NextResponse } from "next/server";
import { buildCasdoorAuthorizeUrl, createCasdoorState } from "@/lib/casdoor";
import { getAuthPageRedirectPath } from "@/lib/auth-redirect";

const CASDOOR_REDIRECT_COOKIE = "casdoor-login-redirect";

export async function GET(request: NextRequest) {
  try {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const redirectPath = getAuthPageRedirectPath(redirect);
    const isSecure = request.nextUrl.protocol === "https:";
    const state = await createCasdoorState(isSecure);
    const authorizeUrl = buildCasdoorAuthorizeUrl({
      state,
      redirectPath,
    });
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(
      CASDOOR_REDIRECT_COOKIE,
      redirectPath,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 60 * 15,
      },
    );

    return response;
  } catch (error) {
    console.error("Failed to start third-party login:", error);
    const fallback = new URL("/auth/signin?error=ThirdPartyLoginStart", request.url);
    return NextResponse.redirect(fallback);
  }
}
