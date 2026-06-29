// ── Profils RFM ───────────────────────────────────────────────────────────────

export const RFM_PROFILES = [
  "champions",
  "loyal",
  "potential",
  "new_customers",
  "at_risk",
  "lost",
  "others",
] as const;

export type RFMProfile = (typeof RFM_PROFILES)[number];

// ── Configuration de chaque profil ───────────────────────────────────────────

export interface RFMProfileConfig {
  key: RFMProfile;
  label: string;
  description: string;
  icon: string;
  color: string;
  textColor: string;
  minR?: number;
  minF?: number;
  minM?: number;
}

export const RFM_PROFILE_CONFIGS: Record<RFMProfile, RFMProfileConfig> = {
  champions: {
    key: "champions",
    label: "Champions",
    description: "Acheteurs récents, fréquents et gros dépensiers",
    icon: "🏆",
    color: "bg-amber-50",
    textColor: "text-amber-700",
    minR: 4,
    minF: 4,
    minM: 4,
  },
  loyal: {
    key: "loyal",
    label: "Fidèles",
    description: "Achètent régulièrement, bon panier moyen",
    icon: "⭐",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    minR: 3,
    minF: 3,
    minM: 3,
  },
  potential: {
    key: "potential",
    label: "Potentiels",
    description: "Clients récents avec potentiel de fidélisation",
    icon: "📈",
    color: "bg-purple-50",
    textColor: "text-purple-700",
    minR: 3,
    minF: 1,
    minM: 2,
  },
  new_customers: {
    key: "new_customers",
    label: "Nouveaux",
    description: "Premier achat récent",
    icon: "🆕",
    color: "bg-green-50",
    textColor: "text-green-700",
    minR: 4,
    minF: 1,
    minM: 1,
  },
  at_risk: {
    key: "at_risk",
    label: "À risque",
    description: "Anciens bons clients qui n'achètent plus",
    icon: "⚠️",
    color: "bg-orange-50",
    textColor: "text-orange-700",
    minR: 1,
    minF: 3,
    minM: 3,
  },
  lost: {
    key: "lost",
    label: "Perdus",
    description: "Inactifs depuis longtemps, faible valeur",
    icon: "💤",
    color: "bg-gray-100",
    textColor: "text-gray-500",
    minR: 1,
    minF: 1,
    minM: 1,
  },
  others: {
    key: "others",
    label: "Autres",
    description: "Profil non déterminé",
    icon: "❓",
    color: "bg-slate-50",
    textColor: "text-slate-500",
  },
};

// ── Seuils de calcul des scores 1-5 ──────────────────────────────────────────

// Recency : jours depuis le dernier achat — plus récent = score plus élevé
export const RECENCY_THRESHOLDS = {
  5: 30,
  4: 60,
  3: 90,
  2: 180,
  1: Infinity,
} as const;

// Frequency : nombre de commandes sur 12 mois
export const FREQUENCY_THRESHOLDS = {
  5: 10,
  4: 6,
  3: 3,
  2: 2,
  1: 1,
} as const;

// Monetary : total dépensé sur 12 mois (en FCFA)
export const MONETARY_THRESHOLDS = {
  5: 1_000_000,
  4: 500_000,
  3: 200_000,
  2: 50_000,
  1: 0,
} as const;

// ── Résultat d'un calcul RFM ──────────────────────────────────────────────────

export interface RFMResult {
  clientId: string;
  r: number;
  f: number;
  m: number;
  profile: RFMProfile;
  daysSinceLastPurchase: number | null;
  ordersLast12Months: number;
  revenueLast12Months: number;
}

// ── Résultat d'un calcul batch ────────────────────────────────────────────────

export interface RFMBatchResult {
  processed: number;
  updated: number;
  errors: number;
  duration: number;
  breakdown: Record<RFMProfile, number>;
}
