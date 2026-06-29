import type { PermissionCode } from "@/lib/permissions";
import { DANGEROUS_PERMISSIONS, SUPER_ADMIN_ONLY_PERMISSIONS } from "@/lib/permissions";

export interface PermissionLabel {
  code: PermissionCode;
  label: string;
  description: string;
  example?: string;
  isDangerous: boolean;
  superAdminOnly: boolean;
}

export const PERMISSION_LABELS: Record<PermissionCode, PermissionLabel> = {
  // ── CLIENTS ───────────────────────────────────────────────────────────────
  "clients.read.own": {
    code: "clients.read.own",
    label: "Voir ses propres clients",
    description:
      "Permet de consulter uniquement les clients créés ou assignés à cette personne",
    example: "Mamadou (vendeur) ne voit que les fiches de ses clients",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.read.all": {
    code: "clients.read.all",
    label: "Voir tous les clients",
    description: "Permet de consulter la fiche de n'importe quel client de Mondial Home",
    example: "Aïssatou peut voir les détails de tous les clients",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.create.all": {
    code: "clients.create.all",
    label: "Ajouter des clients",
    description: "Permet de créer de nouveaux clients dans la base",
    example: "Enregistrer un nouveau client qui entre dans le magasin",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.update.own": {
    code: "clients.update.own",
    label: "Modifier ses propres clients",
    description: "Permet de modifier uniquement les clients dont cette personne s'occupe",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.update.all": {
    code: "clients.update.all",
    label: "Modifier tous les clients",
    description: "Permet de modifier la fiche de n'importe quel client",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.delete.all": {
    code: "clients.delete.all",
    label: "Supprimer des clients",
    description: "⚠️ Permet de supprimer un client de la base (action irréversible)",
    isDangerous: true,
    superAdminOnly: false,
  },
  "clients.export.all": {
    code: "clients.export.all",
    label: "Exporter la liste clients",
    description: "Permet de télécharger la liste des clients en Excel ou CSV",
    isDangerous: false,
    superAdminOnly: false,
  },
  "clients.import.all": {
    code: "clients.import.all",
    label: "Importer des clients",
    description:
      "Permet d'ajouter plusieurs clients à la fois depuis un fichier Excel ou CSV",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── ARTICLES ──────────────────────────────────────────────────────────────
  "articles.read.all": {
    code: "articles.read.all",
    label: "Voir les articles",
    description: "Permet de consulter le catalogue produits",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.create.all": {
    code: "articles.create.all",
    label: "Ajouter des articles",
    description: "Permet d'ajouter de nouveaux produits au catalogue",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.update.all": {
    code: "articles.update.all",
    label: "Modifier des articles",
    description:
      "Permet de modifier les informations d'un produit (prix, stock, description)",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.delete.all": {
    code: "articles.delete.all",
    label: "Supprimer des articles",
    description: "⚠️ Permet de retirer définitivement un produit du catalogue",
    isDangerous: true,
    superAdminOnly: false,
  },
  "articles.export.all": {
    code: "articles.export.all",
    label: "Exporter le catalogue",
    description: "Permet de télécharger la liste des articles en Excel ou CSV",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.import.all": {
    code: "articles.import.all",
    label: "Importer des articles",
    description: "Permet d'ajouter plusieurs articles à la fois depuis un fichier",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.manage_categories": {
    code: "articles.manage_categories",
    label: "Gérer les catégories",
    description:
      "Permet de créer, modifier, réorganiser et supprimer les catégories du catalogue",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.manage_prices": {
    code: "articles.manage_prices",
    label: "Gérer les prix et promotions",
    description: "Permet de modifier les prix de vente et de définir des promotions",
    isDangerous: false,
    superAdminOnly: false,
  },
  "articles.view_cost": {
    code: "articles.view_cost",
    label: "Voir les prix d'achat",
    description:
      "Permet de consulter les prix de revient (information confidentielle et marge)",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── VENTES ────────────────────────────────────────────────────────────────
  "sales.read.own": {
    code: "sales.read.own",
    label: "Voir ses propres ventes",
    description:
      "Permet de consulter uniquement les ventes enregistrées par cette personne",
    isDangerous: false,
    superAdminOnly: false,
  },
  "sales.read.all": {
    code: "sales.read.all",
    label: "Voir toutes les ventes",
    description: "Permet de consulter l'ensemble des ventes de Mondial Home",
    isDangerous: false,
    superAdminOnly: false,
  },
  "sales.create.all": {
    code: "sales.create.all",
    label: "Enregistrer une vente",
    description: "Permet de saisir une nouvelle vente en caisse",
    isDangerous: false,
    superAdminOnly: false,
  },
  "sales.update.all": {
    code: "sales.update.all",
    label: "Modifier une vente",
    description: "Permet de corriger les informations d'une vente déjà enregistrée",
    isDangerous: false,
    superAdminOnly: false,
  },
  "sales.cancel.all": {
    code: "sales.cancel.all",
    label: "Annuler une vente",
    description: "⚠️ Permet d'annuler une vente après son enregistrement (action tracée)",
    isDangerous: true,
    superAdminOnly: false,
  },
  "sales.refund.all": {
    code: "sales.refund.all",
    label: "Effectuer un remboursement",
    description: "⚠️ Permet de rembourser un client (action tracée et irréversible)",
    isDangerous: true,
    superAdminOnly: false,
  },
  "sales.export.all": {
    code: "sales.export.all",
    label: "Exporter les ventes",
    description: "Permet de télécharger le rapport des ventes en Excel ou CSV",
    isDangerous: false,
    superAdminOnly: false,
  },
  "sales.delete.all": {
    code: "sales.delete.all",
    label: "Supprimer des ventes",
    description: "⚠️ Permet de supprimer définitivement un enregistrement de vente",
    isDangerous: true,
    superAdminOnly: false,
  },

  // ── CAMPAGNES ─────────────────────────────────────────────────────────────
  "campaigns.read.all": {
    code: "campaigns.read.all",
    label: "Voir les campagnes",
    description: "Permet de consulter toutes les campagnes marketing",
    isDangerous: false,
    superAdminOnly: false,
  },
  "campaigns.create.all": {
    code: "campaigns.create.all",
    label: "Créer des campagnes",
    description: "Permet de créer de nouvelles campagnes SMS, Email ou WhatsApp",
    isDangerous: false,
    superAdminOnly: false,
  },
  "campaigns.update.all": {
    code: "campaigns.update.all",
    label: "Modifier des campagnes",
    description: "Permet de modifier le contenu ou la planification d'une campagne",
    isDangerous: false,
    superAdminOnly: false,
  },
  "campaigns.delete.all": {
    code: "campaigns.delete.all",
    label: "Supprimer des campagnes",
    description: "⚠️ Permet de supprimer définitivement une campagne",
    isDangerous: true,
    superAdminOnly: false,
  },
  "campaigns.send.all": {
    code: "campaigns.send.all",
    label: "Envoyer des campagnes",
    description:
      "⚠️ Permet de déclencher l'envoi de SMS, Email ou WhatsApp aux clients — action qui génère des coûts",
    example: "Envoyer une promo flash à 5 000 clients par SMS",
    isDangerous: true,
    superAdminOnly: false,
  },
  "campaigns.cancel.all": {
    code: "campaigns.cancel.all",
    label: "Annuler des campagnes",
    description: "⚠️ Permet d'annuler ou stopper une campagne en cours d'envoi",
    isDangerous: true,
    superAdminOnly: false,
  },
  "campaigns.validate.all": {
    code: "campaigns.validate.all",
    label: "Valider les campagnes",
    description: "Permet d'approuver une campagne avant son envoi (rôle de superviseur)",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── SEGMENTS ──────────────────────────────────────────────────────────────
  "segments.read.all": {
    code: "segments.read.all",
    label: "Voir les segments",
    description: "Permet de consulter les groupes de clients définis",
    isDangerous: false,
    superAdminOnly: false,
  },
  "segments.create.all": {
    code: "segments.create.all",
    label: "Créer des segments",
    description: "Permet de créer de nouveaux groupes de clients avec des critères",
    isDangerous: false,
    superAdminOnly: false,
  },
  "segments.update.all": {
    code: "segments.update.all",
    label: "Modifier des segments",
    description: "Permet de changer les critères ou le nom d'un segment",
    isDangerous: false,
    superAdminOnly: false,
  },
  "segments.delete.all": {
    code: "segments.delete.all",
    label: "Supprimer des segments",
    description: "⚠️ Permet de supprimer un segment (les clients ne sont pas supprimés)",
    isDangerous: true,
    superAdminOnly: false,
  },
  "segments.compute.all": {
    code: "segments.compute.all",
    label: "Recalculer des segments",
    description: "Permet de forcer le recalcul du nombre de membres d'un segment",
    isDangerous: false,
    superAdminOnly: false,
  },
  "segments.manage_members.all": {
    code: "segments.manage_members.all",
    label: "Gérer les membres",
    description: "Permet d'ajouter ou retirer des clients d'un groupe statique",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── AUTOMATISATIONS ───────────────────────────────────────────────────────
  "automations.read.all": {
    code: "automations.read.all",
    label: "Voir les automatisations",
    description: "Permet de consulter les scénarios automatiques configurés",
    isDangerous: false,
    superAdminOnly: false,
  },
  "automations.create.all": {
    code: "automations.create.all",
    label: "Créer des automatisations",
    description: "Permet de créer de nouveaux scénarios automatiques",
    isDangerous: false,
    superAdminOnly: false,
  },
  "automations.update.all": {
    code: "automations.update.all",
    label: "Modifier des automatisations",
    description: "Permet de modifier le contenu ou les règles d'un scénario",
    isDangerous: false,
    superAdminOnly: false,
  },
  "automations.delete.all": {
    code: "automations.delete.all",
    label: "Supprimer des automatisations",
    description: "⚠️ Permet de supprimer définitivement un scénario automatique",
    isDangerous: true,
    superAdminOnly: false,
  },
  "automations.activate.all": {
    code: "automations.activate.all",
    label: "Activer / désactiver des automatisations",
    description:
      "⚠️ Permet de démarrer ou arrêter un scénario automatique — affecte l'envoi de messages",
    isDangerous: true,
    superAdminOnly: false,
  },

  // ── TEMPLATES ─────────────────────────────────────────────────────────────
  "templates.read.all": {
    code: "templates.read.all",
    label: "Voir les modèles de messages",
    description: "Permet de consulter la bibliothèque de modèles",
    isDangerous: false,
    superAdminOnly: false,
  },
  "templates.create.all": {
    code: "templates.create.all",
    label: "Créer des modèles",
    description: "Permet d'ajouter de nouveaux modèles de messages",
    isDangerous: false,
    superAdminOnly: false,
  },
  "templates.update.all": {
    code: "templates.update.all",
    label: "Modifier des modèles",
    description: "Permet de modifier le contenu d'un modèle existant",
    isDangerous: false,
    superAdminOnly: false,
  },
  "templates.delete.all": {
    code: "templates.delete.all",
    label: "Supprimer des modèles",
    description: "⚠️ Permet de supprimer définitivement un modèle de message",
    isDangerous: true,
    superAdminOnly: false,
  },
  "templates.duplicate.all": {
    code: "templates.duplicate.all",
    label: "Dupliquer des modèles",
    description: "Permet de créer une copie d'un modèle existant",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  "analytics.view.basic": {
    code: "analytics.view.basic",
    label: "Voir les statistiques de base",
    description:
      "Permet de consulter les indicateurs principaux (ventes, clients, taux d'ouverture)",
    isDangerous: false,
    superAdminOnly: false,
  },
  "analytics.view.advanced": {
    code: "analytics.view.advanced",
    label: "Voir les statistiques avancées",
    description:
      "Permet de consulter les analyses détaillées, ROI, cohortes et rapports personnalisés",
    isDangerous: false,
    superAdminOnly: false,
  },
  "analytics.export.all": {
    code: "analytics.export.all",
    label: "Exporter les rapports",
    description: "Permet de télécharger les rapports analytiques en Excel ou PDF",
    isDangerous: false,
    superAdminOnly: false,
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  "admin.view.all": {
    code: "admin.view.all",
    label: "Accéder au panneau d'administration",
    description: "Permet d'accéder à la section Administration du CRM",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.users.read.all": {
    code: "admin.users.read.all",
    label: "Voir les membres de l'équipe",
    description: "Permet de consulter la liste et les fiches de tous les utilisateurs",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.users.create.all": {
    code: "admin.users.create.all",
    label: "Inviter des membres",
    description:
      "Permet d'envoyer des invitations par email pour créer de nouveaux comptes",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.users.update.all": {
    code: "admin.users.update.all",
    label: "Modifier les membres",
    description:
      "⚠️ Permet de modifier le nom, l'email ou les informations d'un utilisateur",
    isDangerous: true,
    superAdminOnly: false,
  },
  "admin.users.delete.all": {
    code: "admin.users.delete.all",
    label: "Supprimer des membres",
    description: "⚠️ Permet de supprimer définitivement un compte utilisateur",
    isDangerous: true,
    superAdminOnly: false,
  },
  "admin.users.deactivate.all": {
    code: "admin.users.deactivate.all",
    label: "Désactiver des comptes",
    description: "Permet de bloquer l'accès d'un utilisateur sans supprimer son compte",
    example: "Bloquer l'accès d'un ancien employé en partance",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.roles.read.all": {
    code: "admin.roles.read.all",
    label: "Voir les profils d'accès",
    description: "Permet de consulter les profils et leurs droits d'accès",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.roles.manage.all": {
    code: "admin.roles.manage.all",
    label: "Gérer les profils d'accès",
    description:
      "⚠️ Permet de créer, modifier et supprimer des profils d'accès — réservé aux administrateurs",
    isDangerous: true,
    superAdminOnly: false,
  },
  "admin.permissions.manage.all": {
    code: "admin.permissions.manage.all",
    label: "Modifier les droits d'accès individuels",
    description:
      "🔒 Permet d'accorder ou retirer des droits spécifiques à un utilisateur — Super Administrateur uniquement",
    isDangerous: true,
    superAdminOnly: true,
  },
  "admin.audit.read.all": {
    code: "admin.audit.read.all",
    label: "Consulter l'historique des actions",
    description: "Permet de voir qui a fait quoi et quand dans l'application",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.sessions.manage.all": {
    code: "admin.sessions.manage.all",
    label: "Gérer les connexions actives",
    description: "Permet de voir et déconnecter à distance les sessions des utilisateurs",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.settings.read.all": {
    code: "admin.settings.read.all",
    label: "Voir les paramètres système",
    description: "Permet de consulter la configuration de l'application",
    isDangerous: false,
    superAdminOnly: false,
  },
  "admin.settings.update.all": {
    code: "admin.settings.update.all",
    label: "Modifier les paramètres système",
    description: "⚠️ Permet de modifier la configuration globale de l'application",
    isDangerous: true,
    superAdminOnly: false,
  },
};

/**
 * Retourne le label FR d'une permission.
 * Fallback sur le code brut si non trouvé.
 */
export function getPermissionLabel(code: string): string {
  return PERMISSION_LABELS[code as PermissionCode]?.label ?? code;
}

/**
 * Vérifie si une permission est considérée comme sensible.
 */
export function isPermissionDangerous(code: string): boolean {
  return DANGEROUS_PERMISSIONS.has(code as PermissionCode);
}

/**
 * Vérifie si une permission est réservée au Super Admin.
 */
export function isPermissionSuperAdminOnly(code: string): boolean {
  return SUPER_ADMIN_ONLY_PERMISSIONS.has(code as PermissionCode);
}
