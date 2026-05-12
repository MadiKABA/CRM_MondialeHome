import type { Metadata } from "next";
import { LoginForm } from "@/features/admin/components/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Connexion</h1>
        <p className="text-muted-foreground mt-1 text-sm">Accédez à votre espace CRM</p>
      </div>
      <LoginForm />
    </div>
  );
}
