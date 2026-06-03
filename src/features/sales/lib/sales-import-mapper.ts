import type { SaleStatus, PaymentMethod } from "@prisma/client";

export const SALE_FIELD_ALIASES: Record<string, string[]> = {
  saleReference: [
    "reference_vente",
    "ref_vente",
    "reference",
    "ref",
    "numero_vente",
    "no_vente",
    "id_vente",
    "sale_id",
    "order_id",
    "n_facture",
    "no_facture",
    "numero_facture",
  ],
  date: [
    "date_vente",
    "date",
    "date_achat",
    "date_commande",
    "sold_at",
    "created_at",
    "date_facture",
  ],
  clientLastName: ["client_nom", "nom_client", "nom", "last_name", "client_last_name"],
  clientFirstName: [
    "client_prenom",
    "prenom_client",
    "prenom",
    "first_name",
    "client_first_name",
  ],
  clientPhone: [
    "client_telephone",
    "telephone",
    "tel",
    "phone",
    "mobile",
    "client_phone",
    "tel_client",
  ],
  clientName: [
    "client",
    "client_nom_complet",
    "nom_complet",
    "customer",
    "full_name",
    "nom_client_complet",
  ],
  articleRef: [
    "article_reference",
    "ref_article",
    "reference_article",
    "sku",
    "code_article",
    "code_produit",
    "code_produit_2",
  ],
  articleName: [
    "article_nom",
    "nom_article",
    "article",
    "produit",
    "designation",
    "libelle",
    "libelle_produit",
  ],
  quantity: ["quantite", "qte", "qty", "quantity", "nb", "nombre"],
  unitPrice: [
    "prix_unitaire",
    "prix_unit",
    "prix",
    "unit_price",
    "price",
    "tarif",
    "pvt",
    "prix_vente",
  ],
  lineDiscount: ["remise_ligne", "remise", "discount", "reduction"],
  globalDiscount: [
    "remise_globale_percent",
    "remise_globale",
    "discount_percent",
    "taux_remise",
  ],
  paymentMethod: [
    "mode_paiement",
    "paiement",
    "payment",
    "moyen_paiement",
    "methode_paiement",
    "mode_reglement",
  ],
  paidAmount: [
    "montant_paye",
    "montant",
    "amount",
    "paid",
    "verse",
    "acompte",
    "montant_verse",
  ],
  status: ["statut", "status", "etat", "état", "statut_reglement"],
  notes: ["notes", "note", "commentaire", "remarque", "observation"],
  seller: ["vendeur", "seller", "commercial", "agent", "code_vendeur"],
  campaign: ["campagne", "campaign", "promo"],
};

const STATUS_MAP: Record<string, SaleStatus> = {
  payée: "PAID",
  payee: "PAID",
  paid: "PAID",
  réglée: "PAID",
  reglee: "PAID",
  ok: "PAID",
  partielle: "PARTIAL",
  partial: "PARTIAL",
  acompte: "PARTIAL",
  "en cours": "PARTIAL",
  impayée: "UNPAID",
  impayee: "UNPAID",
  unpaid: "UNPAID",
  "non payée": "UNPAID",
  "non payee": "UNPAID",
  annulée: "CANCELLED",
  annulee: "CANCELLED",
  cancelled: "CANCELLED",
  cancel: "CANCELLED",
  remboursée: "REFUNDED",
  remboursee: "REFUNDED",
  refunded: "REFUNDED",
};

const PAYMENT_MAP: Record<string, PaymentMethod> = {
  wave: "WAVE",
  "orange money": "ORANGE_MONEY",
  orange_money: "ORANGE_MONEY",
  om: "ORANGE_MONEY",
  "free money": "FREE_MONEY",
  free_money: "FREE_MONEY",
  freemoney: "FREE_MONEY",
  espèces: "CASH",
  especes: "CASH",
  cash: "CASH",
  liquide: "CASH",
  virement: "BANK_TRANSFER",
  "virement bancaire": "BANK_TRANSFER",
  bank: "BANK_TRANSFER",
  crédit: "CREDIT",
  credit: "CREDIT",
  différé: "CREDIT",
  differe: "CREDIT",
  carte: "CARD",
  "carte bancaire": "CARD",
  card: "CARD",
  cheque: "CHECK",
  chèque: "CHECK",
  check: "CHECK",
  autre: "OTHER",
  other: "OTHER",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-.]/g, "_");
}

export function parseImportDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const match = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
  if (match?.[1] && match[2] && match[3]) {
    const d = new Date(
      `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
    );
    return isNaN(d.getTime()) ? null : d;
  }

  // Timestamp Excel (jours depuis 1900-01-00 avec bug bissextile 1900)
  const n = parseFloat(s);
  if (!isNaN(n) && n > 40000 && n < 55000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let phone = raw.replace(/[\s.\-()]/g, "");
  if (phone.startsWith("00221")) phone = `+${phone.slice(2)}`;
  if (phone.startsWith("221")) phone = `+${phone}`;
  if (!phone.startsWith("+") && phone.length === 9) phone = `+221${phone}`;
  return /^\+221[0-9]{9}$/.test(phone) ? phone : null;
}

export interface MappedSaleItem {
  articleRef: string | null;
  articleName: string;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  totalPrice: number;
}

export interface MappedSaleGroup {
  saleReference: string;
  date: Date;
  clientLastName: string | null;
  clientFirstName: string | null;
  clientPhone: string | null;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  discountPercent: number | null;
  status: SaleStatus;
  notes: string | null;
  sellerName: string | null;
  campaignName: string | null;
  items: MappedSaleItem[];
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function autoDetectSaleMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const norm = normalize(header);
    for (const [field, aliases] of Object.entries(SALE_FIELD_ALIASES)) {
      if (aliases.map(normalize).includes(norm) && !mapping[header]) {
        mapping[header] = field;
      }
    }
  }
  return mapping;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const n = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export function mapAndGroupSaleRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): MappedSaleGroup[] {
  const groupMap = new Map<string, MappedSaleGroup>();
  let autoIndex = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const get = (field: string): string => {
      const header = Object.entries(mapping).find(([, f]) => f === field)?.[0];
      return header ? (row[header] ?? "").trim() : "";
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    const articleName = get("articleName");
    const articleRef = get("articleRef") || null;

    if (!articleName) errors.push(`Ligne ${i + 2} : nom d'article manquant`);

    const unitPriceRaw = get("unitPrice");
    const unitPrice = parseAmount(unitPriceRaw);
    if (!unitPriceRaw || unitPrice === 0) {
      errors.push(`Ligne ${i + 2} : prix unitaire invalide "${unitPriceRaw}"`);
    }

    const quantityRaw = get("quantity");
    const quantity = parseInt(quantityRaw || "1", 10);
    const lineDiscount = parseAmount(get("lineDiscount"));

    const item: MappedSaleItem = {
      articleRef,
      articleName: articleName || "Article sans nom",
      unitPrice,
      quantity: isNaN(quantity) || quantity < 1 ? 1 : quantity,
      lineDiscount: isNaN(lineDiscount) ? 0 : lineDiscount,
      totalPrice: Math.max(
        0,
        unitPrice * (isNaN(quantity) || quantity < 1 ? 1 : quantity) -
          (isNaN(lineDiscount) ? 0 : lineDiscount)
      ),
    };

    let saleRef = get("saleReference");
    if (!saleRef) {
      const clientKey = `${get("clientPhone") || get("clientName") || get("clientLastName")}_${get("date")}`;
      saleRef = clientKey || `AUTO-${++autoIndex}`;
    }

    if (!groupMap.has(saleRef)) {
      const dateRaw = get("date");
      const date = parseImportDate(dateRaw);
      if (!date) errors.push(`Date invalide : "${dateRaw}"`);

      const statusRaw = get("status").toLowerCase().trim();
      const status: SaleStatus = STATUS_MAP[statusRaw] ?? "PAID";
      if (statusRaw && !STATUS_MAP[statusRaw]) {
        warnings.push(`Statut "${statusRaw}" non reconnu — "payée" utilisé`);
      }

      const paymentRaw = get("paymentMethod").toLowerCase().trim();
      const paymentMethod: PaymentMethod = PAYMENT_MAP[paymentRaw] ?? "CASH";
      if (paymentRaw && !PAYMENT_MAP[paymentRaw]) {
        warnings.push(`Mode paiement "${paymentRaw}" non reconnu — "Espèces" utilisé`);
      }

      const paidAmount = parseAmount(get("paidAmount"));
      const discountRaw = get("globalDiscount");
      const discountPercent = discountRaw ? parseAmount(discountRaw) : null;

      const phone = normalizePhone(get("clientPhone"));
      const lastName = get("clientLastName") || null;
      const firstName = get("clientFirstName") || null;
      const fullName = get("clientName");
      const parsedLast = lastName || (fullName ? fullName.split(" ")[0] : null) || null;
      const parsedFirst =
        firstName || (fullName ? fullName.split(" ").slice(1).join(" ") : null) || null;

      groupMap.set(saleRef, {
        saleReference: saleRef,
        date: date ?? new Date(),
        clientLastName: parsedLast,
        clientFirstName: parsedFirst,
        clientPhone: phone,
        paymentMethod,
        paidAmount,
        discountPercent:
          discountPercent && !isNaN(discountPercent) ? discountPercent : null,
        status,
        notes: get("notes") || null,
        sellerName: get("seller") || null,
        campaignName: get("campaign") || null,
        items: [item],
        errors,
        warnings,
        isValid: errors.length === 0,
      });
    } else {
      const existing = groupMap.get(saleRef)!;
      existing.items.push(item);
      if (errors.length > 0) {
        existing.errors.push(...errors);
        existing.isValid = false;
      }
    }
  }

  return Array.from(groupMap.values());
}
