# CRM Mondial Home — Instructions du Projet

## 🏢 Contexte

Développement d'une plateforme CRM sur mesure pour **Mondial Home**,
enseigne d'ameublement et décoration intérieure à Dakar, Sénégal.
Développé par **Active Solution** (Digital Service).

Contrat signé : 460 000 FCFA — Contrat n° AS-MH-2026-001
Acompte : 40% à la signature, 30% livraison intermédiaire, 30% finale.

---

## 🛠 Stack technique

| Composant        | Technologie                                  |
| ---------------- | -------------------------------------------- |
| Framework        | Next.js 15 (App Router + TypeScript strict)  |
| Base de données  | PostgreSQL 16 via Neon (Prisma ORM)          |
| Authentification | Better Auth                                  |
| UI               | shadcn/ui (style new-york) + Tailwind CSS v4 |
| Icônes           | Lucide React                                 |
| Forms            | React Hook Form + Zod                        |
| Charts           | Recharts                                     |
| Queue            | BullMQ + Redis (ioredis / Upstash)           |
| SMS              | Africa's Talking (Sénégal)                   |
| Email            | Resend + Svix (webhooks)                     |
| Stockage médias  | Cloudinary                                   |
| Logger           | Pino (avec stdSerializers)                   |
| Toasts           | Sonner                                       |
| Déploiement      | Render (Web Service + Background Worker)     |
| Package manager  | pnpm UNIQUEMENT (jamais npm/yarn)            |
| ORM              | Prisma avec migrations versionnées           |

---

## 📦 Modules — État d'avancement

| Code   | Module                                                                    | Statut     |
| ------ | ------------------------------------------------------------------------- | ---------- |
| M11    | Administration & RBAC (8 rôles, 80+ permissions, audit log)               | ✅ Terminé |
| Profil | Profil utilisateur (infos, password, avatar Cloudinary, sessions)         | ✅ Terminé |
| M1     | Gestion des Clients (CRUD, import CSV/Excel, export, segmentation)        | ✅ Terminé |
| M1 RFM | Score RFM automatique (worker BullMQ nightly 02:00 UTC)                   | ✅ Terminé |
| M1 Seg | Segmentation (groupes statiques + segments dynamiques + critères produit) | ✅ Terminé |
| M2     | Catalogue (catégories hiérarchiques + articles + images Cloudinary)       | ✅ Terminé |
| M3     | Ventes (CRUD, paiements Wave/OM/Cash, import, export)                     | ✅ Terminé |
| M10    | Templates Email (structure réutilisable, variables, preview live)         | ✅ Terminé |
| M9     | Dashboard Analytics (KPIs, Recharts, cache Redis stale-while-revalidate)  | ✅ Terminé |
| M8     | Email masse (Resend, BullMQ worker, webhooks delivered/opened/clicked)    | ✅ Terminé |
| M4     | Campagnes Email (wizard 6 étapes, preview, upload Cloudinary différé)     | ✅ Terminé |
| M6     | Canal SMS Africa's Talking                                                | ⏳ À faire |
| M7     | Canal WhatsApp Meta                                                       | ⏳ À faire |
| M5     | Historique campagnes                                                      | ⏳ À faire |

---

## 🗂 Architecture des dossiers

```
src/
├── app/
│   ├── (auth)/                   # Login, forgot-password
│   ├── (dashboard)/              # Pages protégées
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard M9
│   │   ├── clients/              # M1
│   │   ├── segments/             # M1 Segmentation
│   │   ├── catalogue/            # M2
│   │   ├── ventes/               # M3
│   │   ├── templates/            # M10
│   │   ├── campagnes/            # M4
│   │   ├── admin/                # M11
│   │   └── profile/
│   └── api/
│       ├── health/route.ts       # GET /api/health
│       ├── upload/banner/route.ts # POST upload image locale (test)
│       └── webhooks/resend/route.ts # POST webhook Resend (svix)
│
├── features/
│   ├── clients/
│   ├── segments/
│   ├── catalogue/
│   ├── ventes/
│   ├── templates/
│   │   ├── types.ts              # BuildEmailOptions, CampaignArticle,
│   │   │                         # FreeImage, BannerData, CampaignContentMode
│   │   ├── lib/
│   │   │   ├── html-builder.ts   # buildEmailHtml() — Option B bannière
│   │   │   ├── renderer.ts       # renderText(), buildClientData()
│   │   │   └── variables.ts      # EMAIL_VARIABLES catalogue
│   │   ├── schemas/
│   │   └── server/
│   ├── campaigns/
│   │   ├── types.ts
│   │   ├── lib/
│   │   │   └── cloudinary-upload.ts # Upload différé au moment de création
│   │   ├── components/
│   │   │   ├── campaign-form/   # Wizard 6 étapes
│   │   │   │   ├── step-info.tsx
│   │   │   │   ├── step-template.tsx
│   │   │   │   ├── step-content.tsx
│   │   │   │   ├── step-schedule.tsx
│   │   │   │   ├── step-preview.tsx
│   │   │   │   └── step-review.tsx
│   │   │   ├── image-picker.tsx     # Sélection image (blob URL, pas upload)
│   │   │   ├── banner-picker.tsx    # Sélection bannière (blob URL)
│   │   │   └── campaign-email-preview.tsx
│   │   └── server/
│   ├── email-mass/
│   ├── rfm/
│   └── dashboard/
│       └── lib/cache.ts          # PAS de "server-only" (utilisé par worker)
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── redis/index.ts            # Client Redis singleton + graceful degradation
│   ├── rate-limit.ts
│   ├── email/
│   ├── permissions/
│   └── logger/                   # Pino avec stdSerializers
│
└── server/
    └── workers/
        ├── index.ts              # PAS de --env-file .env.local (Render)
        ├── rfm.worker.ts
        ├── email.worker.ts
        └── campaign.worker.ts
```

---

## 🎨 Identité visuelle Mondial Home

### Palette de couleurs

```css
--color-cream: oklch(0.96 0.015 80) --color-cream-darker: oklch(0.92 0.02 75)
  --color-gold: oklch(0.71 0.1 80) --color-gold-deep: oklch(0.58 0.12 70)
  /* CTA principal */ --color-gold-darker: oklch(0.48 0.1 65) /* Hover CTA */
  --color-gold-light: oklch(0.85 0.06 80) --color-text-primary: oklch(0.25 0.02 60)
  --color-text-secondary: oklch(0.45 0.015 60) --color-text-muted: oklch(0.6 0.01 60);
```

### Règles couleurs STRICTES

- ✅ CTA : `bg-gold-deep hover:bg-gold-darker text-white`
- ✅ Secondaire : `border border-cream-darker hover:bg-cream`
- ❌ INTERDIT : `bg-black`, `bg-blue-*`, `bg-green-*` sur CTAs

### Typographie

- Titres : **Playfair Display** (serif)
- Corps : **Inter** (sans-serif)

---

## 🏗 Architecture des emails (html-builder.ts)

### Règles fondamentales

```
✅ Tables HTML (pas de flexbox/grid — compatibilité Outlook/Gmail)
✅ Inline CSS uniquement (pas de classes Tailwind dans les emails)
✅ Largeur max 600px
✅ Compatible Gmail, Outlook, Apple Mail, Mobile
```

### Structure d'un email (Option B bannière)

```
[TOP BAR doré — MONDIAL HOME DAKAR]
[HEADER LOGO — Mondial Home · Mobilier & Décoration]

Si image bannière uploadée :
  [IMAGE BANNIÈRE Cloudinary — remplace le header coloré]

Si PAS d'image bannière :
  [HEADER COLORÉ — 🚚 NOUVELLES ARRIVÉES (fallback du template)]

[Introduction (variables client remplacées)]
[Images libres Cloudinary — 1 par ligne (full) ou 2 par ligne (half)]
[Articles catalogue — 2 par ligne (desktop), 1 par ligne (mobile)]
[Conclusion]
[Bouton CTA doré]
[Footer Mondial Home]
```

### Grille articles dans l'email

```
RÈGLE : 2 articles par ligne MAXIMUM (colonnes fixes 250px, table-based)
→ Cards compactes (pas trop hautes)
→ Hauteur image : 160px
→ Police prix : 16px bold doré
→ SANS box-shadow sur les cards (interdit)
→ Bordure fine : 1px solid #EEE6D8
→ Border-radius : 8px

1 article  → centré, max 250px de large
2 articles → 2 colonnes de 250px
3 articles → ligne 1 : 2 articles / ligne 2 : 1 centré
4 articles → 2 lignes de 2
```

### Séparation Template / Campagne

```
TEMPLATE stocke (structure réutilisable) :
→ name, category, productCategory, subject,
  preheader, content, conclusion, variables[]
→ PAS de produits, PAS de CTA, PAS de bannière

CAMPAGNE fournit à chaque utilisation :
→ articles[] (depuis catalogue M2)
→ freeImages[] (images libres Cloudinary)
→ contentMode ("articles" | "images" | "both")
→ bannerImageUrl + bannerLinkUrl (Cloudinary)
→ ctaText + ctaUrl
→ campaignVars (reduction, dateExpiration...)
```

---

## 📧 Architecture Email (M8 + M4)

### Upload Cloudinary — Pattern différé

```
PENDANT le wizard :
→ Sélection image → blob URL locale (preview immédiate)
→ PAS d'upload → pas d'images orphelines sur Cloudinary

Au clic "Créer la campagne" :
→ uploadCampaignImages() uploadé toutes les images
→ URLs Cloudinary remplacent les blob URLs
→ campaignData sauvegardé avec URLs permanentes en DB
```

### Sécurité avant sauvegarde

```typescript
// Dans createCampaign() — OBLIGATOIRE
if (bannerUrl?.startsWith("blob:")) {
  return { success: false, error: "Images non uploadées" };
}
```

### Worker email

```
QUEUE_NAME = "email-send"
BATCH_SIZE = 50 emails
DELAY_BETWEEN_EMAILS = 120ms  // rate limit Resend 10 req/s
DELAY_BETWEEN_BATCHES = 1000ms
sanitizeTagValue() sur tous les tags Resend (ASCII uniquement)
```

### Webhooks Resend (svix)

```
Route : /api/webhooks/resend
Événements : delivered, opened, clicked, bounced
→ Met à jour MessageLog.status
→ Incrémente EmailBatch compteurs
→ Sync stats Campaign
```

---

## 🔴 Bugs résolus à ne pas reproduire

```
1. getRedisClient export manquant
   → Aligner les exports de src/lib/redis/index.ts

2. EmailCampaignData ReferenceError "use server"
   → Toujours "import type" pour les interfaces dans les Server Actions

3. --env-file .env.local dans le script workers
   → Sur Render : "workers": "tsx src/server/workers/index.ts"
   → En local  : "workers:dev": "tsx --env-file .env.local watch src/server/workers/index.ts"

4. import "server-only" dans cache.ts
   → INTERDIT dans les fichiers importés par le worker tsx
   → Supprimer server-only de tout fichier dans la chaîne du worker

5. ZodError datetime (scheduledAt)
   → input type="datetime-local" → new Date(val).toISOString() avant Zod
   → z.string().datetime({ offset: true })

6. Resend tags invalides
   → sanitizeTagValue() : remplacer [^a-zA-Z0-9_-] par "_"

7. Rate limit Resend
   → 120ms de délai entre chaque email individuel
   → 1s entre les batches de 50

8. Pino erreurs invisibles en prod
   → serializers: { ...pino.stdSerializers, err: pino.stdSerializers.err }

9. Upstash quota 500 000 req/jour
   → Augmenter les TTL du cache dashboard
   → Ou passer en Pay-as-you-go

10. Blob URLs envoyées au serveur pour preview
    → Les blob URLs ne fonctionnent que côté navigateur
    → Pour la preview : afficher les blobs localement en UI
    → Pour l'envoi : upload Cloudinary obligatoire avant sauvegarde
```

---

## 🔐 RBAC — Architecture permissions

### 3 niveaux

```
User → UserRole → Role → RolePermission → Permission
User → UserPermission (surcharge individuelle)
```

### Règle d'import CRITIQUE

```typescript
// ✅ Server Components / Server Actions
import { hasPermission, requirePermission } from "@/lib/permissions/server";

// ✅ Client Components
import { checkPermission } from "@/lib/permissions"; // index.ts = client-safe

// ❌ JAMAIS server.ts depuis un Client Component
```

### Sécurité Server Actions — ordre obligatoire

```
1. Auth (session)
2. Rate limit
3. requirePermission (RBAC)
4. Validation Zod
5. Guards métier
6. DB
7. Audit log
8. revalidatePath
9. Return Result<T>
```

---

## 🗄 Base de données

### Conventions Prisma

```
IDs          : @default(cuid())
Tables       : @@map("snake_case")
Soft delete  : deletedAt DateTime?
Timestamps   : createdAt + updatedAt obligatoires
JSONB        : pour campaignData, criteria, metadata
```

### Modèles clés

```
Client         → rfmScore, rfmRecency, rfmFrequency, rfmMonetary
Segment        → type (STATIC/DYNAMIC), criteria (Json), memberCount
Campaign       → status, channel, campaignData (Json), emailBatchId
EmailBatch     → status, sentCount, deliveredCount, openedCount...
MessageLog     → resendId (unique), status, sentAt, openedAt...
Template       → channel, category, subject, content, variables[]
```

---

## ⚙️ Variables d'environnement

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://crm-mondiale-home.onrender.com

# Redis (Upstash)
REDIS_URL=rediss://default:xxx@accurate-dove-155255.upstash.io:6379

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=crm@mondialhomesn.com
RESEND_FROM_NAME=Mondial Home CRM
RESEND_WEBHOOK_SECRET=whsec_xxx

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://crm-mondiale-home.onrender.com
NODE_ENV=production
```

---

## 📜 Scripts

```bash
pnpm dev              # Dev avec Turbo
pnpm build            # Build prod
pnpm start            # node .next/standalone/server.js (Render)
pnpm type-check       # TypeScript strict
pnpm lint             # ESLint
pnpm db:migrate       # Créer + appliquer migration
pnpm db:seed          # Données initiales
pnpm db:studio        # Prisma Studio
pnpm workers          # Workers Render (sans --env-file)
pnpm workers:dev      # Workers local (avec --env-file .env.local)
```

---

## 🌍 Spécificités Sénégal

```
Devise       : XOF (FCFA)
Timezone     : Africa/Dakar (UTC+0)
Téléphone    : +221XXXXXXXXX (9 chiffres)
Mobile money : Wave (leader), Orange Money, Free Money
Langues      : Français (défaut), Wolof (prévu)
Conformité   : Loi n°2008-12 CDP Sénégal
```

---

## 📐 Conventions de code

```
TypeScript   : strict, zéro any, zéro @ts-ignore
Commits      : feat(module): / fix(module): / chore: / perf:
Imports      : absolus via @/* uniquement
Composants   : < 200 lignes, Server Components par défaut
"use client" : seulement si hooks React / events / Browser APIs
Result<T>    : pattern universel pour les Server Actions
```

### Interdictions absolues

```
❌ npm ou yarn
❌ any / @ts-ignore
❌ DELETE physique sur données métier
❌ Validation uniquement client-side
❌ Mutation sans RBAC
❌ bg-black / bg-blue-* / bg-green-* sur CTAs
❌ import "server-only" dans les fichiers utilisés par les workers
❌ blob URL sauvegardée en DB
❌ Co-author Claude dans les commits
❌ API routes (sauf webhooks externes)
❌ box-shadow sur les cards produits dans les emails
```

---

## ✅ Prochaines étapes

```
M6  SMS Africa's Talking     ← prochain
M7  WhatsApp Meta            ← soumettre templates maintenant
M5  Historique campagnes
🎉  Livraison finale → 138 000 FCFA
```
