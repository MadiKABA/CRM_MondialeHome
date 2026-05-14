"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, checkPermission } from "@/lib/permissions";
import {
  sendInvitationSchema,
  revokeInvitationSchema,
} from "@/features/admin/schemas/invitation.schema";
import type { ActionResult } from "@/features/admin/types";
import type {
  SendInvitationInput,
  RevokeInvitationInput,
} from "@/features/admin/schemas/invitation.schema";

// ── Envoyer une invitation ────────────────────────────────────

export async function sendInvitation(
  input: SendInvitationInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.create.all");

    const data = sendInvitationSchema.parse(input);

    // Vérifier que l'email n'est pas déjà utilisé
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existingUser) {
      return { success: false, error: "Un compte existe déjà avec cet email." };
    }

    // Annuler les invitations PENDING existantes pour cet email
    await db.invitation.updateMany({
      where: { email: data.email, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const invitation = await db.invitation.create({
      data: {
        email: data.email,
        invitedById: session.user.id,
        roleId: data.roleId ?? null,
        token,
        status: "PENDING",
        expiresAt,
      },
      select: { id: true },
    });

    // TODO: envoyer l'email d'invitation via Brevo avec le lien contenant le token

    revalidatePath("/admin/users");
    revalidatePath("/admin/users/invitations");
    return { success: true, data: { id: invitation.id } };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED")
        return { success: false, error: "Non authentifié." };
      if (err.message.startsWith("FORBIDDEN"))
        return { success: false, error: "Accès refusé." };
    }
    return {
      success: false,
      error: "Une erreur est survenue lors de l'envoi de l'invitation.",
    };
  }
}

// ── Révoquer une invitation ───────────────────────────────────

export async function revokeInvitation(
  input: RevokeInvitationInput
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await checkPermission("admin.users.create.all");

    const data = revokeInvitationSchema.parse(input);

    const invitation = await db.invitation.findUnique({
      where: { id: data.invitationId },
      select: { status: true },
    });

    if (!invitation) {
      return { success: false, error: "Invitation introuvable." };
    }
    if (invitation.status !== "PENDING") {
      return { success: false, error: "Cette invitation ne peut plus être révoquée." };
    }

    await db.invitation.update({
      where: { id: data.invitationId },
      data: { status: "REVOKED" },
    });

    revalidatePath("/admin/users/invitations");
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

// ── Renvoyer une invitation ───────────────────────────────────

export async function resendInvitation(
  invitationId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    await checkPermission("admin.users.create.all");

    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
      select: { id: true, email: true, roleId: true, status: true },
    });

    if (!invitation) return { success: false, error: "Invitation introuvable." };
    if (invitation.status !== "PENDING") {
      return {
        success: false,
        error: "Seules les invitations en attente peuvent être renvoyées.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.invitation.update({
      where: { id: invitationId },
      data: { token, expiresAt, invitedById: session.user.id },
    });

    // TODO: renvoyer l'email via Brevo

    revalidatePath("/admin/users/invitations");
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
