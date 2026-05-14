import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import type { PermissionCode } from "./constants";

// ============================================================
// Server-side helpers
// ============================================================

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Retourne la session ou throw UNAUTHORIZED.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/**
 * Vérifie une permission côté serveur — throw si non autorisé.
 * Délègue à getEffectivePermissions (implémenté en Phase 2).
 * Pour l'instant : toujours autorisé si authentifié + isSuperAdmin.
 *
 * TODO(Phase 2): remplacer par appel à features/admin/lib/permissions.ts
 */
export async function checkPermission(permission: PermissionCode): Promise<void> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");

  // Super Admin court-circuit — accès total
  if ((session.user as { isSuperAdmin?: boolean }).isSuperAdmin) return;

  // TODO(Phase 2): charger les permissions effectives depuis la DB
  // const perms = await getEffectivePermissions(session.user.id);
  // if (!perms.has(permission)) throw new Error("FORBIDDEN");
  throw new Error(`FORBIDDEN: permission ${permission} requise`);
}

/**
 * Vérifie sans throw — retourne boolean.
 */
export function hasPermission(
  userPermissions: string[],
  permission: PermissionCode
): boolean {
  return userPermissions.includes(permission);
}

// ============================================================
// Exports
// ============================================================
export {
  PERMISSIONS,
  ALL_PERMISSION_CODES,
  PERMISSIONS_BY_MODULE,
  DANGEROUS_PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
} from "./constants";
export type { PermissionCode } from "./constants";
export { MODULES, MODULE_ORDER } from "./modules";
export type { ModuleCode, Module } from "./modules";
