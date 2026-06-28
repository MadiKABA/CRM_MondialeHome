// ── Types de campagne et catégories produit ──────────────────────────────────

export const CAMPAIGN_TYPES = [
  "Promotion",
  "Arrivage",
  "Fidélisation",
  "Relance",
  "Événement",
  "Transactionnel",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const PRODUCT_CATEGORIES = [
  "Salon / Canapés",
  "Chambre / Lits",
  "Salle à manger",
  "Décoration",
  "Bureau",
  "Extérieur",
  "Général",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// ── Configuration des headers selon type + catégorie ─────────────────────────

export interface HeaderConfig {
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
}

export const HEADER_CONFIGS: Record<string, HeaderConfig> = {
  // Promotion
  Promotion_default: {
    icon: "🎁",
    title: "OFFRE SPÉCIALE",
    subtitle: "Profitez de nos meilleures offres",
    bgColor: "#8B6914",
    textColor: "#FFFFFF",
  },
  "Promotion_Salon / Canapés": {
    icon: "🎁",
    title: "SOLDES SALON",
    subtitle: "Jusqu'à -{{reduction}} sur nos canapés",
    bgColor: "#8B6914",
    textColor: "#FFFFFF",
  },
  "Promotion_Chambre / Lits": {
    icon: "🎁",
    title: "SOLDES CHAMBRE",
    subtitle: "Jusqu'à -{{reduction}} sur nos lits",
    bgColor: "#8B6914",
    textColor: "#FFFFFF",
  },
  "Promotion_Salle à manger": {
    icon: "🎁",
    title: "SOLDES SALLE À MANGER",
    subtitle: "Jusqu'à -{{reduction}} sur nos tables",
    bgColor: "#8B6914",
    textColor: "#FFFFFF",
  },
  Promotion_Décoration: {
    icon: "🎁",
    title: "SOLDES DÉCORATION",
    subtitle: "Transformez votre intérieur",
    bgColor: "#8B6914",
    textColor: "#FFFFFF",
  },

  // Arrivage
  Arrivage_default: {
    icon: "🚚",
    title: "NOUVELLES ARRIVÉES",
    subtitle: "Découvrez nos dernières nouveautés",
    bgColor: "#4A3728",
    textColor: "#FFFFFF",
  },
  "Arrivage_Salon / Canapés": {
    icon: "🛋️",
    title: "NOUVEAUX CANAPÉS",
    subtitle: "Notre collection salon vient d'arriver",
    bgColor: "#6B5344",
    textColor: "#FFFFFF",
  },
  "Arrivage_Chambre / Lits": {
    icon: "🛏️",
    title: "COLLECTION CHAMBRE",
    subtitle: "Lits, armoires et tables de chevet",
    bgColor: "#2D3748",
    textColor: "#FFFFFF",
  },
  "Arrivage_Salle à manger": {
    icon: "🍽️",
    title: "SALLE À MANGER",
    subtitle: "Tables, chaises et buffets",
    bgColor: "#4A5240",
    textColor: "#FFFFFF",
  },
  Arrivage_Décoration: {
    icon: "💡",
    title: "COLLECTION DÉCORATION",
    subtitle: "Sublimez votre intérieur",
    bgColor: "#8B5E3C",
    textColor: "#FFFFFF",
  },
  Arrivage_Bureau: {
    icon: "💼",
    title: "MOBILIER DE BUREAU",
    subtitle: "Pour un espace de travail idéal",
    bgColor: "#2D3A4A",
    textColor: "#FFFFFF",
  },
  Arrivage_Extérieur: {
    icon: "🌿",
    title: "COLLECTION EXTÉRIEUR",
    subtitle: "Pour un jardin et terrasse de rêve",
    bgColor: "#3D5A3E",
    textColor: "#FFFFFF",
  },

  // Fidélisation
  Fidélisation_default: {
    icon: "⭐",
    title: "OFFRE EXCLUSIVE",
    subtitle: "Réservée à nos meilleurs clients",
    bgColor: "#5C4209",
    textColor: "#F5EFE6",
  },

  // Relance
  Relance_default: {
    icon: "💛",
    title: "VOUS NOUS MANQUEZ",
    subtitle: "Voici une offre pour votre retour",
    bgColor: "#7C5C2E",
    textColor: "#FFFFFF",
  },

  // Événement
  Événement_default: {
    icon: "🎉",
    title: "ÉVÉNEMENT MONDIAL HOME",
    subtitle: "Ne manquez pas cet événement",
    bgColor: "#4A2828",
    textColor: "#FFFFFF",
  },

  // Transactionnel
  Transactionnel_default: {
    icon: "📋",
    title: "INFORMATION",
    subtitle: "Un message important pour vous",
    bgColor: "#2D2D2D",
    textColor: "#FFFFFF",
  },
};

export function getHeaderConfig(
  campaignType: string,
  productCategory?: string | null
): HeaderConfig {
  const key = productCategory
    ? `${campaignType}_${productCategory}`
    : `${campaignType}_default`;

  return (
    HEADER_CONFIGS[key] ??
    HEADER_CONFIGS[`${campaignType}_default`] ??
    HEADER_CONFIGS["Promotion_default"]!
  );
}

// ── Produit dans un template ──────────────────────────────────────────────────

export interface TemplateProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  originalPrice: number | null;
  promoPrice: number | null;
  linkUrl: string | null;
  discountPercent?: number | null;
}

// ── DTO Template complet ──────────────────────────────────────────────────────

export interface TemplateDTO {
  id: string;
  name: string;
  description: string | null;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  // campaignType du DB exposé comme "category" dans le DTO
  category: CampaignType | null;
  productCategory: ProductCategory | null;
  language: string;
  subject: string | null;
  preheader: string | null;
  content: string | null;
  conclusion: string | null;
  products: TemplateProduct[];
  ctaText: string | null;
  ctaUrl: string | null;
  variables: string[];
  isActive: boolean;
  isSystem: boolean;
  usageCount: number;
  lastUsedAt: Date | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Calculé
  headerConfig: HeaderConfig;
}

// ── Résultat paginé ───────────────────────────────────────────────────────────

export interface PaginatedTemplates {
  templates: TemplateDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    emailCount: number;
    active: number;
  };
}

// ── Résultat d'un envoi test ──────────────────────────────────────────────────

export interface TestEmailResult {
  success: boolean;
  error?: string;
  id?: string;
}
