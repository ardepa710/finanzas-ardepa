# FINANZAS ARDEPA — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir una app de finanzas personales local con Next.js que gestiona créditos, registra gastos vía Telegram, calcula ahorro inteligente por quincena y muestra un dashboard con gráficas.

**Architecture:** Monolito Next.js 15 App Router — el bot de Telegram se maneja como API route con webhook, Prisma v6 conecta a PostgreSQL local. La lógica financiera crítica vive en `src/lib/savings-calculator.ts` con tests unitarios con Vitest.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Prisma v6, PostgreSQL local, Recharts, node-telegram-bot-api, Vitest

---

## Pre-requisitos

- Node.js 20+ instalado
- PostgreSQL local corriendo en puerto 5432
- Cuenta de Telegram con un bot creado via @BotFather (guardar el token)
- ngrok instalado (`npm i -g ngrok` o descargado de ngrok.com)

---

### Task 1: Scaffolding del proyecto

**Files:**
- Create: `finanzas-ardepa/` (directorio raíz — ya existe)
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, etc. (via CLI)

**Step 1: Inicializar Next.js en el directorio existente**

```bash
cd /home/ardepa/finanzas-ardepa
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Responder `Yes` a todo lo que pregunte. Cuando pregunte si continuar en directorio no vacío (por `docs/`), responder `Yes`.

**Step 2: Instalar dependencias del proyecto**

```bash
npm install prisma @prisma/client recharts node-telegram-bot-api
npm install -D vitest @vitejs/plugin-react @types/node-telegram-bot-api
```

**Step 3: Verificar que Next.js arranca**

```bash
npm run dev
```

Abrir http://localhost:3000 — debe mostrar la página default de Next.js.

**Step 4: Commit inicial**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 + Tailwind CSS v4 project"
```

---

### Task 2: Configurar PostgreSQL y Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env.local`
- Create: `src/lib/prisma.ts`

**Step 1: Crear la base de datos PostgreSQL**

```bash
psql -U postgres -c "CREATE DATABASE finanzas_ardepa;"
```

Si PostgreSQL requiere contraseña, usar: `psql -U postgres -W`

**Step 2: Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Esto crea `prisma/schema.prisma` y `.env` con `DATABASE_URL`.

**Step 3: Mover variables a .env.local y actualizar schema**

Crear `.env.local` con:
```
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/finanzas_ardepa"
TELEGRAM_BOT_TOKEN="TU_TOKEN_DEL_BOT"
TELEGRAM_ALLOWED_CHAT_ID="TU_CHAT_ID"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Para obtener tu `TELEGRAM_ALLOWED_CHAT_ID`: habla con @userinfobot en Telegram.

Eliminar `.env` (ya no se usa) y agregar a `.gitignore`:
```
.env
.env.local
```

**Step 4: Escribir el schema completo en `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TipoCredito {
  PRESTAMO
  TARJETA
}

enum CategoriaGasto {
  ALIMENTACION
  TRANSPORTE
  ENTRETENIMIENTO
  SALUD
  SERVICIOS
  OTROS
}

enum FuenteGasto {
  TELEGRAM
  WEB
}

model Credito {
  id           String      @id @default(cuid())
  nombre       String
  tipo         TipoCredito
  montoTotal   Decimal     @db.Decimal(10, 2)
  saldoActual  Decimal     @db.Decimal(10, 2)
  pagoMensual  Decimal     @db.Decimal(10, 2)
  pagoMinimo   Decimal?    @db.Decimal(10, 2)
  fechaCorte   Int?        // día del mes 1-31 (solo TARJETA)
  diaPago      Int         // día del mes límite de pago 1-31
  tasaInteres  Decimal?    @db.Decimal(5, 2)
  activo       Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Gasto {
  id          String         @id @default(cuid())
  descripcion String
  monto       Decimal        @db.Decimal(10, 2)
  categoria   CategoriaGasto
  fecha       DateTime       @default(now())
  fuente      FuenteGasto    @default(WEB)
  createdAt   DateTime       @default(now())
}

model ConfiguracionSalario {
  id                   Int      @id @default(1)
  monto                Decimal  @db.Decimal(10, 2)
  fechaBaseProximoPago DateTime // un lunes de pago conocido como referencia
  updatedAt            DateTime @updatedAt
}
```

**Step 5: Ejecutar migración**

```bash
npx prisma migrate dev --name init
```

Expected output: `✔ Generated Prisma Client`

**Step 6: Seed inicial — configuración de salario**

Crear `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Fecha base: próximo lunes de pago conocido (ajusta esta fecha)
  await prisma.configuracionSalario.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      monto: 22000,
      // Cambia esta fecha al próximo lunes que recibes pago
      fechaBaseProximoPago: new Date('2026-03-02T00:00:00.000Z'),
    },
  })
  console.log('Seed completado')
}

main().finally(() => prisma.$disconnect())
```

Agregar a `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

```bash
npm install -D ts-node
npx prisma db seed
```

**Step 7: Crear cliente Prisma singleton en `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 8: Verificar conexión**

```bash
npx prisma studio
```

Debe abrir en http://localhost:5555 mostrando las tablas Credito, Gasto, ConfiguracionSalario.

**Step 9: Commit**

```bash
git add prisma/ src/lib/prisma.ts .gitignore
git commit -m "feat: setup Prisma v6 schema con Credito, Gasto, ConfiguracionSalario"
```

---

### Task 3: Calculadora de Ahorro (lógica financiera core)

Esta es la pieza más importante. Se testea primero.

**Files:**
- Create: `src/lib/savings-calculator.ts`
- Create: `src/lib/savings-calculator.test.ts`
- Create: `vitest.config.ts`

**Step 1: Configurar Vitest**

Crear `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Agregar a `package.json` en `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 2: Escribir los tests PRIMERO**

Crear `src/lib/savings-calculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import {
  getNextPaydays,
  calcularAhorroPorCredito,
  calcularResumenAhorro,
} from './savings-calculator'

describe('getNextPaydays', () => {
  it('retorna la fecha base si es en el futuro', () => {
    const base = new Date('2026-03-02') // lunes
    const hoy = new Date('2026-02-26')
    const pagos = getNextPaydays(base, hoy, 3)
    expect(pagos).toHaveLength(3)
    expect(pagos[0].toISOString().slice(0, 10)).toBe('2026-03-02')
    expect(pagos[1].toISOString().slice(0, 10)).toBe('2026-03-16')
    expect(pagos[2].toISOString().slice(0, 10)).toBe('2026-03-30')
  })

  it('salta fechas pasadas y retorna las próximas', () => {
    const base = new Date('2026-03-02')
    const hoy = new Date('2026-03-10') // entre primer y segundo pago
    const pagos = getNextPaydays(base, hoy, 2)
    expect(pagos[0].toISOString().slice(0, 10)).toBe('2026-03-16')
  })
})

describe('calcularAhorroPorCredito', () => {
  it('distribuye pago de crédito entre N quincenas hasta fecha límite', () => {
    const credito = {
      nombre: 'Crédito Nómina',
      pagoMensual: 2000,
      diaPago: 15, // paga el 15 de cada mes
    }
    const pagos = [
      new Date('2026-03-02'),
      new Date('2026-03-16'),
    ]
    const resultado = calcularAhorroPorCredito(credito, pagos, new Date('2026-03-15'))
    // Solo hay 1 quincena antes del pago (2026-03-02), entonces aparta todo en ese pago
    expect(resultado.porPago[0]).toBe(2000)
  })

  it('distribuye equitativamente entre 2 quincenas', () => {
    const credito = {
      nombre: 'Tarjeta',
      pagoMensual: 3000,
      diaPago: 20,
    }
    const pagos = [
      new Date('2026-03-02'),
      new Date('2026-03-16'),
    ]
    const resultado = calcularAhorroPorCredito(credito, pagos, new Date('2026-03-19'))
    expect(resultado.porPago[0]).toBeCloseTo(1500)
    expect(resultado.porPago[1]).toBeCloseTo(1500)
  })
})

describe('calcularResumenAhorro', () => {
  it('suma el ahorro de múltiples créditos para el próximo pago', () => {
    const creditos = [
      { nombre: 'Crédito A', pagoMensual: 2000, diaPago: 10 },
      { nombre: 'Crédito B', pagoMensual: 1500, diaPago: 25 },
    ]
    const resultado = calcularResumenAhorro(
      creditos,
      new Date('2026-03-02'), // fecha base
      new Date('2026-02-26'), // hoy
    )
    expect(resultado.totalProximoPago).toBeGreaterThan(0)
    expect(resultado.desglose).toHaveLength(2)
  })
})
```

**Step 3: Correr los tests — deben FALLAR**

```bash
npm test
```

Expected: FAIL — `Cannot find module './savings-calculator'`

**Step 4: Implementar `src/lib/savings-calculator.ts`**

```typescript
export interface CreditoInput {
  nombre: string
  pagoMensual: number
  diaPago: number // día del mes 1-31
}

export interface AhorroPorCredito {
  nombre: string
  montoTotal: number
  porPago: number[]
}

export interface ResumenAhorro {
  totalProximoPago: number
  desglose: AhorroPorCredito[]
  proximaFechaPago: Date
  diasParaProximoPago: number
  salarioDisponible: number // salario - totalProximoPago
}

/**
 * Genera las próximas N fechas de pago de salario.
 * El salario se paga cada 14 días (lunes alterno) desde una fecha base.
 */
export function getNextPaydays(
  fechaBase: Date,
  hoy: Date,
  cantidad: number
): Date[] {
  const pagos: Date[] = []
  let cursor = new Date(fechaBase)

  // Avanzar hasta el primer pago futuro desde hoy
  while (cursor <= hoy) {
    cursor = new Date(cursor.getTime() + 14 * 24 * 60 * 60 * 1000)
  }

  for (let i = 0; i < cantidad; i++) {
    pagos.push(new Date(cursor))
    cursor = new Date(cursor.getTime() + 14 * 24 * 60 * 60 * 1000)
  }

  return pagos
}

/**
 * Determina la próxima fecha límite de pago de un crédito
 * dado el día del mes en que vence.
 */
function getProximaFechaVencimiento(diaPago: number, hoy: Date): Date {
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth()
  const diaHoy = hoy.getDate()

  if (diaPago > diaHoy) {
    return new Date(anio, mes, diaPago)
  } else {
    // Ya pasó este mes, es el mes siguiente
    return new Date(anio, mes + 1, diaPago)
  }
}

/**
 * Calcula cuánto apartar de cada pago de salario para cubrir un crédito.
 */
export function calcularAhorroPorCredito(
  credito: CreditoInput,
  proximosPagos: Date[],
  fechaVencimiento: Date
): AhorroPorCredito {
  // Pagos de salario que caen ANTES de la fecha de vencimiento
  const pagosAntesDeVencer = proximosPagos.filter(p => p < fechaVencimiento)

  const n = pagosAntesDeVencer.length || 1 // al menos 1
  const porPago = Array(proximosPagos.length).fill(0)

  // Distribuir equitativamente entre los pagos previos al vencimiento
  for (let i = 0; i < n && i < porPago.length; i++) {
    porPago[i] = credito.pagoMensual / n
  }

  return {
    nombre: credito.nombre,
    montoTotal: credito.pagoMensual,
    porPago,
  }
}

/**
 * Calcula el resumen completo de ahorro para todos los créditos.
 */
export function calcularResumenAhorro(
  creditos: CreditoInput[],
  fechaBase: Date,
  hoy: Date,
  salario: number = 22000
): ResumenAhorro {
  const proximosPagos = getNextPaydays(fechaBase, hoy, 6)
  const proximaFechaPago = proximosPagos[0]
  const diasParaProximoPago = Math.ceil(
    (proximaFechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  )

  const desglose = creditos.map(credito => {
    const fechaVencimiento = getProximaFechaVencimiento(credito.diaPago, hoy)
    return calcularAhorroPorCredito(credito, proximosPagos, fechaVencimiento)
  })

  const totalProximoPago = desglose.reduce(
    (sum, c) => sum + (c.porPago[0] || 0),
    0
  )

  return {
    totalProximoPago: Math.round(totalProximoPago * 100) / 100,
    desglose,
    proximaFechaPago,
    diasParaProximoPago,
    salarioDisponible: salario - totalProximoPago,
  }
}
```

**Step 5: Correr los tests — deben PASAR**

```bash
npm test
```

Expected: PASS — todos los tests en verde.

**Step 6: Commit**

```bash
git add src/lib/savings-calculator.ts src/lib/savings-calculator.test.ts vitest.config.ts
git commit -m "feat: calculadora de ahorro con tests (TDD)"
```

---

### Task 4: API Routes — Créditos

**Files:**
- Create: `src/app/api/creditos/route.ts`
- Create: `src/app/api/creditos/[id]/route.ts`

**Step 1: Crear `src/app/api/creditos/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const creditos = await prisma.credito.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(creditos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const credito = await prisma.credito.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      montoTotal: body.montoTotal,
      saldoActual: body.saldoActual,
      pagoMensual: body.pagoMensual,
      pagoMinimo: body.pagoMinimo ?? null,
      fechaCorte: body.fechaCorte ?? null,
      diaPago: body.diaPago,
      tasaInteres: body.tasaInteres ?? null,
    },
  })
  return NextResponse.json(credito, { status: 201 })
}
```

**Step 2: Crear `src/app/api/creditos/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const credito = await prisma.credito.update({
    where: { id },
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      montoTotal: body.montoTotal,
      saldoActual: body.saldoActual,
      pagoMensual: body.pagoMensual,
      pagoMinimo: body.pagoMinimo ?? null,
      fechaCorte: body.fechaCorte ?? null,
      diaPago: body.diaPago,
      tasaInteres: body.tasaInteres ?? null,
      activo: body.activo,
    },
  })
  return NextResponse.json(credito)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.credito.update({
    where: { id },
    data: { activo: false },
  })
  return NextResponse.json({ ok: true })
}
```

**Step 3: Verificar API con curl**

```bash
# Crear un crédito de prueba
curl -X POST http://localhost:3000/api/creditos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Crédito Nómina","tipo":"PRESTAMO","montoTotal":50000,"saldoActual":35000,"pagoMensual":2500,"diaPago":15}'
```

Expected: JSON del crédito creado con `id`, `createdAt`, etc.

**Step 4: Commit**

```bash
git add src/app/api/creditos/
git commit -m "feat: API REST CRUD créditos"
```

---

### Task 5: API Routes — Gastos

**Files:**
- Create: `src/app/api/gastos/route.ts`
- Create: `src/app/api/gastos/[id]/route.ts`
- Create: `src/app/api/dashboard/route.ts`

**Step 1: Crear `src/app/api/gastos/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const categoria = searchParams.get('categoria')

  const gastos = await prisma.gasto.findMany({
    where: {
      ...(desde && { fecha: { gte: new Date(desde) } }),
      ...(hasta && { fecha: { lte: new Date(hasta) } }),
      ...(categoria && { categoria: categoria as any }),
    },
    orderBy: { fecha: 'desc' },
    take: 100,
  })
  return NextResponse.json(gastos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const gasto = await prisma.gasto.create({
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoria: body.categoria,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      fuente: body.fuente ?? 'WEB',
    },
  })
  return NextResponse.json(gasto, { status: 201 })
}
```

**Step 2: Crear `src/app/api/gastos/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const gasto = await prisma.gasto.update({
    where: { id },
    data: {
      descripcion: body.descripcion,
      monto: body.monto,
      categoria: body.categoria,
      fecha: new Date(body.fecha),
    },
  })
  return NextResponse.json(gasto)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.gasto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

**Step 3: Crear `src/app/api/dashboard/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro } from '@/lib/savings-calculator'

export async function GET() {
  const [creditos, config] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.configuracionSalario.findFirst(),
  ])

  // Gastos del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const gastosMes = await prisma.gasto.findMany({
    where: { fecha: { gte: inicioMes } },
    orderBy: { fecha: 'desc' },
  })

  // Calcular resumen de ahorro
  const creditosInput = creditos.map(c => ({
    nombre: c.nombre,
    pagoMensual: Number(c.pagoMensual),
    diaPago: c.diaPago,
  }))

  const resumenAhorro = config
    ? calcularResumenAhorro(
        creditosInput,
        config.fechaBaseProximoPago,
        new Date(),
        Number(config.monto)
      )
    : null

  // Gastos por categoría (para pastel)
  const porCategoria = gastosMes.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    creditos,
    gastosMes,
    porCategoria,
    resumenAhorro,
    config,
  })
}
```

**Step 4: Commit**

```bash
git add src/app/api/gastos/ src/app/api/dashboard/
git commit -m "feat: API REST CRUD gastos + endpoint dashboard"
```

---

### Task 6: Bot de Telegram

**Files:**
- Create: `src/lib/telegram-handler.ts`
- Create: `src/app/api/telegram/route.ts`

**Step 1: Crear parser en `src/lib/telegram-handler.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { CategoriaGasto } from '@prisma/client'

const CATEGORIAS_MAP: Record<string, CategoriaGasto> = {
  comida: 'ALIMENTACION',
  alimentacion: 'ALIMENTACION',
  alimentos: 'ALIMENTACION',
  transporte: 'TRANSPORTE',
  gasolina: 'TRANSPORTE',
  uber: 'TRANSPORTE',
  entretenimiento: 'ENTRETENIMIENTO',
  ocio: 'ENTRETENIMIENTO',
  salud: 'SALUD',
  farmacia: 'SALUD',
  servicios: 'SERVICIOS',
  renta: 'SERVICIOS',
  luz: 'SERVICIOS',
  agua: 'SERVICIOS',
  otros: 'OTROS',
}

function parseCategoria(texto: string): CategoriaGasto {
  return CATEGORIAS_MAP[texto.toLowerCase()] ?? 'OTROS'
}

export async function handleTelegramMessage(text: string): Promise<string> {
  const partes = text.trim().split(/\s+/)
  const comando = partes[0].toLowerCase()

  if (comando === '/gasto') {
    // /gasto [categoria] [monto] [descripcion opcional]
    if (partes.length < 3) {
      return '❌ Formato: /gasto [categoría] [monto] [descripción]\nEjemplo: /gasto Comida 180 McDonald\'s'
    }
    const categoriaTexto = partes[1]
    const monto = parseFloat(partes[2])
    if (isNaN(monto) || monto <= 0) {
      return '❌ El monto debe ser un número positivo.\nEjemplo: /gasto Comida 180'
    }
    const descripcion = partes.slice(3).join(' ') || categoriaTexto
    const categoria = parseCategoria(categoriaTexto)

    await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        categoria,
        fuente: 'TELEGRAM',
      },
    })
    return `✅ Gasto registrado\n📁 ${categoria}\n💰 $${monto.toFixed(2)} MXN\n📝 ${descripcion}`
  }

  if (comando === '/resumen') {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: hoy } },
    })
    if (gastos.length === 0) return '📊 Sin gastos registrados hoy.'
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    const lista = gastos.map(g => `• ${g.descripcion}: $${Number(g.monto).toFixed(2)}`).join('\n')
    return `📊 *Gastos de hoy*\n${lista}\n\n💰 Total: $${total.toFixed(2)} MXN`
  }

  if (comando === '/quincena') {
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: inicio } },
    })
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    return `📊 *Gastos del mes*\n💰 Total: $${total.toFixed(2)} MXN\n📝 ${gastos.length} registros`
  }

  if (comando === '/creditos') {
    const creditos = await prisma.credito.findMany({ where: { activo: true } })
    if (creditos.length === 0) return '💳 Sin créditos activos.'
    const lista = creditos.map(c =>
      `• ${c.nombre}: $${Number(c.saldoActual).toFixed(2)} (pago día ${c.diaPago})`
    ).join('\n')
    return `💳 *Créditos activos*\n${lista}`
  }

  if (comando === '/ahorro') {
    const config = await prisma.configuracionSalario.findFirst()
    const creditos = await prisma.credito.findMany({ where: { activo: true } })
    if (!config) return '⚙️ Sin configuración de salario.'

    const { calcularResumenAhorro } = await import('./savings-calculator')
    const resumen = calcularResumenAhorro(
      creditos.map(c => ({ nombre: c.nombre, pagoMensual: Number(c.pagoMensual), diaPago: c.diaPago })),
      config.fechaBaseProximoPago,
      new Date(),
      Number(config.monto)
    )

    const desglose = resumen.desglose
      .filter(d => d.porPago[0] > 0)
      .map(d => `• ${d.nombre}: $${d.porPago[0].toFixed(2)}`)
      .join('\n')

    return `💰 *Recomendación de ahorro*\n` +
      `Próximo pago: ${resumen.proximaFechaPago.toLocaleDateString('es-MX')} (en ${resumen.diasParaProximoPago} días)\n\n` +
      `${desglose}\n\n` +
      `*Apartar: $${resumen.totalProximoPago.toFixed(2)}*\n` +
      `Disponible: $${resumen.salarioDisponible.toFixed(2)}`
  }

  return '❓ Comandos disponibles:\n/gasto [cat] [monto] [desc]\n/resumen\n/quincena\n/creditos\n/ahorro'
}
```

**Step 2: Crear webhook en `src/app/api/telegram/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramMessage } from '@/lib/telegram-handler'

const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId = message.chat?.id
  const text = message.text ?? ''

  // Filtro de seguridad: solo responde al chat_id autorizado
  if (String(chatId) !== ALLOWED_CHAT_ID) {
    return NextResponse.json({ ok: true })
  }

  const respuesta = await handleTelegramMessage(text)
  await sendMessage(chatId, respuesta)

  return NextResponse.json({ ok: true })
}
```

**Step 3: Registrar webhook con ngrok**

```bash
# Terminal 1: correr Next.js
npm run dev

# Terminal 2: exponer con ngrok
ngrok http 3000
```

Copiar la URL de ngrok (ej: `https://abc123.ngrok-free.app`) y registrar el webhook:

```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok-free.app/api/telegram"}'
```

**Step 4: Probar el bot**

Enviar a tu bot en Telegram: `/gasto Comida 180 Tacos`
Expected: `✅ Gasto registrado...`

**Step 5: Commit**

```bash
git add src/lib/telegram-handler.ts src/app/api/telegram/
git commit -m "feat: bot Telegram con comandos /gasto /resumen /quincena /creditos /ahorro"
```

---

### Task 7: Layout y navegación

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/Sidebar.tsx`

**Step 1: Actualizar `src/app/globals.css`**

Reemplazar contenido con:
```css
@import "tailwindcss";

:root {
  --background: #0f172a;
  --foreground: #f1f5f9;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}
```

**Step 2: Crear grupo de ruta `(dashboard)`**

```bash
mkdir -p src/app/\(dashboard\)/gastos src/app/\(dashboard\)/creditos
```

**Step 3: Crear `src/components/Sidebar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '📊 Dashboard', icon: '📊' },
  { href: '/gastos', label: '💸 Gastos', icon: '💸' },
  { href: '/creditos', label: '💳 Créditos', icon: '💳' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-emerald-400">FINANZAS</h1>
        <p className="text-xs text-slate-400">ARDEPA</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === link.href
                ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Bot Telegram activo</p>
      </div>
    </aside>
  )
}
```

**Step 4: Crear `src/app/(dashboard)/layout.tsx`**

```tsx
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/app/ src/components/Sidebar.tsx
git commit -m "feat: layout con sidebar de navegación"
```

---

### Task 8: Página de Créditos (CRUD UI)

**Files:**
- Create: `src/app/(dashboard)/creditos/page.tsx`
- Create: `src/components/creditos/CreditoForm.tsx`
- Create: `src/components/creditos/CreditoCard.tsx`

**Step 1: Crear `src/components/creditos/CreditoForm.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface Props {
  initial?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export default function CreditoForm({ initial, onSave, onCancel }: Props) {
  const [tipo, setTipo] = useState(initial?.tipo ?? 'PRESTAMO')
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    montoTotal: initial?.montoTotal ?? '',
    saldoActual: initial?.saldoActual ?? '',
    pagoMensual: initial?.pagoMensual ?? '',
    pagoMinimo: initial?.pagoMinimo ?? '',
    fechaCorte: initial?.fechaCorte ?? '',
    diaPago: initial?.diaPago ?? '',
    tasaInteres: initial?.tasaInteres ?? '',
  })

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: any) => {
    e.preventDefault()
    onSave({ ...form, tipo, activo: true })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400">Nombre del crédito</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="input w-full">
            <option value="PRESTAMO">Préstamo</option>
            <option value="TARJETA">Tarjeta de crédito</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400">Monto total</label>
          <input required type="number" value={form.montoTotal} onChange={set('montoTotal')} className="input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Saldo actual</label>
          <input required type="number" value={form.saldoActual} onChange={set('saldoActual')} className="input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Pago mensual</label>
          <input required type="number" value={form.pagoMensual} onChange={set('pagoMensual')} className="input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Día de pago (1-31)</label>
          <input required type="number" min="1" max="31" value={form.diaPago} onChange={set('diaPago')} className="input w-full" />
        </div>
        {tipo === 'TARJETA' && (
          <>
            <div>
              <label className="text-xs text-slate-400">Pago mínimo</label>
              <input type="number" value={form.pagoMinimo} onChange={set('pagoMinimo')} className="input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Día de corte (1-31)</label>
              <input type="number" min="1" max="31" value={form.fechaCorte} onChange={set('fechaCorte')} className="input w-full" />
            </div>
          </>
        )}
        <div>
          <label className="text-xs text-slate-400">Tasa de interés anual (%)</label>
          <input type="number" step="0.01" value={form.tasaInteres} onChange={set('tasaInteres')} className="input w-full" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  )
}
```

**Step 2: Crear `src/app/(dashboard)/creditos/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import CreditoForm from '@/components/creditos/CreditoForm'

export default function CreditosPage() {
  const [creditos, setCreditos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)

  const cargar = () => fetch('/api/creditos').then(r => r.json()).then(setCreditos)
  useEffect(() => { cargar() }, [])

  const guardar = async (data: any) => {
    if (editando) {
      await fetch(`/api/creditos/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/creditos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowForm(false)
    setEditando(null)
    cargar()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Desactivar este crédito?')) return
    await fetch(`/api/creditos/${id}`, { method: 'DELETE' })
    cargar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">💳 Créditos</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Nuevo crédito</button>
      </div>

      {(showForm || editando) && (
        <CreditoForm
          initial={editando}
          onSave={guardar}
          onCancel={() => { setShowForm(false); setEditando(null) }}
        />
      )}

      <div className="grid gap-4">
        {creditos.map((c: any) => (
          <div key={c.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-100">{c.nombre}</h3>
                <p className="text-xs text-slate-400">{c.tipo} · Pago día {c.diaPago}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditando(c); setShowForm(false) }} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                <button onClick={() => eliminar(c.id)} className="text-xs text-red-400 hover:text-red-300">Desactivar</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Saldo actual</p>
                <p className="font-medium text-red-400">${Number(c.saldoActual).toLocaleString('es-MX')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pago mensual</p>
                <p className="font-medium text-slate-200">${Number(c.pagoMensual).toLocaleString('es-MX')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Progreso</p>
                <div className="h-2 bg-slate-700 rounded-full mt-1">
                  <div
                    className="h-2 bg-emerald-500 rounded-full"
                    style={{ width: `${Math.max(0, 100 - (Number(c.saldoActual) / Number(c.montoTotal)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Agregar estilos de utilidad a `globals.css`**

Agregar al final de `src/app/globals.css`:
```css
.input {
  @apply bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500;
}
.btn-primary {
  @apply bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors;
}
.btn-secondary {
  @apply bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors;
}
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/creditos/ src/components/creditos/
git commit -m "feat: CRUD UI créditos con formulario diferenciado PRESTAMO/TARJETA"
```

---

### Task 9: Página de Gastos (CRUD UI)

**Files:**
- Create: `src/app/(dashboard)/gastos/page.tsx`

**Step 1: Crear `src/app/(dashboard)/gastos/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

const CATEGORIAS = ['ALIMENTACION', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'SERVICIOS', 'OTROS']
const CATEGORIA_EMOJI: Record<string, string> = {
  ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬',
  SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦',
}

export default function GastosPage() {
  const [gastos, setGastos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: 'ALIMENTACION', fecha: new Date().toISOString().slice(0, 10) })
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const cargar = () => {
    const params = filtroCategoria ? `?categoria=${filtroCategoria}` : ''
    fetch(`/api/gastos${params}`).then(r => r.json()).then(setGastos)
  }
  useEffect(() => { cargar() }, [filtroCategoria])

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const guardar = async (e: any) => {
    e.preventDefault()
    if (editando) {
      await fetch(`/api/gastos/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/gastos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setShowForm(false); setEditando(null)
    setForm({ descripcion: '', monto: '', categoria: 'ALIMENTACION', fecha: new Date().toISOString().slice(0, 10) })
    cargar()
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const iniciarEdicion = (g: any) => {
    setEditando(g)
    setForm({ descripcion: g.descripcion, monto: g.monto, categoria: g.categoria, fecha: new Date(g.fecha).toISOString().slice(0, 10) })
    setShowForm(true)
  }

  const total = gastos.reduce((s: number, g: any) => s + Number(g.monto), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">💸 Gastos</h1>
          <p className="text-slate-400 text-sm">Total: ${total.toLocaleString('es-MX')} MXN</p>
        </div>
        <button onClick={() => { setEditando(null); setShowForm(true) }} className="btn-primary">+ Nuevo gasto</button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroCategoria('')} className={`text-xs px-3 py-1 rounded-full ${!filtroCategoria ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>Todos</button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setFiltroCategoria(c)} className={`text-xs px-3 py-1 rounded-full ${filtroCategoria === c ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
            {CATEGORIA_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={guardar} className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-slate-400">Descripción</label>
            <input required value={form.descripcion} onChange={set('descripcion')} className="input w-full" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Monto (MXN)</label>
            <input required type="number" step="0.01" value={form.monto} onChange={set('monto')} className="input w-full" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Categoría</label>
            <select value={form.categoria} onChange={set('categoria')} className="input w-full">
              {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_EMOJI[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Fecha</label>
            <input type="date" value={form.fecha} onChange={set('fecha')} className="input w-full" />
          </div>
          <div className="flex gap-2 items-end">
            <button type="submit" className="btn-primary flex-1">{editando ? 'Actualizar' : 'Guardar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null) }} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {gastos.map((g: any) => (
          <div key={g.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center gap-4">
            <span className="text-2xl">{CATEGORIA_EMOJI[g.categoria]}</span>
            <div className="flex-1">
              <p className="text-sm text-slate-100">{g.descripcion}</p>
              <p className="text-xs text-slate-500">{new Date(g.fecha).toLocaleDateString('es-MX')} · {g.fuente === 'TELEGRAM' ? '📱 Telegram' : '🌐 Web'}</p>
            </div>
            <span className="text-sm font-medium text-red-400">${Number(g.monto).toLocaleString('es-MX')}</span>
            <div className="flex gap-2">
              <button onClick={() => iniciarEdicion(g)} className="text-xs text-blue-400">Editar</button>
              <button onClick={() => eliminar(g.id)} className="text-xs text-red-400">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/gastos/
git commit -m "feat: CRUD UI gastos con filtros por categoría"
```

---

### Task 10: Dashboard con gráficas

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/dashboard/CashFlowChart.tsx`
- Create: `src/components/dashboard/ExpensesPieChart.tsx`
- Create: `src/components/dashboard/SavingsCard.tsx`

**Step 1: Crear `src/components/dashboard/SavingsCard.tsx`**

```tsx
interface Props {
  resumen: any
}
export default function SavingsCard({ resumen }: Props) {
  if (!resumen) return null
  const pct = (resumen.totalProximoPago / (resumen.totalProximoPago + resumen.salarioDisponible)) * 100

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <h2 className="text-sm font-semibold text-slate-400 mb-3">💰 Recomendación de ahorro</h2>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-bold text-emerald-400">${resumen.totalProximoPago.toLocaleString('es-MX')}</span>
        <span className="text-slate-400 text-sm mb-1">MXN</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Próximo pago: {new Date(resumen.proximaFechaPago).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · en {resumen.diasParaProximoPago} días
      </p>
      <div className="h-2 bg-slate-700 rounded-full mb-3">
        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1">
        {resumen.desglose.filter((d: any) => d.porPago[0] > 0).map((d: any) => (
          <div key={d.nombre} className="flex justify-between text-xs">
            <span className="text-slate-400">{d.nombre}</span>
            <span className="text-slate-200">${d.porPago[0].toLocaleString('es-MX')}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between text-sm">
        <span className="text-slate-400">Disponible tras créditos</span>
        <span className="font-semibold text-slate-100">${resumen.salarioDisponible.toLocaleString('es-MX')}</span>
      </div>
    </div>
  )
}
```

**Step 2: Crear `src/components/dashboard/ExpensesPieChart.tsx`**

```tsx
'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']
const LABELS: Record<string, string> = {
  ALIMENTACION: 'Alimentación', TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento', SALUD: 'Salud',
  SERVICIOS: 'Servicios', OTROS: 'Otros',
}

interface Props {
  porCategoria: Record<string, number>
}

export default function ExpensesPieChart({ porCategoria }: Props) {
  const data = Object.entries(porCategoria).map(([name, value]) => ({
    name: LABELS[name] ?? name,
    value: Math.round(value * 100) / 100,
  }))

  if (data.length === 0) return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-center justify-center h-48">
      <p className="text-slate-500 text-sm">Sin gastos este mes</p>
    </div>
  )

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <h2 className="text-sm font-semibold text-slate-400 mb-4">🥧 Gastos por categoría (mes actual)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => `$${v.toLocaleString('es-MX')}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 3: Crear `src/app/(dashboard)/page.tsx`**

```tsx
import SavingsCard from '@/components/dashboard/SavingsCard'
import ExpensesPieChart from '@/components/dashboard/ExpensesPieChart'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro } from '@/lib/savings-calculator'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [creditos, config] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.configuracionSalario.findFirst(),
  ])

  const inicioMes = new Date()
  inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)

  const [gastosMes, gastosRecientes] = await Promise.all([
    prisma.gasto.findMany({ where: { fecha: { gte: inicioMes } } }),
    prisma.gasto.findMany({ orderBy: { fecha: 'desc' }, take: 8 }),
  ])

  const totalMes = gastosMes.reduce((s, g) => s + Number(g.monto), 0)
  const porCategoria = gastosMes.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  const resumenAhorro = config ? calcularResumenAhorro(
    creditos.map(c => ({ nombre: c.nombre, pagoMensual: Number(c.pagoMensual), diaPago: c.diaPago })),
    config.fechaBaseProximoPago,
    new Date(),
    Number(config.monto)
  ) : null

  const EMOJI: Record<string, string> = { ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬', SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">📊 Dashboard</h1>
        <p className="text-slate-400 text-sm">FINANZAS ARDEPA · {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-500">Salario quincenal</p>
          <p className="text-2xl font-bold text-emerald-400">${(22000).toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-500">Gastos este mes</p>
          <p className="text-2xl font-bold text-red-400">${totalMes.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-500">Créditos activos</p>
          <p className="text-2xl font-bold text-blue-400">{creditos.length}</p>
        </div>
      </div>

      {/* Ahorro + Pastel */}
      <div className="grid grid-cols-2 gap-4">
        {resumenAhorro && <SavingsCard resumen={resumenAhorro} />}
        <ExpensesPieChart porCategoria={porCategoria} />
      </div>

      {/* Gastos recientes */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">🕐 Gastos recientes</h2>
        <div className="space-y-2">
          {gastosRecientes.map(g => (
            <div key={g.id} className="flex items-center gap-3">
              <span>{EMOJI[g.categoria]}</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200">{g.descripcion}</p>
                <p className="text-xs text-slate-500">{new Date(g.fecha).toLocaleDateString('es-MX')} · {g.fuente === 'TELEGRAM' ? '📱' : '🌐'}</p>
              </div>
              <span className="text-sm font-medium text-red-400">${Number(g.monto).toLocaleString('es-MX')}</span>
            </div>
          ))}
          {gastosRecientes.length === 0 && <p className="text-slate-500 text-sm">Sin gastos registrados aún.</p>}
        </div>
      </div>

      {/* Créditos resumen */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">💳 Estado de créditos</h2>
        <div className="space-y-3">
          {creditos.map(c => {
            const pct = Math.max(0, 100 - (Number(c.saldoActual) / Number(c.montoTotal)) * 100)
            return (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{c.nombre}</span>
                  <span className="text-slate-400">${Number(c.saldoActual).toLocaleString('es-MX')} restante</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {creditos.length === 0 && <p className="text-slate-500 text-sm">Sin créditos registrados.</p>}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx src/components/dashboard/
git commit -m "feat: dashboard con gráfica de gastos, tarjeta de ahorro y resumen de créditos"
```

---

### Task 11: README y guía de setup

**Files:**
- Create: `README.md`

**Step 1: Crear README.md**

```markdown
# FINANZAS ARDEPA

App de finanzas personales local. Gestión de créditos, gastos vía Telegram y dashboard financiero.

## Setup

### 1. Requisitos
- Node.js 20+
- PostgreSQL local en puerto 5432
- Bot de Telegram creado via @BotFather
- ngrok instalado

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
Crear `.env.local`:
```
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/finanzas_ardepa"
TELEGRAM_BOT_TOKEN="tu_token"
TELEGRAM_ALLOWED_CHAT_ID="tu_chat_id"
```
Tu chat_id lo obtienes hablando con @userinfobot en Telegram.

### 4. Base de datos
```bash
npx prisma migrate dev
npx prisma db seed  # carga salario inicial $22,000 MXN
```

### 5. Correr la app
```bash
npm run dev
```
Abrir: http://localhost:3000

### 6. Activar bot de Telegram
```bash
# Terminal 2
ngrok http 3000
```
Copiar URL de ngrok y registrar webhook:
```bash
curl -X POST "https://api.telegram.org/botTU_TOKEN/setWebhook" \
  -d '{"url":"https://TU_URL.ngrok-free.app/api/telegram"}'
```

## Comandos del bot

| Comando | Descripción |
|---|---|
| `/gasto Comida 180 Tacos` | Registra un gasto |
| `/resumen` | Gastos del día |
| `/quincena` | Gastos del mes |
| `/creditos` | Lista de créditos activos |
| `/ahorro` | Cuánto apartar en el próximo pago |

## Categorías
Comida · Transporte · Entretenimiento · Salud · Servicios · Otros
```

**Step 2: Commit final**

```bash
git add README.md
git commit -m "docs: README con guía completa de setup y uso"
```

---

## Resumen de tareas

| # | Tarea | Estimado |
|---|---|---|
| 1 | Scaffolding Next.js | 5 min |
| 2 | PostgreSQL + Prisma | 10 min |
| 3 | Calculadora de ahorro (TDD) | 15 min |
| 4 | API Créditos | 5 min |
| 5 | API Gastos + Dashboard | 5 min |
| 6 | Bot Telegram | 10 min |
| 7 | Layout + Sidebar | 5 min |
| 8 | UI Créditos | 10 min |
| 9 | UI Gastos | 10 min |
| 10 | Dashboard + gráficas | 15 min |
| 11 | README | 5 min |

**Total: ~11 tareas, implementación completa**
