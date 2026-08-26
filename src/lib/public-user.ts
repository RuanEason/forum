import { isAdminRole } from "@/lib/roles";

export function toPublicUser<T extends { role?: unknown }>(user: T): Omit<T, "role"> & {
  isAdmin: boolean;
} {
  const { role, ...publicUser } = user;

  return {
    ...publicUser,
    isAdmin: isAdminRole(role),
  };
}
