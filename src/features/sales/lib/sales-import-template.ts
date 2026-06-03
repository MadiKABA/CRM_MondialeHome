import * as XLSX from "xlsx";
import Papa from "papaparse";

const TEMPLATE_HEADERS = [
  "reference_vente",
  "date_vente",
  "client_nom",
  "client_prenom",
  "client_telephone",
  "article_reference",
  "article_nom",
  "quantite",
  "prix_unitaire",
  "remise_ligne",
  "remise_globale_percent",
  "mode_paiement",
  "montant_paye",
  "statut",
  "notes",
  "vendeur",
  "campagne",
];

const TEMPLATE_ROWS = [
  {
    reference_vente: "VTE-2601-0001",
    date_vente: "12/01/2026",
    client_nom: "Diop",
    client_prenom: "Mamadou",
    client_telephone: "+221771234567",
    article_reference: "MH-CAP-001",
    article_nom: "Canapé 3 places Oslo",
    quantite: "2",
    prix_unitaire: "450000",
    remise_ligne: "0",
    remise_globale_percent: "10",
    mode_paiement: "Wave",
    montant_paye: "810000",
    statut: "payée",
    notes: "",
    vendeur: "Ibrahima Fall",
    campagne: "",
  },
  {
    reference_vente: "VTE-2601-0001",
    date_vente: "12/01/2026",
    client_nom: "Diop",
    client_prenom: "Mamadou",
    client_telephone: "+221771234567",
    article_reference: "MH-TAB-001",
    article_nom: "Table basse Nordic",
    quantite: "1",
    prix_unitaire: "180000",
    remise_ligne: "0",
    remise_globale_percent: "10",
    mode_paiement: "Wave",
    montant_paye: "0",
    statut: "payée",
    notes: "",
    vendeur: "Ibrahima Fall",
    campagne: "",
  },
  {
    reference_vente: "VTE-2601-0002",
    date_vente: "13/01/2026",
    client_nom: "Konaté",
    client_prenom: "Aïssatou",
    client_telephone: "+221789876543",
    article_reference: "MH-LIT-001",
    article_nom: "Lit 2 places Oslo",
    quantite: "1",
    prix_unitaire: "680000",
    remise_ligne: "0",
    remise_globale_percent: "0",
    mode_paiement: "Espèces",
    montant_paye: "400000",
    statut: "partielle",
    notes: "Reste 280000 FCFA à payer fin janvier",
    vendeur: "Fatou Sarr",
    campagne: "",
  },
];

const GUIDE_ROWS = [
  {
    champ: "statut",
    valeurs_acceptees: "payée, partielle, impayée, annulée",
  },
  {
    champ: "mode_paiement",
    valeurs_acceptees: "Wave, Orange Money, Free Money, Espèces, Virement, Crédit, Autre",
  },
  {
    champ: "date_vente",
    valeurs_acceptees: "JJ/MM/AAAA ou AAAA-MM-JJ ou JJ-MM-AAAA",
  },
  {
    champ: "reference_vente",
    valeurs_acceptees:
      "Identifiant unique de la vente. Plusieurs lignes avec la même référence = une seule vente multi-articles",
  },
  {
    champ: "montant_paye",
    valeurs_acceptees:
      "Montant en FCFA sans espaces ni symboles. Pour une vente multi-lignes, renseigner uniquement sur la première ligne.",
  },
  {
    champ: "remise_ligne",
    valeurs_acceptees: "Remise en FCFA sur cette ligne uniquement",
  },
  {
    champ: "remise_globale_percent",
    valeurs_acceptees: "Remise en % appliquée sur le total de la vente (0 à 100)",
  },
  {
    champ: "client_telephone",
    valeurs_acceptees: "+221XXXXXXXXX ou 77XXXXXXX (normalisé automatiquement)",
  },
];

export function downloadSalesTemplateCSV(): void {
  const csv = Papa.unparse(
    { fields: TEMPLATE_HEADERS, data: TEMPLATE_ROWS },
    { delimiter: ";", header: true }
  );
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_ventes_mondial_home.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSalesTemplateExcel(): void {
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS, {
    header: TEMPLATE_HEADERS,
  });

  ws["!cols"] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ventes");

  const wsGuide = XLSX.utils.json_to_sheet(GUIDE_ROWS);
  wsGuide["!cols"] = [{ wch: 25 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Guide");

  XLSX.writeFile(wb, "modele_import_ventes_mondial_home.xlsx");
}
