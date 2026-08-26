import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdminRole } from "@/lib/roles";

export { isAdminRole, isSuperAdminRole } from "@/lib/roles";

const authUserSelect = {
  id: true,
  name: true,
  role: true,
  banned: true,
  sessionVersion: true,
  deletionRequestedAt: true,
  deletionScheduledAt: true,
} as const;

export type CurrentUser = {
  id: string;
  name: string | null;
  role: string;
  banned: boolean;
  sessionVersion: number;
  deletionRequestedAt?: Date | null;
  deletionScheduledAt?: Date | null;
};

type SessionShape = {
  user?: {
    id?: unknown;
    sessionVersion?: unknown;
  };
} | null;

export type AuthSuccess = {
  ok: true;
  user: CurrentUser;
};

export type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

function createAuthResponse(error: string, status: 401 | 403) {
  const response = NextResponse.json({ error }, { status });

  if (status === 401) {
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
  }

  return response;
}

export function unauthorizedResponse() {
  return createAuthResponse("Unauthorized", 401);
}

export function forbiddenResponse(error = "Forbidden") {
  return createAuthResponse(error, 403);
}

export function canManageUser(actor: CurrentUser, target: Pick<CurrentUser, "id" | "role">) {
  if (actor.id === target.id) {
    return false;
  }

  if (isAdminRole(target.role) && !isSuperAdminRole(actor.role)) {
    return false;
  }

  return isAdminRole(actor.role);
}

export function isSessionVersionValid(
  sessionVersion: unknown,
  currentSessionVersion: number,
) {
  return sessionVersion === undefined
    || sessionVersion === currentSessionVersion;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = (await getServerSession(authOptions)) as SessionShape;
  const userId = typeof session?.user?.id === "string" ? session.user.id : null;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authUserSelect,
  });

  if (!user || !isSessionVersionValid(session?.user?.sessionVersion, user.sessionVersion)) {
    return null;
  }

  return user;
}

export async function requireCurrentUser(): Promise<AuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, response: unauthorizedResponse() };
  }

  return { ok: true, user };
}

export async function requireActiveUser(): Promise<AuthResult> {
  const result = await requireCurrentUser();

  if (!result.ok) {
    return result;
  }

  if (result.user.banned) {
    return { ok: false, response: forbiddenResponse("Account is banned") };
  }

  if (result.user.deletionRequestedAt) {
    return { ok: false, response: forbiddenResponse("Account deletion is pending") };
  }

  return result;
}

export async function requireAdminUser(): Promise<AuthResult> {
  const result = await requireActiveUser();

  if (!result.ok) {
    return result;
  }

  if (!isAdminRole(result.user.role)) {
    return { ok: false, response: forbiddenResponse() };
  }

  return result;
}

export async function incrementSessionVersion(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
}
