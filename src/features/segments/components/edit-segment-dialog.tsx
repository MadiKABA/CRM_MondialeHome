"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { updateDynamicSegment } from "@/features/segments/server/actions";
import { createSegmentSchema, type CreateSegmentInput } from "../schemas/segment.schema";
import type { SegmentDTO } from "../types";

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

interface EditSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: SegmentDTO;
  onSuccess?: () => void;
}

export function EditSegmentDialog({
  open,
  onOpenChange,
  segment,
  onSuccess,
}: EditSegmentDialogProps) {
  const [isPending, startTransition] = useTransition();

  const defaultCriteria: CreateSegmentInput["criteria"] = {
    operator: "AND",
    criteria: [{ field: "totalSpent", operator: "gte", value: 0 }],
  };

  // Les critères viennent de la DB avec field: string ; on cast car les valeurs sont toujours valides
  const toCriteria = (c: typeof segment.criteria): CreateSegmentInput["criteria"] =>
    (c as unknown as CreateSegmentInput["criteria"]) ?? defaultCriteria;

  const form = useForm<CreateSegmentInput>({
    resolver: zodResolver(createSegmentSchema) as Resolver<CreateSegmentInput>,
    defaultValues: {
      name: segment.name,
      description: segment.description ?? "",
      color: segment.color,
      icon: segment.icon ?? "",
      autoRefresh: segment.autoRefresh,
      criteria: toCriteria(segment.criteria),
    },
  });

  // Resynchronise les valeurs à chaque ouverture
  useEffect(() => {
    if (open) {
      form.reset({
        name: segment.name,
        description: segment.description ?? "",
        color: segment.color,
        icon: segment.icon ?? "",
        autoRefresh: segment.autoRefresh,
        criteria: toCriteria(segment.criteria),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, segment]);

  const selectedColor = form.watch("color");

  function onSubmit(data: CreateSegmentInput) {
    startTransition(async () => {
      const result = await updateDynamicSegment(segment.id, data);
      if (result.success) {
        const count = result.data?.memberCount ?? 0;
        toast.success(
          `Segment mis à jour — ${count.toLocaleString("fr-FR")} client${count !== 1 ? "s" : ""} ciblé${count !== 1 ? "s" : ""}`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.success === false ? result.error : "Une erreur est survenue");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le segment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du segment *</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea rows={2} {...field} />
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
                            borderColor:
                              selectedColor === color ? "white" : "transparent",
                            outline:
                              selectedColor === color ? `2px solid ${color}` : "none",
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
                    <Input
                      placeholder="Ex : ⚡"
                      maxLength={4}
                      className="w-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-cream-darker text-text-secondary hover:bg-cream"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
