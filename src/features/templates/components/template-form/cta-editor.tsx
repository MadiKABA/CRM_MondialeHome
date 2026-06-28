"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";

export function CtaEditor() {
  const form = useFormContext<CreateEmailTemplateInput>();

  return (
    <div className="space-y-3">
      <h2 className="text-text-primary text-sm font-semibold">
        Bouton d&apos;appel à l&apos;action
        <span className="text-text-muted ml-1.5 text-xs font-normal">(optionnel)</span>
      </h2>

      <FormField
        control={form.control}
        name="ctaText"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Texte du bouton</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Ex : Voir l'offre, Découvrir la collection..."
                className="border-cream-darker focus:border-gold text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ctaUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Lien du bouton</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="https://mondialhome.sn/offres"
                className="border-cream-darker focus:border-gold text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="text-text-muted text-[11px]">
        Le texte et le lien doivent être renseignés ensemble, ou laissés tous les deux
        vides.
      </p>
    </div>
  );
}
