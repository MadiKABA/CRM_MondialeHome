"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelSale } from "../server/actions";
import { cancelSaleSchema, type CancelSaleInput } from "../schemas/sale.schema";

interface CancelSaleDialogProps {
  saleId: string;
  reference: string;
  trigger?: React.ReactNode;
}

export function CancelSaleDialog({ saleId, reference, trigger }: CancelSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CancelSaleInput>({
    resolver: zodResolver(cancelSaleSchema),
    defaultValues: { saleId },
  });

  function onSubmit(data: CancelSaleInput) {
    startTransition(async () => {
      const res = await cancelSale(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Vente annulée");
      reset();
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            title="Annuler la vente"
          >
            <XCircle className="size-4" />
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la vente {reference} ?</AlertDialogTitle>
          <p className="text-muted-foreground text-sm">
            Cette action est irréversible. Indiquez le motif d&apos;annulation.
          </p>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("saleId")} />

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Ex : erreur de saisie, client annule la commande..."
              rows={3}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-destructive text-xs">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isPending}>Conserver</AlertDialogCancel>
            <Button variant="destructive" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer l&apos;annulation
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
