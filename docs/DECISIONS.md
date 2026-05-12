# Architecture Decision Records (ADR)

## ADR-001 : Next.js 16 au lieu de 15

**Date** : 2026-05-12
**Statut** : Accepté

**Contexte** : La mission spécifiait Next.js 15 mais `create-next-app@latest` installe Next.js 16.2.6 (latest stable).

**Décision** : Utiliser Next.js 16. Même paradigme App Router, zéro breaking change pertinent pour ce projet. Bénéfice : meilleures performances, dernier correctifs de sécurité.

---

## ADR-002 : shadcn/ui nouvelle génération (base-ui)

**Date** : 2026-05-12
**Statut** : Accepté

**Contexte** : shadcn/ui a migré vers `@base-ui/react` comme base de composants (plus accessible, moins de dépendances).

**Décision** : Utiliser la version shadcn@latest avec base-ui. Tailwind v4 CSS-first (`@theme`) au lieu de `tailwind.config.js`. Compatibilité totale avec l'écosystème.

---

## ADR-003 : Server Actions plutôt que tRPC

**Date** : 2026-05-12
**Statut** : Accepté

**Contexte** : Le client voulait "API layer : Server Actions (pas tRPC)".

**Décision** : Server Actions Next.js pour toutes les mutations. Pattern : `requireAuth()` → `checkPermission()` → `schema.parse()` → service layer → réponse. TanStack Query pour le cache côté client.

---

## ADR-004 : Palette terracotta pour le design system

**Date** : 2026-05-12
**Statut** : Accepté

**Contexte** : Enseigne d'ameublement à Dakar — besoin d'une identité chaleureuse et professionnelle.

**Décision** : Palette terracotta (#C4622D) + sable doré (#D4A853) + vert mousse (#4A6741) sur fond crème ivoire. Inspirée des matériaux naturels et de l'esthétique africaine contemporaine.

---

## ADR-005 : Workers BullMQ dans un process séparé

**Date** : 2026-05-12
**Statut** : Accepté

**Contexte** : Les workers de traitement de messages/campagnes sont des opérations longues qui ne doivent pas bloquer le serveur Next.js.

**Décision** : Process séparé via `pnpm workers` (tsx). Sur VPS, PM2 gère les deux process (app + workers) indépendamment. Permet de scaler les workers séparément si nécessaire.

---

## ADR-006 : Schéma Prisma en attente

**Date** : 2026-05-12
**Statut** : En attente

**Contexte** : Le schéma complet sera fourni par le client (données métier CRM spécifiques).

**Décision** : Schéma minimal Better Auth créé (User, Session, Account, Verification). Le reste sera ajouté à réception du schéma complet.
