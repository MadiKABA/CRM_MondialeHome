// ============================================================
// PERMISSIONS — CRM Mondial Home
// Format : module.action.scope
// 59 permissions réparties sur 9 modules
// ============================================================

export const PERMISSIONS = {
  // ── CLIENTS (8) ─────────────────────────────────────────
  CLIENTS_READ_OWN: "clients.read.own",
  CLIENTS_READ_ALL: "clients.read.all",
  CLIENTS_CREATE_ALL: "clients.create.all",
  CLIENTS_UPDATE_OWN: "clients.update.own",
  CLIENTS_UPDATE_ALL: "clients.update.all",
  CLIENTS_DELETE_ALL: "clients.delete.all",
  CLIENTS_EXPORT_ALL: "clients.export.all",
  CLIENTS_IMPORT_ALL: "clients.import.all",

  // ── ARTICLES (6) ────────────────────────────────────────
  ARTICLES_READ_ALL: "articles.read.all",
  ARTICLES_CREATE_ALL: "articles.create.all",
  ARTICLES_UPDATE_ALL: "articles.update.all",
  ARTICLES_DELETE_ALL: "articles.delete.all",
  ARTICLES_EXPORT_ALL: "articles.export.all",
  ARTICLES_IMPORT_ALL: "articles.import.all",

  // ── VENTES (8) ──────────────────────────────────────────
  SALES_READ_OWN: "sales.read.own",
  SALES_READ_ALL: "sales.read.all",
  SALES_CREATE_ALL: "sales.create.all",
  SALES_UPDATE_ALL: "sales.update.all",
  SALES_CANCEL_ALL: "sales.cancel.all",
  SALES_REFUND_ALL: "sales.refund.all",
  SALES_EXPORT_ALL: "sales.export.all",
  SALES_DELETE_ALL: "sales.delete.all",

  // ── CAMPAGNES (6) ───────────────────────────────────────
  CAMPAIGNS_READ_ALL: "campaigns.read.all",
  CAMPAIGNS_CREATE_ALL: "campaigns.create.all",
  CAMPAIGNS_UPDATE_ALL: "campaigns.update.all",
  CAMPAIGNS_DELETE_ALL: "campaigns.delete.all",
  CAMPAIGNS_SEND_ALL: "campaigns.send.all",
  CAMPAIGNS_VALIDATE_ALL: "campaigns.validate.all",

  // ── SEGMENTS (5) ────────────────────────────────────────
  SEGMENTS_READ_ALL: "segments.read.all",
  SEGMENTS_CREATE_ALL: "segments.create.all",
  SEGMENTS_UPDATE_ALL: "segments.update.all",
  SEGMENTS_DELETE_ALL: "segments.delete.all",
  SEGMENTS_COMPUTE_ALL: "segments.compute.all",

  // ── AUTOMATISATIONS (5) ─────────────────────────────────
  AUTOMATIONS_READ_ALL: "automations.read.all",
  AUTOMATIONS_CREATE_ALL: "automations.create.all",
  AUTOMATIONS_UPDATE_ALL: "automations.update.all",
  AUTOMATIONS_DELETE_ALL: "automations.delete.all",
  AUTOMATIONS_ACTIVATE_ALL: "automations.activate.all",

  // ── TEMPLATES (5) ───────────────────────────────────────
  TEMPLATES_READ_ALL: "templates.read.all",
  TEMPLATES_CREATE_ALL: "templates.create.all",
  TEMPLATES_UPDATE_ALL: "templates.update.all",
  TEMPLATES_DELETE_ALL: "templates.delete.all",
  TEMPLATES_DUPLICATE_ALL: "templates.duplicate.all",

  // ── ANALYTICS (3) ───────────────────────────────────────
  ANALYTICS_VIEW_BASIC: "analytics.view.basic",
  ANALYTICS_VIEW_ADVANCED: "analytics.view.advanced",
  ANALYTICS_EXPORT_ALL: "analytics.export.all",

  // ── ADMIN (13) ──────────────────────────────────────────
  ADMIN_VIEW_ALL: "admin.view.all",
  ADMIN_USERS_READ_ALL: "admin.users.read.all",
  ADMIN_USERS_CREATE_ALL: "admin.users.create.all",
  ADMIN_USERS_UPDATE_ALL: "admin.users.update.all",
  ADMIN_USERS_DELETE_ALL: "admin.users.delete.all",
  ADMIN_USERS_DEACTIVATE_ALL: "admin.users.deactivate.all",
  ADMIN_ROLES_READ_ALL: "admin.roles.read.all",
  ADMIN_ROLES_MANAGE_ALL: "admin.roles.manage.all",
  ADMIN_PERMISSIONS_MANAGE_ALL: "admin.permissions.manage.all",
  ADMIN_AUDIT_READ_ALL: "admin.audit.read.all",
  ADMIN_SESSIONS_MANAGE_ALL: "admin.sessions.manage.all",
  ADMIN_SETTINGS_READ_ALL: "admin.settings.read.all",
  ADMIN_SETTINGS_UPDATE_ALL: "admin.settings.update.all",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Toutes les permissions en tableau (utile pour le Super Admin)
export const ALL_PERMISSION_CODES = Object.values(PERMISSIONS) as PermissionCode[];

// Permissions selon leur module (pour filtrer rapidement)
export const PERMISSIONS_BY_MODULE: Record<string, PermissionCode[]> = {
  clients: [
    PERMISSIONS.CLIENTS_READ_OWN,
    PERMISSIONS.CLIENTS_READ_ALL,
    PERMISSIONS.CLIENTS_CREATE_ALL,
    PERMISSIONS.CLIENTS_UPDATE_OWN,
    PERMISSIONS.CLIENTS_UPDATE_ALL,
    PERMISSIONS.CLIENTS_DELETE_ALL,
    PERMISSIONS.CLIENTS_EXPORT_ALL,
    PERMISSIONS.CLIENTS_IMPORT_ALL,
  ],
  articles: [
    PERMISSIONS.ARTICLES_READ_ALL,
    PERMISSIONS.ARTICLES_CREATE_ALL,
    PERMISSIONS.ARTICLES_UPDATE_ALL,
    PERMISSIONS.ARTICLES_DELETE_ALL,
    PERMISSIONS.ARTICLES_EXPORT_ALL,
    PERMISSIONS.ARTICLES_IMPORT_ALL,
  ],
  sales: [
    PERMISSIONS.SALES_READ_OWN,
    PERMISSIONS.SALES_READ_ALL,
    PERMISSIONS.SALES_CREATE_ALL,
    PERMISSIONS.SALES_UPDATE_ALL,
    PERMISSIONS.SALES_CANCEL_ALL,
    PERMISSIONS.SALES_REFUND_ALL,
    PERMISSIONS.SALES_EXPORT_ALL,
    PERMISSIONS.SALES_DELETE_ALL,
  ],
  campaigns: [
    PERMISSIONS.CAMPAIGNS_READ_ALL,
    PERMISSIONS.CAMPAIGNS_CREATE_ALL,
    PERMISSIONS.CAMPAIGNS_UPDATE_ALL,
    PERMISSIONS.CAMPAIGNS_DELETE_ALL,
    PERMISSIONS.CAMPAIGNS_SEND_ALL,
    PERMISSIONS.CAMPAIGNS_VALIDATE_ALL,
  ],
  segments: [
    PERMISSIONS.SEGMENTS_READ_ALL,
    PERMISSIONS.SEGMENTS_CREATE_ALL,
    PERMISSIONS.SEGMENTS_UPDATE_ALL,
    PERMISSIONS.SEGMENTS_DELETE_ALL,
    PERMISSIONS.SEGMENTS_COMPUTE_ALL,
  ],
  automations: [
    PERMISSIONS.AUTOMATIONS_READ_ALL,
    PERMISSIONS.AUTOMATIONS_CREATE_ALL,
    PERMISSIONS.AUTOMATIONS_UPDATE_ALL,
    PERMISSIONS.AUTOMATIONS_DELETE_ALL,
    PERMISSIONS.AUTOMATIONS_ACTIVATE_ALL,
  ],
  templates: [
    PERMISSIONS.TEMPLATES_READ_ALL,
    PERMISSIONS.TEMPLATES_CREATE_ALL,
    PERMISSIONS.TEMPLATES_UPDATE_ALL,
    PERMISSIONS.TEMPLATES_DELETE_ALL,
    PERMISSIONS.TEMPLATES_DUPLICATE_ALL,
  ],
  analytics: [
    PERMISSIONS.ANALYTICS_VIEW_BASIC,
    PERMISSIONS.ANALYTICS_VIEW_ADVANCED,
    PERMISSIONS.ANALYTICS_EXPORT_ALL,
  ],
  admin: [
    PERMISSIONS.ADMIN_VIEW_ALL,
    PERMISSIONS.ADMIN_USERS_READ_ALL,
    PERMISSIONS.ADMIN_USERS_CREATE_ALL,
    PERMISSIONS.ADMIN_USERS_UPDATE_ALL,
    PERMISSIONS.ADMIN_USERS_DELETE_ALL,
    PERMISSIONS.ADMIN_USERS_DEACTIVATE_ALL,
    PERMISSIONS.ADMIN_ROLES_READ_ALL,
    PERMISSIONS.ADMIN_ROLES_MANAGE_ALL,
    PERMISSIONS.ADMIN_PERMISSIONS_MANAGE_ALL,
    PERMISSIONS.ADMIN_AUDIT_READ_ALL,
    PERMISSIONS.ADMIN_SESSIONS_MANAGE_ALL,
    PERMISSIONS.ADMIN_SETTINGS_READ_ALL,
    PERMISSIONS.ADMIN_SETTINGS_UPDATE_ALL,
  ],
};

// Permissions considérées comme sensibles (confirmation requise en UI)
export const DANGEROUS_PERMISSIONS = new Set<PermissionCode>([
  PERMISSIONS.CLIENTS_DELETE_ALL,
  PERMISSIONS.ARTICLES_DELETE_ALL,
  PERMISSIONS.SALES_CANCEL_ALL,
  PERMISSIONS.SALES_REFUND_ALL,
  PERMISSIONS.SALES_DELETE_ALL,
  PERMISSIONS.CAMPAIGNS_DELETE_ALL,
  PERMISSIONS.CAMPAIGNS_SEND_ALL,
  PERMISSIONS.SEGMENTS_DELETE_ALL,
  PERMISSIONS.AUTOMATIONS_DELETE_ALL,
  PERMISSIONS.AUTOMATIONS_ACTIVATE_ALL,
  PERMISSIONS.TEMPLATES_DELETE_ALL,
  PERMISSIONS.ADMIN_USERS_DELETE_ALL,
  PERMISSIONS.ADMIN_USERS_UPDATE_ALL,
  PERMISSIONS.ADMIN_ROLES_MANAGE_ALL,
  PERMISSIONS.ADMIN_PERMISSIONS_MANAGE_ALL,
  PERMISSIONS.ADMIN_SETTINGS_UPDATE_ALL,
]);

// Permission réservée Super Admin uniquement
export const SUPER_ADMIN_ONLY_PERMISSIONS = new Set<PermissionCode>([
  PERMISSIONS.ADMIN_PERMISSIONS_MANAGE_ALL,
]);
