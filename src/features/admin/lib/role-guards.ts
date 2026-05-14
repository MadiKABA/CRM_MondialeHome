import { db } from "@/lib/db";

/**
 * Vérifie qu'il reste au moins un autre Super Admin actif avant de toucher l'actuel.
 * Empêche de se retrouver sans Super Admin dans l'application.
 */
export async function canRemoveSuperAdmin(userId: string): Promise<boolean> {
  const count = await db.user.count({
    where: {
      isSuperAdmin: true,
      isActive: true,
      deletedAt: null,
      id: { not: userId },
    },
  });
  return count > 0;
}

/**
 * Vérifie qu'un manager peut agir sur un utilisateur cible.
 *
 * Règles :
 * - Un utilisateur ne peut pas se modifier lui-même via le panneau admin
 * - Un Super Admin peut gérer n'importe qui
 * - Un utilisateur ne peut pas gérer un Super Admin
 * - La priorité du manager doit être strictement supérieure à celle de la cible
 */
export async function canManageUser(
  managerId: string,
  targetId: string
): Promise<boolean> {
  if (managerId === targetId) return false;

  const [manager, target] = await Promise.all([
    db.user.findUnique({
      where: { id: managerId, deletedAt: null },
      select: {
        isSuperAdmin: true,
        roles: { select: { role: { select: { priority: true } } } },
      },
    }),
    db.user.findUnique({
      where: { id: targetId, deletedAt: null },
      select: {
        isSuperAdmin: true,
        roles: { select: { role: { select: { priority: true } } } },
      },
    }),
  ]);

  if (!manager || !target) return false;
  if (manager.isSuperAdmin) return true;
  if (target.isSuperAdmin) return false;

  const managerMaxPriority =
    manager.roles.length > 0 ? Math.max(...manager.roles.map((r) => r.role.priority)) : 0;

  const targetMaxPriority =
    target.roles.length > 0 ? Math.max(...target.roles.map((r) => r.role.priority)) : 0;

  return managerMaxPriority > targetMaxPriority;
}

/**
 * Vérifie que l'utilisateur aura encore au moins un rôle après suppression.
 */
export async function willHaveAtLeastOneRole(
  userId: string,
  roleIdsToRemove: string[]
): Promise<boolean> {
  const current = await db.userRole.count({ where: { userId } });
  return current - roleIdsToRemove.length >= 1;
}

/**
 * Vérifie que le rôle n'est pas un rôle système avant de le supprimer.
 */
export async function canDeleteRole(roleId: string): Promise<boolean> {
  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { isSystem: true },
  });
  return !!role && !role.isSystem;
}
