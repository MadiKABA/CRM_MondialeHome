"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuickClient } from "../../server/actions";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50),
  lastName: z.string().max(50).optional(),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Format : +221XXXXXXXXX")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface QuickClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: {
    id: string;
    fullName: string;
    phone: string | null;
    reference: string | null;
  }) => void;
}

export function QuickClientDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickClientDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createQuickClient({
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        phone: values.phone || undefined,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success("Client créé");
      onCreated({
        id: res.data!.id,
        fullName: res.data!.fullName,
        phone: values.phone || null,
        reference: null,
      });
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouveau client (rapide)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qc-firstName">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="qc-firstName"
              {...register("firstName")}
              placeholder="Mamadou"
              autoFocus
            />
            {errors.firstName && (
              <p className="text-destructive text-xs">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-lastName">Nom</Label>
            <Input id="qc-lastName" {...register("lastName")} placeholder="Diallo" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-phone">Téléphone</Label>
            <Input id="qc-phone" {...register("phone")} placeholder="+221 77 000 00 00" />
            {errors.phone && (
              <p className="text-destructive text-xs">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Créer et sélectionner
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
