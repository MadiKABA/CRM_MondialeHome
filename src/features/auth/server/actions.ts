"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendForgotPasswordEmail } from "@/lib/email/send";
import { EMAIL_CONFIG } from "@/lib/email/config";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/auth.schema";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email requis").email("Email invalide"),
});

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function requestPasswordReset(input: unknown): Promise<{ success: true }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "unknown";

  // Rate limiting strict — 3 tentatives / 15 min par IP (anti-spam)
  const rateCheck = await checkRateLimit({
    key: `forgot_password:${ip}`,
    limit: 3,
    windowMs: 900_000,
  });

  // Toujours retourner success, même si limité (anti-énumération)
  if (!rateCheck.allowed) {
    logger.warn({ ip }, "Forgot password rate limited");
    return { success: true };
  }

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: true };

  const { email } = parsed.data;

  // Anti-énumération : success même si user non trouvé
  const user = await db.user
    .findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, firstName: true, isActive: true },
    })
    .catch(() => null);

  if (!user?.isActive) return { success: true };

  try {
    const { nanoid } = await import("nanoid");
    const token = nanoid(32);

    // Format attendu par l'endpoint natif Better Auth auth.api.resetPassword :
    // identifier = "reset-password:<token>", value = userId
    await db.verification.create({
      data: {
        identifier: `reset-password:${token}`,
        value: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
        userId: user.id,
      },
    });

    const resetUrl = `${EMAIL_CONFIG.appUrl}/reset-password?token=${token}`;
    const emailResult = await sendForgotPasswordEmail({
      to: email.toLowerCase(),
      userName: user.firstName ?? user.name ?? "Utilisateur",
      resetUrl,
    });

    if (!emailResult.success) {
      logger.error({ error: emailResult.error, email }, "Failed to send reset email");
    }
  } catch (err) {
    logger.error({ err, email }, "requestPasswordReset failed");
  }

  return { success: true };
}

export async function resetPassword(
  input: ResetPasswordFormValues
): Promise<ActionResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "unknown";

  const rateCheck = await checkRateLimit({
    key: `reset_password:${ip}`,
    limit: 5,
    windowMs: 900_000,
  });
  if (!rateCheck.allowed) {
    return { success: false, error: "Trop de tentatives. Réessayez plus tard." };
  }

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const { token, newPassword } = parsed.data;

  const verification = await db.verification.findFirst({
    where: { identifier: `reset-password:${token}` },
    select: { userId: true, expiresAt: true },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return {
      success: false,
      error: "Ce lien est invalide ou a expiré. Demandez un nouveau lien.",
    };
  }

  try {
    await auth.api.resetPassword({ body: { newPassword, token } });
  } catch (err) {
    logger.warn({ err }, "Password reset failed");
    return {
      success: false,
      error: "Ce lien est invalide ou a expiré. Demandez un nouveau lien.",
    };
  }

  await db.auditLog
    .create({
      data: {
        userId: verification.userId,
        action: "password.reset",
        entity: "User",
        entityId: verification.userId ?? undefined,
        ipAddress: ip,
        userAgent: h.get("user-agent") ?? undefined,
        status: "success",
      },
    })
    .catch((err: unknown) => {
      logger.error({ err }, "Failed to write audit log for password reset");
    });

  logger.info({ userId: verification.userId }, "Password reset successful");

  return { success: true };
}
