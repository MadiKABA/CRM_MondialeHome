"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  type PaymentMethodType,
} from "../../types";
import type { SaleFormValues } from "../../schemas/sale.schema";

const METHODS: PaymentMethodType[] = [
  "WAVE",
  "ORANGE_MONEY",
  "FREE_MONEY",
  "CASH",
  "CREDIT",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
];

export function PaymentSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SaleFormValues>();

  const payments = watch("payments") ?? [];
  const selectedMethod = payments[0]?.method as PaymentMethodType | undefined;
  const amount = payments[0]?.amount;
  const reference = payments[0]?.reference;

  function selectMethod(method: PaymentMethodType) {
    setValue("payments", [
      {
        method,
        amount: amount ?? 0,
        reference: reference ?? "",
        notes: "",
      },
    ]);
  }

  const hasReference =
    selectedMethod === "WAVE" ||
    selectedMethod === "ORANGE_MONEY" ||
    selectedMethod === "FREE_MONEY" ||
    selectedMethod === "BANK_TRANSFER";

  return (
    <div className="space-y-4">
      {/* Méthode */}
      <div className="space-y-2">
        <Label>Méthode de paiement</Label>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => selectMethod(method)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                selectedMethod === method
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <span className="text-base">{PAYMENT_METHOD_ICONS[method]}</span>
              {PAYMENT_METHOD_LABELS[method]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setValue("payments", [])}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              payments.length === 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            Aucun paiement
          </button>
        </div>
      </div>

      {/* Montant + référence */}
      {selectedMethod && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">
              Montant payé{" "}
              <span className="text-muted-foreground font-normal">(FCFA)</span>
            </Label>
            <Input
              id="pay-amount"
              type="number"
              min={0}
              placeholder="0"
              {...register("payments.0.amount", { valueAsNumber: true })}
            />
            {errors.payments?.[0]?.amount && (
              <p className="text-destructive text-xs">
                {errors.payments[0].amount.message}
              </p>
            )}
          </div>

          {hasReference && (
            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Référence transaction (optionnel)</Label>
              <Input
                id="pay-ref"
                placeholder="Réf. Wave, OM..."
                {...register("payments.0.reference")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
