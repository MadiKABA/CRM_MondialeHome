import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const db = new PrismaClient();

// ============================================================================
// HELPERS
// ============================================================================

// ============================================================================
// PERMISSIONS — 59 permissions sur 9 modules
// ============================================================================

const PERMISSION_DEFS = [
  // ── CLIENTS (8) ────────────────────────────────────────────────────────────
  {
    code: "clients.read.own",
    module: "clients",
    action: "read",
    scope: "own",
    description: "Voir ses propres clients",
    category: "Clients",
  },
  {
    code: "clients.read.all",
    module: "clients",
    action: "read",
    scope: "all",
    description: "Voir tous les clients",
    category: "Clients",
  },
  {
    code: "clients.create.all",
    module: "clients",
    action: "create",
    scope: "all",
    description: "Ajouter des clients",
    category: "Clients",
  },
  {
    code: "clients.update.own",
    module: "clients",
    action: "update",
    scope: "own",
    description: "Modifier ses propres clients",
    category: "Clients",
  },
  {
    code: "clients.update.all",
    module: "clients",
    action: "update",
    scope: "all",
    description: "Modifier tous les clients",
    category: "Clients",
  },
  {
    code: "clients.delete.all",
    module: "clients",
    action: "delete",
    scope: "all",
    description: "Supprimer des clients",
    category: "Clients",
  },
  {
    code: "clients.export.all",
    module: "clients",
    action: "export",
    scope: "all",
    description: "Exporter la liste clients",
    category: "Clients",
  },
  {
    code: "clients.import.all",
    module: "clients",
    action: "import",
    scope: "all",
    description: "Importer des clients",
    category: "Clients",
  },

  // ── ARTICLES (6) ───────────────────────────────────────────────────────────
  {
    code: "articles.read.all",
    module: "articles",
    action: "read",
    scope: "all",
    description: "Voir les articles",
    category: "Articles",
  },
  {
    code: "articles.create.all",
    module: "articles",
    action: "create",
    scope: "all",
    description: "Créer des articles",
    category: "Articles",
  },
  {
    code: "articles.update.all",
    module: "articles",
    action: "update",
    scope: "all",
    description: "Modifier des articles",
    category: "Articles",
  },
  {
    code: "articles.delete.all",
    module: "articles",
    action: "delete",
    scope: "all",
    description: "Supprimer des articles",
    category: "Articles",
  },
  {
    code: "articles.export.all",
    module: "articles",
    action: "export",
    scope: "all",
    description: "Exporter le catalogue",
    category: "Articles",
  },
  {
    code: "articles.import.all",
    module: "articles",
    action: "import",
    scope: "all",
    description: "Importer des articles",
    category: "Articles",
  },
  {
    code: "articles.manage_categories",
    module: "articles",
    action: "manage_categories",
    scope: "all",
    description: "Gérer les catégories du catalogue",
    category: "Articles",
  },

  // ── VENTES (8) ─────────────────────────────────────────────────────────────
  {
    code: "sales.read.own",
    module: "sales",
    action: "read",
    scope: "own",
    description: "Voir ses propres ventes",
    category: "Ventes",
  },
  {
    code: "sales.read.all",
    module: "sales",
    action: "read",
    scope: "all",
    description: "Voir toutes les ventes",
    category: "Ventes",
  },
  {
    code: "sales.create.all",
    module: "sales",
    action: "create",
    scope: "all",
    description: "Enregistrer une vente",
    category: "Ventes",
  },
  {
    code: "sales.update.all",
    module: "sales",
    action: "update",
    scope: "all",
    description: "Modifier une vente",
    category: "Ventes",
  },
  {
    code: "sales.cancel.all",
    module: "sales",
    action: "cancel",
    scope: "all",
    description: "Annuler une vente",
    category: "Ventes",
  },
  {
    code: "sales.refund.all",
    module: "sales",
    action: "refund",
    scope: "all",
    description: "Effectuer un remboursement",
    category: "Ventes",
  },
  {
    code: "sales.export.all",
    module: "sales",
    action: "export",
    scope: "all",
    description: "Exporter les ventes",
    category: "Ventes",
  },
  {
    code: "sales.delete.all",
    module: "sales",
    action: "delete",
    scope: "all",
    description: "Supprimer des ventes",
    category: "Ventes",
  },

  // ── CAMPAGNES (6) ──────────────────────────────────────────────────────────
  {
    code: "campaigns.read.all",
    module: "campaigns",
    action: "read",
    scope: "all",
    description: "Voir les campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.create.all",
    module: "campaigns",
    action: "create",
    scope: "all",
    description: "Créer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.update.all",
    module: "campaigns",
    action: "update",
    scope: "all",
    description: "Modifier des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.delete.all",
    module: "campaigns",
    action: "delete",
    scope: "all",
    description: "Supprimer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.send.all",
    module: "campaigns",
    action: "send",
    scope: "all",
    description: "Envoyer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.validate.all",
    module: "campaigns",
    action: "validate",
    scope: "all",
    description: "Valider des campagnes",
    category: "Campagnes",
  },

  // ── SEGMENTS (5) ───────────────────────────────────────────────────────────
  {
    code: "segments.read.all",
    module: "segments",
    action: "read",
    scope: "all",
    description: "Voir les segments",
    category: "Segments",
  },
  {
    code: "segments.create.all",
    module: "segments",
    action: "create",
    scope: "all",
    description: "Créer des segments",
    category: "Segments",
  },
  {
    code: "segments.update.all",
    module: "segments",
    action: "update",
    scope: "all",
    description: "Modifier des segments",
    category: "Segments",
  },
  {
    code: "segments.delete.all",
    module: "segments",
    action: "delete",
    scope: "all",
    description: "Supprimer des segments",
    category: "Segments",
  },
  {
    code: "segments.compute.all",
    module: "segments",
    action: "compute",
    scope: "all",
    description: "Recalculer des segments",
    category: "Segments",
  },

  // ── AUTOMATISATIONS (5) ────────────────────────────────────────────────────
  {
    code: "automations.read.all",
    module: "automations",
    action: "read",
    scope: "all",
    description: "Voir les automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.create.all",
    module: "automations",
    action: "create",
    scope: "all",
    description: "Créer des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.update.all",
    module: "automations",
    action: "update",
    scope: "all",
    description: "Modifier des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.delete.all",
    module: "automations",
    action: "delete",
    scope: "all",
    description: "Supprimer des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.activate.all",
    module: "automations",
    action: "activate",
    scope: "all",
    description: "Activer des automatisations",
    category: "Automatisations",
  },

  // ── TEMPLATES (5) ──────────────────────────────────────────────────────────
  {
    code: "templates.read.all",
    module: "templates",
    action: "read",
    scope: "all",
    description: "Voir les modèles",
    category: "Modèles",
  },
  {
    code: "templates.create.all",
    module: "templates",
    action: "create",
    scope: "all",
    description: "Créer des modèles",
    category: "Modèles",
  },
  {
    code: "templates.update.all",
    module: "templates",
    action: "update",
    scope: "all",
    description: "Modifier des modèles",
    category: "Modèles",
  },
  {
    code: "templates.delete.all",
    module: "templates",
    action: "delete",
    scope: "all",
    description: "Supprimer des modèles",
    category: "Modèles",
  },
  {
    code: "templates.duplicate.all",
    module: "templates",
    action: "duplicate",
    scope: "all",
    description: "Dupliquer des modèles",
    category: "Modèles",
  },

  // ── ANALYTICS (3) ──────────────────────────────────────────────────────────
  {
    code: "analytics.view.basic",
    module: "analytics",
    action: "view",
    scope: "basic",
    description: "Voir les statistiques de base",
    category: "Statistiques",
  },
  {
    code: "analytics.view.advanced",
    module: "analytics",
    action: "view",
    scope: "advanced",
    description: "Voir les statistiques avancées",
    category: "Statistiques",
  },
  {
    code: "analytics.export.all",
    module: "analytics",
    action: "export",
    scope: "all",
    description: "Exporter les rapports",
    category: "Statistiques",
  },

  // ── ADMIN (13) ─────────────────────────────────────────────────────────────
  {
    code: "admin.view.all",
    module: "admin",
    action: "view",
    scope: "all",
    description: "Accéder au panneau d'administration",
    category: "Administration",
  },
  {
    code: "admin.users.read.all",
    module: "admin",
    action: "users.read",
    scope: "all",
    description: "Voir tous les utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.create.all",
    module: "admin",
    action: "users.create",
    scope: "all",
    description: "Créer et inviter des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.update.all",
    module: "admin",
    action: "users.update",
    scope: "all",
    description: "Modifier des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.delete.all",
    module: "admin",
    action: "users.delete",
    scope: "all",
    description: "Supprimer des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.deactivate.all",
    module: "admin",
    action: "users.deactivate",
    scope: "all",
    description: "Désactiver des comptes utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.roles.read.all",
    module: "admin",
    action: "roles.read",
    scope: "all",
    description: "Voir les profils d'accès",
    category: "Administration",
  },
  {
    code: "admin.roles.manage.all",
    module: "admin",
    action: "roles.manage",
    scope: "all",
    description: "Gérer les profils et leurs droits",
    category: "Administration",
  },
  {
    code: "admin.permissions.manage.all",
    module: "admin",
    action: "permissions.manage",
    scope: "all",
    description: "Modifier les droits d'accès individuels",
    category: "Administration",
  },
  {
    code: "admin.audit.read.all",
    module: "admin",
    action: "audit.read",
    scope: "all",
    description: "Consulter l'historique des actions",
    category: "Administration",
  },
  {
    code: "admin.sessions.manage.all",
    module: "admin",
    action: "sessions.manage",
    scope: "all",
    description: "Gérer les connexions actives",
    category: "Administration",
  },
  {
    code: "admin.settings.read.all",
    module: "admin",
    action: "settings.read",
    scope: "all",
    description: "Voir les paramètres système",
    category: "Administration",
  },
  {
    code: "admin.settings.update.all",
    module: "admin",
    action: "settings.update",
    scope: "all",
    description: "Modifier les paramètres système",
    category: "Administration",
  },
];

// ============================================================================
// ROLES — 8 profils système
// ============================================================================

const ALL_CODES = PERMISSION_DEFS.map((p) => p.code);

// Permissions en lecture seule (toutes les *.read.* et *.view.*)
const READ_ONLY_CODES = ALL_CODES.filter(
  (c) => c.includes(".read.") || c.includes(".view.")
);

// Toutes sauf admin.permissions.manage.all (réservée Super Admin)
const ADMIN_CODES = ALL_CODES.filter((c) => c !== "admin.permissions.manage.all");

const ROLE_DEFS = [
  {
    name: "Super Administrateur",
    slug: "super_admin",
    description:
      "Accès illimité à toute l'application, y compris la gestion des droits d'accès",
    isSystem: true,
    priority: 100,
    permissions: ALL_CODES,
  },
  {
    name: "Administrateur",
    slug: "admin",
    description:
      "Accès complet aux fonctions métier sans pouvoir modifier les droits d'accès",
    isSystem: true,
    priority: 90,
    permissions: ADMIN_CODES,
  },
  {
    name: "Responsable Marketing",
    slug: "manager_marketing",
    description: "Gère les campagnes, segments et analyse les performances marketing",
    isSystem: true,
    priority: 75,
    permissions: [
      "clients.read.all",
      "clients.export.all",
      "campaigns.read.all",
      "campaigns.create.all",
      "campaigns.update.all",
      "campaigns.delete.all",
      "campaigns.send.all",
      "campaigns.validate.all",
      "segments.read.all",
      "segments.create.all",
      "segments.update.all",
      "segments.delete.all",
      "segments.compute.all",
      "automations.read.all",
      "automations.create.all",
      "automations.update.all",
      "automations.delete.all",
      "automations.activate.all",
      "templates.read.all",
      "templates.create.all",
      "templates.update.all",
      "templates.delete.all",
      "templates.duplicate.all",
      "analytics.view.basic",
      "analytics.view.advanced",
      "analytics.export.all",
      "admin.view.all",
    ],
  },
  {
    name: "Opérateur Marketing",
    slug: "operator_marketing",
    description: "Crée les campagnes — une validation est requise avant l'envoi",
    isSystem: true,
    priority: 50,
    permissions: [
      "clients.read.all",
      "campaigns.read.all",
      "campaigns.create.all",
      "campaigns.update.all",
      // Pas de campaigns.send ni campaigns.delete
      "segments.read.all",
      "segments.create.all",
      "templates.read.all",
      "templates.create.all",
      "templates.duplicate.all",
      "analytics.view.basic",
      "admin.view.all",
    ],
  },
  {
    name: "Responsable Commercial",
    slug: "manager_commercial",
    description:
      "Gère la relation client, les ventes et suit les performances commerciales",
    isSystem: true,
    priority: 70,
    permissions: [
      "clients.read.all",
      "clients.create.all",
      "clients.update.all",
      "clients.delete.all",
      "clients.export.all",
      "clients.import.all",
      "articles.read.all",
      "sales.read.all",
      "sales.create.all",
      "sales.update.all",
      "sales.cancel.all",
      "sales.export.all",
      // Pas de sales.refund ni sales.delete (sensible)
      "analytics.view.basic",
      "analytics.view.advanced",
      "analytics.export.all",
      "admin.view.all",
    ],
  },
  {
    name: "Vendeur",
    slug: "seller",
    description: "Enregistre les ventes et consulte les clients dont il s'occupe",
    isSystem: true,
    priority: 30,
    permissions: [
      "clients.read.own",
      "clients.create.all",
      "clients.update.own",
      "articles.read.all",
      "sales.read.own",
      "sales.create.all",
      "templates.read.all",
    ],
  },
  {
    name: "Comptable",
    slug: "accountant",
    description: "Consulte les ventes et exporte les rapports financiers",
    isSystem: true,
    priority: 60,
    permissions: [
      "clients.read.all",
      "articles.read.all",
      "sales.read.all",
      "sales.export.all",
      "analytics.view.basic",
      "analytics.view.advanced",
      "analytics.export.all",
      "admin.view.all",
    ],
  },
  {
    name: "Consultation seule",
    slug: "viewer",
    description:
      "Accès en lecture uniquement — ne peut rien créer, modifier ni supprimer",
    isSystem: true,
    priority: 10,
    permissions: READ_ONLY_CODES,
  },
];

// ============================================================================
// CATEGORIES — Mobilier Mondial Home Dakar
// ============================================================================

const CATEGORY_DEFS = [
  {
    name: "Salon",
    slug: "salon",
    description: "Meubles et accessoires pour le salon",
    icon: "sofa",
    sortOrder: 1,
    children: [
      { name: "Canapés & Sofas", slug: "canapes-sofas", sortOrder: 1 },
      { name: "Tables basses", slug: "tables-basses", sortOrder: 2 },
      { name: "Bibliothèques & Étagères", slug: "bibliotheques-etageres", sortOrder: 3 },
      { name: "Meubles TV", slug: "meubles-tv", sortOrder: 4 },
      { name: "Poufs & Fauteuils", slug: "poufs-fauteuils", sortOrder: 5 },
    ],
  },
  {
    name: "Chambre à coucher",
    slug: "chambre",
    description: "Literie et mobilier de chambre",
    icon: "bed",
    sortOrder: 2,
    children: [
      { name: "Lits & Têtes de lit", slug: "lits-tetes-de-lit", sortOrder: 1 },
      { name: "Matelas", slug: "matelas", sortOrder: 2 },
      { name: "Armoires & Dressings", slug: "armoires-dressings", sortOrder: 3 },
      { name: "Tables de chevet", slug: "tables-de-chevet", sortOrder: 4 },
      { name: "Commodes", slug: "commodes", sortOrder: 5 },
    ],
  },
  {
    name: "Salle à manger",
    slug: "salle-a-manger",
    description: "Tables, chaises et buffets de salle à manger",
    icon: "utensils",
    sortOrder: 3,
    children: [
      { name: "Tables de salle à manger", slug: "tables-salle-a-manger", sortOrder: 1 },
      { name: "Chaises de salle à manger", slug: "chaises-salle-a-manger", sortOrder: 2 },
      { name: "Buffets & Bahuts", slug: "buffets-bahuts", sortOrder: 3 },
      { name: "Bars & Dessertes", slug: "bars-dessertes", sortOrder: 4 },
    ],
  },
  {
    name: "Bureau & Travail",
    slug: "bureau",
    description: "Mobilier de bureau et espace travail",
    icon: "briefcase",
    sortOrder: 4,
    children: [
      { name: "Bureaux", slug: "bureaux", sortOrder: 1 },
      { name: "Chaises de bureau", slug: "chaises-bureau", sortOrder: 2 },
      { name: "Rangements bureau", slug: "rangements-bureau", sortOrder: 3 },
    ],
  },
  {
    name: "Décoration & Accessoires",
    slug: "decoration",
    description: "Objets déco, tapis, luminaires",
    icon: "lamp",
    sortOrder: 5,
    children: [
      { name: "Tapis", slug: "tapis", sortOrder: 1 },
      { name: "Luminaires", slug: "luminaires", sortOrder: 2 },
      { name: "Miroirs", slug: "miroirs", sortOrder: 3 },
      { name: "Tableaux & Art mural", slug: "tableaux-art-mural", sortOrder: 4 },
      { name: "Coussins & Textiles", slug: "coussins-textiles", sortOrder: 5 },
    ],
  },
  {
    name: "Cuisine",
    slug: "cuisine",
    description: "Mobilier et accessoires de cuisine",
    icon: "chef-hat",
    sortOrder: 6,
    children: [
      { name: "Tables de cuisine", slug: "tables-cuisine", sortOrder: 1 },
      {
        name: "Tabourets & Chaises hautes",
        slug: "tabourets-chaises-hautes",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Jardin & Extérieur",
    slug: "jardin-exterieur",
    description: "Mobilier de jardin et terrasse",
    icon: "tree",
    sortOrder: 7,
    children: [
      { name: "Salons de jardin", slug: "salons-de-jardin", sortOrder: 1 },
      {
        name: "Chaises & Fauteuils extérieur",
        slug: "chaises-fauteuils-exterieur",
        sortOrder: 2,
      },
      { name: "Parasols & Stores", slug: "parasols-stores", sortOrder: 3 },
    ],
  },
];

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

const SETTINGS = [
  {
    key: "company.name",
    value: "Mondial Home",
    category: "company",
    description: "Nom de l'entreprise",
    isPublic: true,
  },
  {
    key: "company.email",
    value: "contact@mondialhome.sn",
    category: "company",
    description: "Email de contact",
    isPublic: true,
  },
  {
    key: "company.phone",
    value: "+221 33 000 00 00",
    category: "company",
    description: "Téléphone",
    isPublic: true,
  },
  {
    key: "company.address",
    value: "Dakar, Sénégal",
    category: "company",
    description: "Adresse",
    isPublic: true,
  },
  {
    key: "company.currency",
    value: "XOF",
    category: "company",
    description: "Devise par défaut",
    isPublic: true,
  },
  {
    key: "company.timezone",
    value: "Africa/Dakar",
    category: "company",
    description: "Fuseau horaire",
    isPublic: true,
  },
  {
    key: "company.language",
    value: "fr",
    category: "company",
    description: "Langue par défaut",
    isPublic: true,
  },
  {
    key: "company.logo",
    value: "",
    category: "company",
    description: "URL du logo",
    isPublic: true,
  },
  {
    key: "sms.sender_id",
    value: "MondialHome",
    category: "sms",
    description: "Identifiant SMS expéditeur",
    isPublic: false,
  },
  {
    key: "sms.daily_limit",
    value: "1000",
    category: "sms",
    description: "Limite SMS par jour",
    isPublic: false,
  },
  {
    key: "email.from_name",
    value: "Mondial Home",
    category: "email",
    description: "Nom expéditeur email",
    isPublic: false,
  },
  {
    key: "email.from_address",
    value: "contact@mondialhome.sn",
    category: "email",
    description: "Adresse expéditeur email",
    isPublic: false,
  },
  {
    key: "crm.birthday_reminder_days",
    value: "7",
    category: "crm",
    description: "Jours avant anniversaire pour envoyer le message",
    isPublic: false,
  },
  {
    key: "crm.inactivity_threshold_days",
    value: "90",
    category: "crm",
    description: "Jours d'inactivité avant relance",
    isPublic: false,
  },
  {
    key: "crm.vip_threshold_xof",
    value: "500000",
    category: "crm",
    description: "Montant total pour passer VIP (XOF)",
    isPublic: false,
  },
  {
    key: "campaigns.require_validation",
    value: "false",
    category: "campaigns",
    description: "Validation requise avant envoi",
    isPublic: false,
  },
  {
    key: "campaigns.max_sms_per_day",
    value: "5000",
    category: "campaigns",
    description: "Max SMS par jour pour campagnes",
    isPublic: false,
  },
  {
    key: "notifications.email_on_new_sale",
    value: "true",
    category: "notifications",
    description: "Email admin à chaque nouvelle vente",
    isPublic: false,
  },
  {
    key: "notifications.email_on_new_client",
    value: "false",
    category: "notifications",
    description: "Email admin à chaque nouveau client",
    isPublic: false,
  },
];

// ============================================================================
// CHANNEL CONFIGS
// ============================================================================

const CHANNEL_CONFIGS = [
  {
    channel: "sms",
    provider: "africas_talking",
    isActive: false,
    credentials: {},
    settings: { sender_id: "MondialHome", environment: "sandbox" },
    monthlyLimit: 10000,
  },
  {
    channel: "email",
    provider: "brevo",
    isActive: false,
    credentials: {},
    settings: { from_name: "Mondial Home", from_email: "contact@mondialhome.sn" },
    monthlyLimit: 20000,
  },
  {
    channel: "whatsapp",
    provider: "brevo",
    isActive: false,
    credentials: {},
    settings: {},
    monthlyLimit: 5000,
  },
];

// ============================================================================
// TEMPLATES
// ============================================================================

type TemplateCategory =
  | "PROMOTION"
  | "NEW_ARRIVAL"
  | "EVENT"
  | "BIRTHDAY"
  | "WELCOME"
  | "REMINDER"
  | "THANK_YOU"
  | "REACTIVATION"
  | "POST_PURCHASE"
  | "ANNOUNCEMENT"
  | "OTHER";

interface TemplateDef {
  name: string;
  slug: string;
  description: string;
  channel: string;
  category: TemplateCategory;
  subject?: string;
  content: string;
  contentHtml?: string;
  variables: string[];
  isSystem?: boolean;
  fromName?: string;
  fromEmail?: string;
  tags: string[];
}

const TEMPLATE_DEFS: TemplateDef[] = [
  {
    name: "Bienvenue SMS",
    slug: "bienvenue-sms",
    description: "Message de bienvenue après inscription d'un nouveau client",
    channel: "sms",
    category: "WELCOME",
    content:
      "Bonjour {{prenom}}, bienvenue chez Mondial Home ! Découvrez notre collection de meubles de qualité. Pour toute question, appelez-nous au +221 33 XXX XX XX. Bonne visite !",
    variables: ["prenom"],
    isSystem: true,
    tags: ["bienvenue", "automatique"],
  },
  {
    name: "Joyeux Anniversaire SMS",
    slug: "anniversaire-sms",
    description: "Message d'anniversaire avec offre spéciale",
    channel: "sms",
    category: "BIRTHDAY",
    content:
      "Joyeux anniversaire {{prenom}} ! Mondial Home vous offre -{{remise}}% sur votre prochain achat jusqu'au {{date_expiration}}. Code : ANNIV{{annee}}. En magasin uniquement.",
    variables: ["prenom", "remise", "date_expiration", "annee"],
    isSystem: true,
    tags: ["anniversaire", "promotion"],
  },
  {
    name: "Promotion Flash SMS",
    slug: "promotion-flash-sms",
    description: "Annonce d'une promotion limitée dans le temps",
    channel: "sms",
    category: "PROMOTION",
    content:
      "PROMO FLASH Mondial Home ! {{description_offre}}. Valable jusqu'au {{date_fin}} en magasin. Infos : +221 33 XXX XX XX",
    variables: ["description_offre", "date_fin"],
    tags: ["promotion", "flash"],
  },
  {
    name: "Nouvelle Collection SMS",
    slug: "nouvelle-collection-sms",
    description: "Annonce d'une nouvelle collection ou nouveaux produits",
    channel: "sms",
    category: "NEW_ARRIVAL",
    content:
      "Mondial Home : Nouvelle collection {{nom_collection}} disponible ! {{description}}. Venez découvrir en magasin ou appelez le +221 33 XXX XX XX.",
    variables: ["nom_collection", "description"],
    tags: ["collection", "nouveaute"],
  },
  {
    name: "Relance Client Inactif SMS",
    slug: "relance-inactif-sms",
    description: "Message pour réactiver les clients n'ayant pas acheté depuis longtemps",
    channel: "sms",
    category: "REACTIVATION",
    content:
      "Bonjour {{prenom}}, vous nous manquez ! Cela fait {{mois}} mois que vous n'êtes pas passé chez Mondial Home. Venez redécouvrir nos nouveautés avec -10% sur votre prochain achat.",
    variables: ["prenom", "mois"],
    tags: ["relance", "inactivite"],
  },
  {
    name: "Anniversaire Premier Achat SMS",
    slug: "anniversaire-achat-sms",
    description: "Célébration du premier anniversaire de l'achat",
    channel: "sms",
    category: "POST_PURCHASE",
    content:
      "Bonjour {{prenom}}, il y a exactement un an vous avez choisi Mondial Home ! Merci de votre confiance. En cadeau : -{{remise}}% sur votre prochain achat. Valable 30 jours.",
    variables: ["prenom", "remise"],
    tags: ["anniversaire-achat", "fidelite"],
  },
  {
    name: "Bienvenue Email",
    slug: "bienvenue-email",
    description: "Email de bienvenue complet avec présentation de la marque",
    channel: "email",
    category: "WELCOME",
    subject: "Bienvenue chez Mondial Home, {{prenom}} !",
    content:
      "Bonjour {{prenom}},\n\nNous sommes ravis de vous accueillir dans la famille Mondial Home !\n\nChez Mondial Home, nous vous proposons une sélection de meubles et de mobilier de qualité pour sublimer votre intérieur.\n\nÀ très bientôt,\nL'équipe Mondial Home",
    contentHtml:
      "<h1>Bienvenue chez Mondial Home, {{prenom}} !</h1><p>Nous sommes ravis de vous accueillir dans la famille Mondial Home !</p><p>Découvrez notre sélection de meubles et mobilier de qualité.</p>",
    variables: ["prenom"],
    isSystem: true,
    fromName: "Mondial Home",
    fromEmail: "contact@mondialhome.sn",
    tags: ["bienvenue", "email"],
  },
  {
    name: "Promotion WhatsApp",
    slug: "promotion-whatsapp",
    description: "Message promotionnel via WhatsApp",
    channel: "whatsapp",
    category: "PROMOTION",
    content:
      "Bonjour {{prenom}}\n\n*OFFRE SPECIALE Mondial Home*\n\n{{description_offre}}\n\nValable jusqu'au *{{date_fin}}*\nEn magasin uniquement\n\nPour plus d'infos, répondez à ce message !",
    variables: ["prenom", "description_offre", "date_fin"],
    tags: ["promotion", "whatsapp"],
  },
];

// ============================================================================
// MAIN SEED
// ============================================================================

async function main() {
  console.log("Démarrage du seed CRM Mondial Home...\n");

  // 0. Nettoyage RBAC (idempotence — repart de zéro sur les associations)
  console.log("Nettoyage des associations RBAC...");
  await db.rolePermission.deleteMany({});
  await db.userRole.deleteMany({});
  // Supprime les permissions obsolètes (codes absents du catalogue actuel)
  const currentCodes = PERMISSION_DEFS.map((p) => p.code);
  const deleted = await db.permission.deleteMany({
    where: { code: { notIn: currentCodes } },
  });
  if (deleted.count > 0) {
    console.log(`  Supprimé: ${deleted.count} permission(s) obsolète(s)`);
  }
  console.log("  OK\n");

  // 1. Permissions
  console.log("Création des permissions...");
  await db.$transaction(
    PERMISSION_DEFS.map((p) =>
      db.permission.upsert({
        where: { code: p.code },
        update: {
          module: p.module,
          action: p.action,
          scope: p.scope,
          description: p.description,
          category: p.category,
        },
        create: {
          code: p.code,
          module: p.module,
          action: p.action,
          scope: p.scope,
          description: p.description,
          category: p.category,
        },
      })
    )
  );
  console.log(`  OK: ${PERMISSION_DEFS.length} permissions\n`);

  // 2. Rôles
  console.log("Création des rôles...");
  for (const roleDef of ROLE_DEFS) {
    const role = await db.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        priority: roleDef.priority,
        isSystem: roleDef.isSystem,
      },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        priority: roleDef.priority,
      },
    });

    const permissions = await db.permission.findMany({
      where: { code: { in: roleDef.permissions } },
    });

    if (permissions.length > 0) {
      await db.rolePermission.createMany({
        data: permissions.map((perm) => ({
          roleId: role.id,
          permissionId: perm.id,
          granted: true,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`  OK: ${role.name} (${permissions.length} permissions)`);
  }
  console.log();

  // 3. Super Admin
  console.log("Création du Super Administrateur...");
  const superAdminPassword = process.env["SUPER_ADMIN_PASSWORD"] ?? "Mondial@2024!";

  // ⭐ Utiliser le context Better Auth pour hasher correctement
  const hash = await hashPassword(superAdminPassword);

  const superAdmin = await db.user.upsert({
    where: { email: "admin@mondialhome.sn" },
    update: {
      // Au cas où on relance le seed, on remet à jour les flags
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: "admin@mondialhome.sn",
      name: "Super Admin",
      firstName: "Super",
      lastName: "Admin",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isSuperAdmin: true,
      isActive: true,
      language: "fr",
      timezone: "Africa/Dakar",
      jobTitle: "Administrateur Système",
    },
  });

  // ⭐ Étape B : Créer/Mettre à jour le compte avec accountId = userId
  await db.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: superAdmin.id, // ⭐ ID utilisateur, PAS l'email
      },
    },
    update: {
      password: hash, // ⭐ Met à jour le mot de passe à chaque seed
    },
    create: {
      userId: superAdmin.id,
      providerId: "credential",
      accountId: superAdmin.id, // ⭐ ID utilisateur, PAS l'email
      password: hash,
    },
  });

  // Assigner le rôle super_admin au Super Admin
  const superAdminRole = await db.role.findUnique({ where: { slug: "super_admin" } });
  if (superAdminRole) {
    await db.userRole.upsert({
      where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        assignedBy: superAdmin.id,
      },
    });
  }

  console.log(`  OK: admin@mondialhome.sn`);
  console.log(`  MOT DE PASSE TEMPORAIRE: ${superAdminPassword}`);
  console.log(`  -> A changer immédiatement apres connexion !\n`);

  // 4. Catégories
  console.log("Création des catégories produits...");
  let categoryCount = 0;

  for (const catDef of CATEGORY_DEFS) {
    const parent = await db.category.upsert({
      where: { slug: catDef.slug },
      update: {
        name: catDef.name,
        description: catDef.description,
        sortOrder: catDef.sortOrder,
      },
      create: {
        name: catDef.name,
        slug: catDef.slug,
        description: catDef.description,
        icon: catDef.icon,
        sortOrder: catDef.sortOrder,
        isActive: true,
      },
    });
    categoryCount++;

    for (const childDef of catDef.children) {
      await db.category.upsert({
        where: { slug: childDef.slug },
        update: { name: childDef.name, sortOrder: childDef.sortOrder },
        create: {
          name: childDef.name,
          slug: childDef.slug,
          sortOrder: childDef.sortOrder,
          parentId: parent.id,
          isActive: true,
        },
      });
      categoryCount++;
    }
  }
  console.log(`  OK: ${categoryCount} catégories\n`);

  // 5. Templates
  console.log("Création des templates...");
  for (const tplDef of TEMPLATE_DEFS) {
    await db.template.upsert({
      where: { slug: tplDef.slug },
      update: { name: tplDef.name, content: tplDef.content },
      create: {
        name: tplDef.name,
        slug: tplDef.slug,
        description: tplDef.description,
        channel: tplDef.channel,
        category: tplDef.category,
        subject: tplDef.subject ?? null,
        content: tplDef.content,
        contentHtml: tplDef.contentHtml ?? null,
        variables: tplDef.variables,
        isSystem: tplDef.isSystem ?? false,
        isActive: true,
        fromName: tplDef.fromName ?? null,
        fromEmail: tplDef.fromEmail ?? null,
        tags: tplDef.tags,
        createdById: superAdmin.id,
      },
    });
    console.log(`  OK: ${tplDef.name} (${tplDef.channel})`);
  }
  console.log();

  // 6. Canal configs
  console.log("Création des configurations de canaux...");
  for (const channelDef of CHANNEL_CONFIGS) {
    await db.channelConfig.upsert({
      where: { channel: channelDef.channel },
      update: {},
      create: {
        channel: channelDef.channel,
        provider: channelDef.provider,
        isActive: channelDef.isActive,
        credentials: channelDef.credentials,
        settings: channelDef.settings,
        monthlyLimit: channelDef.monthlyLimit,
      },
    });
    console.log(
      `  OK: Canal ${channelDef.channel} (${channelDef.provider}) — à configurer`
    );
  }
  console.log();

  // 7. Paramètres système
  console.log("Création des paramètres système...");
  for (const setting of SETTINGS) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        category: setting.category,
        description: setting.description,
        isPublic: setting.isPublic,
        updatedBy: superAdmin.id,
      },
    });
  }
  console.log(`  OK: ${SETTINGS.length} paramètres\n`);

  // 8. Segments système
  console.log("Création des segments système...");
  const systemSegments = [
    {
      name: "Tous les clients",
      slug: "tous-les-clients",
      description: "Segment contenant tous les clients actifs",
      type: "DYNAMIC" as const,
      rules: [{ field: "status", operator: "equals", value: "ACTIVE" }],
      color: "#4A6741",
    },
    {
      name: "Clients VIP",
      slug: "clients-vip",
      description: "Clients avec statut VIP",
      type: "DYNAMIC" as const,
      rules: [{ field: "isVip", operator: "equals", value: true }],
      color: "#D4A853",
    },
    {
      name: "Clients inactifs (90j+)",
      slug: "clients-inactifs-90j",
      description: "Clients sans achat depuis 90 jours",
      type: "DYNAMIC" as const,
      rules: [{ field: "lastPurchaseAt", operator: "before", value: "90_days_ago" }],
      color: "#C4622D",
    },
    {
      name: "Nouveaux clients (30j)",
      slug: "nouveaux-clients-30j",
      description: "Clients inscrits dans les 30 derniers jours",
      type: "DYNAMIC" as const,
      rules: [{ field: "acquisitionDate", operator: "after", value: "30_days_ago" }],
      color: "#5B9BD5",
    },
  ];

  for (const seg of systemSegments) {
    await db.segment.upsert({
      where: { slug: seg.slug },
      update: {},
      create: {
        name: seg.name,
        slug: seg.slug,
        description: seg.description,
        type: seg.type,
        rules: seg.rules,
        isSystem: true,
        isActive: true,
        color: seg.color,
        createdById: superAdmin.id,
      },
    });
    console.log(`  OK: ${seg.name}`);
  }
  console.log();

  // Résumé
  console.log("=".repeat(60));
  console.log("SEED TERMINE — CRM Mondial Home prêt\n");
  console.log("  Email admin    : admin@mondialhome.sn");
  console.log(`  Mot de passe   : ${superAdminPassword}`);
  console.log("  A FAIRE        : Changer le mot de passe admin");
  console.log("  A FAIRE        : Configurer les canaux SMS/Email/WhatsApp");
  console.log("  A FAIRE        : Mettre a jour les parametres company.*");
  console.log("=".repeat(60));
}

main()
  .catch((e: unknown) => {
    console.error("Erreur seed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
