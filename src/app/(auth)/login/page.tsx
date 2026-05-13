import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Connexion — Mondial Home CRM",
  description: "Connectez-vous à votre espace CRM Mondial Home",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Bienvenue</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Connectez-vous à votre espace CRM pour gérer clients, collections et campagnes.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
