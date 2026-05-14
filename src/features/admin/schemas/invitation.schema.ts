import { z } from "zod";

export const sendInvitationSchema = z.object({
  email: z.string().email("Email invalide"),
  roleId: z.string().cuid("Profil invalide").optional(),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;

export const revokeInvitationSchema = z.object({
  invitationId: z.string().cuid(),
});

export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
