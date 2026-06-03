import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { SaleStatusBadge } from "./sale-status-badge";
import { PaymentMethodBadge } from "./payment-method-badge";
import { AddPaymentDialog } from "./add-payment-dialog";
import { CancelSaleDialog } from "./cancel-sale-dialog";
import type { SaleListItemDTO } from "../types";

interface SalesListProps {
  sales: SaleListItemDTO[];
  canCancel?: boolean;
}

export function SalesList({ sales, canCancel = false }: SalesListProps) {
  if (sales.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">Aucune vente trouvée</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Ajustez vos filtres ou enregistrez une nouvelle vente
        </p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Référence</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id} className="hover:bg-muted/20">
              <TableCell className="font-mono text-xs font-medium">
                {sale.reference}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{sale.clientName ?? "—"}</p>
                  {sale.clientPhone && (
                    <p className="text-muted-foreground text-xs">{sale.clientPhone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(sale.totalAmount)}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatCurrency(sale.paidAmount)}
              </TableCell>
              <TableCell>
                {sale.primaryPaymentMethod ? (
                  <PaymentMethodBadge method={sale.primaryPaymentMethod} />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell>
                <SaleStatusBadge status={sale.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(sale.soldAt).toLocaleDateString("fr-SN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    render={<Link href={`/sales/${sale.id}`} />}
                  >
                    <Eye className="size-4" />
                  </Button>

                  {sale.status !== "PAID" &&
                    sale.status !== "CANCELLED" &&
                    sale.status !== "REFUNDED" && <AddPaymentDialog sale={sale} />}

                  {canCancel &&
                    sale.status !== "CANCELLED" &&
                    sale.status !== "REFUNDED" && (
                      <CancelSaleDialog saleId={sale.id} reference={sale.reference} />
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
