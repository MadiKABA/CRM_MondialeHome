"use client";

import { useForm, type Resolver } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/section-card";
import { User } from "lucide-react";
import { updateProfile } from "../server/actions";
import { updateProfileSchema, type ProfileFormValues } from "../schemas/profile.schema";
import type { ProfileDTO } from "../types";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "wo", label: "Wolof" },
  { value: "en", label: "English" },
] as const;

const TIMEZONES = [
  { value: "Africa/Dakar", label: "Dakar (UTC+0)" },
  { value: "Africa/Abidjan", label: "Abidjan (UTC+0)" },
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)" },
] as const;

interface PersonalInfoFormProps {
  profile: ProfileDTO;
}

export function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema) as unknown as Resolver<ProfileFormValues>,
    defaultValues: {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      jobTitle: profile.jobTitle ?? "",
      department: profile.department ?? "",
      language: (profile.language as "fr" | "wo" | "en") ?? "fr",
      timezone: profile.timezone ?? "Africa/Dakar",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateProfile(values);
      if (result.success) {
        toast.success("Profil mis à jour avec succès");
        form.reset(values);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionCard
      title="Informations personnelles"
      description="Vos informations de base visibles dans l'application"
      icon={<User className="size-5" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Mamadou" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Diallo" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email — lecture seule */}
          <div className="space-y-2">
            <FormLabel>Adresse e-mail</FormLabel>
            <div className="flex items-center gap-2">
              <Input
                value={profile.email}
                disabled
                className="bg-muted/40 text-muted-foreground h-11 flex-1"
              />
              {profile.emailVerified ? (
                <Badge
                  variant="outline"
                  className="shrink-0 border-green-500/40 text-green-600"
                >
                  Vérifié
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 border-yellow-500/40 text-yellow-600"
                >
                  Non vérifié
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              L&apos;e-mail ne peut pas être modifié depuis cette page.
            </p>
          </div>

          {/* Téléphone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <div className="flex">
                    <span className="border-input bg-muted/40 text-muted-foreground flex h-11 items-center rounded-l-md border border-r-0 px-3 text-sm select-none">
                      +221
                    </span>
                    <Input
                      placeholder="77 123 45 67"
                      className="h-11 rounded-l-none"
                      {...field}
                      value={field.value?.replace(/^\+221/, "") ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
                        field.onChange(raw ? `+221${raw}` : "");
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Poste + Département */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du poste</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Responsable commercial"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département</FormLabel>
                  <FormControl>
                    <Input placeholder="Commercial" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Langue + Fuseau horaire */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Langue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choisir une langue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuseau horaire</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choisir un fuseau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={!form.formState.isDirty || isSubmitting}
              onClick={() => form.reset()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isDirty || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Form>
    </SectionCard>
  );
}
