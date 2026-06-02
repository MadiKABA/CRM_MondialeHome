import type { ArticleStatus } from "@prisma/client";

export const FIELD_ALIASES: Record<string, string[]> = {
  reference: ["reference", "ref", "code", "code_article", "sku", "id", "article_id"],
  name: [
    "nom",
    "name",
    "libelle",
    "libellé",
    "designation",
    "désignation",
    "produit",
    "article",
  ],
  shortDescription: [
    "description_courte",
    "description",
    "desc",
    "résumé",
    "resume",
    "short_desc",
  ],
  categoryName: [
    "categorie",
    "catégorie",
    "category",
    "famille",
    "rayon",
    "sous_famille",
    "type",
  ],
  brand: ["marque", "brand", "fabricant", "manufacturer"],
  supplier: ["fournisseur", "supplier", "vendor"],
  color: ["couleur", "color", "coloris"],
  material: ["matiere", "matière", "material", "composition"],
  dimensions: ["dimensions", "taille", "size", "format"],
  weight: ["poids_kg", "poids", "weight", "masse"],
  price: ["prix_vente", "prix", "price", "tarif", "pvt", "pv", "prix_ttc", "montant"],
  promoPrice: [
    "prix_promo",
    "prix_promotion",
    "promo",
    "solde",
    "promotion",
    "prix_solde",
  ],
  costPrice: ["prix_achat", "cout", "coût", "cost", "pa", "prix_revient"],
  stock: ["stock", "quantite", "quantité", "qty", "qte", "inventaire"],
  stockAlert: [
    "seuil_alerte_stock",
    "seuil_alerte",
    "stock_mini",
    "stock_minimum",
    "alerte",
  ],
  status: ["statut", "status", "etat", "état", "disponibilite", "disponibilité"],
  isNew: ["nouveaute", "nouveauté", "new", "nouveau", "arrivage"],
  tags: ["tags", "mots_cles", "mots-clés", "keywords", "etiquettes"],
  barcode: ["code_barre", "code_barres", "barcode", "ean", "ean13", "gtin"],
};

const STATUS_MAP: Record<string, ArticleStatus> = {
  disponible: "AVAILABLE",
  "en stock": "AVAILABLE",
  actif: "AVAILABLE",
  "en ligne": "AVAILABLE",
  rupture: "OUT_OF_STOCK",
  "rupture de stock": "OUT_OF_STOCK",
  "en rupture": "OUT_OF_STOCK",
  bientot: "COMING_SOON",
  bientôt: "COMING_SOON",
  "bientôt disponible": "COMING_SOON",
  "a venir": "COMING_SOON",
  prochainement: "COMING_SOON",
  archive: "ARCHIVED",
  archivé: "ARCHIVED",
  inactif: "ARCHIVED",
  arrete: "DISCONTINUED",
  arrêté: "DISCONTINUED",
  supprime: "DISCONTINUED",
  supprimé: "DISCONTINUED",
  available: "AVAILABLE",
  "in stock": "AVAILABLE",
  active: "AVAILABLE",
  "out of stock": "OUT_OF_STOCK",
  "coming soon": "COMING_SOON",
  archived: "ARCHIVED",
  discontinued: "DISCONTINUED",
};

function parseBool(val: string): boolean {
  const v = val.toLowerCase().trim();
  return ["oui", "yes", "true", "1", "o", "x", "✓"].includes(v);
}

function parsePrice(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.round(n);
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-.]/g, "_");
}

export function autoDetectMapping(fileHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const fileHeader of fileHeaders) {
    const normalized = normalizeHeader(fileHeader);

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      const normalizedAliases = aliases.map(normalizeHeader);
      if (normalizedAliases.includes(normalized) && !mapping[fileHeader]) {
        mapping[fileHeader] = field;
      }
    }
  }

  return mapping;
}

export interface MappedArticleRow {
  rowIndex: number;
  raw: Record<string, string>;
  reference: string;
  name: string;
  shortDescription: string | null;
  categoryName: string | null;
  brand: string | null;
  supplier: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  price: number | null;
  promoPrice: number | null;
  costPrice: number | null;
  stock: number;
  stockAlert: number;
  status: ArticleStatus;
  isNew: boolean;
  tags: string[];
  barcode: string | null;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
  existingReferences: Set<string>
): MappedArticleRow[] {
  const seenInFile = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getField = (field: string): string => {
      const header = Object.entries(mapping).find(([, f]) => f === field)?.[0];
      return header ? (row[header] ?? "").trim() : "";
    };

    // Référence : majuscules, espaces → tirets
    const reference = getField("reference")
      .toUpperCase()
      .replace(/\s+/g, "-")
      // Garder uniquement les caractères autorisés par la regex du schéma
      .replace(/[^A-Z0-9\-_]/g, "");

    const name = getField("name");

    if (!reference) errors.push("Référence manquante");
    if (!name) errors.push("Nom manquant");

    const priceRaw = getField("price");
    const price = parsePrice(priceRaw);
    if (!priceRaw) {
      errors.push("Prix de vente manquant");
    } else if (price === null || price < 0) {
      errors.push(`Prix invalide : "${priceRaw}"`);
    }

    const promoRaw = getField("promoPrice");
    const promoPriceRaw = parsePrice(promoRaw);
    if (promoPriceRaw !== null && price !== null && promoPriceRaw >= price) {
      warnings.push("Prix promotionnel ≥ prix normal — ignoré");
    }
    const promoPrice =
      promoPriceRaw !== null && price !== null && promoPriceRaw < price
        ? promoPriceRaw
        : null;

    const costPrice = parsePrice(getField("costPrice"));

    const stockRaw = getField("stock");
    const stockParsed = stockRaw ? parseInt(stockRaw, 10) : 0;
    if (stockRaw && isNaN(stockParsed)) {
      warnings.push(`Stock invalide "${stockRaw}" — remplacé par 0`);
    }
    const stock = isNaN(stockParsed) ? 0 : Math.max(0, stockParsed);

    const stockAlertRaw = getField("stockAlert");
    const stockAlertParsed = stockAlertRaw ? parseInt(stockAlertRaw, 10) : 5;
    const stockAlert = isNaN(stockAlertParsed) ? 5 : Math.max(0, stockAlertParsed);

    const statusRaw = getField("status").toLowerCase().trim();
    const status: ArticleStatus = STATUS_MAP[statusRaw] ?? "AVAILABLE";
    if (statusRaw && !STATUS_MAP[statusRaw]) {
      warnings.push(`Statut "${statusRaw}" non reconnu — "disponible" utilisé`);
    }

    if (reference) {
      if (existingReferences.has(reference)) {
        warnings.push(`Référence "${reference}" existe déjà en base → sera mise à jour`);
      }
      if (seenInFile.has(reference)) {
        errors.push(`Référence "${reference}" en double dans le fichier`);
      } else {
        seenInFile.add(reference);
      }
    }

    const tagsRaw = getField("tags");
    const tags = tagsRaw
      ? tagsRaw
          .split(/[,;|]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const weightRaw = getField("weight");
    const weightParsed = weightRaw ? parseFloat(weightRaw.replace(",", ".")) : null;
    const weight = weightParsed !== null && !isNaN(weightParsed) ? weightParsed : null;

    const barcodeRaw = getField("barcode");
    const barcode = barcodeRaw || null;

    return {
      rowIndex: index + 2,
      raw: row,
      reference,
      name,
      shortDescription: getField("shortDescription") || null,
      categoryName: getField("categoryName") || null,
      brand: getField("brand") || null,
      supplier: getField("supplier") || null,
      color: getField("color") || null,
      material: getField("material") || null,
      dimensions: getField("dimensions") || null,
      weight,
      price,
      promoPrice,
      costPrice,
      stock,
      stockAlert,
      status,
      isNew: parseBool(getField("isNew")),
      tags,
      barcode,
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  });
}
