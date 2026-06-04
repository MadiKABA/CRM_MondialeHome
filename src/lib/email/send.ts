import "server-only";
import { getResendClient } from "./client";
import { EMAIL_CONFIG } from "./config";
import { ForgotPasswordEmail } from "./templates/forgot-password";
import { InvitationEmail } from "./templates/invitation";
import { logger } from "@/lib/logger";

type EmailResult = { success: true; id: string } | { success: false; error: string };

// ── Reset mot de passe ────────────────────────────────────────────────────────

export async function sendForgotPasswordEmail(params: {
  to: string;
  userName: string;
  // Better Auth fournit l'URL complète avec token inclus
  resetUrl: string;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const appUrl = EMAIL_CONFIG.appUrl;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.formatted,
      to: [params.to],
      subject: "Réinitialisation de votre mot de passe — Mondial Home CRM",
      react: ForgotPasswordEmail({
        resetUrl: params.resetUrl,
        userName: params.userName,
        expiresIn: "1 heure",
        appUrl,
      }),
    });

    if (error) {
      logger.error({ error, to: params.to }, "Resend error: forgot password");
      return { success: false, error: error.message };
    }

    logger.info({ id: data?.id, to: params.to }, "Forgot password email sent");
    return { success: true, id: data?.id ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    logger.error({ err, to: params.to }, "Failed to send forgot password email");
    return { success: false, error: msg };
  }
}

// ── Invitation nouveau membre ─────────────────────────────────────────────────

export async function sendInvitationEmail(params: {
  to: string;
  recipientName: string;
  inviterName: string;
  email: string;
  tempPassword: string;
  roleName: string;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const appUrl = EMAIL_CONFIG.appUrl;
    const loginUrl = `${appUrl}/login`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.formatted,
      to: [params.to],
      subject: "Bienvenue sur Mondial Home CRM — Vos identifiants de connexion",
      react: InvitationEmail({
        recipientName: params.recipientName,
        inviterName: params.inviterName,
        loginUrl,
        email: params.email,
        tempPassword: params.tempPassword,
        roleName: params.roleName,
        appUrl,
      }),
    });

    if (error) {
      logger.error({ error, to: params.to }, "Resend error: invitation");
      return { success: false, error: error.message };
    }

    logger.info({ id: data?.id, to: params.to }, "Invitation email sent");
    return { success: true, id: data?.id ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    logger.error({ err, to: params.to }, "Failed to send invitation email");
    return { success: false, error: msg };
  }
}
