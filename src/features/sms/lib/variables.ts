import {
  extractVariables,
  type VariableDefinition,
} from "@/features/templates/lib/variables";

export type { VariableDefinition };

// Volontairement limité à 3 variables pour garder les SMS courts et pertinents
// — {{produit}} et {{reduction}} sont saisis à la création de la campagne, pas
// dans le template (voir src/lib/sms/personalizer.ts).
export const SMS_VARIABLES: VariableDefinition[] = [
  {
    code: "{{prenom}}",
    label: "Prénom",
    category: "Client",
    example: "Mamadou",
    description: "Prénom du client destinataire",
  },
  {
    code: "{{produit}}",
    label: "Produit",
    category: "Campagne",
    example: "Canapé Oslo",
    description: "Nom du produit — saisi à la création de la campagne",
  },
  {
    code: "{{reduction}}",
    label: "Réduction",
    category: "Campagne",
    example: "20",
    description: "Pourcentage de réduction — saisi à la création de la campagne",
  },
];

export function validateSmsVariables(text: string): {
  valid: boolean;
  unknown: string[];
} {
  const defined = new Set(SMS_VARIABLES.map((v) => v.code));
  const unknown = extractVariables(text).filter((v) => !defined.has(v));
  return { valid: unknown.length === 0, unknown };
}
