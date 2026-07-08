// Export CSV, Excel, PDF — côté client uniquement

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ClientListItemDTO } from "../types";

function formatRow(client: ClientListItemDTO): Record<string, string> {
  return {
    Référence: client.reference ?? "",
    Prénom: client.firstName,
    Nom: client.lastName ?? "",
    Téléphone: client.phone ?? "",
    Email: client.email ?? "",
    Ville: client.city ?? "",
    Quartier: client.district ?? "",
    Source: client.source ?? "",
    Statut: client.status,
    "Total dépensé (FCFA)": client.totalSpent.toLocaleString("fr-FR"),
    "Nb commandes": String(client.totalOrders),
    "Dernier achat": client.lastPurchaseAt
      ? new Date(client.lastPurchaseAt).toLocaleDateString("fr-FR")
      : "",
    "Date inscription": new Date(client.createdAt).toLocaleDateString("fr-FR"),
  };
}

export function exportToCSV(clients: ClientListItemDTO[], filename = "clients"): void {
  const rows = clients.map(formatRow);
  const csv = Papa.unparse(rows, { delimiter: ";", header: true });
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(clients: ClientListItemDTO[], filename = "clients"): void {
  const rows = clients.map(formatRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPDF(
  clients: ClientListItemDTO[],
  filename = "clients"
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", format: "a4" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Mondiale Home CRM — Liste des Clients", 14, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Exporté le ${new Date().toLocaleDateString("fr-FR")} · ${clients.length} clients`,
    14,
    22
  );

  autoTable(doc, {
    head: [
      [
        "Réf.",
        "Prénom",
        "Nom",
        "Téléphone",
        "Ville",
        "Quartier",
        "Statut",
        "Dépensé",
        "Cmdes",
      ],
    ],
    body: clients.map((c) => [
      c.reference ?? "",
      c.firstName,
      c.lastName ?? "",
      c.phone ?? "",
      c.city ?? "",
      c.district ?? "",
      c.status,
      c.totalSpent.toLocaleString("fr-FR") + " FCFA",
      String(c.totalOrders),
    ]),
    startY: 28,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [141, 87, 54], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [253, 250, 246] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
