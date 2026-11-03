"use client";

import { useEffectivePermissions } from "@/components/providers/permissions-provider";
import type { PermissionCode } from "@/lib/permissions";

function allows(perms: ReadonlySet<string>, permission: string): boolean {
  return perms.has("*") || perms.has(permission);
}

export function usePermission(permission: PermissionCode): boolean {
  return allows(useEffectivePermissions(), permission);
}

export function useHasAnyPermission(permissions: PermissionCode[]): boolean {
  const perms = useEffectivePermissions();
  return permissions.some((p) => allows(perms, p));
}
