import * as XLSX from "xlsx";
import type { SaleListItemDTO } from "../types";
import { SALE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "../types";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-SN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toCsvRow(sale: SaleListItemDTO): string[] {
  return [
    sale.reference,
    formatDate(sale.soldAt),
    sale.clientName ?? "",
    sale.clientPhone ?? "",
    sale.sellerName ?? "",
    String(sale.itemsCount),
    String(sale.totalAmount),
    String(sale.paidAmount),
    String(sale.remainingAmount),
    SALE_STATUS_LABELS[sale.status],
    sale.primaryPaymentMethod ? PAYMENT_METHOD_LABELS[sale.primaryPaymentMethod] : "",
  ];
}

const HEADERS = [
  "Référence",
  "Date",
  "Client",
  "Téléphone",
  "Vendeur",
  "Nb articles",
  "Total (FCFA)",
  "Payé (FCFA)",
  "Reste (FCFA)",
  "Statut",
  "Mode paiement",
];

export function exportToCsv(sales: SaleListItemDTO[]): Blob {
  const BOM = "﻿";
  const rows = [HEADERS.join(";"), ...sales.map((s) => toCsvRow(s).join(";"))];
  return new Blob([BOM + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
}

export function exportToExcel(sales: SaleListItemDTO[]): Blob {
  const rows = sales.map((s) => {
    const r = toCsvRow(s);
    return HEADERS.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = r[i] ?? "";
      return acc;
    }, {});
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 24 },
    { wch: 16 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventes");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function exportToPdf(sales: SaleListItemDTO[]): Promise<Blob> {
  // jsPDF est importé dynamiquement pour éviter le SSR
  return import("jspdf").then(({ default: jsPDF }) =>
    import("jspdf-autotable").then(({ default: autoTable }) => {
      const doc = new jsPDF({ orientation: "landscape", format: "a4" });

      doc.setFontSize(14);
      doc.text("Historique des ventes — Mondiale Home", 14, 16);
      doc.setFontSize(9);
      doc.text(
        `Exporté le ${new Date().toLocaleDateString("fr-SN")} · ${sales.length} vente(s)`,
        14,
        22
      );

      autoTable(doc, {
        head: [HEADERS],
        body: sales.map(toCsvRow),
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [196, 98, 45] },
      });

      const buffer = doc.output("arraybuffer");
      return new Blob([buffer], { type: "application/pdf" });
    })
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
