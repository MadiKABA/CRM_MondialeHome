# CLAUDE.md — Contexte permanent pour Claude Code

> Ce fichier fournit à Claude Code le contexte nécessaire pour travailler efficacement sur ce projet. Lis-le entièrement avant toute intervention.

---

## 🎯 Projet : CRM Mondial Home

### Description

Plateforme CRM complète pour **Mondial Home**, enseigne d'ameublement et décoration intérieure basée à Dakar, Sénégal. Le système permet la gestion clients, le catalogue produits, l'historique des ventes, les campagnes marketing multi-canaux (SMS, WhatsApp, Email), l'automatisation marketing, et le pilotage du ROI commercial.

### Client

- **Nom** : Mondial Home
- **Localisation** : Dakar, Sénégal
- **Secteur** : Ameublement, décoration, articles de maison
- **Volume** : ~10 000 clients, plusieurs centaines d'articles

### Devise & Locale

- **Devise** : XOF (Franc CFA)
- **Locale par défaut** : `fr` (Français)
- **Locale secondaire** : `wo` (Wolof) — structure i18n prête, traductions à venir
- **Timezone** : `Africa/Dakar` (UTC+0)
- **Format téléphone** : E.164 avec préfixe Sénégal `+221`

---

## 🛠 Stack Technique

### Core

- **Framework** : Next.js 15 (App Router, Server Components, Server Actions)
- **Langage** : TypeScript strict (zéro `any` toléré)
- **Package manager** : `pnpm` (jamais npm/yarn)
- **Node** : 20 LTS minimum

### Données

- **Database** : PostgreSQL 16
- **ORM** : Prisma
- **Cache & Queue** : Redis 7 + BullMQ
- **Storage** : Cloudinary (images, médias)

### Auth & Sécurité

- **Auth** : Better Auth (email/password, Google OAuth, 2FA TOTP, magic links)
- **RBAC** : système custom avec rôles + permissions granulaires modifiables par Super Admin
- **Sessions** : stockées en DB via Prisma adapter

### UI

- **CSS** : Tailwind CSS v4
- **Components** : shadcn/ui (style new-york, base color zinc)
- **Icons** : Lucide React
- **Forms** : React Hook Form + Zod
- **Tables** : TanStack Table
- **Charts** : Recharts
- **Toasts** : Sonner
- **Command palette** : cmdk
- **Theme** : next-themes (dark mode complet)

### State Management

- **Client** : Zustand (pour state global UI)
- **Server** : TanStack Query (pour cache client)
- **URL** : nuqs ou URLSearchParams natif

### Communication externe

- **SMS** : Africa's Talking (Sénégal)
- **WhatsApp** : Brevo OU Meta Cloud API
- **Email** : Brevo

### Qualité & Observabilité

- **Logger** : Pino
- **Monitoring** : Sentry
- **Tests unitaires** : Vitest + Testing Library
- **Tests E2E** : Playwright
- **Linting** : ESLint + Prettier + Husky + lint-staged
- **Commits** : Commitlint (Conventional Commits)

### Déploiement

- **Hébergement cible** : VPS Ubuntu 22.04+ (PAS Vercel)
- **Process manager** : PM2
- **Reverse proxy** : Nginx
- **SSL** : Let's Encrypt (Certbot)
- **CI/CD** : GitHub Actions

---

## 📁 Architecture du projet

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, register, forgot-password
│   ├── (dashboard)/              # Routes authentifiées
│   │   ├── clients/
│   │   ├── articles/
│   │   ├── sales/
│   │   ├── campaigns/
│   │   ├── segments/
│   │   ├── automations/
│   │   ├── templates/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── admin/                # Users, roles, audit log
│   ├── api/
│   │   ├── auth/[...all]/        # Better Auth handler
│   │   └── webhooks/             # Callbacks providers
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                       # shadcn/ui (auto-géré)
│   ├── layout/                   # Sidebar, Header, Breadcrumbs
│   ├── forms/                    # Forms génériques
│   ├── data-table/               # DataTable réutilisable
│   ├── charts/                   # Wrappers Recharts
│   └── shared/                   # PermissionGate, EmptyState, etc.
│
├── features/                     # Modules métier (feature-based)
│   ├── clients/
│   │   ├── components/           # UI spécifique au module
│   │   ├── hooks/                # Hooks React
│   │   ├── server/               # Server actions, queries
│   │   ├── services/             # Business logic pure
│   │   ├── schemas/              # Zod schemas
│   │   └── types.ts              # Types métier
│   ├── articles/
│   ├── sales/
│   ├── campaigns/
│   ├── segments/
│   ├── automations/
│   ├── messaging/                # SMS, WhatsApp, Email
│   ├── analytics/
│   └── admin/
│
├── lib/
│   ├── auth/                     # Better Auth config + helpers
│   ├── db/                       # Prisma client
│   ├── redis/                    # Redis client
│   ├── queue/                    # BullMQ queues
│   ├── providers/                # Africa's Talking, Brevo
│   ├── cloudinary/               # Upload helpers
│   ├── logger/                   # Pino setup
│   ├── permissions/              # RBAC logic
│   └── utils/                    # cn(), formatters, etc.
│
├── server/
│   ├── actions/                  # Server actions globales
│   ├── middleware/               # Auth, RBAC, audit
│   └── workers/                  # Workers BullMQ
│
├── hooks/                        # Hooks globaux
├── types/                        # Types globaux
├── constants/                    # Routes, permissions, etc.
├── config/                       # env, app config
└── styles/                       # Styles globaux
```

---

## 📐 Conventions de Code

### Naming

- **PascalCase** : composants React, types, interfaces, enums
  - `ClientList.tsx`, `CampaignStatus`, `UserRole`
- **camelCase** : variables, fonctions, hooks
  - `getUserById`, `useClients`, `formatCurrency`
- **kebab-case** : noms de fichiers (sauf composants en PascalCase)
  - `client-service.ts`, `format-helpers.ts`
- **UPPER_SNAKE_CASE** : constantes
  - `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`

### Imports

- Toujours utiliser **alias absolu** `@/*` (jamais de chemins relatifs au-delà de `../`)
  - ✅ `import { db } from "@/lib/db"`
  - ❌ `import { db } from "../../../lib/db"`
- Ordre des imports :
  1. Modules externes (react, next, etc.)
  2. Imports internes (`@/...`)
  3. Imports relatifs (`./`)
  4. Types (en dernier, avec `import type`)

### TypeScript

- **Strict mode obligatoire** : zéro `any`, zéro `@ts-ignore`
- Utiliser `unknown` au lieu de `any` si type inconnu
- Préférer `interface` pour les objets publics, `type` pour les unions/intersections
- Toujours typer les retours de fonctions exportées
- Utiliser `satisfies` pour la validation de types sans perdre l'inférence
- Pas d'enum TypeScript natif → utiliser `as const` ou enum Prisma

### Composants React

- **Server Components par défaut** (ne pas mettre `"use client"` sauf si nécessaire)
- Utiliser `"use client"` uniquement si :
  - Hooks React (useState, useEffect, etc.)
  - Event handlers (onClick, onChange)
  - Browser APIs
- **Petits composants** : < 200 lignes idéalement
- **Props explicitement typées** :

```tsx
  interface ClientCardProps {
    client: ClientDTO;
    onEdit?: (id: string) => void;
  }

  export function ClientCard({ client, onEdit }: ClientCardProps) { ... }
```

- Préférer la **composition** à la prop drilling
- Co-localiser les composants spécifiques à un module dans `features/[module]/components/`

### Server Actions

- Toujours débuter par `"use server"`
- Toujours valider l'input avec Zod
- Toujours vérifier l'authentification et les permissions
- Toujours retourner un type cohérent (ex: `Result<T, E>` pattern)
- Toujours appeler `revalidatePath` ou `revalidateTag` après mutation

Exemple :

```ts
"use server";

import { z } from "zod";
import { checkPermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";

const createClientSchema = z.object({
  firstName: z.string().min(1),
  phone: z.string().regex(/^\+221[0-9]{9}$/),
  // ...
});

export async function createClient(input: z.infer<typeof createClientSchema>) {
  const user = await checkPermission("clients.create.all");
  const data = createClientSchema.parse(input);

  const client = await db.client.create({ data: { ...data, createdById: user.id } });

  await auditLog({ userId: user.id, action: "client.create", entityId: client.id });
  revalidatePath("/clients");

  return { success: true, data: client };
}
```

### Schémas Zod

- Définir dans `features/[module]/schemas/`
- Réutiliser entre client (form) et server (validation)
- Exporter le type inféré : `export type CreateClientInput = z.infer<typeof createClientSchema>`

### DTO Pattern

- **JAMAIS exposer directement les types Prisma au client**
- Créer des DTOs dans `features/[module]/types.ts`
- Mapper Prisma → DTO dans les services
- Le DTO n'expose que ce qui est nécessaire (pas de mots de passe, données sensibles, etc.)

### Gestion d'erreurs

- Utiliser un pattern Result quand pertinent :

```ts
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

- Capturer et logger les erreurs avec Pino
- Envoyer à Sentry les erreurs critiques
- Ne jamais exposer les stack traces au client en production

### Pas de Magic Strings

- Routes : `src/constants/routes.ts`
- Permissions : `src/lib/permissions/constants.ts`
- Messages d'erreur : `src/constants/messages.ts`
- Statuts : utiliser les enums Prisma

---

## 🔐 Sécurité — Règles Strictes

1. **Validation SYSTÉMATIQUE côté serveur** avec Zod, même si validé côté client
2. **Authentification** vérifiée sur chaque Server Action et API route
3. **Permissions RBAC** vérifiées avant toute action métier
4. **Rate limiting** sur endpoints sensibles (auth, exports, envois massifs)
5. **Sanitization** des inputs HTML (ne jamais faire `dangerouslySetInnerHTML` sans DOMPurify)
6. **Secrets** uniquement côté serveur, jamais dans `NEXT_PUBLIC_*`
7. **Audit log** sur toutes les actions sensibles (suppressions, modifications de permissions, envois de campagnes)
8. **CSRF** géré par Better Auth
9. **SQL injection** : impossible via Prisma, mais ne JAMAIS utiliser `$queryRawUnsafe`
10. **Headers de sécurité** configurés dans `next.config.ts`

---

## 🎨 UX — Règles

1. **Loading states** systématiques (Skeleton plutôt que spinner)
2. **Empty states** designés (jamais une page blanche)
3. **Error states** clairs avec actions de récupération
4. **Optimistic updates** quand pertinent (UX réactive)
5. **Toasts Sonner** pour feedback immédiat (succès/erreur)
6. **Confirmations** pour actions destructives (ConfirmDialog)
7. **Dark mode** complet sur chaque composant
8. **Responsive** mobile-first
9. **Accessibilité** : ARIA labels, navigation clavier, focus visible
10. **i18n ready** : tous les textes via constantes ou structure de traduction (jamais hardcodés en jsx)

---

## 🗄 Base de Données — Règles

### Conventions Prisma

- Noms de tables en **snake_case** via `@@map("table_name")`
- Noms de champs en **camelCase** dans Prisma, **snake_case** en DB via `@map`
- Tous les IDs en `cuid()`
- Toujours inclure `createdAt` et `updatedAt`
- Utiliser `deletedAt` pour soft delete (pas de DELETE physique sur données métier)
- Indexer les colonnes filtrées/triées fréquemment
- Utiliser `JSONB` pour métadonnées flexibles
- Utiliser PostgreSQL arrays (`String[]`) pour tags simples

### Migrations

- En dev : `pnpm db:migrate` (crée et applique)
- En prod : `pnpm db:migrate:deploy` (applique uniquement)
- Toujours nommer les migrations explicitement
- **Jamais modifier une migration déjà appliquée en prod**

### Queries

- Toujours `select` ou `include` explicite (jamais `findMany()` sans projection sur les grosses tables)
- Pagination obligatoire sur les listes (`take` + `skip` ou cursor-based)
- Utiliser transactions Prisma (`db.$transaction`) pour opérations atomiques

---

## 🚀 Performance

1. **Pagination** sur toutes les listes (défaut 20-50)
2. **Lazy loading** des composants lourds (`dynamic()`)
3. **Image optimization** : `next/image` + Cloudinary loader
4. **Indexes DB** sur colonnes filtrées
5. **React Query** stale time configuré intelligemment
6. **Server-side filtering/sorting** pour grandes listes
7. **Streaming** pour pages avec données lentes (loading.tsx + Suspense)
8. **Cache Next.js** : utiliser revalidate tags pour invalidation fine

---

## 🧪 Tests

### Stratégie

- **Tests unitaires** (Vitest) : services, helpers, schemas Zod
- **Tests d'intégration** (Vitest) : Server Actions avec DB test
- **Tests E2E** (Playwright) : parcours critiques (login, création client, envoi campagne)

### Couverture cible

- Services business logic : > 80%
- Server Actions : > 70%
- Composants UI : tests E2E plutôt qu'unitaires

---

## 📦 Workflow Git

### Branches

- `main` : production (protégée)
- `develop` : intégration
- `feature/[nom]` : nouvelles features
- `fix/[nom]` : corrections
- `hotfix/[nom]` : urgences prod

### Commits (Conventional Commits)

- `feat:` nouvelle feature
- `fix:` correction de bug
- `refactor:` refactoring sans changement fonctionnel
- `docs:` documentation
- `style:` formatage
- `test:` ajout/modification de tests
- `chore:` tâches techniques
- `perf:` amélioration de performance
- `ci:` CI/CD

Exemples :

```
feat(clients): add CSV import with deduplication
fix(campaigns): correct ROI calculation for partial deliveries
refactor(auth): migrate from NextAuth to Better Auth
```

### Pull Requests

- Titre clair en suivant Conventional Commits
- Description avec contexte + screenshots si UI
- Linké à une issue si applicable
- Tests passants
- Review obligatoire avant merge

---

## 🔧 Commandes Utiles

```bash
# Développement
pnpm dev                    # Démarre Next.js en dev (Turbo)
pnpm workers                # Démarre les workers BullMQ
pnpm build                  # Build production

# Base de données
pnpm db:push                # Push schema (dev rapide)
pnpm db:migrate             # Crée et applique migration
pnpm db:migrate:deploy      # Applique migrations (prod)
pnpm db:studio              # Ouvre Prisma Studio
pnpm db:seed                # Lance le seed
pnpm db:reset               # Reset complet de la DB

# Qualité
pnpm lint                   # Lance ESLint
pnpm lint:fix               # Corrige auto
pnpm format                 # Prettier
pnpm type-check             # Vérifie les types

# Tests
pnpm test                   # Vitest watch
pnpm test:e2e               # Playwright

# Docker (dev)
docker compose up -d        # Lance PostgreSQL + Redis
docker compose down         # Stop les services
```

---

## 🌍 Spécificités Sénégal / Mondial Home

### Téléphone

- Format E.164 obligatoire : `+221[opérateur][numéro]`
- Validation : regex `/^\+221[0-9]{9}$/`
- Affichage : `+221 77 123 45 67` (espaces tous les 2 chiffres après le préfixe)

### Paiements (PaymentMethod enum)

- `CASH` : espèces (très courant)
- `WAVE` : Wave Senegal (mobile money populaire)
- `ORANGE_MONEY` : Orange Money
- `FREE_MONEY` : Free Money
- `CARD` : carte bancaire
- `CHECK` : chèque
- `CREDIT` : vente à crédit (courant pour les meubles)
- `BANK_TRANSFER` : virement

### Langues

- `fr` : Français (par défaut)
- `wo` : Wolof (à venir)
- Communication client : respecter `client.language` et `client.preferredChannel`

### Géographie

- Pays par défaut : `SN`
- Champ `district` (quartier) important à Dakar (Almadies, Plateau, Mermoz, Ouakam, etc.)
- Régions du Sénégal : utiliser codes ISO

### Adresses

- Pas toujours de code postal au Sénégal
- Préférer `address` (libre) + `district` + `city`
- Champ `latitude`/`longitude` optionnel pour livraison

### Conformité légale

- **CDP Sénégal** (Commission de Protection des Données) — équivalent CNIL
- Loi 2008-12 sur la protection des données personnelles
- Consentement explicite obligatoire pour communications marketing
- Centre de préférences accessible via lien unique
- Droit à l'oubli : soft delete + anonymisation

---

## 🎨 Identité Visuelle Mondial Home

### Couleurs (à valider/ajuster avec le client)

- **Primary** : à définir (proposer une palette professionnelle adaptée à l'ameublement haut de gamme)
- **Accents** : tons chauds (terre cuite, bronze) cohérents avec l'univers de la décoration
- **Neutrals** : zinc/stone pour les fonds

### Typographie

- **Corps** : Inter (lisibilité)
- **Titres** : Plus Jakarta Sans ou Geist (modernité)
- **Mono** : JetBrains Mono (codes, références)

### Ton

- Professionnel mais chaleureux
- Tutoiement pour les communications client (selon préférence Mondial Home)
- Vocabulaire métier : "arrivage", "collection", "ensemble", "pièce", "ambiance"

---

## 📋 Modules CRM (CDC)

| Code | Module                 | Statut        |
| ---- | ---------------------- | ------------- |
| M1   | Gestion Clients        | À implémenter |
| M2   | Catalogue Articles     | À implémenter |
| M3   | Historique Ventes      | À implémenter |
| M4   | Éditeur Campagnes      | À implémenter |
| M5   | Historique Campagnes   | À implémenter |
| M6   | Canal SMS              | À implémenter |
| M7   | Canal WhatsApp         | À implémenter |
| M8   | Canal Email            | À implémenter |
| M9   | Automatisations        | À implémenter |
| M10  | Dashboard Analytics    | À implémenter |
| M11  | Bibliothèque Templates | À implémenter |
| M12  | Administration & RBAC  | À implémenter |

---

## ⚠️ Interdictions Strictes

1. ❌ Ne jamais utiliser `npm` ou `yarn` → toujours `pnpm`
2. ❌ Ne jamais utiliser `any` ou `@ts-ignore`
3. ❌ Ne jamais exposer les types Prisma au client (utiliser DTOs)
4. ❌ Ne jamais hardcoder de strings métier (utiliser constantes ou i18n)
5. ❌ Ne jamais commiter de secrets, clés API, ou `.env.local`
6. ❌ Ne jamais utiliser `getServerSideProps` ou Pages Router
7. ❌ Ne jamais faire de DELETE physique sur données métier (soft delete)
8. ❌ Ne jamais sauter la validation Zod côté serveur
9. ❌ Ne jamais oublier les vérifications de permissions RBAC
10. ❌ Ne jamais modifier une migration Prisma déjà appliquée en prod

---

## 🎯 Mindset Senior à appliquer

1. **Anticiper** : penser scalabilité, maintenance, montée en charge
2. **Documenter** : expliquer le "pourquoi", pas juste le "comment"
3. **Refuser les hacks** : préférer prendre 30 min de plus pour bien faire
4. **Tester ses suppositions** : ne jamais "supposer que ça marche"
5. **Communiquer** : expliquer ses choix d'architecture
6. **Refactor sans peur** : si quelque chose est sale, le nettoyer
7. **KISS** : la solution simple est presque toujours la bonne
8. **YAGNI** : ne pas sur-architecturer pour des besoins hypothétiques
9. **DRY raisonnable** : factoriser ce qui se répète vraiment
10. **Sécurité d'abord** : zéro compromis sur l'auth, les permissions, la validation

---

## 📞 Communication avec l'utilisateur

- **Toujours répondre en français**
- **Expliquer les choix d'architecture** quand pertinent
- **Prévenir avant les opérations longues** (installations massives, migrations)
- **Demander validation** avant d'installer des packages hors de la stack définie
- **Marquer les TODOs** clairement avec contexte : `// TODO: [contexte] - description`
- **Documenter les décisions** dans `docs/DECISIONS.md` (format ADR)
- **Suggérer des améliorations** quand pertinent, mais respecter les choix faits

---

## 🚦 Avant chaque intervention

Claude Code doit :

1. ✅ Lire ce fichier `CLAUDE.md`
2. ✅ Lire le `README.md` pour le statut actuel
3. ✅ Lire `docs/DECISIONS.md` pour comprendre les choix passés
4. ✅ Vérifier la structure existante avant de créer de nouveaux fichiers
5. ✅ Respecter les conventions de naming et d'architecture
6. ✅ Tester son code (au minimum `pnpm type-check` et `pnpm lint`)
7. ✅ Mettre à jour la documentation si nécessaire

---

## 🆘 En cas de doute

Si une décision n'est pas couverte par ce document :

1. Cherche dans `docs/DECISIONS.md` si une ADR existe
2. Cherche dans le code existant un pattern similaire
3. Demande à l'utilisateur plutôt que de deviner
4. Documente la nouvelle décision dans `docs/DECISIONS.md`

---

**Dernière mise à jour** : [Date d'initialisation du projet]
**Version du document** : 1.0
