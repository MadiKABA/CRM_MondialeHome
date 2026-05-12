"use client";

import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
import { signIn } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      toast.error("Identifiants incorrects", {
        description: "Vérifiez votre email et votre mot de passe.",
      });
      return;
    }

    toast.success("Connexion réussie");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({
              field,
            }: {
              field: ControllerRenderProps<LoginFormValues, "email">;
            }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="vous@mondialhome.sn"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({
              field,
            }: {
              field: ControllerRenderProps<LoginFormValues, "password">;
            }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </Form>
    </div>
  );
}
