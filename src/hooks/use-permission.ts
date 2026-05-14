"use client";

import { useSession } from "@/lib/auth/client";
import { hasPermission } from "@/lib/permissions";
import type { PermissionCode } from "@/lib/permissions";

export function usePermission(permission: PermissionCode): boolean {
  const { data: session } = useSession();

  if (!session) return false;

  const userPermissions: string[] =
    // TODO(Phase 2): charger depuis les permissions effectives en session
    (session.user as { permissions?: string[] }).permissions ?? [];

  return hasPermission(userPermissions, permission);
}

export function useHasAnyPermission(permissions: PermissionCode[]): boolean {
  const { data: session } = useSession();

  if (!session) return false;

  const userPermissions: string[] =
    (session.user as { permissions?: string[] }).permissions ?? [];

  return permissions.some((p) => hasPermission(userPermissions, p));
}
