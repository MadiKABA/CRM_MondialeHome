# Changelog

Toutes les modifications notables sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [Unreleased]

### Added

- Infrastructure complète : Next.js 16, TypeScript strict, Tailwind v4
- Authentification Better Auth (email/password, Google OAuth, 2FA, magic links)
- shadcn/ui avec palette Mondial Home (terracotta, sable, vert mousse)
- Sidebar collapsible avec navigation complète
- Middleware de protection des routes dashboard
- RBAC : constants, helpers server/client, PermissionGate
- Queue système BullMQ + Redis (6 queues)
- Logger Pino avec transport pretty en dev
- Providers Africa's Talking (SMS) + Brevo (Email)
- DataTable générique TanStack Table
- Composants utilitaires : EmptyState, ConfirmDialog, PageHeader
- Docker compose (PostgreSQL + Redis)
- Dockerfile multi-stage pour VPS
- PM2 ecosystem config
- Documentation complète (README, ARCHITECTURE, CONTRIBUTING, DECISIONS, DEPLOYMENT)
- Husky + lint-staged + commitlint
- Vitest + Playwright configurés
