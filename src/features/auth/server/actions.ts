"use server";

import { type z } from "zod";
import { forgotPasswordSchema } from "@/features/auth/schemas/auth.schema";
import { logger } from "@/lib/logger";

export async function requestPasswordReset(
  input: z.infer<typeof forgotPasswordSchema>
): Promise<{ success: true }> {
  const data = forgotPasswordSchema.parse(input);

  // TODO: envoyer le lien de réinitialisation via Brevo quand configuré
  // Pour ne pas révéler si l'email existe ou non (sécurité), on retourne toujours success
  logger.info({ email: data.email }, "Demande de réinitialisation de mot de passe");

  return { success: true };
}
