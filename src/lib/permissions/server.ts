import "server-only";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import type { PermissionCode } from "./constants";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/**
 * Vérifie une permission côté serveur — throw FORBIDDEN si non autorisé.
 * Super Admin court-circuite la vérification via le flag isSuperAdmin en session.
 */
export async function checkPermission(permission: PermissionCode): Promise<void> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");

  if ((session.user as { isSuperAdmin?: boolean }).isSuperAdmin) return;

  const { hasPermission: dbHasPermission } =
    await import("@/features/admin/lib/permissions");
  const allowed = await dbHasPermission(session.user.id, permission);
  if (!allowed) throw new Error(`FORBIDDEN: permission "${permission}" requise`);
}

/**
 * Vérifie une permission côté serveur — retourne boolean sans throw.
 * À utiliser pour les vérifications conditionnelles dans les Server Actions.
 */
export async function hasPermission(permission: PermissionCode): Promise<boolean> {
  const session = await getServerSession();
  if (!session) return false;

  if ((session.user as { isSuperAdmin?: boolean }).isSuperAdmin) return true;

  const { hasPermission: dbHasPermission } =
    await import("@/features/admin/lib/permissions");
  return dbHasPermission(session.user.id, permission);
}
