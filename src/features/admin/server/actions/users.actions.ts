"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, checkPermission } from "@/lib/permissions";
import { canManageUser } from "@/features/admin/lib/role-guards";
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  removeRoleSchema,
} from "@/features/admin/schemas/user.schema";
import type { ActionResult } from "@/features/admin/types";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@/features/admin/schemas/user.schema";

// ── Créer un utilisateur ──────────────────────────────────────

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.create.all");

    const data = createUserSchema.parse(input);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, error: "Un utilisateur avec cet email existe déjà." };
    }

    const roles = await db.role.findMany({
      where: { id: { in: data.roleIds } },
      select: { id: true },
    });
    if (roles.length !== data.roleIds.length) {
      return {
        success: false,
        error: "Un ou plusieurs profils sélectionnés sont invalides.",
      };
    }

    const firstName = data.firstName;
    const lastName = data.lastName;
    const name = `${firstName} ${lastName}`.trim();

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          firstName,
          lastName,
          email: data.email,
          phone: data.phone || null,
          jobTitle: data.jobTitle || null,
          department: data.department || null,
          language: data.language,
          timezone: data.timezone,
          isActive: true,
        },
        select: { id: true },
      });

      await tx.userRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: created.id,
          assignedBy: session.user.id,
          roleId,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    revalidatePath("/admin/users");
    return { success: true, data: { id: user.id } };
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

// ── Mettre à jour un utilisateur ──────────────────────────────

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.update.all");

    const data = updateUserSchema.parse(input);

    const canManage = await canManageUser(session.user.id, userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour modifier cet utilisateur.",
      };
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      const first = data.firstName ?? user?.firstName ?? "";
      const last = data.lastName ?? user?.lastName ?? "";
      updateData.firstName = first;
      updateData.lastName = last;
      updateData.name = `${first} ${last}`.trim();
    }
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle || null;
    if (data.department !== undefined) updateData.department = data.department || null;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await db.user.update({ where: { id: userId }, data: updateData });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
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

// ── Désactiver un utilisateur ─────────────────────────────────

export async function deactivateUser(userId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.update.all");

    const canManage = await canManageUser(session.user.id, userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour désactiver cet utilisateur.",
      };
    }

    await db.user.update({ where: { id: userId }, data: { isActive: false } });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue." };
  }
}

// ── Réactiver un utilisateur ──────────────────────────────────

export async function activateUser(userId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.update.all");

    const canManage = await canManageUser(session.user.id, userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour réactiver cet utilisateur.",
      };
    }

    await db.user.update({ where: { id: userId }, data: { isActive: true } });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue." };
  }
}

// ── Supprimer un utilisateur (soft delete) ────────────────────

export async function deleteUser(userId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.delete.all");

    const canManage = await canManageUser(session.user.id, userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour supprimer cet utilisateur.",
      };
    }

    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    revalidatePath("/admin/users");
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

// ── Assigner un rôle à un utilisateur ────────────────────────

export async function assignRole(
  input: Parameters<typeof assignRoleSchema.parse>[0]
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.roles.manage.all");

    const data = assignRoleSchema.parse(input);

    const canManage = await canManageUser(session.user.id, data.userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour modifier les profils de cet utilisateur.",
      };
    }

    await db.userRole.upsert({
      where: { userId_roleId: { userId: data.userId, roleId: data.roleId } },
      create: { userId: data.userId, roleId: data.roleId, assignedBy: session.user.id },
      update: {},
    });

    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return {
      success: false,
      error: "Une erreur est survenue lors de l'assignation du profil.",
    };
  }
}

// ── Retirer un rôle d'un utilisateur ─────────────────────────

export async function removeRole(
  input: Parameters<typeof removeRoleSchema.parse>[0]
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.roles.manage.all");

    const data = removeRoleSchema.parse(input);

    const canManage = await canManageUser(session.user.id, data.userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour modifier les profils de cet utilisateur.",
      };
    }

    const remaining = await db.userRole.count({ where: { userId: data.userId } });
    if (remaining <= 1) {
      return {
        success: false,
        error: "Impossible de retirer le dernier profil d'un utilisateur.",
      };
    }

    await db.userRole.delete({
      where: { userId_roleId: { userId: data.userId, roleId: data.roleId } },
    });

    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return {
      success: false,
      error: "Une erreur est survenue lors du retrait du profil.",
    };
  }
}
