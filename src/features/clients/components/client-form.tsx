"use client";

import { type Resolver, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { clientSchema, type ClientInput } from "../schemas/client.schema";
import { createClient, updateClient } from "../server/actions";
import type { ClientDetailDTO } from "../types";

interface ClientFormProps {
  client?: ClientDetailDTO;
}

const SOURCES = [
  "Walk-in",
  "Recommandation",
  "Campagne SMS",
  "Campagne WhatsApp",
  "Campagne Email",
  "Réseaux sociaux",
  "Site web",
  "Import",
  "Autre",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading border-cream-darker border-b pb-2 text-xs font-semibold tracking-widest uppercase">
      {children}
    </h2>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive mt-1 text-xs">{message}</p>;
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema) as Resolver<ClientInput>,
    defaultValues: {
      firstName: client?.firstName ?? "",
      lastName: client?.lastName ?? "",
      gender: (client?.gender as ClientInput["gender"]) ?? undefined,
      birthDate: client?.birthDate ? new Date(client.birthDate) : undefined,
      phone: client?.phone ?? "",
      phoneSecondary: client?.phoneSecondary ?? "",
      whatsapp: client?.whatsapp ?? "",
      email: client?.email ?? "",
      address: client?.address ?? "",
      city: client?.city ?? "",
      district: client?.district ?? "",
      region: client?.region ?? "",
      language: (client?.language as ClientInput["language"]) ?? "fr",
      preferredChannel:
        (client?.preferredChannel as ClientInput["preferredChannel"]) ?? undefined,
      source: client?.source ?? "",
      sourceDetails: client?.sourceDetails ?? "",
      smsConsent: client?.smsConsent ?? true,
      whatsappConsent: client?.whatsappConsent ?? true,
      emailConsent: client?.emailConsent ?? true,
      notes: client?.notes ?? "",
      tags: client?.tags ?? [],
    },
  });

  const onSubmit = async (data: ClientInput) => {
    const result = isEdit
      ? await updateClient(client.id, data)
      : await createClient(data);

    if (result.success) {
      toast.success(isEdit ? "Client mis à jour" : "Client créé avec succès");
      if (!isEdit && "data" in result && result.data?.id) {
        router.push(`/clients/${result.data.id}`);
      } else {
        router.push(isEdit ? `/clients/${client.id}` : "/clients");
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Informations personnelles */}
      <section className="space-y-4">
        <SectionTitle>Informations personnelles</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="firstName">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Fatou"
              className="mt-1"
              {...register("firstName")}
            />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              placeholder="Diallo"
              className="mt-1"
              {...register("lastName")}
            />
            <FieldError message={errors.lastName?.message} />
          </div>
          <div>
            <Label htmlFor="gender">Genre</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Féminin</SelectItem>
                    <SelectItem value="MALE">Masculin</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Controller
              control={control}
              name="birthDate"
              render={({ field }) => (
                <Input
                  id="birthDate"
                  type="date"
                  className="mt-1"
                  value={
                    field.value ? new Date(field.value).toISOString().slice(0, 10) : ""
                  }
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              )}
            />
          </div>
        </div>
      </section>

      {/* Coordonnées */}
      <section className="space-y-4">
        <SectionTitle>Coordonnées</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="phone">Téléphone principal</Label>
            <Input
              id="phone"
              placeholder="+221 77 123 45 67"
              className="mt-1"
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <Label htmlFor="phoneSecondary">Téléphone secondaire</Label>
            <Input
              id="phoneSecondary"
              placeholder="+221 70 123 45 67"
              className="mt-1"
              {...register("phoneSecondary")}
            />
            <FieldError message={errors.phoneSecondary?.message} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="+221 77 123 45 67"
              className="mt-1"
              {...register("whatsapp")}
            />
            <FieldError message={errors.whatsapp?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="fatou@example.com"
              className="mt-1"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      </section>

      {/* Adresse */}
      <section className="space-y-4">
        <SectionTitle>Adresse (Sénégal)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input id="city" placeholder="Dakar" className="mt-1" {...register("city")} />
          </div>
          <div>
            <Label htmlFor="district">Quartier</Label>
            <Input
              id="district"
              placeholder="Almadies"
              className="mt-1"
              {...register("district")}
            />
          </div>
          <div>
            <Label htmlFor="region">Région</Label>
            <Input
              id="region"
              placeholder="Dakar"
              className="mt-1"
              {...register("region")}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label htmlFor="address">Adresse complète</Label>
            <Input
              id="address"
              placeholder="Rue 10, Villa 5, Almadies…"
              className="mt-1"
              {...register("address")}
            />
          </div>
        </div>
      </section>

      {/* Préférences */}
      <section className="space-y-4">
        <SectionTitle>Préférences</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Langue préférée</Label>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="wo">Wolof</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Canal préféré</Label>
            <Controller
              control={control}
              name="preferredChannel"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      {/* Source */}
      <section className="space-y-4">
        <SectionTitle>{"Source d'acquisition"}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Source</Label>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="sourceDetails">Détails</Label>
            <Input
              id="sourceDetails"
              placeholder="Recommandé par M. Ba…"
              className="mt-1"
              {...register("sourceDetails")}
            />
          </div>
        </div>
      </section>

      {/* Consentements */}
      <section className="space-y-4">
        <SectionTitle>Consentements marketing</SectionTitle>
        <div className="flex flex-wrap gap-6">
          {(
            [
              { name: "smsConsent", label: "SMS" },
              { name: "whatsappConsent", label: "WhatsApp" },
              { name: "emailConsent", label: "Email" },
            ] as const
          ).map(({ name, label }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={cn(
                      "border-border",
                      field.value && "border-gold-deep bg-gold-deep"
                    )}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              )}
            />
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <SectionTitle>Notes</SectionTitle>
        <Textarea
          placeholder="Informations complémentaires sur le client…"
          rows={4}
          className="resize-none"
          {...register("notes")}
        />
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold-deep hover:bg-gold-darker min-w-[140px] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enregistrement…
            </>
          ) : isEdit ? (
            "Mettre à jour"
          ) : (
            "Créer le client"
          )}
        </Button>
      </div>
    </form>
  );
}
