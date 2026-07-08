import { extractVariables } from "./variables";

export type ClientData = Record<string, string>;
export type CampaignVars = Record<string, string>;

// ── Données client de test (Mamadou Diop) ────────────────────────────────────

export const DEFAULT_CLIENT_DATA: ClientData = {
  "{{prenom}}": "Mamadou",
  "{{nom}}": "Diop",
  "{{prenom_nom}}": "Mamadou Diop",
  "{{ville}}": "Dakar",
  "{{quartier}}": "Mermoz",
  "{{dernier_article}}": "Canapé 3 places Oslo",
  "{{montant_total}}": "850 000 FCFA",
  "{{nb_commandes}}": "5",
  "{{date_dernier_achat}}": "12 janvier 2026",
  "{{nom_boutique}}": "Mondiale Home",
  "{{adresse_boutique}}": "Dakar, Rue 10 × Liberté 6",
  "{{telephone_boutique}}": "+221 33 820 00 00",
  "{{date_aujourd_hui}}": new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
};

// ── Variables de campagne de test ─────────────────────────────────────────────

export const DEFAULT_CAMPAIGN_VARS: CampaignVars = {
  "{{reduction}}": "20%",
  "{{code_promo}}": "PROMO20",
  "{{date_expiration}}": "31 janvier 2026",
  "{{lien}}": "https://mondialhome.sn/offre",
};

// ── Toutes les données de test combinées ──────────────────────────────────────

export const DEFAULT_TEST_DATA: ClientData = {
  ...DEFAULT_CLIENT_DATA,
  ...DEFAULT_CAMPAIGN_VARS,
};

// ── Remplacer les variables dans un texte ─────────────────────────────────────
// Priorité : campaignVars > clientData (les vars campagne écrasent les vars client)

export function renderText(
  text: string,
  clientData?: ClientData,
  campaignVars?: CampaignVars
): string {
  const allData = {
    ...DEFAULT_CLIENT_DATA,
    ...(clientData ?? {}),
    ...DEFAULT_CAMPAIGN_VARS,
    ...(campaignVars ?? {}),
  };

  return Object.entries(allData).reduce(
    (result, [variable, value]) => result.replaceAll(variable, value),
    text
  );
}

// ── Formater un prix en FCFA ──────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

// ── Calculer le pourcentage de réduction ──────────────────────────────────────

export function calcDiscountPercent(originalPrice: number, promoPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
}

// ── Extraire toutes les variables d'un template ───────────────────────────────

export function extractAllTemplateVariables(template: {
  subject?: string | null;
  content?: string | null;
  conclusion?: string | null;
}): string[] {
  const texts = [template.subject, template.content, template.conclusion].filter(
    Boolean
  ) as string[];

  return [...new Set(texts.flatMap(extractVariables))];
}

// ── Construire les données client depuis un objet Client Prisma ───────────────
// Utilisé lors de l'envoi réel (M4 Campagnes)

export function buildClientData(client: {
  firstName: string;
  lastName?: string | null;
  city?: string | null;
  district?: string | null;
  totalSpent?: number | bigint;
  totalOrders?: number;
  lastPurchaseAt?: Date | null;
}): ClientData {
  const totalSpent = client.totalSpent
    ? Number(client.totalSpent).toLocaleString("fr-FR") + " FCFA"
    : "0 FCFA";

  return {
    "{{prenom}}": client.firstName,
    "{{nom}}": client.lastName ?? "",
    "{{prenom_nom}}": `${client.firstName} ${client.lastName ?? ""}`.trim(),
    "{{ville}}": client.city ?? "",
    "{{quartier}}": client.district ?? "",
    "{{montant_total}}": totalSpent,
    "{{nb_commandes}}": String(client.totalOrders ?? 0),
    "{{date_dernier_achat}}": client.lastPurchaseAt
      ? client.lastPurchaseAt.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "",
    "{{nom_boutique}}": "Mondiale Home",
    "{{adresse_boutique}}": "Dakar, Rue 10 × Liberté 6",
    "{{telephone_boutique}}": "+221 33 820 00 00",
    "{{date_aujourd_hui}}": new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}
