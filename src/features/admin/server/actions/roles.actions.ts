"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/permissions/server";
import { logger } from "@/lib/logger";
import { canDeleteRole } from "@/features/admin/lib/role-guards";
import { deleteRoleSchema } from "@/features/admin/schemas/role.schema";
import type { ActionResult } from "@/features/admin/types";

// ── Schémas serveur (validation stricte côté action) ──────────

const setRolePermissionsSchema = z.object({
  roleId: z.string().cuid(),
  permissionCodes: z.array(z.string()),
});

const createRoleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100).default(0),
  permissionCodes: z.array(z.string()).default([]),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100).optional(),
});

// ── Helper : super_admin uniquement ───────────────────────────

async function requireSuperAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, isActive: true },
  });
  return (user?.isSuperAdmin ?? false) && (user?.isActive ?? false);
}

// ── Helper : audit ────────────────────────────────────────────

async function audit(params: {
  userId: string;
  action: string;
  entityId?: string;
  newValue?: Record<string, unknown>;
}) {
  const h = await headers();
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: "Role",
      entityId: params.entityId ?? null,
      newValue: (params.newValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ipAddress: h.get("x-forwarded-for"),
      userAgent: h.get("user-agent"),
      status: "success",
    },
  });
}

// ── Mettre à jour les permissions d'un rôle ───────────────────

export async function setRolePermissions(
  input: z.infer<typeof setRolePermissionsSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const isSuperAdmin = await requireSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return { success: false, error: "Réservé au Super Administrateur." };
    }

    const data = setRolePermissionsSchema.parse(input);

    const role = await db.role.findUnique({
      where: { id: data.roleId },
      select: { id: true },
    });
    if (!role) return { success: false, error: "Profil introuvable." };

    const permissions = await db.permission.findMany({
      where: { code: { in: data.permissionCodes } },
      select: { id: true },
    });

    await db.$transaction([
      db.rolePermission.deleteMany({ where: { roleId: data.roleId } }),
      db.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: data.roleId, permissionId: p.id })),
        skipDuplicates: true,
      }),
    ]);

    await audit({
      userId: session.user.id,
      action: "role.permissions.update",
      entityId: data.roleId,
      newValue: { permissionCount: data.permissionCodes.length },
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${data.roleId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to update role permissions");
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { success: false, error: "Non authentifié." };
    return { success: false, error: "Une erreur est survenue lors de la mise à jour." };
  }
}

// ── Créer un rôle ─────────────────────────────────────────────

export async function createRole(
  input: z.input<typeof createRoleSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    const isSuperAdmin = await requireSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return { success: false, error: "Réservé au Super Administrateur." };
    }

    const data = createRoleSchema.parse(input);

    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const existing = await db.role.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      return { success: false, error: "Un profil avec ce nom existe déjà." };
    }

    const permissions = await db.permission.findMany({
      where: { code: { in: data.permissionCodes } },
      select: { id: true },
    });

    const role = await db.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null,
          priority: data.priority,
          isSystem: false,
        },
        select: { id: true },
      });

      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: created.id, permissionId: p.id })),
        });
      }

      return created;
    });

    await audit({
      userId: session.user.id,
      action: "role.create",
      entityId: role.id,
      newValue: { name: data.name, slug },
    });

    revalidatePath("/admin/roles");
    return { success: true, data: { id: role.id } };
  } catch (err) {
    logger.error({ err }, "Failed to create role");
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { success: false, error: "Non authentifié." };
    return { success: false, error: "Une erreur est survenue lors de la création." };
  }
}

// ── Modifier un rôle ──────────────────────────────────────────

export async function updateRole(
  roleId: string,
  input: z.infer<typeof updateRoleSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const isSuperAdmin = await requireSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return { success: false, error: "Réservé au Super Administrateur." };
    }

    const data = updateRoleSchema.parse(input);

    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });
    if (!role) return { success: false, error: "Profil introuvable." };

    await db.role.update({
      where: { id: roleId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });

    await audit({
      userId: session.user.id,
      action: "role.update",
      entityId: roleId,
      newValue: { previousName: role.name, ...data },
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${roleId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to update role");
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { success: false, error: "Non authentifié." };
    return { success: false, error: "Une erreur est survenue lors de la mise à jour." };
  }
}

// ── Supprimer un rôle ─────────────────────────────────────────

export async function deleteRole(
  input: z.infer<typeof deleteRoleSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const isSuperAdmin = await requireSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return { success: false, error: "Réservé au Super Administrateur." };
    }

    const data = deleteRoleSchema.parse(input);

    const canDelete = await canDeleteRole(data.roleId);
    if (!canDelete) {
      return {
        success: false,
        error: "Les profils système ne peuvent pas être supprimés.",
      };
    }

    const role = await db.role.findUnique({
      where: { id: data.roleId },
      select: { name: true },
    });

    const usersCount = await db.userRole.count({ where: { roleId: data.roleId } });

    if (usersCount > 0) {
      if (!data.replacementRoleId) {
        return {
          success: false,
          error: `Ce profil est attribué à ${usersCount} membre(s). Choisissez un profil de remplacement.`,
        };
      }
      await db.userRole.updateMany({
        where: { roleId: data.roleId },
        data: { roleId: data.replacementRoleId },
      });
    }

    await db.role.delete({ where: { id: data.roleId } });

    await audit({
      userId: session.user.id,
      action: "role.delete",
      entityId: data.roleId,
      newValue: {
        name: role?.name,
        replacementRoleId: data.replacementRoleId,
        usersReassigned: usersCount,
      },
    });

    revalidatePath("/admin/roles");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to delete role");
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { success: false, error: "Non authentifié." };
    return { success: false, error: "Une erreur est survenue lors de la suppression." };
  }
}

// ── Dupliquer un rôle ─────────────────────────────────────────

export async function duplicateRole(
  roleId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    const isSuperAdmin = await requireSuperAdmin(session.user.id);
    if (!isSuperAdmin) {
      return { success: false, error: "Réservé au Super Administrateur." };
    }

    const source = await db.role.findUnique({
      where: { id: roleId },
      select: {
        name: true,
        description: true,
        priority: true,
        permissions: { select: { permissionId: true } },
      },
    });
    if (!source) return { success: false, error: "Profil source introuvable." };

    const baseName = `${source.name} (copie)`;
    const slug = baseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const newRole = await db.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: baseName,
          slug,
          description: source.description,
          priority: source.priority,
          isSystem: false,
        },
        select: { id: true },
      });

      if (source.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: source.permissions.map((p) => ({
            roleId: created.id,
            permissionId: p.permissionId,
          })),
        });
      }

      return created;
    });

    await audit({
      userId: session.user.id,
      action: "role.duplicate",
      entityId: newRole.id,
      newValue: { sourceRoleId: roleId, newName: baseName },
    });

    revalidatePath("/admin/roles");
    return { success: true, data: { id: newRole.id } };
  } catch (err) {
    logger.error({ err }, "Failed to duplicate role");
    if (err instanceof Error && err.message === "UNAUTHORIZED")
      return { success: false, error: "Non authentifié." };
    return { success: false, error: "Une erreur est survenue lors de la duplication." };
  }
}
