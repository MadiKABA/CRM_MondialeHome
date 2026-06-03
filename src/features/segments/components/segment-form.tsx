"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CriteriaBuilder } from "./criteria-builder";
import { createDynamicSegment } from "@/features/segments/server/actions";
import { createSegmentSchema, type CreateSegmentInput } from "../schemas/segment.schema";

const COLOR_SWATCHES = [
  "#8B6914",
  "#B8945F",
  "#C4622D",
  "#4A6741",
  "#5B9BD5",
  "#7C3AED",
  "#059669",
  "#D97706",
];

export function SegmentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateSegmentInput>({
    resolver: zodResolver(createSegmentSchema) as Resolver<CreateSegmentInput>,
    defaultValues: {
      name: "",
      description: "",
      color: "#8B6914",
      icon: "",
      autoRefresh: true,
      criteria: {
        operator: "AND",
        criteria: [{ field: "totalSpent", operator: "gte", value: 0 }],
      },
    },
  });

  const selectedColor = form.watch("color");

  function onSubmit(data: CreateSegmentInput) {
    startTransition(async () => {
      const result = await createDynamicSegment(data);
      if (result.success && result.data) {
        toast.success(
          `Segment "${data.name}" créé — ${result.data.memberCount.toLocaleString("fr-FR")} clients ciblés`
        );
        router.push(`/segments/${result.data.id}`);
      } else {
        toast.error(result.success === false ? result.error : "Une erreur est survenue");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du segment *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Champions — Gros acheteurs fidèles" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex : Clients avec plus de 500 000 FCFA d'achats..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className="size-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedColor === color ? "white" : "transparent",
                        outline: selectedColor === color ? `2px solid ${color}` : "none",
                        outlineOffset: "2px",
                      }}
                      aria-label={`Couleur ${color}`}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icône emoji (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Ex : 🏆" maxLength={4} className="w-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Critères */}
        <div className="border-cream-darker rounded-xl border p-5">
          <p className="font-heading mb-4 text-base font-semibold">
            Critères de sélection
          </p>
          <Controller
            control={form.control}
            name="criteria"
            render={({ field }) => (
              <CriteriaBuilder value={field.value} onChange={field.onChange} />
            )}
          />
          {form.formState.errors.criteria?.criteria?.message && (
            <p className="text-destructive mt-2 text-sm">
              {form.formState.errors.criteria.criteria.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="autoRefresh"
          render={({ field }) => (
            <FormItem className="border-cream-darker flex items-center justify-between rounded-xl border p-4">
              <div>
                <FormLabel className="text-base">Actualisation automatique</FormLabel>
                <FormDescription className="text-text-secondary text-xs">
                  Recalcule la liste à chaque envoi de campagne
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="border-cream-darker text-text-secondary hover:bg-cream"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Création..." : "Créer le segment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
