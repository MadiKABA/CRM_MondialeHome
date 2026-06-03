"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkPermission, requireAuth } from "@/lib/permissions/server";
import { canManageUser, canRemoveSuperAdmin } from "@/features/admin/lib/role-guards";
import { sendInvitationEmail } from "@/lib/email/send";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
  deleteUserSchema,
  inviteUserSchema,
  assignRoleSchema,
  removeRoleSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ToggleUserStatusInput,
  type DeleteUserInput,
  type InviteUserInput,
} from "@/features/admin/schemas/user.schema";
import type { ActionResult } from "@/features/admin/types";

// ── Helpers ───────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for") ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
}

async function audit(params: {
  userId: string;
  action: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}) {
  const meta = await getRequestMeta();
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: "User",
      entityId: params.entityId ?? null,
      oldValue: (params.oldValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      newValue: (params.newValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      status: "success",
    },
  });
}

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

    // Capturer le mot de passe en clair avant hashage pour l'email d'invitation
    const plainPassword = data.password;
    const hashedPwd = await hashPassword(plainPassword);

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

      // Compte credential Better Auth — accountId = user.id (convention)
      await tx.account.create({
        data: {
          userId: created.id,
          providerId: "credential",
          accountId: created.id,
          password: hashedPwd,
        },
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

    await audit({
      userId: session.user.id,
      action: "user.create",
      entityId: user.id,
      newValue: { email: data.email, name, roleIds: data.roleIds },
    });

    // Récupérer les noms des rôles pour l'email d'invitation
    const roleNames = await db.role.findMany({
      where: { id: { in: data.roleIds } },
      select: { name: true },
    });

    const emailResult = await sendInvitationEmail({
      to: data.email,
      recipientName: firstName,
      inviterName: session.user.name ?? "L'administrateur",
      email: data.email,
      tempPassword: plainPassword,
      roleName: roleNames.map((r) => r.name).join(", "),
    });

    if (!emailResult.success) {
      logger.warn(
        { error: emailResult.error, userId: user.id },
        "User created but invitation email failed"
      );
    }

    revalidatePath("/admin/users");
    return { success: true, data: { id: user.id } };
  } catch (err) {
    logger.error({ err }, "Failed to create user");
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

    const oldUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        jobTitle: true,
        isActive: true,
      },
    });

    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const first = data.firstName ?? oldUser?.firstName ?? "";
      const last = data.lastName ?? oldUser?.lastName ?? "";
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

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: updateData });

      if (data.roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId } });
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId,
            roleId,
            assignedBy: session.user.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    await audit({
      userId: session.user.id,
      action: "user.update",
      entityId: userId,
      oldValue: oldUser ?? undefined,
      newValue: { ...updateData, roleIds: data.roleIds },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to update user");
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la mise à jour." };
  }
}

// ── Activer / Désactiver un utilisateur ───────────────────────

export async function toggleUserStatus(
  input: ToggleUserStatusInput
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.update.all");

    const data = toggleUserStatusSchema.parse(input);

    if (data.userId === session.user.id) {
      return {
        success: false,
        error: "Vous ne pouvez pas modifier le statut de votre propre compte.",
      };
    }

    const canManage = await canManageUser(session.user.id, data.userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour modifier cet utilisateur.",
      };
    }

    if (!data.isActive) {
      const target = await db.user.findUnique({
        where: { id: data.userId },
        select: { isSuperAdmin: true },
      });
      if (target?.isSuperAdmin) {
        const canRemove = await canRemoveSuperAdmin(data.userId);
        if (!canRemove) {
          return {
            success: false,
            error: "Impossible de désactiver le dernier Super Administrateur.",
          };
        }
      }
    }

    await db.user.update({
      where: { id: data.userId },
      data: { isActive: data.isActive },
    });

    await audit({
      userId: session.user.id,
      action: data.isActive ? "user.activate" : "user.deactivate",
      entityId: data.userId,
      newValue: { isActive: data.isActive, reason: data.reason },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to toggle user status");
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue." };
  }
}

// Aliases conservés pour rétro-compatibilité avec les composants existants
export async function deactivateUser(userId: string): Promise<ActionResult<void>> {
  return toggleUserStatus({ userId, isActive: false, reason: "Désactivation manuelle" });
}

export async function activateUser(userId: string): Promise<ActionResult<void>> {
  return toggleUserStatus({ userId, isActive: true, reason: "Réactivation manuelle" });
}

// ── Supprimer un utilisateur (soft delete) ────────────────────

export async function deleteUser(input: DeleteUserInput): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.delete.all");

    const data = deleteUserSchema.parse(input);

    if (data.userId === session.user.id) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre compte.",
      };
    }

    const canManage = await canManageUser(session.user.id, data.userId);
    if (!canManage) {
      return {
        success: false,
        error: "Vous n'avez pas les droits pour supprimer cet utilisateur.",
      };
    }

    const target = await db.user.findUnique({
      where: { id: data.userId },
      select: { isSuperAdmin: true, email: true },
    });

    if (target?.isSuperAdmin) {
      const canRemove = await canRemoveSuperAdmin(data.userId);
      if (!canRemove) {
        return {
          success: false,
          error: "Impossible de supprimer le dernier Super Administrateur.",
        };
      }
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.userId },
        data: { deletedAt: new Date(), isActive: false },
      });
      await tx.session.deleteMany({ where: { userId: data.userId } });
    });

    await audit({
      userId: session.user.id,
      action: "user.delete",
      entityId: data.userId,
      newValue: { email: target?.email },
    });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to delete user");
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de la suppression." };
  }
}

// ── Inviter un utilisateur par email ─────────────────────────

export async function inviteUser(input: InviteUserInput): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.create.all");

    const data = inviteUserSchema.parse(input);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { success: false, error: "Un utilisateur avec cet email existe déjà." };
    }

    const existingInvite = await db.invitation.findFirst({
      where: {
        email: data.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      return {
        success: false,
        error: "Une invitation est déjà en attente pour cet email.",
      };
    }

    const role = await db.role.findFirst({
      where: { id: { in: data.roleIds } },
      select: { id: true },
    });

    const { nanoid } = await import("nanoid");
    await db.invitation.create({
      data: {
        email: data.email,
        invitedById: session.user.id,
        roleId: role?.id ?? null,
        token: nanoid(32),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });

    // TODO: envoyer l'email d'invitation via Brevo

    await audit({
      userId: session.user.id,
      action: "user.invite",
      newValue: { email: data.email, roleIds: data.roleIds },
    });

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to invite user");
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return { success: false, error: "Une erreur est survenue lors de l'invitation." };
  }
}

// ── Assigner un rôle ──────────────────────────────────────────

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

    await audit({
      userId: session.user.id,
      action: "user.role.assign",
      entityId: data.userId,
      newValue: { roleId: data.roleId },
    });

    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to assign role");
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

// ── Retirer un rôle ───────────────────────────────────────────

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

    await audit({
      userId: session.user.id,
      action: "user.role.remove",
      entityId: data.userId,
      newValue: { roleId: data.roleId },
    });

    revalidatePath(`/admin/users/${data.userId}`);
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, "Failed to remove role");
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
