const DEFAULT_REDIRECT_PATH = "/";
const AUTH_PAGE_PATHS = new Set(["/auth/signin", "/auth/signup"]);

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH
): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function toSignInPath(redirectPath: string): string {
  return `/auth/signin?redirect=${encodeURIComponent(redirectPath)}`;
}

export function toCompleteProfilePath(redirectPath: string): string {
  const safePath = getAuthPageRedirectPath(redirectPath, DEFAULT_REDIRECT_PATH);
  return safePath === DEFAULT_REDIRECT_PATH
    ? "/auth/complete-profile"
    : `/auth/complete-profile?redirect=${encodeURIComponent(safePath)}`;
}

export function getAuthPageRedirectPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT_PATH
): string {
  const safePath = getSafeRedirectPath(value, fallback);
  const pathname = safePath.split("?")[0];

  if (AUTH_PAGE_PATHS.has(pathname)) {
    return fallback;
  }

  return safePath;
}
