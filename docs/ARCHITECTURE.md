# Architecture — CRM Mondial Home

## Principes directeurs

- **Clean Architecture légère** : séparation UI / Domain / Infrastructure
- **Feature-based modules** : chaque domaine métier dans `src/features/`
- **Server Components par défaut** : Client Components uniquement si état/interaction nécessaire
- **Server Actions pour mutations** : pas d'endpoints REST pour le CRUD interne
- **Zod partout** : validation à la frontière système (formulaires, actions, webhooks)

## Structure des dossiers

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── (auth)/             # Login, Register, Forgot
│   ├── (dashboard)/        # Interface CRM protégée
│   └── api/                # Route Handlers (auth + webhooks)
│
├── components/             # Composants réutilisables
│   ├── ui/                 # shadcn/ui (ne pas modifier directement)
│   ├── layout/             # Sidebar, Header, Breadcrumbs
│   ├── data-table/         # DataTable générique TanStack
│   ├── charts/             # Wrappers Recharts
│   └── shared/             # PermissionGate, EmptyState, etc.
│
├── features/               # Modules métier
│   └── [feature]/
│       ├── components/     # UI propre à ce module
│       ├── hooks/          # Hooks client (useQuery, useStore)
│       ├── server/         # Server Actions + queries DB
│       ├── services/       # Business logic pure (testable)
│       ├── schemas/        # Zod schemas partagés client/server
│       └── types.ts        # DTOs (jamais les types Prisma bruts)
│
├── lib/                    # Bibliothèques / clients tiers
│   ├── auth/               # Better Auth config + client React
│   ├── db/                 # Prisma singleton
│   ├── redis/              # ioredis singleton
│   ├── queue/              # BullMQ queues + job types
│   ├── providers/          # Africa's Talking, Brevo
│   ├── cloudinary/         # Upload helpers
│   ├── logger/             # Pino
│   ├── permissions/        # RBAC helpers
│   └── utils/              # Fonctions utilitaires
│
├── server/
│   ├── actions/            # Server Actions globales
│   ├── middleware/         # Middlewares custom
│   └── workers/            # Workers BullMQ
│
├── hooks/                  # Hooks React globaux
├── types/                  # Types TypeScript globaux
├── constants/              # Constantes (navigation, etc.)
└── config/
    └── env.ts              # Variables d'env validées (Zod)
```

## Flux de données

```
User Input
  └─► React Hook Form (Zod schema)
        └─► Server Action
              ├─► checkPermission() [RBAC]
              ├─► Parse & validate (Zod)
              ├─► Service layer (business logic)
              │     └─► Prisma (DB)
              └─► Response / revalidatePath
```

## RBAC

- Permissions stockées par rôle en DB
- Chargées en session via Better Auth
- `checkPermission()` côté serveur (Server Actions + API Routes)
- `usePermission()` côté client (UI conditionnelle)
- `PermissionGate` pour wrapper des sections JSX

## Queue System

6 queues BullMQ séparées par domaine :

- `campaigns` — envoi de campagnes
- `messages` — messages individuels
- `automations` — étapes d'automatisation
- `imports` — import CSV/XLSX
- `exports` — export données
- `webhooks` — traitement callbacks providers

Workers dans un process séparé (`pnpm workers`).
