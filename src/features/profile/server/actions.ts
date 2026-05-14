"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  updateProfileSchema,
  changePasswordSchema,
  avatarSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type AvatarInput,
} from "../schemas/profile.schema";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function getRequestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for") ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
}

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    const result = updateProfileSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Données invalides",
      };
    }
    const data = result.data;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        phone: data.phone || null,
        jobTitle: data.jobTitle || null,
        department: data.department || null,
        language: data.language,
        timezone: data.timezone,
      },
    });

    const meta = await getRequestMeta();
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "profile.update",
        entity: "User",
        entityId: session.user.id,
        newValue: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: "success",
      },
    });

    logger.info({ userId: session.user.id }, "Profile updated");
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to update profile");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    const result = changePasswordSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0]?.message ?? "Données invalides",
      };
    }
    const data = result.data;

    const meta = await getRequestMeta();

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: true,
        },
        headers: await headers(),
      });
    } catch {
      logger.warn({ userId: session.user.id }, "Failed password change attempt");
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "password.change.failed",
          entity: "User",
          entityId: session.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          status: "failed",
          errorMessage: "Invalid current password",
        },
      });
      return { success: false, error: "Mot de passe actuel incorrect" };
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "password.change",
        entity: "User",
        entityId: session.user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        status: "success",
      },
    });

    logger.info({ userId: session.user.id }, "Password changed");
    revalidatePath("/settings/profile");

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to change password");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function updateAvatar(input: AvatarInput): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    const result = avatarSchema.safeParse(input);
    if (!result.success) return { success: false, error: "URL invalide" };

    const url = new URL(result.data.imageUrl);
    if (url.hostname !== "res.cloudinary.com") {
      return { success: false, error: "Domaine d'image non autorisé" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { image: result.data.imageUrl },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "avatar.update",
        entity: "User",
        entityId: session.user.id,
        status: "success",
      },
    });

    logger.info({ userId: session.user.id }, "Avatar updated");
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to update avatar");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    await db.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "avatar.remove",
        entity: "User",
        entityId: session.user.id,
        status: "success",
      },
    });

    logger.info({ userId: session.user.id }, "Avatar removed");
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to remove avatar");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    const target = await db.session.findUnique({ where: { id: sessionId } });

    if (!target || target.userId !== session.user.id) {
      return { success: false, error: "Session introuvable" };
    }

    if (target.token === session.session.token) {
      return {
        success: false,
        error: "Utilisez le bouton 'Se déconnecter' pour la session actuelle",
      };
    }

    await db.session.delete({ where: { id: sessionId } });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "session.revoke",
        entity: "Session",
        entityId: sessionId,
        status: "success",
      },
    });

    revalidatePath("/settings/profile");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to revoke session");
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function revokeAllOtherSessions(): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Non authentifié" };

    await db.session.deleteMany({
      where: {
        userId: session.user.id,
        NOT: { token: session.session.token },
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "session.revoke.all_others",
        entity: "Session",
        status: "success",
      },
    });

    logger.info({ userId: session.user.id }, "All other sessions revoked");
    revalidatePath("/settings/profile");
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Failed to revoke all sessions");
    return { success: false, error: "Une erreur est survenue" };
  }
}
