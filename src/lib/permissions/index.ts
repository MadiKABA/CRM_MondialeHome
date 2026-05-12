import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import type { Permission } from "./constants";

// ============================================================
// Server-side helpers
// ============================================================

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Check if a user has a specific permission (no throw).
 * Uses the user's roles array stored in session.
 */
export function hasPermission(
  userPermissions: string[],
  permission: Permission
): boolean {
  return userPermissions.includes(permission);
}

/**
 * Server-side permission check — throws if unauthorized.
 * Use inside Server Actions and Route Handlers.
 */
export async function checkPermission(permission: Permission): Promise<void> {
  const session = await getServerSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const userPermissions: string[] =
    // TODO: load from user's role in DB — replace this placeholder
    (session.user as { permissions?: string[] }).permissions ?? [];

  if (!hasPermission(userPermissions, permission)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Returns the current session or throws UNAUTHORIZED.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

// ============================================================
// Exports
// ============================================================
export { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from "./constants";
export type { Permission, Role } from "./constants";
