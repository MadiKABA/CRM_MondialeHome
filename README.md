# CRM Mondial Home

Plateforme CRM pour Mondial Home — enseigne d'ameublement à Dakar, Sénégal.

## Stack

| Couche           | Technologie                                  |
| ---------------- | -------------------------------------------- |
| Framework        | Next.js 16 (App Router + TypeScript strict)  |
| Base de données  | PostgreSQL 16 via Prisma ORM                 |
| Authentification | Better Auth (2FA, magic links, OAuth Google) |
| UI               | shadcn/ui + Tailwind CSS v4                  |
| Forms            | React Hook Form + Zod                        |
| State            | Zustand + TanStack Query                     |
| Tables           | TanStack Table                               |
| Charts           | Recharts                                     |
| Queue            | BullMQ + Redis                               |
| SMS              | Africa's Talking                             |
| Email/WA         | Brevo                                        |
| Upload           | Cloudinary                                   |
| Logging          | Pino                                         |
| Monitoring       | Sentry                                       |
| Tests            | Vitest + Playwright                          |

## Prérequis

- Node.js 22+
- pnpm 10+
- Docker (pour PostgreSQL + Redis en dev)

## Installation

```bash
# 1. Cloner et installer
git clone <repo>
cd CRMMondialHome
pnpm install

# 2. Copier et remplir les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos vraies valeurs

# 3. Démarrer PostgreSQL + Redis
docker compose up -d

# 4. Générer le client Prisma
pnpm db:generate

# 5. Appliquer le schéma (après l'avoir fourni)
pnpm db:push

# 6. Seed initial
pnpm db:seed

# 7. Lancer l'app
pnpm dev
```

## Scripts disponibles

```bash
pnpm dev              # Dev avec Turbopack
pnpm build            # Build production
pnpm start            # Serveur production
pnpm lint             # Lint
pnpm lint:fix         # Lint + fix
pnpm format           # Prettier
pnpm type-check       # TypeScript check

pnpm db:generate      # Générer client Prisma
pnpm db:push          # Appliquer schéma (dev)
pnpm db:migrate       # Migration dev
pnpm db:migrate:deploy # Migration production
pnpm db:studio        # Prisma Studio
pnpm db:seed          # Seed initial
pnpm db:reset         # Reset BDD (attention !)

pnpm test             # Tests unitaires (Vitest)
pnpm test:e2e         # Tests E2E (Playwright)

pnpm workers          # Démarrer les workers BullMQ
```

## Architecture

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Déploiement

Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Conventions

Voir [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
