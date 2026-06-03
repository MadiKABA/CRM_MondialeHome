"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { createGroup } from "@/features/segments/server/actions";
import { createGroupSchema, type CreateGroupInput } from "../schemas/segment.schema";

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

export function GroupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema) as Resolver<CreateGroupInput>,
    defaultValues: {
      name: "",
      description: "",
      color: "#8B6914",
      icon: "",
    },
  });

  const selectedColor = form.watch("color");

  function onSubmit(data: CreateGroupInput) {
    startTransition(async () => {
      const result = await createGroup(data);
      if (result.success && result.data) {
        toast.success(`Groupe "${data.name}" créé avec succès`);
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
              <FormLabel>Nom du groupe *</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Clients VIP Janvier 2026" {...field} />
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
                  placeholder="Ex : Groupe créé pour la promo de janvier"
                  rows={3}
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
                <Input placeholder="Ex : 🌟" maxLength={4} className="w-24" {...field} />
              </FormControl>
              <FormMessage />
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
            {isPending ? "Création..." : "Créer le groupe"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
