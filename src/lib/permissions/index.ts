import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import type { PermissionCode } from "./constants";

// ============================================================
// Server-side session helpers
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
 * Vérifie une permission côté serveur — throw FORBIDDEN si non autorisé.
 *
 * Utilise getEffectivePermissions de features/admin/lib/permissions.ts.
 * Super Admin court-circuite la vérification via le flag isSuperAdmin en session.
 */
export async function checkPermission(permission: PermissionCode): Promise<void> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");

  // Super Admin : accès total sans requête DB
  if ((session.user as { isSuperAdmin?: boolean }).isSuperAdmin) return;

  // Chargement des permissions effectives depuis la DB (memoïsé par request)
  const { hasPermission: dbHasPermission } =
    await import("@/features/admin/lib/permissions");
  const allowed = await dbHasPermission(session.user.id, permission);
  if (!allowed) throw new Error(`FORBIDDEN: permission "${permission}" requise`);
}

/**
 * Vérifie sans throw — retourne boolean.
 * Utilisé par les hooks client via les permissions stockées dans la session.
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
