import type { PermissionCode } from "./constants";

// ============================================================
// Client-safe permission helpers (no server dependencies)
// For server-only functions, import from "@/lib/permissions/server"
// ============================================================

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
