"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/client";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    setHasError(false);

    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      setHasError(true);
      toast.error("Email ou mot de passe incorrect", {
        description: "Vérifiez vos identifiants et réessayez.",
      });
      // Réinitialise l'animation de shake après un bref délai
      setTimeout(() => setHasError(false), 600);
      return;
    }

    toast.success("Connexion réussie", { description: "Bienvenue !" });
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div
      className={cn("animate-in-up transition-transform", hasError && "animate-shake")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email */}
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

          {/* Mot de passe */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Mot de passe</FormLabel>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="h-11 pr-10 pl-9 text-base sm:text-sm"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-8 -translate-y-1/2 p-0"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Se souvenir de moi */}
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="remember-me"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor="remember-me"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Se souvenir de moi
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
              tabIndex={-1}
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton submit */}
          <Button
            type="submit"
            className="h-11 w-full text-base font-semibold sm:text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Pas encore de compte ?{" "}
        <span className="text-foreground font-medium">
          Contactez votre administrateur
        </span>
      </p>
    </div>
  );
}
