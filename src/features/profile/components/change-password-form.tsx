"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/section-card";
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { changePassword } from "../server/actions";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "../schemas/profile.schema";
import { cn } from "@/lib/utils";

interface PasswordCriterion {
  label: string;
  test: (pwd: string) => boolean;
}

const CRITERIA: PasswordCriterion[] = [
  { label: "12 caractères minimum", test: (p) => p.length >= 12 },
  { label: "Une majuscule", test: (p) => /[A-Z]/.test(p) },
  { label: "Une minuscule", test: (p) => /[a-z]/.test(p) },
  { label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { label: "Un caractère spécial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthColor(score: number): string {
  if (score <= 1) return "bg-destructive";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-yellow-500";
  if (score <= 4) return "bg-blue-500";
  return "bg-gold-deep";
}

function getStrengthLabel(score: number): string {
  if (score === 0) return "";
  if (score <= 1) return "Très faible";
  if (score <= 2) return "Faible";
  if (score <= 3) return "Moyen";
  if (score <= 4) return "Fort";
  return "Très fort";
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 pr-10"
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

export function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? "";
  const score = CRITERIA.filter((c) => c.test(newPassword)).length;

  const onSubmit = async (values: ChangePasswordInput) => {
    setIsSubmitting(true);
    try {
      const result = await changePassword(values);
      if (result.success) {
        toast.success("Mot de passe modifié. Les autres sessions ont été déconnectées.");
        form.reset();
        setIsOpen(false);
      } else {
        toast.error(result.error);
        if (result.error === "Mot de passe actuel incorrect") {
          form.setError("currentPassword", { message: result.error });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Mot de passe"
      description="Modifiez votre mot de passe de connexion"
      icon={<Lock className="size-5" />}
      action={
        !isOpen ? (
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            Modifier
          </Button>
        ) : undefined
      }
    >
      {!isOpen ? (
        <p className="text-muted-foreground text-sm">
          Votre mot de passe est sécurisé. Cliquez sur &quot;Modifier&quot; pour le
          changer.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Avertissement */}
            <div className="bg-muted/50 flex items-start gap-2.5 rounded-lg p-3 text-sm">
              <AlertTriangle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <p className="text-muted-foreground">
                La modification du mot de passe déconnectera toutes vos autres sessions
                actives.
              </p>
            </div>

            {/* Mot de passe actuel */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Entrez votre mot de passe actuel"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nouveau mot de passe */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Choisissez un mot de passe fort"
                      disabled={isSubmitting}
                    />
                  </FormControl>

                  {/* Barre de force */}
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

                      {/* Critères */}
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
                  <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Répétez le nouveau mot de passe"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  form.reset();
                  setIsOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-40">
                {isSubmitting ? "Modification…" : "Modifier le mot de passe"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </SectionCard>
  );
}
