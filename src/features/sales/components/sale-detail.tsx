import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { SaleStatusBadge } from "./sale-status-badge";
import { PaymentMethodBadge } from "./payment-method-badge";
import { AddPaymentDialog } from "./add-payment-dialog";
import { CancelSaleDialog } from "./cancel-sale-dialog";
import type { SaleDetailDTO } from "../types";

interface SaleDetailProps {
  sale: SaleDetailDTO;
  canUpdate?: boolean;
  canCancel?: boolean;
}

export function SaleDetail({
  sale,
  canUpdate = false,
  canCancel = false,
}: SaleDetailProps) {
  const canAddPayment =
    canUpdate &&
    sale.status !== "PAID" &&
    sale.status !== "CANCELLED" &&
    sale.status !== "REFUNDED";

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 gap-1.5"
            render={<Link href="/sales" />}
          >
            <ChevronLeft className="size-4" />
            Ventes
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{sale.reference}</h1>
            <SaleStatusBadge status={sale.status} />
          </div>
          {sale.primaryPaymentMethod && (
            <PaymentMethodBadge method={sale.primaryPaymentMethod} />
          )}
        </div>

        <div className="flex gap-2">
          {canAddPayment && (
            <AddPaymentDialog
              sale={sale}
              trigger={<Button size="sm">Ajouter un paiement</Button>}
            />
          )}
          {canCancel && sale.status !== "CANCELLED" && sale.status !== "REFUNDED" && (
            <CancelSaleDialog
              saleId={sale.id}
              reference={sale.reference}
              trigger={
                <Button size="sm" variant="destructive">
                  Annuler la vente
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client + Vendeur */}
          <div className="border-border bg-card space-y-3 rounded-xl border p-5">
            <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Informations
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Client</p>
                <p className="font-medium">{sale.clientName ?? "—"}</p>
                {sale.clientPhone && (
                  <p className="text-muted-foreground text-xs">{sale.clientPhone}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Vendeur</p>
                <p className="font-medium">{sale.sellerName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date de vente</p>
                <p className="font-medium">
                  {new Date(sale.soldAt).toLocaleDateString("fr-SN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {sale.campaignName && (
                <div>
                  <p className="text-muted-foreground text-xs">Campagne</p>
                  <p className="font-medium">{sale.campaignName}</p>
                </div>
              )}
            </div>
            {sale.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Notes</p>
                  <p className="text-sm">{sale.notes}</p>
                </div>
              </>
            )}
          </div>

          {/* Articles */}
          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="border-border border-b px-5 py-4">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Articles ({sale.itemsCount})
              </h2>
            </div>
            <div className="divide-border divide-y">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.articleName}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.articleRef} · {formatCurrency(item.unitPrice)} ×{" "}
                      {item.quantity}
                      {item.discount > 0 && ` − ${formatCurrency(item.discount)}`}
                    </p>
                  </div>
                  <p className="ml-4 font-medium tabular-nums">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Paiements */}
          {sale.payments.length > 0 && (
            <div className="border-border bg-card overflow-hidden rounded-xl border">
              <div className="border-border border-b px-5 py-4">
                <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  Paiements
                </h2>
              </div>
              <div className="divide-border divide-y">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <PaymentMethodBadge method={payment.method} />
                      <div>
                        <p className="text-sm font-medium">
                          {payment.reference && (
                            <span className="text-muted-foreground mr-2 text-xs">
                              Réf. {payment.reference}
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(payment.paidAt).toLocaleDateString("fr-SN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne résumé financier */}
        <div className="border-border bg-card h-fit space-y-4 rounded-xl border p-5">
          <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
            Résumé financier
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="tabular-nums">
                {formatCurrency(sale.totalAmount + sale.discountAmount)}
              </span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>
                  Remise{sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}
                </span>
                <span className="tabular-nums">
                  −{formatCurrency(sale.discountAmount)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Payé</span>
              <span className="tabular-nums">{formatCurrency(sale.paidAmount)}</span>
            </div>
            {sale.remainingAmount > 0 && (
              <div className="flex justify-between font-medium text-red-600">
                <span>Reste à payer</span>
                <span className="tabular-nums">
                  {formatCurrency(sale.remainingAmount)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
