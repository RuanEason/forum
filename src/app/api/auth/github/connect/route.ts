import { NextRequest, NextResponse } from "next/server";
import { getAuthPageRedirectPath, toSignInPath } from "@/lib/auth-redirect";
import {
  buildGitHubAuthorizeUrl,
  createGitHubState,
  encodeGitHubConnectIntent,
  GITHUB_CONNECT_COOKIE,
} from "@/lib/github";
import { requireActiveUser } from "@/lib/server-auth";

const SETTINGS_SECURITY_PATH = "/settings?section=security";

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();

  if (!auth.ok) {
    return NextResponse.redirect(new URL(toSignInPath(SETTINGS_SECURITY_PATH), request.url));
  }

  try {
    const redirectPath = getAuthPageRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      SETTINGS_SECURITY_PATH,
    );
    const isSecure = request.nextUrl.protocol === "https:";
    const state = await createGitHubState(isSecure);
    const intent = await encodeGitHubConnectIntent({
      userId: auth.user.id,
      redirectPath,
    });
    const response = NextResponse.redirect(buildGitHubAuthorizeUrl({ state }));

    response.cookies.set(GITHUB_CONNECT_COOKIE, intent, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 60 * 15,
    });

    return response;
  } catch (error) {
    console.error("Failed to start GitHub connection:", error);
    return NextResponse.redirect(
      new URL(`${SETTINGS_SECURITY_PATH}&github=error`, request.url),
    );
  }
}
