"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/features/auth/server/actions";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/auth.schema";
import { cn } from "@/lib/utils";

interface PasswordCriterion {
  label: string;
  test: (pwd: string) => boolean;
}

const CRITERIA: PasswordCriterion[] = [
  { label: "8 caractères minimum", test: (p) => p.length >= 8 },
  { label: "Une majuscule", test: (p) => /[A-Z]/.test(p) },
  { label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { label: "Un caractère spécial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthColor(score: number): string {
  if (score <= 1) return "bg-destructive";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-yellow-500";
  return "bg-gold-deep";
}

function getStrengthLabel(score: number): string {
  if (score === 0) return "";
  if (score <= 1) return "Très faible";
  if (score <= 2) return "Faible";
  if (score <= 3) return "Moyen";
  return "Fort";
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="h-11 pr-10 pl-9 text-base sm:text-sm"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;
  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? "";
  const score = CRITERIA.filter((c) => c.test(newPassword)).length;

  async function onSubmit(values: ResetPasswordFormValues) {
    const result = await resetPassword(values);
    if (result.success) {
      toast.success("Mot de passe réinitialisé avec succès");
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
      return;
    }
    toast.error(result.error);
    setInvalidToken(true);
  }

  if (!token) {
    return (
      <div className="animate-in-up space-y-4 text-center">
        <div className="bg-destructive/10 mx-auto flex size-16 items-center justify-center rounded-full">
          <XCircle className="text-destructive size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">Lien invalide</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ce lien de réinitialisation est incomplet ou invalide. Demandez-en un nouveau.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/forgot-password" />}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Demander un nouveau lien
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-in-up space-y-4 text-center">
        <div className="bg-primary/10 mx-auto flex size-16 items-center justify-center rounded-full">
          <CheckCircle className="text-primary size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">
            Mot de passe réinitialisé
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Redirection vers la page de connexion…
          </p>
        </div>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="animate-in-up space-y-4 text-center">
        <div className="bg-destructive/10 mx-auto flex size-16 items-center justify-center rounded-full">
          <XCircle className="text-destructive size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">Lien expiré ou invalide</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ce lien de réinitialisation a peut-être déjà été utilisé ou a expiré.
            Demandez-en un nouveau.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/forgot-password" />}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Demander un nouveau lien
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in-up space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Nouveau mot de passe */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Nouveau mot de passe
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormControl>

                {newPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="bg-muted flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full">
                        {CRITERIA.map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-full flex-1 rounded-full transition-all duration-300",
                              i < score ? getStrengthColor(score) : "bg-transparent"
                            )}
                          />
                        ))}
                      </div>
                      <span
                        className={cn(
                          "ml-3 text-xs font-medium whitespace-nowrap",
                          score <= 2
                            ? "text-destructive"
                            : score <= 3
                              ? "text-yellow-600"
                              : "text-gold-deep"
                        )}
                      >
                        {getStrengthLabel(score)}
                      </span>
                    </div>

                    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {CRITERIA.map((criterion) => {
                        const met = criterion.test(newPassword);
                        return (
                          <li
                            key={criterion.label}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            {met ? (
                              <CheckCircle2 className="text-gold-deep size-3.5 shrink-0" />
                            ) : (
                              <XCircle className="text-muted-foreground size-3.5 shrink-0" />
                            )}
                            <span
                              className={cn(
                                met ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {criterion.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmation */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Confirmer le mot de passe
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="h-11 w-full text-base font-semibold sm:text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Réinitialisation…
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/login" />}
          className="gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </Button>
      </div>
    </div>
  );
}
