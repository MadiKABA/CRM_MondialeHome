# Guide de déploiement — VPS Ubuntu

## Prérequis VPS

- Ubuntu 22.04+
- Node.js 22 (via nvm)
- pnpm
- PM2
- Nginx
- PostgreSQL 16
- Redis 7
- Certbot (SSL)

## Configuration serveur

### 1. Installer Node.js 22

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. Installer PM2

```bash
npm install -g pm2
pm2 startup
```

### 3. Créer l'utilisateur deploy

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /var/www/crm-mondial-home
chown deploy:deploy /var/www/crm-mondial-home
mkdir -p /var/log/pm2
chown deploy:deploy /var/log/pm2
```

### 4. PostgreSQL

```bash
sudo apt install postgresql-16
sudo -u postgres psql
CREATE USER crm WITH PASSWORD 'strongpassword';
CREATE DATABASE mondialhome OWNER crm;
\q
```

### 5. Redis

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
```

## Déploiement initial

```bash
# Sur le serveur, en tant que deploy
cd /var/www/crm-mondial-home
git clone <repo> .

cp .env.example .env.local
# Éditer .env.local avec les vraies valeurs de prod

pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
pnpm build

# Copier les assets standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Démarrer avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

## Configuration Nginx

```nginx
server {
    server_name crm.mondialhome.sn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo certbot --nginx -d crm.mondialhome.sn
```

## Déploiements suivants

```bash
cd /var/www/crm-mondial-home
./scripts/deploy.sh
```

## Monitoring

```bash
pm2 status           # État des process
pm2 logs             # Logs en temps réel
pm2 monit            # Dashboard
```
