# Docker + Auto-Deploy Setup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconstruir el deploy Docker desde cero en el VPS con auto-deploy SSH en cada push a `main`.

**Architecture:** Multi-stage Dockerfile (Alpine builder → Debian Slim runner para Prisma/OpenSSL), 4 servicios docker-compose (db/migrate/web/bot), GitHub Actions usa `appleboy/ssh-action` para SSH al VPS y ejecutar `git pull + docker compose up --build`. Secrets almacenados solo en `.env` del VPS — GitHub solo necesita la clave SSH privada.

**Tech Stack:** Docker, Docker Compose, GitHub Actions (appleboy/ssh-action@v1.0.3), node:20-slim, postgres:16-alpine

---

## Task 1: Generar clave SSH para GitHub Actions

**Archivos:** Solo comandos — no toca el repo.

**Step 1: Generar keypair ed25519**

```bash
ssh-keygen -t ed25519 -C "github-actions-finanzas" -f /tmp/finanzas-deploy-key -N ""
```

**Step 2: Ver las dos claves**

```bash
echo "=== PÚBLICA (→ VPS authorized_keys) ==="
cat /tmp/finanzas-deploy-key.pub

echo "=== PRIVADA (→ GitHub Secret VPS_SSH_KEY) ==="
cat /tmp/finanzas-deploy-key
```

**Step 3: Agregar la clave pública al VPS**

```bash
ssh root@62.72.26.125 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
ssh root@62.72.26.125 "cat >> ~/.ssh/authorized_keys" < /tmp/finanzas-deploy-key.pub
ssh root@62.72.26.125 "chmod 600 ~/.ssh/authorized_keys"
```

**Step 4: Verificar que el SSH funciona con la nueva clave**

```bash
ssh -i /tmp/finanzas-deploy-key root@62.72.26.125 "echo '✅ SSH funciona'"
```

Expected output: `✅ SSH funciona`

**Step 5: Agregar la clave privada a GitHub Secrets**

Ir a: https://github.com/ardepa710/finanzas-ardepa/settings/secrets/actions/new
- Name: `VPS_SSH_KEY`
- Value: contenido completo de `/tmp/finanzas-deploy-key` (incluyendo las líneas `-----BEGIN...` y `-----END...`)

**Step 6: Limpiar clave privada local**

```bash
rm /tmp/finanzas-deploy-key /tmp/finanzas-deploy-key.pub
```

---

## Task 2: Arreglar Dockerfile — runner a node:20-slim

**Archivos:**
- Modify: `Dockerfile`

**Step 1: Cambiar el runner stage**

Localizar la última etapa `FROM node:20-alpine AS runner` y reemplazar por `node:20-slim` con apt en lugar de apk.

El Dockerfile completo corregido:

```dockerfile
# ─────────────────────────────────────────────
#  FINANZAS ARDEPA — Dockerfile
#  Sirve para 3 servicios: web, bot, migrate
# ─────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────
# RUNNER: node:20-slim (Debian) — Prisma/OpenSSL compatible
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

**Step 2: Commit**

```bash
git add Dockerfile
git commit -m "fix: use node:20-slim for runner stage (Prisma/OpenSSL compatibility)"
```

---

## Task 3: Reemplazar deploy.yml — API Hostinger → SSH

**Archivos:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: Escribir el nuevo workflow**

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: SSH Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 62.72.26.125
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /opt/finanzas-ardepa
            git pull origin main
            docker compose up -d --build
            echo "✅ Deploy completado"
```

**Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: replace Hostinger API with SSH-based auto-deploy"
```

**Step 3: Push a main**

```bash
git push origin main
```

Este push no desplegará aún (el VPS no tiene el directorio). El workflow fallará — eso es esperado. Continuamos con Task 4.

---

## Task 4: Primer setup del VPS (manual, una sola vez)

> Todos los comandos se ejecutan en el VPS vía SSH.

**Step 1: SSH al VPS**

```bash
ssh root@62.72.26.125
```

**Step 2: Crear directorio y clonar repo**

```bash
mkdir -p /opt/finanzas-ardepa
git clone https://github.com/ardepa710/finanzas-ardepa.git /opt/finanzas-ardepa
cd /opt/finanzas-ardepa
```

**Step 3: Crear .env con las credenciales reales**

```bash
cat > /opt/finanzas-ardepa/.env << 'ENVEOF'
DB_USER=finanzas
DB_PASSWORD=CAMBIA_ESTA_PASSWORD_SEGURA
WEB_PORT=3000
ANTHROPIC_API_KEY=sk-ant-TU_KEY_AQUI
TELEGRAM_BOT_TOKEN=TU_BOT_TOKEN_AQUI
TELEGRAM_ALLOWED_CHAT_ID=TU_CHAT_ID_AQUI
ENVEOF
chmod 600 /opt/finanzas-ardepa/.env
```

> Reemplaza los valores con las credenciales reales (ver `~/.claude/.secrets.env` localmente).

**Step 4: Verificar que nginx-proxy network existe**

```bash
docker network ls | grep nginx-proxy
```

Expected: debe aparecer `nginx-proxy` en la lista. Si no existe:
```bash
docker network create nginx-proxy
```

**Step 5: Primer `docker compose up`**

```bash
cd /opt/finanzas-ardepa
docker compose up -d --build
```

Expected: Docker construye las imágenes (~3-5 min), luego los 4 servicios arrancan.

**Step 6: Verificar estado**

```bash
docker compose ps
```

Expected:
```
NAME                        STATUS
finanzas-ardepa-db-1        Up (healthy)
finanzas-ardepa-migrate-1   Exited (0)   ← correcto, terminó con éxito
finanzas-ardepa-web-1       Up
finanzas-ardepa-bot-1       Up
```

**Step 7: Ver logs si hay problemas**

```bash
docker compose logs web --tail=30
docker compose logs migrate --tail=30
```

---

## Task 5: Verificar el auto-deploy end-to-end

**Step 1: Hacer un commit de prueba (local)**

```bash
# En la máquina local:
git commit --allow-empty -m "ci: test auto-deploy"
git push origin main
```

**Step 2: Ver el workflow en GitHub Actions**

Ir a: https://github.com/ardepa710/finanzas-ardepa/actions

Expected: el workflow "Deploy to VPS" completa con ✅ en ~1-2 minutos.

**Step 3: Verificar en VPS**

```bash
ssh root@62.72.26.125 "cd /opt/finanzas-ardepa && docker compose ps"
```

Expected: todos los servicios Up.

**Step 4: Verificar la app**

Abrir en browser: `http://62.72.26.125:3000`

Expected: el dashboard de finanzas carga correctamente.

---

## Notas Importantes

- **El `.env` del VPS nunca se sube a git** (está en `.gitignore`)
- **GitHub solo necesita un secret**: `VPS_SSH_KEY` — las demás vars (DB_PASSWORD, etc.) viven en el VPS
- **`docker compose up -d --build`** reconstruye imágenes en cada deploy — añade ~2-3 min de downtime mínimo
- **`migrate` service** corre `prisma migrate deploy` en cada deploy — es idempotente (safe to run multiple times)
- **Directorio VPS**: `/opt/finanzas-ardepa` en lugar del anterior `/tmp/finanzas-deploy` (más estable, /tmp puede vaciarse)
