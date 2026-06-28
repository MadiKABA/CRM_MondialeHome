import { extractVariables } from "./variables";

export type TestData = Record<string, string>;

export const DEFAULT_TEST_DATA: TestData = {
  "{{prenom}}": "Mamadou",
  "{{nom}}": "Diop",
  "{{prenom_nom}}": "Mamadou Diop",
  "{{ville}}": "Dakar",
  "{{quartier}}": "Mermoz",
  "{{dernier_article}}": "Canapé 3 places Oslo",
  "{{montant_total}}": "850 000 FCFA",
  "{{nb_commandes}}": "5",
  "{{date_dernier_achat}}": "12 janvier 2026",
  "{{reduction}}": "20%",
  "{{code_promo}}": "PROMO20",
  "{{date_expiration}}": "31 janvier 2026",
  "{{lien}}": "https://mondialhome.sn/offre",
  "{{nom_boutique}}": "Mondial Home",
  "{{adresse_boutique}}": "Dakar, Rue 10 × Liberté 6",
  "{{telephone_boutique}}": "+221 33 820 00 00",
  "{{date_aujourd_hui}}": new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
};

export function renderText(text: string, data: TestData = DEFAULT_TEST_DATA): string {
  return Object.entries(data).reduce(
    (result, [variable, value]) => result.replaceAll(variable, value),
    text
  );
}

export function calcDiscountPercent(originalPrice: number, promoPrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

export function extractAllTemplateVariables(template: {
  subject?: string | null;
  content?: string | null;
  conclusion?: string | null;
  ctaText?: string | null;
}): string[] {
  const texts = [
    template.subject,
    template.content,
    template.conclusion,
    template.ctaText,
  ].filter(Boolean) as string[];

  return [...new Set(texts.flatMap(extractVariables))];
}
