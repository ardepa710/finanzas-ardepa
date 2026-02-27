# ─────────────────────────────────────────────
#  FINANZAS ARDEPA — Dockerfile
#  Sirve para 3 servicios: web, bot, migrate
# ─────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema para Prisma y pg
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
# npm ci instala exactamente lo del lockfile (reproducible)
RUN npm ci

# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Copiar node_modules ya instalados
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma (lee schema.prisma, no necesita DB)
RUN npx prisma generate

# Build Next.js (necesita DATABASE_URL como placeholder para que no falle)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar todo desde el builder (incluyendo node_modules para tsx y prisma)
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

# Por defecto arranca la app web (el bot usa CMD override en docker-compose)
CMD ["npm", "start"]
