import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "Le prénom est requis")
    .max(50, "Le prénom est trop long")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Caractères non autorisés"),
  lastName: z
    .string()
    .min(1, "Le nom est requis")
    .max(50, "Le nom est trop long")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Caractères non autorisés"),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Format requis : +221XXXXXXXXX")
    .or(z.literal(""))
    .optional(),
  jobTitle: z.string().max(100, "Le titre est trop long").or(z.literal("")).optional(),
  department: z.string().max(100).or(z.literal("")).optional(),
  language: z.enum(["fr", "wo", "en"]),
  timezone: z.string().min(1),
});

// Input type matches what the form sends (language & timezone always provided)
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Form values type — all fields present (optional ones default to empty string)
export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  department: string;
  language: "fr" | "wo" | "en";
  timezone: string;
};

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(12, "Minimum 12 caractères")
      .max(128, "Maximum 128 caractères")
      .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Doit contenir au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Doit contenir au moins un caractère spécial"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const avatarSchema = z.object({
  imageUrl: z.string().url("URL invalide"),
});

export type AvatarInput = z.infer<typeof avatarSchema>;
