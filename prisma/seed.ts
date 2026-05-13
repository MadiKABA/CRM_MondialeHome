import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const db = new PrismaClient();

// ============================================================================
// HELPERS
// ============================================================================

// ============================================================================
// PERMISSIONS
// ============================================================================

const PERMISSION_DEFS = [
  // Clients
  {
    code: "clients.read",
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
    code: "clients.create",
    module: "clients",
    action: "create",
    scope: "all",
    description: "Créer des clients",
    category: "Clients",
  },
  {
    code: "clients.update",
    module: "clients",
    action: "update",
    scope: "all",
    description: "Modifier des clients",
    category: "Clients",
  },
  {
    code: "clients.delete",
    module: "clients",
    action: "delete",
    scope: "all",
    description: "Supprimer des clients",
    category: "Clients",
  },
  {
    code: "clients.export",
    module: "clients",
    action: "export",
    scope: "all",
    description: "Exporter les clients",
    category: "Clients",
  },
  {
    code: "clients.import",
    module: "clients",
    action: "import",
    scope: "all",
    description: "Importer des clients",
    category: "Clients",
  },
  // Articles
  {
    code: "articles.read",
    module: "articles",
    action: "read",
    scope: "all",
    description: "Voir les articles",
    category: "Articles",
  },
  {
    code: "articles.create",
    module: "articles",
    action: "create",
    scope: "all",
    description: "Créer des articles",
    category: "Articles",
  },
  {
    code: "articles.update",
    module: "articles",
    action: "update",
    scope: "all",
    description: "Modifier des articles",
    category: "Articles",
  },
  {
    code: "articles.delete",
    module: "articles",
    action: "delete",
    scope: "all",
    description: "Supprimer des articles",
    category: "Articles",
  },
  // Ventes
  {
    code: "sales.read",
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
    code: "sales.create",
    module: "sales",
    action: "create",
    scope: "all",
    description: "Créer des ventes",
    category: "Ventes",
  },
  {
    code: "sales.update",
    module: "sales",
    action: "update",
    scope: "all",
    description: "Modifier des ventes",
    category: "Ventes",
  },
  {
    code: "sales.delete",
    module: "sales",
    action: "delete",
    scope: "all",
    description: "Supprimer des ventes",
    category: "Ventes",
  },
  {
    code: "sales.export",
    module: "sales",
    action: "export",
    scope: "all",
    description: "Exporter les ventes",
    category: "Ventes",
  },
  // Campagnes
  {
    code: "campaigns.read",
    module: "campaigns",
    action: "read",
    scope: "all",
    description: "Voir les campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.create",
    module: "campaigns",
    action: "create",
    scope: "all",
    description: "Créer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.update",
    module: "campaigns",
    action: "update",
    scope: "all",
    description: "Modifier des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.delete",
    module: "campaigns",
    action: "delete",
    scope: "all",
    description: "Supprimer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.send",
    module: "campaigns",
    action: "send",
    scope: "all",
    description: "Envoyer des campagnes",
    category: "Campagnes",
  },
  {
    code: "campaigns.approve",
    module: "campaigns",
    action: "approve",
    scope: "all",
    description: "Valider des campagnes",
    category: "Campagnes",
  },
  // Segments
  {
    code: "segments.read",
    module: "segments",
    action: "read",
    scope: "all",
    description: "Voir les segments",
    category: "Segmentation",
  },
  {
    code: "segments.create",
    module: "segments",
    action: "create",
    scope: "all",
    description: "Créer des segments",
    category: "Segmentation",
  },
  {
    code: "segments.update",
    module: "segments",
    action: "update",
    scope: "all",
    description: "Modifier des segments",
    category: "Segmentation",
  },
  {
    code: "segments.delete",
    module: "segments",
    action: "delete",
    scope: "all",
    description: "Supprimer des segments",
    category: "Segmentation",
  },
  // Automatisations
  {
    code: "automations.read",
    module: "automations",
    action: "read",
    scope: "all",
    description: "Voir les automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.create",
    module: "automations",
    action: "create",
    scope: "all",
    description: "Créer des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.update",
    module: "automations",
    action: "update",
    scope: "all",
    description: "Modifier des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.delete",
    module: "automations",
    action: "delete",
    scope: "all",
    description: "Supprimer des automatisations",
    category: "Automatisations",
  },
  {
    code: "automations.activate",
    module: "automations",
    action: "activate",
    scope: "all",
    description: "Activer des automatisations",
    category: "Automatisations",
  },
  // Templates
  {
    code: "templates.read",
    module: "templates",
    action: "read",
    scope: "all",
    description: "Voir les templates",
    category: "Templates",
  },
  {
    code: "templates.create",
    module: "templates",
    action: "create",
    scope: "all",
    description: "Créer des templates",
    category: "Templates",
  },
  {
    code: "templates.update",
    module: "templates",
    action: "update",
    scope: "all",
    description: "Modifier des templates",
    category: "Templates",
  },
  {
    code: "templates.delete",
    module: "templates",
    action: "delete",
    scope: "all",
    description: "Supprimer des templates",
    category: "Templates",
  },
  // Analytics
  {
    code: "analytics.read",
    module: "analytics",
    action: "read",
    scope: "all",
    description: "Voir les analytics",
    category: "Analytics",
  },
  {
    code: "analytics.export",
    module: "analytics",
    action: "export",
    scope: "all",
    description: "Exporter les analytics",
    category: "Analytics",
  },
  // Admin
  {
    code: "admin.read",
    module: "admin",
    action: "read",
    scope: "all",
    description: "Accès au panneau admin",
    category: "Administration",
  },
  {
    code: "admin.users.read",
    module: "admin",
    action: "users.read",
    scope: "all",
    description: "Voir les utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.create",
    module: "admin",
    action: "users.create",
    scope: "all",
    description: "Créer des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.update",
    module: "admin",
    action: "users.update",
    scope: "all",
    description: "Modifier des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.users.delete",
    module: "admin",
    action: "users.delete",
    scope: "all",
    description: "Supprimer des utilisateurs",
    category: "Administration",
  },
  {
    code: "admin.roles.read",
    module: "admin",
    action: "roles.read",
    scope: "all",
    description: "Voir les rôles",
    category: "Administration",
  },
  {
    code: "admin.roles.manage",
    module: "admin",
    action: "roles.manage",
    scope: "all",
    description: "Gérer les rôles et permissions",
    category: "Administration",
  },
  {
    code: "admin.audit.read",
    module: "admin",
    action: "audit.read",
    scope: "all",
    description: "Voir les journaux d'audit",
    category: "Administration",
  },
  {
    code: "admin.settings.read",
    module: "admin",
    action: "settings.read",
    scope: "all",
    description: "Voir les paramètres",
    category: "Administration",
  },
  {
    code: "admin.settings.update",
    module: "admin",
    action: "settings.update",
    scope: "all",
    description: "Modifier les paramètres",
    category: "Administration",
  },
];

// ============================================================================
// ROLES
// ============================================================================

const ROLE_DEFS = [
  {
    name: "Super Administrateur",
    slug: "super_admin",
    description: "Accès complet à toutes les fonctionnalités du CRM",
    isSystem: true,
    priority: 100,
    permissions: PERMISSION_DEFS.map((p) => p.code),
  },
  {
    name: "Administrateur",
    slug: "admin",
    description: "Administration complète sauf accès super admin",
    isSystem: true,
    priority: 80,
    permissions: [
      "clients.read",
      "clients.read.all",
      "clients.create",
      "clients.update",
      "clients.delete",
      "clients.export",
      "clients.import",
      "articles.read",
      "articles.create",
      "articles.update",
      "articles.delete",
      "sales.read",
      "sales.read.all",
      "sales.create",
      "sales.update",
      "sales.delete",
      "sales.export",
      "campaigns.read",
      "campaigns.create",
      "campaigns.update",
      "campaigns.delete",
      "campaigns.send",
      "campaigns.approve",
      "segments.read",
      "segments.create",
      "segments.update",
      "segments.delete",
      "automations.read",
      "automations.create",
      "automations.update",
      "automations.delete",
      "automations.activate",
      "templates.read",
      "templates.create",
      "templates.update",
      "templates.delete",
      "analytics.read",
      "analytics.export",
      "admin.read",
      "admin.users.read",
      "admin.users.create",
      "admin.audit.read",
      "admin.settings.read",
    ],
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Gestion des clients, ventes et campagnes",
    isSystem: true,
    priority: 60,
    permissions: [
      "clients.read",
      "clients.read.all",
      "clients.create",
      "clients.update",
      "clients.export",
      "articles.read",
      "sales.read",
      "sales.read.all",
      "sales.create",
      "sales.export",
      "campaigns.read",
      "campaigns.create",
      "campaigns.update",
      "campaigns.send",
      "segments.read",
      "segments.create",
      "automations.read",
      "templates.read",
      "templates.create",
      "analytics.read",
    ],
  },
  {
    name: "Agent Commercial",
    slug: "agent",
    description: "Saisie des ventes et gestion basique des clients",
    isSystem: true,
    priority: 40,
    permissions: [
      "clients.read",
      "clients.create",
      "clients.update",
      "articles.read",
      "sales.read",
      "sales.create",
      "campaigns.read",
      "templates.read",
    ],
  },
  {
    name: "Observateur",
    slug: "viewer",
    description: "Lecture seule sur les données principales",
    isSystem: true,
    priority: 20,
    permissions: [
      "clients.read",
      "articles.read",
      "sales.read",
      "campaigns.read",
      "analytics.read",
    ],
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

    await db.$transaction(
      permissions.map((perm) =>
        db.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: { granted: true },
          create: { roleId: role.id, permissionId: perm.id, granted: true },
        })
      )
    );

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
