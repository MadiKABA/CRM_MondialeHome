export interface VariableDefinition {
  code: string;
  label: string;
  category: string;
  example: string;
  description: string;
}

export const EMAIL_VARIABLES: VariableDefinition[] = [
  // ── Client ───────────────────────────────────────────────────────────────
  {
    code: "{{prenom}}",
    label: "Prénom",
    category: "Client",
    example: "Mamadou",
    description: "Prénom du client destinataire",
  },
  {
    code: "{{nom}}",
    label: "Nom",
    category: "Client",
    example: "Diop",
    description: "Nom de famille du client",
  },
  {
    code: "{{prenom_nom}}",
    label: "Prénom et nom",
    category: "Client",
    example: "Mamadou Diop",
    description: "Prénom et nom complets",
  },
  {
    code: "{{ville}}",
    label: "Ville",
    category: "Client",
    example: "Dakar",
    description: "Ville du client",
  },
  // ── Achats ───────────────────────────────────────────────────────────────
  {
    code: "{{dernier_article}}",
    label: "Dernier article acheté",
    category: "Achats",
    example: "Canapé 3 places Oslo",
    description: "Nom du dernier article acheté",
  },
  {
    code: "{{montant_total}}",
    label: "Total dépensé",
    category: "Achats",
    example: "850 000 FCFA",
    description: "Total cumulé des achats du client",
  },
  {
    code: "{{nb_commandes}}",
    label: "Nombre de commandes",
    category: "Achats",
    example: "5",
    description: "Nombre total de commandes",
  },
  {
    code: "{{date_dernier_achat}}",
    label: "Date du dernier achat",
    category: "Achats",
    example: "12 janvier 2026",
    description: "Date du dernier achat effectué",
  },
  // ── Campagne ─────────────────────────────────────────────────────────────
  {
    code: "{{reduction}}",
    label: "Pourcentage de réduction",
    category: "Campagne",
    example: "20%",
    description: "Taux de réduction de la promotion",
  },
  {
    code: "{{code_promo}}",
    label: "Code promotionnel",
    category: "Campagne",
    example: "PROMO20",
    description: "Code à utiliser en caisse",
  },
  {
    code: "{{date_expiration}}",
    label: "Date d'expiration",
    category: "Campagne",
    example: "31 janvier 2026",
    description: "Date limite de l'offre",
  },
  {
    code: "{{lien}}",
    label: "Lien de l'offre",
    category: "Campagne",
    example: "https://mondialhome.sn/offre",
    description: "Lien vers la page de l'offre",
  },
  // ── Boutique ──────────────────────────────────────────────────────────────
  {
    code: "{{nom_boutique}}",
    label: "Nom de la boutique",
    category: "Boutique",
    example: "Mondial Home",
    description: "Nom de l'enseigne",
  },
  {
    code: "{{adresse_boutique}}",
    label: "Adresse boutique",
    category: "Boutique",
    example: "Dakar, Rue 10 × Liberté 6",
    description: "Adresse physique de la boutique",
  },
  {
    code: "{{telephone_boutique}}",
    label: "Téléphone boutique",
    category: "Boutique",
    example: "+221 33 820 00 00",
    description: "Numéro de contact boutique",
  },
  {
    code: "{{date_aujourd_hui}}",
    label: "Date d'aujourd'hui",
    category: "Boutique",
    example: "15 janvier 2026",
    description: "Date du jour d'envoi",
  },
];

export function groupVariablesByCategory(
  variables: VariableDefinition[]
): Record<string, VariableDefinition[]> {
  return variables.reduce(
    (acc, v) => {
      if (!acc[v.category]) acc[v.category] = [];
      acc[v.category]!.push(v);
      return acc;
    },
    {} as Record<string, VariableDefinition[]>
  );
}

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[a-z_]+\}\}/g) ?? [];
  return [...new Set(matches)];
}

export function validateTemplateVariables(texts: (string | null | undefined)[]): {
  valid: boolean;
  unknown: string[];
} {
  const defined = new Set(EMAIL_VARIABLES.map((v) => v.code));
  const used = texts.filter(Boolean).flatMap((t) => extractVariables(t!));
  const unknown = [...new Set(used)].filter((v) => !defined.has(v));
  return { valid: unknown.length === 0, unknown };
}
