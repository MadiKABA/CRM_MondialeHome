"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { formatCurrency } from "@/lib/utils";
import { SaleStatusBadge } from "../sale-status-badge";
import type { SaleFormValues } from "../../schemas/sale.schema";
import type { SaleStatusType } from "../../types";

export function SaleSummary() {
  const { control } = useFormContext<SaleFormValues>();
  const items = useWatch({ control, name: "items" }) ?? [];
  const payments = useWatch({ control, name: "payments" }) ?? [];
  const discountPercent = useWatch({ control, name: "discountPercent" });
  const discountAmount = useWatch({ control, name: "discountAmount" });

  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1);
    const price = Number(item?.unitPrice ?? 0);
    const disc = Number(item?.discount ?? 0);
    return sum + Math.max(0, price * qty - disc);
  }, 0);

  let globalDiscount = 0;
  if (discountPercent) {
    globalDiscount = (subtotal * Number(discountPercent)) / 100;
  } else if (discountAmount) {
    globalDiscount = Math.min(Number(discountAmount), subtotal);
  }

  const total = Math.max(0, subtotal - globalDiscount);
  const paid = payments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
  const remaining = Math.max(0, total - paid);

  let status: SaleStatusType = "UNPAID";
  if (payments.length === 0) {
    status = "UNPAID";
  } else if (paid >= total && total > 0) {
    status = "PAID";
  } else if (paid > 0) {
    status = "PARTIAL";
  } else {
    status = "UNPAID";
  }

  return (
    <div className="border-border bg-muted/30 space-y-3 rounded-xl border p-5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Sous-total</span>
        <span className="font-mono">{formatCurrency(subtotal)}</span>
      </div>

      {globalDiscount > 0 && (
        <div className="flex justify-between text-sm text-amber-600">
          <span>Remise{discountPercent ? ` (${discountPercent}%)` : ""}</span>
          <span className="font-mono">−{formatCurrency(globalDiscount)}</span>
        </div>
      )}

      <div className="bg-border h-px" />

      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span className="font-mono text-base">{formatCurrency(total)}</span>
      </div>

      {payments.length > 0 && (
        <>
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Montant payé</span>
            <span className="font-mono">{formatCurrency(paid)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className={remaining > 0 ? "text-red-600" : "text-muted-foreground"}>
              Reste à payer
            </span>
            <span
              className={`font-mono ${remaining > 0 ? "text-red-600" : "text-muted-foreground"}`}
            >
              {formatCurrency(remaining)}
            </span>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-muted-foreground text-xs">Statut</span>
        <SaleStatusBadge status={status} />
      </div>
    </div>
  );
}
