"use client";

import { useSession } from "@/lib/auth/client";
import { hasPermission } from "@/lib/permissions";
import type { PermissionCode } from "@/lib/permissions";

type SessionUser = {
  permissions?: string[];
  role?: string;
  isSuperAdmin?: boolean;
};

function isPrivileged(user: SessionUser): boolean {
  // Super admin explicite OU rôle admin du plugin Better Auth
  return user.isSuperAdmin === true || user.role === "admin";
}

export function usePermission(permission: PermissionCode): boolean {
  const { data: session } = useSession();
  if (!session) return false;

  const user = session.user as SessionUser;
  if (isPrivileged(user)) return true;

  // TODO(Phase 2): permissions granulaires chargées en session depuis la DB
  const userPermissions = user.permissions ?? [];
  return hasPermission(userPermissions, permission);
}

export function useHasAnyPermission(permissions: PermissionCode[]): boolean {
  const { data: session } = useSession();
  if (!session) return false;

  const user = session.user as SessionUser;
  if (isPrivileged(user)) return true;

  const userPermissions = user.permissions ?? [];
  return permissions.some((p) => hasPermission(userPermissions, p));
}
