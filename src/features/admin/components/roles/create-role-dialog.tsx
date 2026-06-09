"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createRoleSchema,
  type CreateRoleInput,
} from "@/features/admin/schemas/role.schema";
import { createRole } from "@/features/admin/server/actions/roles.actions";

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(data: CreateRoleInput) {
    const result = await createRole(data);
    if (result.success) {
      toast.success(`Profil "${data.name}" créé avec succès.`);
      reset();
      setOpen(false);
      router.push(`/admin/roles/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gold-deep hover:bg-gold-deep/90 text-cream gap-1.5"
      >
        <Plus className="size-4" />
        Nouveau profil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau profil</DialogTitle>
            <DialogDescription>
              Créez un profil personnalisé et définissez ses droits d&apos;accès.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cr-name">Nom du profil *</Label>
              <Input
                id="cr-name"
                {...register("name")}
                placeholder="ex: Responsable commercial"
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cr-description">Description</Label>
              <Input
                id="cr-description"
                {...register("description")}
                placeholder="Décrivez les responsabilités de ce profil…"
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose
                render={<button type="button" />}
                className="border-cream-darker text-text-secondary hover:bg-cream/50 rounded-lg border px-4 py-2 text-sm transition-colors"
              >
                Annuler
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Créer le profil
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
