export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole);
}

export function isSuperAdminRole(role: unknown): boolean {
  return role === "super_admin";
}
