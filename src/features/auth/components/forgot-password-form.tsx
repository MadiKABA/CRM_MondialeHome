"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
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
import { requestPasswordReset } from "@/features/auth/server/actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas/auth.schema";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordFormValues) {
    await requestPasswordReset(values);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="animate-in-up space-y-4 text-center">
        <div className="bg-primary/10 mx-auto flex size-16 items-center justify-center rounded-full">
          <CheckCircle className="text-primary size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">Vérifiez vos emails</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Si un compte existe pour cet email, vous recevrez un lien de réinitialisation
            dans les prochaines minutes.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/login" />}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in-up space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Adresse email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="vous@mondialhome.sn"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="h-11 pl-9 text-base sm:text-sm"
                      {...field}
                    />
                  </div>
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
                Envoi en cours…
              </>
            ) : (
              "Envoyer le lien de réinitialisation"
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
