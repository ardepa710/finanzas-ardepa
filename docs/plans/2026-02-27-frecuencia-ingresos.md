# Frecuencias de Pago + Módulo de Ingresos — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar frecuencias semanal/quincenal/mensual a créditos, crear módulo de fuentes de ingreso recurrentes + ingresos manuales, y actualizar el calculador de ahorro para proyectar cuánto apartar de cada cobro para cubrir créditos.

**Architecture:** Migración de schema en dos pasos: primero agregar nuevas tablas/campos, luego migrar datos y eliminar `ConfiguracionSalario`. El calculador de ahorro se reescribe con TDD para soportar múltiples fuentes de ingreso y frecuencias variables. UI actualizada con selectors condicionales por frecuencia.

**Tech Stack:** Next.js 15 App Router, Prisma 7.4.1 + @prisma/adapter-pg, PostgreSQL, Vitest, Tailwind CSS v4.

**Design doc:** `docs/plans/2026-02-27-frecuencia-pagos-ingresos-design.md`

---

## Task 1: Schema — Agregar FrecuenciaPago + campos a Credito + nuevos modelos

**Files:**
- Modify: `prisma/schema.prisma`
- Create migration via CLI

### Step 1: Modificar schema.prisma

Reemplazar el contenido de `prisma/schema.prisma` con:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum TipoCredito {
  PRESTAMO
  TARJETA
}

enum FrecuenciaPago {
  SEMANAL
  QUINCENAL
  MENSUAL
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
  id          String         @id @default(cuid())
  nombre      String
  tipo        TipoCredito
  montoTotal  Decimal        @db.Decimal(10, 2)
  saldoActual Decimal        @db.Decimal(10, 2)
  pagoMensual Decimal        @db.Decimal(10, 2)
  pagoMinimo  Decimal?       @db.Decimal(10, 2)
  fechaCorte  Int?
  diaPago     Int            // usado solo cuando frecuencia=MENSUAL
  tasaInteres Decimal?       @db.Decimal(5, 2)
  activo      Boolean        @default(true)
  frecuencia  FrecuenciaPago @default(MENSUAL)
  diaSemana   Int?           // 0=Dom..6=Sáb — solo para SEMANAL y QUINCENAL
  fechaBase   DateTime?      // fecha de referencia para SEMANAL/QUINCENAL
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
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

model FuenteIngreso {
  id         String         @id @default(cuid())
  nombre     String
  monto      Decimal        @db.Decimal(10, 2)
  frecuencia FrecuenciaPago
  diaSemana  Int?           // 0=Dom..6=Sáb — para SEMANAL/QUINCENAL
  diaMes     Int?           // 1-31 — para MENSUAL
  fechaBase  DateTime       // fecha de referencia para calcular próximos pagos
  activo     Boolean        @default(true)
  createdAt  DateTime       @default(now())
  ingresos   IngresoManual[]
}

model IngresoManual {
  id          String         @id @default(cuid())
  monto       Decimal        @db.Decimal(10, 2)
  fecha       DateTime       @default(now())
  descripcion String?
  fuenteId    String?
  fuente      FuenteIngreso? @relation(fields: [fuenteId], references: [id])
  createdAt   DateTime       @default(now())
}

model ConfiguracionSalario {
  id                   Int      @id @default(1)
  monto                Decimal  @db.Decimal(10, 2)
  fechaBaseProximoPago DateTime
  updatedAt            DateTime @updatedAt
}
```

**NOTA:** `ConfiguracionSalario` se mantiene en este paso. Se elimina en Task 2.

### Step 2: Generar la migración

```bash
cd /home/ardepa/finanzas-ardepa
npx prisma migrate dev --name add_frecuencia_ingresos
```

Expected: migración creada en `prisma/migrations/TIMESTAMP_add_frecuencia_ingresos/migration.sql`

### Step 3: Regenerar el cliente Prisma

```bash
npx prisma generate
```

### Step 4: Commit

```bash
git add prisma/
git commit -m "feat: agregar FrecuenciaPago, campos a Credito, modelos FuenteIngreso e IngresoManual"
```

---

## Task 2: Schema — Migrar datos y eliminar ConfiguracionSalario

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: la migración SQL generada en este paso

### Step 1: Quitar ConfiguracionSalario del schema

En `prisma/schema.prisma`, eliminar el modelo `ConfiguracionSalario` completo (las últimas 6 líneas).

### Step 2: Generar la migración (sin aplicar todavía)

```bash
npx prisma migrate dev --name remove_config_salario --create-only
```

Expected: crea `prisma/migrations/TIMESTAMP_remove_config_salario/migration.sql` pero NO la aplica.

### Step 3: Editar el SQL generado

Abrir `prisma/migrations/TIMESTAMP_remove_config_salario/migration.sql`.

El archivo generado solo tendrá `DROP TABLE "ConfiguracionSalario";`. Agregar ANTES el INSERT de migración:

```sql
-- Migrar datos de ConfiguracionSalario a FuenteIngreso (si existe)
INSERT INTO "FuenteIngreso" (id, nombre, monto, frecuencia, "diaSemana", "fechaBase", activo, "createdAt")
SELECT
  'csal_migrated_01',
  'Salario',
  monto,
  'QUINCENAL'::"FrecuenciaPago",
  1,
  "fechaBaseProximoPago",
  true,
  now()
FROM "ConfiguracionSalario"
WHERE id = 1
ON CONFLICT DO NOTHING;

DROP TABLE "ConfiguracionSalario";
```

### Step 4: Aplicar la migración

```bash
npx prisma migrate dev
```

Expected: migración aplicada, tabla `ConfiguracionSalario` eliminada.

### Step 5: Regenerar el cliente

```bash
npx prisma generate
```

### Step 6: Commit

```bash
git add prisma/
git commit -m "feat: migrar ConfiguracionSalario a FuenteIngreso y eliminar tabla"
```

---

## Task 3: savings-calculator.ts — Reescribir con TDD

**Files:**
- Modify: `src/lib/savings-calculator.ts`
- Modify: `src/lib/savings-calculator.test.ts`

### Step 1: Escribir los tests (todos failing primero)

Reemplazar `src/lib/savings-calculator.test.ts` con:

```typescript
import { describe, it, expect } from 'vitest'
import {
  getNextOccurrences,
  getNextCreditDueDate,
  calcularResumenAhorro,
  type FuenteIngresoInput,
  type CreditoInput,
} from './savings-calculator'

// Fecha fija para todos los tests: miércoles 5 de marzo de 2026
const HOY = new Date(2026, 2, 5) // mes 0-indexed

describe('getNextOccurrences', () => {
  it('MENSUAL: devuelve próximas N fechas en el día del mes', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(new Date(2026, 2, 15))  // 15 mar
    expect(result[1]).toEqual(new Date(2026, 3, 15))  // 15 abr
    expect(result[2]).toEqual(new Date(2026, 4, 15))  // 15 may
  })

  it('MENSUAL: si el día del mes ya pasó este mes, empieza el siguiente', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'MENSUAL',
      diaMes: 1,
      fechaBase: new Date(2026, 0, 1),
    }
    const result = getNextOccurrences(fuente, HOY, 2)
    expect(result[0]).toEqual(new Date(2026, 3, 1))  // 1 abr (1 mar ya pasó)
  })

  it('QUINCENAL: devuelve cada 14 días desde fechaBase', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2), // lunes 2 mar
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    expect(result[0]).toEqual(new Date(2026, 2, 16)) // 16 mar
    expect(result[1]).toEqual(new Date(2026, 2, 30)) // 30 mar
    expect(result[2]).toEqual(new Date(2026, 3, 13)) // 13 abr
  })

  it('SEMANAL: devuelve cada 7 días desde fechaBase', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2), // lunes 2 mar
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    expect(result[0]).toEqual(new Date(2026, 2, 9))  // 9 mar
    expect(result[1]).toEqual(new Date(2026, 2, 16)) // 16 mar
    expect(result[2]).toEqual(new Date(2026, 2, 23)) // 23 mar
  })
})

describe('getNextCreditDueDate', () => {
  it('MENSUAL: devuelve el siguiente diaPago este mes si no pasó', () => {
    const credito: CreditoInput = {
      nombre: 'Nómina',
      pagoMensual: 2500,
      frecuencia: 'MENSUAL',
      diaPago: 15,
    }
    const result = getNextCreditDueDate(credito, HOY) // hoy es 5 mar
    expect(result).toEqual(new Date(2026, 2, 15, 23, 59, 0))
  })

  it('MENSUAL: avanza al mes siguiente si diaPago ya pasó', () => {
    const credito: CreditoInput = {
      nombre: 'Nómina',
      pagoMensual: 2500,
      frecuencia: 'MENSUAL',
      diaPago: 1,
    }
    const result = getNextCreditDueDate(credito, HOY) // hoy es 5 mar, día 1 ya pasó
    expect(result).toEqual(new Date(2026, 3, 1, 23, 59, 0)) // 1 abr
  })

  it('QUINCENAL: devuelve el próximo ciclo de 14 días desde fechaBase', () => {
    const credito: CreditoInput = {
      nombre: 'Crédito semanal',
      pagoMensual: 1000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2), // 2 mar
    }
    const result = getNextCreditDueDate(credito, HOY) // hoy es 5 mar
    expect(result).toEqual(new Date(2026, 2, 16)) // siguiente: 16 mar
  })

  it('SEMANAL: devuelve el próximo ciclo de 7 días desde fechaBase', () => {
    const credito: CreditoInput = {
      nombre: 'Crédito semanal',
      pagoMensual: 500,
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2), // 2 mar (lunes)
    }
    const result = getNextCreditDueDate(credito, HOY) // hoy es 5 mar (jue)
    expect(result).toEqual(new Date(2026, 2, 9)) // siguiente lunes: 9 mar
  })
})

describe('calcularResumenAhorro', () => {
  it('devuelve proyección de cobros con desglose por crédito', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 22000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }]
    const creditos: CreditoInput[] = [{
      nombre: 'Nómina',
      pagoMensual: 2000,
      frecuencia: 'MENSUAL',
      diaPago: 20,
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY)

    expect(result.cobros).toHaveLength(3)
    expect(result.cobros[0].fecha).toEqual(new Date(2026, 2, 16))
    expect(result.cobros[0].montoIngreso).toBe(22000)
    expect(result.cobros[0].totalApartar).toBeGreaterThan(0)
    expect(result.cobros[0].disponible).toBeLessThan(22000)
  })

  it('disponible = montoIngreso - totalApartar', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 10000,
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }]
    const creditos: CreditoInput[] = [{
      nombre: 'Tarjeta',
      pagoMensual: 3000,
      frecuencia: 'MENSUAL',
      diaPago: 20,
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY)
    const c = result.cobros[0]
    expect(c.disponible).toBe(c.montoIngreso - c.totalApartar)
  })
})
```

### Step 2: Ejecutar tests para confirmar que fallan

```bash
cd /home/ardepa/finanzas-ardepa
npx vitest run src/lib/savings-calculator.test.ts
```

Expected: varios tests FAIL con "getNextOccurrences is not a function" u otro error de importación.

### Step 3: Reescribir savings-calculator.ts

Reemplazar `src/lib/savings-calculator.ts` con:

```typescript
export type FrecuenciaPago = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'

export interface FuenteIngresoInput {
  nombre?: string
  monto?: number
  frecuencia: FrecuenciaPago
  diaMes?: number        // solo MENSUAL
  diaSemana?: number     // 0=Dom..6=Sáb, solo SEMANAL/QUINCENAL
  fechaBase?: Date       // para SEMANAL/QUINCENAL y referencia MENSUAL
}

export interface CreditoInput {
  nombre: string
  pagoMensual: number
  frecuencia: FrecuenciaPago
  diaPago?: number       // solo MENSUAL
  diaSemana?: number     // solo SEMANAL/QUINCENAL
  fechaBase?: Date       // solo SEMANAL/QUINCENAL
}

export interface DesgloseCobro {
  creditoNombre: string
  monto: number
}

export interface ProyeccionCobro {
  fecha: Date
  fuenteNombre: string
  montoIngreso: number
  desglose: DesgloseCobro[]
  totalApartar: number
  disponible: number
}

export interface ResumenAhorro {
  cobros: ProyeccionCobro[]
}

/**
 * Avanza `cursor` en `pasos` días, devolviendo una nueva Date.
 */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Devuelve fecha con hora 00:00:00 (sin componente horario)
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Para SEMANAL/QUINCENAL: avanza desde fechaBase en intervalos de `step` días
 * hasta encontrar la primera fecha futura. Luego toma N fechas.
 */
function getNextByInterval(fechaBase: Date, hoy: Date, step: number, n: number): Date[] {
  let cursor = startOfDay(fechaBase)
  const today = startOfDay(hoy)
  while (cursor <= today) {
    cursor = addDays(cursor, step)
  }
  const result: Date[] = []
  for (let i = 0; i < n; i++) {
    result.push(new Date(cursor))
    cursor = addDays(cursor, step)
  }
  return result
}

/**
 * Devuelve las próximas N fechas de pago para una FuenteIngreso.
 */
export function getNextOccurrences(
  fuente: FuenteIngresoInput,
  hoy: Date,
  n: number
): Date[] {
  if (fuente.frecuencia === 'MENSUAL') {
    const dia = fuente.diaMes!
    const result: Date[] = []
    const today = startOfDay(hoy)
    let year = today.getFullYear()
    let month = today.getMonth()
    while (result.length < n) {
      const candidate = new Date(year, month, dia)
      if (candidate > today) result.push(candidate)
      month++
      if (month > 11) { month = 0; year++ }
    }
    return result
  }
  const step = fuente.frecuencia === 'SEMANAL' ? 7 : 14
  return getNextByInterval(fuente.fechaBase!, hoy, step, n)
}

/**
 * Devuelve la próxima fecha de vencimiento de un crédito.
 */
export function getNextCreditDueDate(credito: CreditoInput, hoy: Date): Date {
  if (credito.frecuencia === 'MENSUAL') {
    const today = startOfDay(hoy)
    const dia = credito.diaPago!
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dia, 23, 59, 0)
    if (thisMonth > today) return thisMonth
    return new Date(today.getFullYear(), today.getMonth() + 1, dia, 23, 59, 0)
  }
  const step = credito.frecuencia === 'SEMANAL' ? 7 : 14
  let cursor = startOfDay(credito.fechaBase!)
  const today = startOfDay(hoy)
  while (cursor <= today) {
    cursor = addDays(cursor, step)
  }
  return cursor
}

/**
 * Calcula para cada cobro próximo cuánto apartar para cubrir los créditos.
 * Proyecta `horizonte` cobros por fuente.
 */
export function calcularResumenAhorro(
  creditos: CreditoInput[],
  fuentes: FuenteIngresoInput[],
  hoy: Date,
  horizonte = 3
): ResumenAhorro {
  // Recopilar todos los cobros próximos de todas las fuentes
  const todosLosCobros: Array<{ fecha: Date; fuente: FuenteIngresoInput }> = []
  for (const fuente of fuentes) {
    const fechas = getNextOccurrences(fuente, hoy, horizonte)
    fechas.forEach(fecha => todosLosCobros.push({ fecha, fuente }))
  }
  todosLosCobros.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const cobrosFinal = todosLosCobros.slice(0, horizonte)

  const cobros: ProyeccionCobro[] = cobrosFinal.map(({ fecha, fuente }) => {
    const desglose: DesgloseCobro[] = []

    for (const credito of creditos) {
      const vencimiento = getNextCreditDueDate(credito, hoy)
      // Cobros de esta fuente antes del vencimiento del crédito
      const allFuente = getNextOccurrences(fuente, hoy, horizonte * 2)
      const cobrosAntesDeVencer = allFuente.filter(f => f < vencimiento)
      const n = cobrosAntesDeVencer.length || 1

      // Solo apartar en este cobro si cae antes del vencimiento
      if (fecha < vencimiento || cobrosAntesDeVencer.length === 0) {
        const porCobro = Math.round((credito.pagoMensual / n) * 100) / 100
        desglose.push({ creditoNombre: credito.nombre, monto: porCobro })
      }
    }

    const totalApartar = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100
    const montoIngreso = fuente.monto ?? 0

    return {
      fecha,
      fuenteNombre: fuente.nombre ?? 'Ingreso',
      montoIngreso,
      desglose,
      totalApartar,
      disponible: Math.round((montoIngreso - totalApartar) * 100) / 100,
    }
  })

  return { cobros }
}
```

### Step 4: Ejecutar tests

```bash
npx vitest run src/lib/savings-calculator.test.ts
```

Expected: todos los tests PASS.

### Step 5: Commit

```bash
git add src/lib/savings-calculator.ts src/lib/savings-calculator.test.ts
git commit -m "feat: reescribir savings-calculator con soporte de frecuencias y múltiples fuentes (TDD)"
```

---

## Task 4: API — Actualizar rutas de créditos

**Files:**
- Modify: `src/app/api/creditos/route.ts`
- Modify: `src/app/api/creditos/[id]/route.ts`

### Step 1: Actualizar POST en `src/app/api/creditos/route.ts`

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
      pagoMinimo: body.pagoMinimo || null,
      fechaCorte: body.fechaCorte ? Number(body.fechaCorte) : null,
      diaPago: Number(body.diaPago) || 1,
      tasaInteres: body.tasaInteres || null,
      frecuencia: body.frecuencia ?? 'MENSUAL',
      diaSemana: body.diaSemana != null ? Number(body.diaSemana) : null,
      fechaBase: body.fechaBase ? new Date(body.fechaBase) : null,
    },
  })
  return NextResponse.json(credito, { status: 201 })
}
```

### Step 2: Actualizar PUT en `src/app/api/creditos/[id]/route.ts`

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
      pagoMinimo: body.pagoMinimo || null,
      fechaCorte: body.fechaCorte ? Number(body.fechaCorte) : null,
      diaPago: Number(body.diaPago) || 1,
      tasaInteres: body.tasaInteres || null,
      activo: body.activo,
      frecuencia: body.frecuencia ?? 'MENSUAL',
      diaSemana: body.diaSemana != null ? Number(body.diaSemana) : null,
      fechaBase: body.fechaBase ? new Date(body.fechaBase) : null,
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

### Step 3: Commit

```bash
git add src/app/api/creditos/
git commit -m "feat: actualizar API de créditos para soportar frecuencia, diaSemana, fechaBase"
```

---

## Task 5: API — Nuevas rutas de ingresos

**Files:**
- Create: `src/app/api/ingresos/route.ts`
- Create: `src/app/api/ingresos/[id]/route.ts`
- Create: `src/app/api/ingresos/manuales/route.ts`
- Create: `src/app/api/ingresos/manuales/[id]/route.ts`

### Step 1: Crear `src/app/api/ingresos/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const fuentes = await prisma.fuenteIngreso.findMany({
    orderBy: { createdAt: 'asc' },
    include: { ingresos: { orderBy: { fecha: 'desc' }, take: 5 } },
  })
  return NextResponse.json(fuentes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const fuente = await prisma.fuenteIngreso.create({
    data: {
      nombre: body.nombre,
      monto: body.monto,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
    },
  })
  return NextResponse.json(fuente, { status: 201 })
}
```

### Step 2: Crear `src/app/api/ingresos/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const fuente = await prisma.fuenteIngreso.update({
    where: { id },
    data: {
      nombre: body.nombre,
      monto: body.monto,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
      activo: body.activo ?? true,
    },
  })
  return NextResponse.json(fuente)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.fuenteIngreso.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}
```

### Step 3: Crear `src/app/api/ingresos/manuales/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const ingresos = await prisma.ingresoManual.findMany({
    orderBy: { fecha: 'desc' },
    take: 50,
    include: { fuente: { select: { nombre: true } } },
  })
  return NextResponse.json(ingresos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ingreso = await prisma.ingresoManual.create({
    data: {
      monto: body.monto,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
      descripcion: body.descripcion || null,
      fuenteId: body.fuenteId || null,
    },
  })
  return NextResponse.json(ingreso, { status: 201 })
}
```

### Step 4: Crear `src/app/api/ingresos/manuales/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.ingresoManual.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

### Step 5: Commit

```bash
git add src/app/api/ingresos/
git commit -m "feat: agregar API routes para FuenteIngreso e IngresoManual"
```

---

## Task 6: UI — Actualizar CreditoForm con selector de frecuencia

**Files:**
- Modify: `src/components/creditos/CreditoForm.tsx`

### Step 1: Reemplazar `src/components/creditos/CreditoForm.tsx`

```typescript
'use client'
import { useState } from 'react'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface CreditoFormData {
  nombre: string
  tipo: 'PRESTAMO' | 'TARJETA'
  montoTotal: string
  saldoActual: string
  pagoMensual: string
  pagoMinimo: string
  fechaCorte: string
  diaPago: string
  tasaInteres: string
  activo: boolean
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  diaSemana: string
  fechaBase: string
}

interface Props {
  initial?: Partial<CreditoFormData> & { id?: string; tipo?: string }
  onSave: (data: CreditoFormData) => void
  onCancel: () => void
}

export default function CreditoForm({ initial, onSave, onCancel }: Props) {
  const [tipo, setTipo] = useState<'PRESTAMO' | 'TARJETA'>((initial?.tipo as any) ?? 'PRESTAMO')
  const [frecuencia, setFrecuencia] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>(
    (initial?.frecuencia as any) ?? 'MENSUAL'
  )
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    montoTotal: initial?.montoTotal ?? '',
    saldoActual: initial?.saldoActual ?? '',
    pagoMensual: initial?.pagoMensual ?? '',
    pagoMinimo: initial?.pagoMinimo ?? '',
    fechaCorte: initial?.fechaCorte ?? '',
    diaPago: initial?.diaPago ?? '',
    tasaInteres: initial?.tasaInteres ?? '',
    diaSemana: initial?.diaSemana ?? '',
    fechaBase: initial?.fechaBase ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, tipo, frecuencia, activo: true })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">{initial?.nombre ? 'Editar crédito' : 'Nuevo crédito'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nombre del crédito</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input" placeholder="Ej: Crédito Nómina" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as any)} className="input">
            <option value="PRESTAMO">Préstamo / Crédito fijo</option>
            <option value="TARJETA">Tarjeta de crédito</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto total original</label>
          <input required type="number" step="0.01" min="0" value={form.montoTotal} onChange={set('montoTotal')} className="input" placeholder="50000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Saldo actual pendiente</label>
          <input required type="number" step="0.01" min="0" value={form.saldoActual} onChange={set('saldoActual')} className="input" placeholder="35000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Pago {frecuencia === 'MENSUAL' ? 'mensual' : frecuencia === 'QUINCENAL' ? 'quincenal' : 'semanal'}</label>
          <input required type="number" step="0.01" min="0" value={form.pagoMensual} onChange={set('pagoMensual')} className="input" placeholder="2500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Frecuencia de pago</label>
          <select value={frecuencia} onChange={e => setFrecuencia(e.target.value as any)} className="input">
            <option value="MENSUAL">Mensual</option>
            <option value="QUINCENAL">Quincenal (cada 14 días)</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </div>

        {frecuencia === 'MENSUAL' ? (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Día límite de pago (1-31)</label>
            <input required type="number" min="1" max="31" value={form.diaPago} onChange={set('diaPago')} className="input" placeholder="15" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de pago (semana)</label>
              <select value={form.diaSemana} onChange={set('diaSemana')} className="input">
                <option value="">Seleccionar...</option>
                {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha del primer pago</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-slate-400 block mb-1">Tasa de interés anual (%)</label>
          <input type="number" step="0.01" min="0" value={form.tasaInteres} onChange={set('tasaInteres')} className="input" placeholder="24.5" />
        </div>

        {tipo === 'TARJETA' && (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Pago mínimo</label>
              <input type="number" step="0.01" min="0" value={form.pagoMinimo} onChange={set('pagoMinimo')} className="input" placeholder="500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de corte (1-31)</label>
              <input type="number" min="1" max="31" value={form.fechaCorte} onChange={set('fechaCorte')} className="input" placeholder="20" />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar crédito</button>
      </div>
    </form>
  )
}
```

### Step 2: Commit

```bash
git add src/components/creditos/CreditoForm.tsx
git commit -m "feat: agregar selector de frecuencia en CreditoForm (semanal/quincenal/mensual)"
```

---

## Task 7: UI — Nueva página /ingresos

**Files:**
- Create: `src/components/ingresos/FuenteIngresoForm.tsx`
- Create: `src/components/ingresos/IngresoManualForm.tsx`
- Create: `src/app/(dashboard)/ingresos/page.tsx`

### Step 1: Crear `src/components/ingresos/FuenteIngresoForm.tsx`

```typescript
'use client'
import { useState } from 'react'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export interface FuenteIngresoFormData {
  nombre: string
  monto: string
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  diaSemana: string
  diaMes: string
  fechaBase: string
}

interface Props {
  initial?: Partial<FuenteIngresoFormData> & { id?: string }
  onSave: (data: FuenteIngresoFormData) => void
  onCancel: () => void
}

export default function FuenteIngresoForm({ initial, onSave, onCancel }: Props) {
  const [frecuencia, setFrecuencia] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>(
    (initial?.frecuencia as any) ?? 'QUINCENAL'
  )
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    monto: initial?.monto ?? '',
    diaSemana: initial?.diaSemana ?? '',
    diaMes: initial?.diaMes ?? '',
    fechaBase: initial?.fechaBase ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, frecuencia })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">{initial?.id ? 'Editar fuente' : 'Nueva fuente de ingreso'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nombre</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input" placeholder="Ej: Salario IMSS" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto</label>
          <input required type="number" step="0.01" min="0" value={form.monto} onChange={set('monto')} className="input" placeholder="22000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Frecuencia</label>
          <select value={frecuencia} onChange={e => setFrecuencia(e.target.value as any)} className="input">
            <option value="MENSUAL">Mensual</option>
            <option value="QUINCENAL">Quincenal (cada 14 días)</option>
            <option value="SEMANAL">Semanal</option>
          </select>
        </div>

        {frecuencia === 'MENSUAL' ? (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Día del mes que cobras</label>
            <input required type="number" min="1" max="31" value={form.diaMes} onChange={set('diaMes')} className="input" placeholder="15" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de la semana</label>
              <select value={form.diaSemana} onChange={set('diaSemana')} className="input">
                <option value="">Seleccionar...</option>
                {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Fecha de primer cobro (referencia)</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        )}

        {frecuencia === 'MENSUAL' && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fecha de referencia</label>
            <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  )
}
```

### Step 2: Crear `src/components/ingresos/IngresoManualForm.tsx`

```typescript
'use client'
import { useState } from 'react'

export interface IngresoManualFormData {
  monto: string
  fecha: string
  descripcion: string
  fuenteId: string
}

interface Fuente { id: string; nombre: string }

interface Props {
  fuentes: Fuente[]
  onSave: (data: IngresoManualFormData) => void
  onCancel: () => void
}

export default function IngresoManualForm({ fuentes, onSave, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<IngresoManualFormData>({
    monto: '',
    fecha: today,
    descripcion: '',
    fuenteId: '',
  })

  const set = (k: keyof IngresoManualFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">Registrar cobro</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto recibido</label>
          <input required type="number" step="0.01" min="0" value={form.monto} onChange={set('monto')} className="input" placeholder="22000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Fecha</label>
          <input required type="date" value={form.fecha} onChange={set('fecha')} className="input" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Fuente (opcional)</label>
          <select value={form.fuenteId} onChange={set('fuenteId')} className="input">
            <option value="">Sin fuente específica</option>
            {fuentes.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Descripción (opcional)</label>
          <input value={form.descripcion} onChange={set('descripcion')} className="input" placeholder="Bono, comisión..." />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Registrar</button>
      </div>
    </form>
  )
}
```

### Step 3: Crear `src/app/(dashboard)/ingresos/page.tsx`

```typescript
'use client'
import { useEffect, useState } from 'react'
import FuenteIngresoForm from '@/components/ingresos/FuenteIngresoForm'
import IngresoManualForm from '@/components/ingresos/IngresoManualForm'

interface FuenteIngreso {
  id: string
  nombre: string
  monto: string | number
  frecuencia: string
  diaSemana?: number | null
  diaMes?: number | null
  fechaBase: string
  activo: boolean
  ingresos?: IngresoManual[]
}

interface IngresoManual {
  id: string
  monto: string | number
  fecha: string
  descripcion?: string | null
  fuente?: { nombre: string } | null
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FREC_LABEL: Record<string, string> = {
  MENSUAL: 'Mensual', QUINCENAL: 'Quincenal', SEMANAL: 'Semanal',
}

export default function IngresosPage() {
  const [fuentes, setFuentes] = useState<FuenteIngreso[]>([])
  const [ingresos, setIngresos] = useState<IngresoManual[]>([])
  const [showFuenteForm, setShowFuenteForm] = useState(false)
  const [editandoFuente, setEditandoFuente] = useState<FuenteIngreso | null>(null)
  const [showIngresoForm, setShowIngresoForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const [fRes, iRes] = await Promise.all([
      fetch('/api/ingresos').then(r => r.json()),
      fetch('/api/ingresos/manuales').then(r => r.json()),
    ])
    setFuentes(fRes)
    setIngresos(iRes)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardarFuente = async (data: any) => {
    const res = editandoFuente
      ? await fetch(`/api/ingresos/${editandoFuente.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      : await fetch('/api/ingresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
    if (!res.ok) { alert('Error al guardar'); return }
    setShowFuenteForm(false)
    setEditandoFuente(null)
    cargar()
  }

  const eliminarFuente = async (id: string) => {
    if (!confirm('¿Desactivar esta fuente de ingreso?')) return
    await fetch(`/api/ingresos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const guardarIngreso = async (data: any) => {
    const res = await fetch('/api/ingresos/manuales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { alert('Error al registrar'); return }
    setShowIngresoForm(false)
    cargar()
  }

  const eliminarIngreso = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/ingresos/manuales/${id}`, { method: 'DELETE' })
    cargar()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">💰 Ingresos</h1>
        <p className="text-slate-400 text-sm">Configura tus fuentes de ingreso y registra cobros recibidos.</p>
      </div>

      {/* Fuentes de ingreso */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Fuentes de ingreso</h2>
          <button onClick={() => { setShowFuenteForm(true); setEditandoFuente(null) }} className="btn-primary text-sm">
            + Nueva fuente
          </button>
        </div>

        {showFuenteForm && (
          <FuenteIngresoForm onSave={guardarFuente} onCancel={() => setShowFuenteForm(false)} />
        )}
        {editandoFuente && (
          <FuenteIngresoForm
            initial={{
              ...editandoFuente,
              monto: String(editandoFuente.monto),
              diaSemana: editandoFuente.diaSemana != null ? String(editandoFuente.diaSemana) : '',
              diaMes: editandoFuente.diaMes != null ? String(editandoFuente.diaMes) : '',
              fechaBase: editandoFuente.fechaBase?.split('T')[0] ?? '',
            }}
            onSave={guardarFuente}
            onCancel={() => setEditandoFuente(null)}
          />
        )}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : fuentes.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-slate-400">Sin fuentes de ingreso configuradas.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {fuentes.map(f => (
              <div key={f.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{f.nombre}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      {FREC_LABEL[f.frecuencia]}
                    </span>
                    {!f.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">Inactiva</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ${Number(f.monto).toLocaleString('es-MX')} MXN
                    {f.frecuencia !== 'MENSUAL' && f.diaSemana != null && ` · ${DIAS_SEMANA[f.diaSemana]}`}
                    {f.frecuencia === 'MENSUAL' && f.diaMes && ` · día ${f.diaMes} de cada mes`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setEditandoFuente(f); setShowFuenteForm(false) }} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                  {f.activo && <button onClick={() => eliminarFuente(f.id)} className="text-xs text-slate-500 hover:text-red-400">Desactivar</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ingresos manuales */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cobros registrados</h2>
          <button onClick={() => setShowIngresoForm(true)} className="btn-primary text-sm">+ Registrar cobro</button>
        </div>

        {showIngresoForm && (
          <IngresoManualForm
            fuentes={fuentes.filter(f => f.activo)}
            onSave={guardarIngreso}
            onCancel={() => setShowIngresoForm(false)}
          />
        )}

        {ingresos.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-slate-400 text-sm">Sin cobros registrados aún.</p>
          </div>
        ) : (
          <div className="card">
            <div className="space-y-3">
              {ingresos.map(i => (
                <div key={i.id} className="flex items-center gap-3">
                  <span className="text-xl shrink-0">💵</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{i.descripcion ?? i.fuente?.nombre ?? 'Ingreso'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(i.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {i.fuente && ` · ${i.fuente.nombre}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 shrink-0">+${Number(i.monto).toLocaleString('es-MX')}</span>
                  <button onClick={() => eliminarIngreso(i.id)} className="text-xs text-slate-600 hover:text-red-400">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
```

### Step 4: Commit

```bash
git add src/components/ingresos/ src/app/\(dashboard\)/ingresos/
git commit -m "feat: nueva página /ingresos con CRUD de fuentes y registro de cobros"
```

---

## Task 8: UI — Actualizar Dashboard y Sidebar

**Files:**
- Modify: `src/components/dashboard/SavingsCard.tsx`
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/components/Sidebar.tsx`

### Step 1: Actualizar `src/components/dashboard/SavingsCard.tsx`

Leer el archivo actual primero, luego reemplazar con soporte para la nueva estructura `ResumenAhorro`:

```typescript
import type { ResumenAhorro } from '@/lib/savings-calculator'

interface Props {
  resumen: ResumenAhorro
}

export default function SavingsCard({ resumen }: Props) {
  const { cobros } = resumen

  if (cobros.length === 0) {
    return (
      <div className="card flex items-center justify-center h-48">
        <p className="text-slate-500 text-sm">Sin proyección disponible</p>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-sm font-semibold text-slate-400">💡 Plan de ahorro</h2>
      <div className="space-y-4">
        {cobros.map((cobro, idx) => (
          <div key={idx} className={idx > 0 ? 'pt-4 border-t border-slate-700/50' : ''}>
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <p className="text-xs text-slate-500">{cobro.fuenteNombre}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {new Date(cobro.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="text-emerald-400 font-semibold">${cobro.montoIngreso.toLocaleString('es-MX')}</p>
            </div>

            {cobro.desglose.length > 0 && (
              <div className="space-y-1 mb-2">
                {cobro.desglose.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">Apartar para {d.creditoNombre}</span>
                    <span className="text-orange-400">−${d.monto.toLocaleString('es-MX')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-700/30">
              <span className="text-slate-400">Disponible</span>
              <span className={cobro.disponible >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ${cobro.disponible.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 2: Actualizar `src/app/(dashboard)/page.tsx`

Cambiar la query de `configuracionSalario` a `fuenteIngreso`:

```typescript
// Reemplazar las líneas:
//   const [creditos, config] = await Promise.all([
//     prisma.credito.findMany(...),
//     prisma.configuracionSalario.findFirst(),
//   ])
// Con:
const [creditos, fuentes] = await Promise.all([
  prisma.credito.findMany({ where: { activo: true }, orderBy: { diaPago: 'asc' } }),
  prisma.fuenteIngreso.findMany({ where: { activo: true } }),
])

// Reemplazar el bloque resumenAhorro:
const resumenAhorro = fuentes.length > 0
  ? calcularResumenAhorro(
      creditos.map(c => ({
        nombre: c.nombre,
        pagoMensual: Number(c.pagoMensual),
        frecuencia: c.frecuencia as any,
        diaPago: c.diaPago,
        diaSemana: c.diaSemana ?? undefined,
        fechaBase: c.fechaBase ?? undefined,
      })),
      fuentes.map(f => ({
        nombre: f.nombre,
        monto: Number(f.monto),
        frecuencia: f.frecuencia as any,
        diaMes: f.diaMes ?? undefined,
        diaSemana: f.diaSemana ?? undefined,
        fechaBase: f.fechaBase,
      })),
      new Date()
    )
  : null

// Reemplazar const salario = config ? ... con:
const salarioTotal = fuentes.reduce((s, f) => s + Number(f.monto), 0)
```

Y actualizar las referencias a `salario` → `salarioTotal` y `config` → `fuentes.length > 0` en el JSX.

### Step 3: Actualizar `src/components/Sidebar.tsx`

Leer el archivo actual. Agregar el enlace a `/ingresos` entre Dashboard y Créditos:

```typescript
// Agregar a la lista de links:
{ href: '/ingresos', label: '💰 Ingresos' }
```

### Step 4: Commit

```bash
git add src/components/dashboard/SavingsCard.tsx src/app/\(dashboard\)/page.tsx src/components/Sidebar.tsx
git commit -m "feat: actualizar Dashboard y Sidebar para usar FuenteIngreso y nuevo ResumenAhorro"
```

---

## Task 9: Verificación final y deploy

### Step 1: Correr todos los tests

```bash
cd /home/ardepa/finanzas-ardepa
npx vitest run
```

Expected: todos los tests PASS.

### Step 2: Build de producción local

```bash
npm run build
```

Expected: sin errores de TypeScript ni build.

### Step 3: Probar flujo completo en local

```bash
npm run dev
```

Verificar:
1. `/ingresos` → crear fuente "Salario" quincenal $22,000 con fechaBase 2026-03-02
2. `/creditos` → crear crédito mensual día 15
3. `/creditos` → crear crédito semanal con fecha base
4. Dashboard → SavingsCard muestra 3 cobros con desglose
5. `/ingresos` → registrar cobro manual

### Step 4: Push y deploy

```bash
git push origin main
```

Expected: GitHub Action dispara redeploy en VPS Hostinger. El servicio `migrate` correrá las 2 nuevas migraciones automáticamente.
