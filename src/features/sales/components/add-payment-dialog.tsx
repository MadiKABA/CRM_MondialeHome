"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { addPayment } from "../server/actions";
import {
  addPaymentSchema,
  PAYMENT_METHODS,
  type AddPaymentInput,
} from "../schemas/sale.schema";
import { PAYMENT_METHOD_LABELS } from "../types";
import type { SaleListItemDTO } from "../types";

interface AddPaymentDialogProps {
  sale: Pick<SaleListItemDTO, "id" | "totalAmount" | "paidAmount" | "remainingAmount">;
  trigger?: React.ReactNode;
}

export function AddPaymentDialog({ sale, trigger }: AddPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddPaymentInput>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      saleId: sale.id,
      amount: sale.remainingAmount,
    },
  });

  const method = watch("method");

  function onSubmit(data: AddPaymentInput) {
    startTransition(async () => {
      const res = await addPayment(data);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Paiement enregistré");
      reset();
      setOpen(false);
    });
  }

  const hasReference =
    method === "WAVE" ||
    method === "ORANGE_MONEY" ||
    method === "FREE_MONEY" ||
    method === "BANK_TRANSFER";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Ajouter un paiement"
          >
            <CreditCard className="size-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un paiement</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Reste à payer :{" "}
            <span className="text-foreground font-medium">
              {formatCurrency(sale.remainingAmount)}
            </span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("saleId")} />

          <div className="space-y-1.5">
            <Label>Méthode *</Label>
            <Select
              onValueChange={(v) => setValue("method", v as AddPaymentInput["method"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une méthode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.method && (
              <p className="text-destructive text-xs">{errors.method.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-amount">
              Montant <span className="text-muted-foreground font-normal">(FCFA)</span> *
            </Label>
            <Input
              id="ap-amount"
              type="number"
              min={1}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-destructive text-xs">{errors.amount.message}</p>
            )}
          </div>

          {hasReference && (
            <div className="space-y-1.5">
              <Label htmlFor="ap-ref">Référence transaction</Label>
              <Input
                id="ap-ref"
                placeholder="Réf. Wave, OM..."
                {...register("reference")}
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
