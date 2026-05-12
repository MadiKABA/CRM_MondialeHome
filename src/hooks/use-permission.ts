"use client";

import { useSession } from "@/lib/auth/client";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();

  if (!session) return false;

  const userPermissions: string[] =
    // TODO: load from session user's permissions after full RBAC is wired
    (session.user as { permissions?: string[] }).permissions ?? [];

  return hasPermission(userPermissions, permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { data: session } = useSession();

  if (!session) return false;

  const userPermissions: string[] =
    (session.user as { permissions?: string[] }).permissions ?? [];

  return permissions.some((p) => hasPermission(userPermissions, p));
}
