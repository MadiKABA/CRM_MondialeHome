import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Mondiale Home",
  description: "Choisissez un nouveau mot de passe pour votre compte Mondiale Home CRM",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Nouveau mot de passe
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choisissez un mot de passe fort pour sécuriser votre compte.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
