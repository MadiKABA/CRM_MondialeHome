#!/usr/bin/env bash
# ============================================================
# SCRIPT DE DÉPLOIEMENT — CRM Mondial Home
# Usage: ./scripts/deploy.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/crm-mondial-home"
DEPLOY_USER="deploy"
PNPM_BIN="$(which pnpm)"

echo "🚀 Déploiement CRM Mondial Home..."

# 1. Pull latest code
git pull origin main

# 2. Install dependencies
$PNPM_BIN install --frozen-lockfile

# 3. Generate Prisma client
$PNPM_BIN prisma generate

# 4. Run DB migrations
$PNPM_BIN prisma migrate deploy

# 5. Build
$PNPM_BIN build

# 6. Copy static files
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 7. Reload PM2
pm2 reload ecosystem.config.js --env production --update-env

echo "✅ Déploiement terminé !"
