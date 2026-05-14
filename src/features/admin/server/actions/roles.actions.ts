"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import { canDeleteRole } from "@/features/admin/lib/role-guards";
import type { ActionResult } from "@/features/admin/types";

// ── Schémas ───────────────────────────────────────────────────

const setRolePermissionsSchema = z.object({
  roleId: z.string().cuid(),
  permissionCodes: z.array(z.string()),
});

const createRoleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100),
  permissionCodes: z.array(z.string()).default([]),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100).optional(),
});

// ── Mettre à jour les permissions d'un rôle ───────────────────

export async function setRolePermissions(
  input: z.infer<typeof setRolePermissionsSchema>
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await checkPermission("admin.roles.manage.all");

    const data = setRolePermissionsSchema.parse(input);

    const role = await db.role.findUnique({
      where: { id: data.roleId },
      select: { id: true },
    });
    if (!role) return { success: false, error: "Profil introuvable." };

    // Résoudre les codes en IDs de permission
    const permissions = await db.permission.findMany({
      where: { code: { in: data.permissionCodes } },
      select: { id: true, code: true },
    });

    await db.$transaction([
      db.rolePermission.deleteMany({ where: { roleId: data.roleId } }),
      db.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: data.roleId, permissionId: p.id })),
        skipDuplicates: true,
      }),
    ]);

    revalidatePath(`/admin/roles/${data.roleId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la mise à jour." };
  }
}

// ── Créer un rôle ─────────────────────────────────────────────

export async function createRole(
  input: z.infer<typeof createRoleSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    await checkPermission("admin.roles.manage.all");

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

    revalidatePath("/admin/roles");
    return { success: true, data: { id: role.id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la création." };
  }
}

// ── Modifier un rôle ──────────────────────────────────────────

export async function updateRole(
  roleId: string,
  input: z.infer<typeof updateRoleSchema>
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await checkPermission("admin.roles.manage.all");

    const data = updateRoleSchema.parse(input);

    await db.role.update({
      where: { id: roleId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });

    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${roleId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la mise à jour." };
  }
}

// ── Supprimer un rôle ─────────────────────────────────────────

export async function deleteRole(roleId: string): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await checkPermission("admin.roles.manage.all");

    const canDelete = await canDeleteRole(roleId);
    if (!canDelete) {
      return {
        success: false,
        error: "Les profils système ne peuvent pas être supprimés.",
      };
    }

    await db.role.delete({ where: { id: roleId } });

    revalidatePath("/admin/roles");
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la suppression." };
  }
}

// ── Dupliquer un rôle ─────────────────────────────────────────

export async function duplicateRole(
  roleId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    await checkPermission("admin.roles.manage.all");

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

    revalidatePath("/admin/roles");
    return { success: true, data: { id: newRole.id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la duplication." };
  }
}
