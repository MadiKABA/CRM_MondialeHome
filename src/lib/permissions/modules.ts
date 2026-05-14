// ============================================================
// MODULES — CRM Mondial Home
// Catalogue des modules pour l'affichage dans l'interface admin
// ============================================================

export const MODULES = {
  clients: {
    code: "clients",
    label: "Clients",
    icon: "Users",
    description: "Gestion de la base clients",
  },
  articles: {
    code: "articles",
    label: "Articles",
    icon: "Package",
    description: "Catalogue produits",
  },
  sales: {
    code: "sales",
    label: "Ventes",
    icon: "ShoppingCart",
    description: "Historique des ventes",
  },
  campaigns: {
    code: "campaigns",
    label: "Campagnes",
    icon: "Send",
    description: "Campagnes marketing",
  },
  segments: {
    code: "segments",
    label: "Segments",
    icon: "Target",
    description: "Segmentation clients",
  },
  automations: {
    code: "automations",
    label: "Automatisations",
    icon: "Zap",
    description: "Scénarios automatiques",
  },
  templates: {
    code: "templates",
    label: "Modèles",
    icon: "FileText",
    description: "Modèles de messages",
  },
  analytics: {
    code: "analytics",
    label: "Statistiques",
    icon: "BarChart3",
    description: "Tableaux de bord et rapports",
  },
  admin: {
    code: "admin",
    label: "Administration",
    icon: "Settings",
    description: "Gestion système et accès",
  },
} as const;

export type ModuleCode = keyof typeof MODULES;
export type Module = (typeof MODULES)[ModuleCode];

export const MODULE_ORDER: ModuleCode[] = [
  "clients",
  "articles",
  "sales",
  "campaigns",
  "segments",
  "automations",
  "templates",
  "analytics",
  "admin",
];
