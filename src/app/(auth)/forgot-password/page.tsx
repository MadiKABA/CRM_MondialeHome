import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Mondiale Home CRM",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Mot de passe oublié ?
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
          votre mot de passe.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
