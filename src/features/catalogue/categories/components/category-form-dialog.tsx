"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createCategory, updateCategory } from "../server/actions";
import {
  createCategorySchema,
  type CreateCategoryInput,
  type CreateCategoryOutput,
} from "../schemas/category.schema";
import type { CategoryDTO, CategorySelectOption } from "../types";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDTO | null;
  parentId?: string | null;
  selectOptions: CategorySelectOption[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  parentId,
  selectOptions,
}: CategoryFormDialogProps) {
  const isEdit = !!category;
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCategoryInput, unknown, CreateCategoryOutput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: parentId ?? null,
      icon: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        description: category?.description ?? "",
        parentId: category?.parentId ?? parentId ?? null,
        icon: category?.icon ?? "",
        isActive: category?.isActive ?? true,
        sortOrder: category?.sortOrder ?? 0,
      });
    }
  }, [open, category, parentId, form]);

  // Exclure les descendants de la catégorie en cours d'édition du select parent
  const filteredOptions = isEdit
    ? selectOptions.filter((opt) => {
        // Exclure la catégorie elle-même et ses descendants
        return opt.id !== category.id;
      })
    : selectOptions;

  // Si parentId est fourni (mode "sous-catégorie"), on le verrouille
  const isParentLocked = !isEdit && parentId != null;

  function onSubmit(values: CreateCategoryOutput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category.id, values)
        : await createCategory(values);

      if (result.success) {
        toast.success(
          isEdit
            ? `Catégorie "${values.name}" modifiée.`
            : `Catégorie "${values.name}" créée.`
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Modifier "${category.name}"` : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-2 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex : Canapé 3 places" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie parente</FormLabel>
                  <FormControl>
                    <select
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      disabled={isParentLocked}
                      className="border-cream-darker bg-background text-text-primary focus:ring-gold-deep w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-60"
                    >
                      <option value="">— Aucune (catégorie racine) —</option>
                      {filteredOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} disabled={!opt.isActive}>
                          {opt.displayName}
                        </option>
                      ))}
                    </select>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la catégorie (optionnel)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icône</FormLabel>
                    <FormControl>
                      <Input placeholder="🛋️ ou texte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordre</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">Catégorie active</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose
                render={<button type="button" />}
                disabled={isPending}
                className="border-cream-darker text-text-secondary hover:bg-cream/50 rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                Annuler
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gold-deep hover:bg-gold-darker gap-1.5 text-white"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
