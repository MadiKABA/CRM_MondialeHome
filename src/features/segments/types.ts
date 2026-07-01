// ── DTO segment / groupe ─────────────────────────────────────────────────────

export interface SegmentDTO {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  type: "STATIC" | "DYNAMIC";
  isSystem: boolean;
  isActive: boolean;
  autoRefresh: boolean;
  memberCount: number;
  criteria: CriteriaGroupDTO | null;
  lastRefreshedAt: Date | null;
  createdAt: Date;
  createdByName: string | null;
}

export interface CriteriaGroupDTO {
  operator: "AND" | "OR";
  criteria: CriterionDTO[];
}

export interface CriterionDTO {
  field: string;
  operator: string;
  value: string | number | boolean | string[] | number[];
  value2?: string | number | null;
  // Critères produit / catégorie
  articleId?: string | null;
  articleName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  periodDays?: number | null;
}

// ── DTO liste ─────────────────────────────────────────────────────────────────

export interface SegmentListDTO {
  segments: SegmentDTO[];
  groups: SegmentDTO[];
  stats: {
    totalSegments: number;
    totalGroups: number;
    totalClients: number;
  };
}

// ── DTO membres ───────────────────────────────────────────────────────────────

export interface SegmentMemberDTO {
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  clientCity: string | null;
  isVip: boolean;
  totalSpent: number;
  addedAt: Date;
}

// ── Résultat prévisualisation ─────────────────────────────────────────────────

export interface SegmentPreviewResult {
  count: number;
  sample: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    city: string | null;
  }>;
}

// ── Définitions des critères (pour l'UI) ─────────────────────────────────────

export interface OperatorDefinition {
  value: string;
  label: string;
  needsValue2?: boolean;
}

export interface CriterionDefinition {
  field: string;
  label: string;
  category: string;
  type:
    | "number"
    | "string"
    | "date"
    | "boolean"
    | "select"
    | "article"
    | "category"
    | "article_period"
    | "category_period";
  operators: OperatorDefinition[];
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// ── Catalogue des critères disponibles ───────────────────────────────────────

export const CRITERIA_DEFINITIONS: CriterionDefinition[] = [
  // Achats
  {
    field: "totalSpent",
    label: "Montant total dépensé",
    category: "Achats",
    type: "number",
    unit: "FCFA",
    placeholder: "Ex : 500000",
    operators: [
      { value: "gte", label: "supérieur ou égal à" },
      { value: "lte", label: "inférieur ou égal à" },
      { value: "gt", label: "supérieur à" },
      { value: "lt", label: "inférieur à" },
      { value: "between", label: "entre ... et ...", needsValue2: true },
    ],
  },
  {
    field: "totalOrders",
    label: "Nombre de commandes",
    category: "Achats",
    type: "number",
    unit: "commandes",
    placeholder: "Ex : 3",
    operators: [
      { value: "gte", label: "supérieur ou égal à" },
      { value: "lte", label: "inférieur ou égal à" },
      { value: "eq", label: "exactement" },
      { value: "gt", label: "plus de" },
      { value: "lt", label: "moins de" },
    ],
  },
  {
    field: "averageBasket",
    label: "Panier moyen",
    category: "Achats",
    type: "number",
    unit: "FCFA",
    placeholder: "Ex : 150000",
    operators: [
      { value: "gte", label: "supérieur ou égal à" },
      { value: "lte", label: "inférieur ou égal à" },
      { value: "between", label: "entre ... et ...", needsValue2: true },
    ],
  },
  {
    field: "lastPurchaseAt",
    label: "Dernier achat",
    category: "Achats",
    type: "date",
    operators: [
      { value: "last_days", label: "dans les X derniers jours" },
      { value: "after", label: "après le" },
      { value: "before", label: "avant le" },
    ],
  },
  {
    field: "firstPurchaseAt",
    label: "Premier achat",
    category: "Achats",
    type: "date",
    operators: [
      { value: "after", label: "après le" },
      { value: "before", label: "avant le" },
    ],
  },
  // Localisation
  {
    field: "city",
    label: "Ville",
    category: "Localisation",
    type: "string",
    placeholder: "Ex : Dakar",
    operators: [
      { value: "eq", label: "est" },
      { value: "contains", label: "contient" },
    ],
  },
  {
    field: "district",
    label: "Quartier",
    category: "Localisation",
    type: "string",
    placeholder: "Ex : Mermoz",
    operators: [
      { value: "eq", label: "est" },
      { value: "contains", label: "contient" },
    ],
  },
  // Profil
  {
    field: "isVip",
    label: "Client VIP",
    category: "Profil",
    type: "boolean",
    operators: [
      { value: "is_true", label: "est VIP" },
      { value: "is_false", label: "n'est pas VIP" },
    ],
  },
  {
    field: "status",
    label: "Statut",
    category: "Profil",
    type: "select",
    operators: [{ value: "eq", label: "est" }],
    options: [
      { value: "ACTIVE", label: "Actif" },
      { value: "INACTIVE", label: "Inactif" },
      { value: "UNSUBSCRIBED", label: "Désabonné" },
      { value: "BLACKLISTED", label: "Blacklisté" },
    ],
  },
  {
    field: "source",
    label: "Source d'acquisition",
    category: "Profil",
    type: "select",
    operators: [{ value: "eq", label: "est" }],
    options: [
      { value: "walk-in", label: "Passage en boutique" },
      { value: "recommandation", label: "Recommandation" },
      { value: "campagne SMS", label: "Campagne SMS" },
      { value: "réseaux sociaux", label: "Réseaux sociaux" },
      { value: "foire", label: "Foire" },
    ],
  },
  {
    field: "createdAt",
    label: "Date d'inscription",
    category: "Profil",
    type: "date",
    operators: [
      { value: "last_days", label: "dans les X derniers jours" },
      { value: "after", label: "après le" },
      { value: "before", label: "avant le" },
    ],
  },
  // Consentements
  {
    field: "smsConsent",
    label: "Consentement SMS",
    category: "Consentements",
    type: "boolean",
    operators: [
      { value: "is_true", label: "a donné son accord SMS" },
      { value: "is_false", label: "a refusé les SMS" },
    ],
  },
  {
    field: "whatsappConsent",
    label: "Consentement WhatsApp",
    category: "Consentements",
    type: "boolean",
    operators: [
      { value: "is_true", label: "a donné son accord WhatsApp" },
      { value: "is_false", label: "a refusé WhatsApp" },
    ],
  },
  {
    field: "emailConsent",
    label: "Consentement Email",
    category: "Consentements",
    type: "boolean",
    operators: [
      { value: "is_true", label: "a donné son accord Email" },
      { value: "is_false", label: "a refusé les emails" },
    ],
  },
  // RFM
  {
    field: "rfmScore",
    label: "Profil RFM",
    category: "RFM",
    type: "select",
    operators: [{ value: "eq", label: "est" }],
    options: [
      { value: "champions", label: "Champions" },
      { value: "loyal", label: "Clients fidèles" },
      { value: "at_risk", label: "À risque" },
      { value: "lost", label: "Perdus" },
      { value: "new_customers", label: "Nouveaux" },
      { value: "potential", label: "Potentiels" },
    ],
  },
  // Produits
  {
    field: "hasOrderedArticle",
    label: "A acheté l'article",
    category: "Produits",
    type: "article",
    operators: [{ value: "eq", label: "a acheté" }],
  },
  {
    field: "hasNotOrderedArticle",
    label: "N'a pas acheté l'article",
    category: "Produits",
    type: "article",
    operators: [{ value: "eq", label: "n'a pas acheté" }],
  },
  {
    field: "hasOrderedCategory",
    label: "A acheté dans la catégorie",
    category: "Produits",
    type: "category",
    operators: [{ value: "eq", label: "a acheté" }],
  },
  {
    field: "hasNotOrderedCategory",
    label: "N'a pas acheté dans la catégorie",
    category: "Produits",
    type: "category",
    operators: [{ value: "eq", label: "n'a pas acheté" }],
  },
  {
    field: "hasOrderedArticleInPeriod",
    label: "A acheté l'article (période)",
    category: "Produits",
    type: "article_period",
    operators: [{ value: "eq", label: "a acheté" }],
  },
  {
    field: "hasOrderedCategoryInPeriod",
    label: "A acheté dans la catégorie (période)",
    category: "Produits",
    type: "category_period",
    operators: [{ value: "eq", label: "a acheté" }],
  },
];
