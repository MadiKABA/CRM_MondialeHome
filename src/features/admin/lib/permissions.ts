import { cache } from "react";
import { db } from "@/lib/db";
import type { PermissionCode } from "@/lib/permissions";

/**
 * Calcule les permissions effectives d'un utilisateur.
 *
 * Logique :
 *   permissions_effectives =
 *     (permissions des rôles actifs)
 *     ∪ (UserPermission granted=true non expirées)
 *     ∖ (UserPermission granted=false non expirées)
 *
 * Exception : isSuperAdmin → wildcard "*" (toutes permissions)
 *
 * Memoïsé par request via React.cache() — une seule requête DB par rendu.
 */
export const getEffectivePermissions = cache(
  async (userId: string): Promise<Set<string>> => {
    const user = await db.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        isSuperAdmin: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  where: { granted: true },
                  select: { permission: { select: { code: true } } },
                },
              },
            },
          },
        },
        permissions: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: {
            granted: true,
            permission: { select: { code: true } },
          },
        },
      },
    });

    if (!user || !user.isActive) return new Set();

    // Super Admin : accès total
    if (user.isSuperAdmin) return new Set(["*"]);

    // 1. Cumul des permissions de tous les rôles
    const effective = new Set<string>();
    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        effective.add(rolePerm.permission.code);
      }
    }

    // 2. Surcharges individuelles (grant ou revoke)
    for (const userPerm of user.permissions) {
      if (userPerm.granted) {
        effective.add(userPerm.permission.code);
      } else {
        effective.delete(userPerm.permission.code);
      }
    }

    return effective;
  }
);

/**
 * Vérifie si un utilisateur possède une permission (sans throw).
 */
export async function hasPermission(
  userId: string,
  permission: PermissionCode
): Promise<boolean> {
  const permissions = await getEffectivePermissions(userId);
  if (permissions.has("*")) return true;
  return permissions.has(permission);
}

/**
 * Vérifie une permission — throw "FORBIDDEN" si non autorisé.
 * À utiliser au début de chaque Server Action admin.
 */
export async function requirePermission(
  userId: string,
  permission: PermissionCode
): Promise<void> {
  const allowed = await hasPermission(userId, permission);
  if (!allowed) {
    throw new Error(`FORBIDDEN: permission "${permission}" requise`);
  }
}

/**
 * Retourne un objet { [code]: boolean } pour un userId donné.
 * Utile pour l'affichage de la matrice de permissions dans l'UI.
 */
export async function getPermissionsMap(
  userId: string,
  codes: PermissionCode[]
): Promise<Record<string, boolean>> {
  const effective = await getEffectivePermissions(userId);
  const isSuperAdmin = effective.has("*");

  return Object.fromEntries(
    codes.map((code) => [code, isSuperAdmin || effective.has(code)])
  );
}
