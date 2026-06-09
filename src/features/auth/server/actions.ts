"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendForgotPasswordEmail } from "@/lib/email/send";
import { EMAIL_CONFIG } from "@/lib/email/config";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email requis").email("Email invalide"),
});

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

    // Supprimer les tokens précédents pour cet email, créer le nouveau
    await db.verification.deleteMany({
      where: { identifier: `reset-password:${email.toLowerCase()}` },
    });
    await db.verification.create({
      data: {
        identifier: `reset-password:${email.toLowerCase()}`,
        value: token,
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
