import * as XLSX from "xlsx";
import Papa from "papaparse";

const TEMPLATE_HEADERS = [
  "reference",
  "nom",
  "description_courte",
  "categorie",
  "marque",
  "fournisseur",
  "couleur",
  "matiere",
  "dimensions",
  "poids_kg",
  "prix_vente",
  "prix_promo",
  "prix_achat",
  "stock",
  "seuil_alerte_stock",
  "statut",
  "nouveaute",
  "tags",
  "code_barre",
];

const TEMPLATE_EXAMPLE_ROWS = [
  {
    reference: "MH-CAP-001",
    nom: "Canapé 3 places Oslo",
    description_courte: "Canapé confortable en tissu microfibre",
    categorie: "Canapé 3 places",
    marque: "ScanDesign",
    fournisseur: "Meublés Dakar Import",
    couleur: "Gris anthracite",
    matiere: "Tissu microfibre",
    dimensions: "220x90x85 cm",
    poids_kg: "52",
    prix_vente: "450000",
    prix_promo: "",
    prix_achat: "280000",
    stock: "5",
    seuil_alerte_stock: "2",
    statut: "disponible",
    nouveaute: "oui",
    tags: "canapé,salon,tissu",
    code_barre: "",
  },
  {
    reference: "MH-LIT-001",
    nom: "Lit 2 places Oslo Capitonné",
    description_courte: "Tête de lit capitonnée avec coffre de rangement",
    categorie: "Lit 2 places",
    marque: "ScanDesign",
    fournisseur: "",
    couleur: "Gris perle",
    matiere: "Tissu capitonné",
    dimensions: "160x200 cm",
    poids_kg: "85",
    prix_vente: "680000",
    prix_promo: "580000",
    prix_achat: "420000",
    stock: "6",
    seuil_alerte_stock: "2",
    statut: "disponible",
    nouveaute: "non",
    tags: "lit,chambre,rangement",
    code_barre: "",
  },
];

export function downloadTemplateCSV(): void {
  const csv = Papa.unparse(
    { fields: TEMPLATE_HEADERS, data: TEMPLATE_EXAMPLE_ROWS },
    { delimiter: ";", header: true }
  );
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_articles_mondial_home.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplateExcel(): void {
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLE_ROWS, {
    header: TEMPLATE_HEADERS,
  });

  ws["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 25 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Articles");

  const guideData = [
    {
      champ: "statut",
      valeurs_acceptees: "disponible, rupture, bientot, archive, arrete",
    },
    {
      champ: "nouveaute",
      valeurs_acceptees: "oui / non (ou 1 / 0 ou true / false)",
    },
    {
      champ: "tags",
      valeurs_acceptees: "valeurs séparées par des virgules : canapé,salon,luxe",
    },
    {
      champ: "prix_vente",
      valeurs_acceptees: "montant en FCFA sans espaces ni symboles : 450000",
    },
    {
      champ: "poids_kg",
      valeurs_acceptees: "nombre décimal avec point : 52.5",
    },
    {
      champ: "reference",
      valeurs_acceptees: "unique, lettres majuscules et chiffres : MH-CAP-001",
    },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide["!cols"] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Guide");

  XLSX.writeFile(wb, "modele_import_articles_mondial_home.xlsx");
}
