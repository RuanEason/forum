import {
  getCurrentUser,
  requireActiveUser,
  type AuthResult,
  type CurrentUser,
} from "@/lib/server-auth";

export type SessionUser = CurrentUser;

export async function getSessionUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export async function requireSessionUser(): Promise<AuthResult> {
  return requireActiveUser();
}
