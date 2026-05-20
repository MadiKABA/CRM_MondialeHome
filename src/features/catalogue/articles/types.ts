export type ArticleStatusType =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "COMING_SOON"
  | "ARCHIVED"
  | "DISCONTINUED";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatusType, string> = {
  AVAILABLE: "Disponible",
  OUT_OF_STOCK: "Rupture de stock",
  COMING_SOON: "Bientôt disponible",
  ARCHIVED: "Archivé",
  DISCONTINUED: "Arrêté",
};

export const ARTICLE_STATUS_COLORS: Record<
  ArticleStatusType,
  { bg: string; text: string }
> = {
  AVAILABLE: { bg: "bg-gold-light/50", text: "text-gold-darker" },
  OUT_OF_STOCK: { bg: "bg-red-50", text: "text-red-700" },
  COMING_SOON: { bg: "bg-amber-50", text: "text-amber-700" },
  ARCHIVED: { bg: "bg-cream", text: "text-muted-foreground" },
  DISCONTINUED: { bg: "bg-cream", text: "text-muted-foreground" },
};

export type StockLevel = "ok" | "low" | "empty";

// ── DTO liste ──────────────────────────────────────────────────────────────

export interface ArticleListItemDTO {
  id: string;
  reference: string;
  barcode: string | null;
  name: string;
  shortDescription: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryPath: string | null;
  brand: string | null;
  mainImage: string | null;
  price: number;
  promoPrice: number | null;
  promoStartDate: Date | null;
  promoEndDate: Date | null;
  currency: string;
  stock: number;
  stockAlert: number;
  status: ArticleStatusType;
  isNew: boolean;
  arrivalDate: Date | null;
  tags: string[];
  isOnPromo: boolean;
  stockLevel: StockLevel;
  createdAt: Date;
  updatedAt: Date;
}

// ── DTO détail ─────────────────────────────────────────────────────────────

export interface ArticleDetailDTO extends ArticleListItemDTO {
  description: string | null;
  supplier: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  attributes: Record<string, string>;
  images: string[];
  videoUrl: string | null;
  metadata: Record<string, unknown>;
}

// DTO séparé pour le prix de revient — requiert articles.view_cost
export interface ArticleCostDTO {
  id: string;
  costPrice: number | null;
  margin: number | null;
  marginAmount: number | null;
}

// ── Résultat paginé ────────────────────────────────────────────────────────

export interface PaginatedArticles {
  articles: ArticleListItemDTO[];
  total: number;
  page: number;
  totalPages: number;
  stats: ArticleStats;
}

export interface ArticleStats {
  total: number;
  available: number;
  outOfStock: number;
  lowStock: number;
  newArrivals: number;
  inPromo: number;
}

// ── Actions result ─────────────────────────────────────────────────────────

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
