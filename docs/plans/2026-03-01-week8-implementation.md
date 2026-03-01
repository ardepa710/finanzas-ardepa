# Week 8 Implementation Plan — AI Insights + Gamificación + Polish + Docs

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completar las 7 features finales de finanzas-ardepa: AI Smart Insights via Claude API, sistema completo de gamificación (Logros + Streak + Niveles/XP), UX polish con skeletons y empty states, y documentación completa.

**Architecture:** El proyecto usa Next.js 15 + Prisma 7 + PostgreSQL con patrón `withErrorHandling` HOF en API routes. Features organizadas en `src/features/<nombre>/`. Tests con Vitest + mocks de Prisma (`vi.mock('@/lib/prisma', ...)`). Schema Prisma ya tiene modelo `Insight` pre-definido (solo requiere migración).

**Tech Stack:** Next.js 15, Prisma 7, @anthropic-ai/sdk, Vitest, Tailwind CSS v4, React Query

---

## Task 21: AI Smart Insights Backend

**Files:**
- Modify: `prisma/schema.prisma` (actualizar default `modelo` en Insight)
- Create: `src/features/insights/services/insight-generator.ts`
- Create: `src/features/insights/types.ts`
- Create: `src/app/api/insights/route.ts`
- Create: `src/features/insights/services/__tests__/insight-generator.test.ts`

**Context:** El modelo `Insight` ya existe en `prisma/schema.prisma` con `TipoInsight` enum y `Prioridad` enum. Solo necesitamos migrar y construir el service que llama a Claude.

### Step 1: Instalar SDK de Anthropic

```bash
npm install @anthropic-ai/sdk
```

Expected: `added 1 package` sin errores.

### Step 2: Agregar ANTHROPIC_API_KEY al entorno

Editar `.env.local` y agregar:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Step 3: Actualizar schema — cambiar default de modelo

En `prisma/schema.prisma`, campo `modelo` en model `Insight`:
```prisma
modelo      String      @default("claude-haiku-4-5-20251001")
```

### Step 4: Migrar schema a la DB

```bash
npx prisma migrate dev --name add_insight_table
```

Expected: `Your database is now in sync with your schema.`

### Step 5: Crear tipos del feature

Crear `src/features/insights/types.ts`:
```typescript
export type TipoInsightFrontend = 'ALERTA' | 'OPORTUNIDAD' | 'LOGRO' | 'SUGERENCIA'

export interface InsightGenerado {
  tipo: TipoInsightFrontend
  titulo: string
  descripcion: string
  accion: string
  prioridad: 1 | 2 | 3 | 4 | 5
  datos: Record<string, number | string>
}

export interface ContextoFinanciero {
  ingresoMensual: number
  gastoPromedio90d: number
  deudaTotal: number
  dti: number           // Debt-to-Income ratio %
  savingsRate: number   // %
  metasActivas: number
  metasProgreso: number // promedio %
  cashflowProximo: number
}
```

### Step 6: Escribir tests del service (TDD — primero)

Crear `src/features/insights/services/__tests__/insight-generator.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generarInsights, buildContexto } from '../insight-generator'
import { prisma } from '@/lib/prisma'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify([
          {
            tipo: 'ALERTA',
            titulo: 'Deuda alta',
            descripcion: 'Tu DTI es 45%.',
            accion: 'Aumenta el pago mínimo',
            prioridad: 5,
            datos: { dti: 45 }
          }
        ])}],
        usage: { input_tokens: 500, output_tokens: 200 }
      })
    }
  }))
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fuenteIngreso: { findMany: vi.fn() },
    gasto: { findMany: vi.fn() },
    credito: { findMany: vi.fn() },
    meta: { findMany: vi.fn() },
    insight: { create: vi.fn(), findMany: vi.fn() },
  }
}))

describe('buildContexto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns zero context when DB is empty', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const ctx = await buildContexto()

    expect(ctx.ingresoMensual).toBe(0)
    expect(ctx.deudaTotal).toBe(0)
    expect(ctx.metasActivas).toBe(0)
  })

  it('normalizes QUINCENAL income to monthly (×2)', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: { toNumber: () => 10000 }, frecuencia: 'QUINCENAL', activo: true } as any
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const ctx = await buildContexto()

    expect(ctx.ingresoMensual).toBe(20000)
  })
})

describe('generarInsights', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls Claude API and returns parsed insights', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.insight.create).mockResolvedValue({} as any)

    const insights = await generarInsights()

    expect(Array.isArray(insights)).toBe(true)
    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]).toHaveProperty('titulo')
    expect(insights[0]).toHaveProperty('tipo')
  })

  it('returns empty array when ANTHROPIC_API_KEY is missing', async () => {
    const original = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const insights = await generarInsights()
    expect(insights).toEqual([])
    process.env.ANTHROPIC_API_KEY = original
  })
})
```

### Step 7: Verificar que los tests fallan

```bash
npm test -- src/features/insights
```

Expected: FAIL — `Cannot find module '../insight-generator'`

### Step 8: Implementar el service

Crear `src/features/insights/services/insight-generator.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import type { ContextoFinanciero, InsightGenerado } from '../types'
import { Decimal } from '@prisma/client/runtime/client'

function toNum(v: Decimal | number): number {
  return typeof v === 'object' && 'toNumber' in v ? v.toNumber() : Number(v)
}

export async function buildContexto(): Promise<ContextoFinanciero> {
  const [fuentes, gastos90d, creditos, metas] = await Promise.all([
    prisma.fuenteIngreso.findMany({ where: { activo: true } }),
    prisma.gasto.findMany({
      where: { fecha: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.meta.findMany({ where: { activo: true } }),
  ])

  const ingresoMensual = fuentes.reduce((acc, f) => {
    const monto = toNum(f.monto)
    const factor = f.frecuencia === 'MENSUAL' ? 1 : f.frecuencia === 'QUINCENAL' ? 2 : 4.33
    return acc + monto * factor
  }, 0)

  const gastoPromedio90d = gastos90d.length > 0
    ? gastos90d.reduce((acc, g) => acc + toNum(g.monto), 0) / 3
    : 0

  const deudaTotal = creditos.reduce((acc, c) => acc + toNum(c.saldoActual), 0)
  const dti = ingresoMensual > 0
    ? (creditos.reduce((acc, c) => acc + toNum(c.pagoMensual), 0) / ingresoMensual) * 100
    : 0
  const savingsRate = ingresoMensual > 0
    ? Math.max(0, ((ingresoMensual - gastoPromedio90d) / ingresoMensual) * 100)
    : 0

  const metasActivas = metas.filter(m => m.estado === 'EN_PROGRESO').length
  const metasProgreso = metasActivas > 0
    ? metas.filter(m => m.estado === 'EN_PROGRESO')
        .reduce((acc, m) => acc + toNum(m.porcentajeProgreso), 0) / metasActivas
    : 0

  return {
    ingresoMensual: Math.round(ingresoMensual),
    gastoPromedio90d: Math.round(gastoPromedio90d),
    deudaTotal: Math.round(deudaTotal),
    dti: Math.round(dti * 10) / 10,
    savingsRate: Math.round(savingsRate * 10) / 10,
    metasActivas,
    metasProgreso: Math.round(metasProgreso),
    cashflowProximo: Math.round(ingresoMensual - gastoPromedio90d),
  }
}

const SYSTEM_PROMPT = `Eres un asesor financiero personal analizando los datos reales de un usuario mexicano.
Analiza el contexto financiero y genera entre 4 y 6 insights accionables.
IMPORTANTE: Responde ÚNICAMENTE con un JSON array válido, sin texto adicional, sin markdown, sin explicaciones.
Cada insight debe tener exactamente: tipo, titulo, descripcion, accion, prioridad (1-5, donde 5 es más urgente), datos.
tipos válidos: ALERTA, OPORTUNIDAD, LOGRO, SUGERENCIA`

export async function generarInsights(): Promise<InsightGenerado[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []

  const ctx = await buildContexto()

  const userPrompt = `Contexto financiero del usuario (MXN):
- Ingreso mensual: $${ctx.ingresoMensual.toLocaleString('es-MX')}
- Gasto promedio mensual (90 días): $${ctx.gastoPromedio90d.toLocaleString('es-MX')}
- Deuda total: $${ctx.deudaTotal.toLocaleString('es-MX')}
- Ratio deuda/ingreso (DTI): ${ctx.dti}%
- Tasa de ahorro: ${ctx.savingsRate}%
- Metas activas: ${ctx.metasActivas} (progreso promedio: ${ctx.metasProgreso}%)
- Cashflow próximo mes estimado: $${ctx.cashflowProximo.toLocaleString('es-MX')}

Genera insights específicos basados en estos números reales.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: SYSTEM_PROMPT,
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const insights: InsightGenerado[] = JSON.parse(text)

    // Persistir en DB (últimos insights para historial)
    await Promise.all(insights.slice(0, 4).map(ins =>
      prisma.insight.create({
        data: {
          tipo: ins.tipo === 'ALERTA' ? 'GASTOS' : ins.tipo === 'OPORTUNIDAD' ? 'AHORRO' : 'GENERAL',
          titulo: ins.titulo,
          contenido: `${ins.descripcion} ${ins.accion}`,
          prioridad: ins.prioridad >= 4 ? 'URGENTE' : ins.prioridad >= 3 ? 'ALTA' : 'NORMAL',
          modelo: 'claude-haiku-4-5-20251001',
          tokens: (message.usage.input_tokens + message.usage.output_tokens),
        }
      })
    ))

    return insights.sort((a, b) => b.prioridad - a.prioridad)
  } catch {
    return []
  }
}
```

### Step 9: Crear API route

Crear `src/app/api/insights/route.ts`:
```typescript
import { withErrorHandling } from '@/lib/api-error'
import { generarInsights } from '@/features/insights/services/insight-generator'

export const GET = withErrorHandling(async () => {
  const insights = await generarInsights()
  return insights
})
```

### Step 10: Correr los tests

```bash
npm test -- src/features/insights
```

Expected: PASS — todos los tests verdes.

### Step 11: Commit

```bash
git add src/features/insights/ src/app/api/insights/ prisma/schema.prisma
git commit -m "feat: add AI Smart Insights backend with Claude API (Task 21)"
```

---

## Task 22: AI Smart Insights Frontend

**Files:**
- Create: `src/features/insights/components/InsightCard.tsx`
- Create: `src/features/insights/components/InsightsSkeleton.tsx`
- Create: `src/features/insights/components/InsightsSection.tsx`
- Create: `src/features/insights/hooks/useInsights.ts`
- Create: `src/features/insights/components/__tests__/InsightCard.test.tsx`
- Modify: `src/app/(dashboard)/page.tsx` (agregar InsightsSection)

### Step 1: Escribir tests del componente InsightCard (TDD)

Crear `src/features/insights/components/__tests__/InsightCard.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InsightCard from '../InsightCard'

const mockInsight = {
  tipo: 'ALERTA' as const,
  titulo: 'DTI muy alto',
  descripcion: 'Tu ratio deuda-ingreso es 45%.',
  accion: 'Aumenta el pago de tu crédito mayor.',
  prioridad: 5 as const,
  datos: { dti: 45 }
}

describe('InsightCard', () => {
  it('renders titulo and descripcion', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText('DTI muy alto')).toBeDefined()
    expect(screen.getByText(/Tu ratio deuda-ingreso/)).toBeDefined()
  })

  it('renders emoji icon for ALERTA type', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText('🚨')).toBeDefined()
  })

  it('renders accion text', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText(/Aumenta el pago/)).toBeDefined()
  })

  it('shows high priority badge for prioridad 5', () => {
    render(<InsightCard insight={mockInsight} />)
    expect(screen.getByText(/urgente/i)).toBeDefined()
  })
})
```

### Step 2: Verificar que falla

```bash
npm test -- InsightCard.test
```

Expected: FAIL — cannot find module

### Step 3: Implementar InsightCard

Crear `src/features/insights/components/InsightCard.tsx`:
```typescript
'use client'
import type { InsightGenerado } from '../types'

const ICONOS: Record<string, string> = {
  ALERTA: '🚨',
  OPORTUNIDAD: '💡',
  LOGRO: '🏆',
  SUGERENCIA: '💬',
}

const PRIORIDAD_LABELS: Record<number, { label: string; cls: string }> = {
  5: { label: 'Urgente', cls: 'bg-red-500/20 text-red-400' },
  4: { label: 'Alto', cls: 'bg-orange-500/20 text-orange-400' },
  3: { label: 'Medio', cls: 'bg-yellow-500/20 text-yellow-400' },
  2: { label: 'Bajo', cls: 'bg-blue-500/20 text-blue-400' },
  1: { label: 'Info', cls: 'bg-slate-500/20 text-slate-400' },
}

export default function InsightCard({ insight }: { insight: InsightGenerado }) {
  const pLabel = PRIORIDAD_LABELS[insight.prioridad] ?? PRIORIDAD_LABELS[1]

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{ICONOS[insight.tipo] ?? '💬'}</span>
          <h3 className="text-sm font-semibold text-slate-100">{insight.titulo}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${pLabel.cls}`}>
          {pLabel.label}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{insight.descripcion}</p>
      <p className="text-xs text-emerald-400 font-medium">→ {insight.accion}</p>
    </div>
  )
}
```

### Step 4: Implementar InsightsSkeleton

Crear `src/features/insights/components/InsightsSkeleton.tsx`:
```typescript
export default function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-700 rounded-full" />
            <div className="h-4 bg-slate-700 rounded w-48" />
          </div>
          <div className="h-3 bg-slate-700 rounded w-full" />
          <div className="h-3 bg-slate-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}
```

### Step 5: Implementar el hook useInsights

Crear `src/features/insights/hooks/useInsights.ts`:
```typescript
'use client'
import { useQuery } from '@tanstack/react-query'
import type { InsightGenerado } from '../types'

async function fetchInsights(): Promise<InsightGenerado[]> {
  const res = await fetch('/api/insights')
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.error?.message ?? 'Error al obtener insights')
  return json.data
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    staleTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  })
}
```

### Step 6: Implementar InsightsSection

Crear `src/features/insights/components/InsightsSection.tsx`:
```typescript
'use client'
import { useInsights } from '../hooks/useInsights'
import InsightCard from './InsightCard'
import InsightsSkeleton from './InsightsSkeleton'
import { useQueryClient } from '@tanstack/react-query'

export default function InsightsSection() {
  const { data: insights, isLoading, isError } = useInsights()
  const qc = useQueryClient()

  if (isLoading) return (
    <section>
      <h2 className="text-base font-semibold text-slate-200 mb-3">🤖 Insights IA</h2>
      <InsightsSkeleton />
    </section>
  )

  if (isError || !insights || insights.length === 0) return (
    <section>
      <h2 className="text-base font-semibold text-slate-200 mb-3">🤖 Insights IA</h2>
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400">Agrega ingresos y gastos para recibir análisis personalizados.</p>
      </div>
    </section>
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-200">🤖 Insights IA</h2>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['insights'] })}
          className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          Actualizar
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <InsightCard key={i} insight={ins} />
        ))}
      </div>
    </section>
  )
}
```

### Step 7: Agregar InsightsSection al dashboard

En `src/app/(dashboard)/page.tsx`, importar y agregar `<InsightsSection />` después de las Quick Stats cards y antes del resto del contenido.

### Step 8: Correr todos los tests

```bash
npm test -- src/features/insights
```

Expected: PASS — todos los tests verdes.

### Step 9: Commit

```bash
git add src/features/insights/components/ src/features/insights/hooks/ src/app/\(dashboard\)/page.tsx
git commit -m "feat: add AI Smart Insights frontend with React Query (Task 22)"
```

---

## Task 23: Gamificación — Sistema de Logros

**Files:**
- Modify: `prisma/schema.prisma` (agregar Logro, Streak, NivelUsuario)
- Create: `prisma/gamificacion-seed.ts`
- Create: `src/features/gamificacion/types.ts`
- Create: `src/features/gamificacion/services/logros-checker.ts`
- Create: `src/app/api/gamificacion/logros/route.ts`
- Create: `src/app/api/gamificacion/check-logros/route.ts`
- Create: `src/features/gamificacion/services/__tests__/logros-checker.test.ts`

### Step 1: Agregar modelos al schema

En `prisma/schema.prisma`, agregar después del último modelo:
```prisma
enum CategoriaLogro {
  DEUDA
  AHORRO
  GASTO
  INVERSION
  RACHA
  META
}

enum TipoStreak {
  GASTOS_DIARIOS
  METAS_CONTRIBUCION
}

model Logro {
  id           String         @id @default(cuid())
  codigo       String         @unique
  nombre       String
  descripcion  String
  icono        String
  categoria    CategoriaLogro
  xp           Int
  desbloqueado Boolean        @default(false)
  fechaLogro   DateTime?
  createdAt    DateTime       @default(now())

  @@index([desbloqueado])
  @@index([categoria])
}

model Streak {
  id              String     @id @default(cuid())
  tipo            TipoStreak @unique
  rachaActual     Int        @default(0)
  rachaMayor      Int        @default(0)
  ultimaActividad DateTime?
  activo          Boolean    @default(true)
}

model NivelUsuario {
  id          String @id @default(cuid())
  xpTotal     Int    @default(0)
  nivelActual Int    @default(1)
  xpSiguiente Int    @default(100)
}
```

### Step 2: Migrar

```bash
npx prisma migrate dev --name add_gamificacion
```

Expected: `Your database is now in sync with your schema.`

### Step 3: Crear seed de logros

Crear `prisma/gamificacion-seed.ts`:
```typescript
import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

const LOGROS_SEED = [
  { codigo: 'PRIMER_GASTO', nombre: 'Primer Registro', descripcion: 'Registraste tu primer gasto', icono: '📝', categoria: 'GASTO', xp: 10 },
  { codigo: 'CREDITO_PRIMERO', nombre: 'Conoce tu Deuda', descripcion: 'Agregaste tu primer crédito', icono: '💳', categoria: 'DEUDA', xp: 20 },
  { codigo: 'META_PRIMERA', nombre: 'Primer Objetivo', descripcion: 'Creaste tu primera meta de ahorro', icono: '🎯', categoria: 'META', xp: 30 },
  { codigo: 'INVERSION_PRIMERA', nombre: 'Primer Inversor', descripcion: 'Registraste tu primera inversión', icono: '📈', categoria: 'INVERSION', xp: 50 },
  { codigo: 'RACHA_7', nombre: 'Semana Perfecta', descripcion: '7 días seguidos registrando gastos', icono: '🔥', categoria: 'RACHA', xp: 50 },
  { codigo: 'RACHA_30', nombre: 'Mes Disciplinado', descripcion: '30 días seguidos registrando gastos', icono: '🏅', categoria: 'RACHA', xp: 200 },
  { codigo: 'PRESUPUESTO_OK', nombre: 'Mes en Verde', descripcion: 'Un mes sin superar ningún presupuesto', icono: '✅', categoria: 'AHORRO', xp: 80 },
  { codigo: 'DEUDA_50', nombre: 'A Mitad del Camino', descripcion: 'Un crédito llegó al 50% pagado', icono: '⚡', categoria: 'DEUDA', xp: 75 },
  { codigo: 'DEUDA_PAGADA', nombre: 'Deuda Libre', descripcion: 'Liquidaste un crédito completamente', icono: '🎉', categoria: 'DEUDA', xp: 300 },
  { codigo: 'AHORRO_10K', nombre: 'Club de los 10K', descripcion: 'Acumulaste $10,000 en metas de ahorro', icono: '💰', categoria: 'AHORRO', xp: 100 },
  { codigo: 'META_3', nombre: 'Soñador', descripcion: 'Tienes 3 metas activas simultáneas', icono: '🌟', categoria: 'META', xp: 45 },
  { codigo: 'META_COMPLETA', nombre: 'Meta Alcanzada', descripcion: 'Completaste una meta de ahorro al 100%', icono: '🏆', categoria: 'META', xp: 150 },
  { codigo: 'INVERSION_10K', nombre: 'Inversor Serio', descripcion: 'Portfolio de inversiones supera $10,000', icono: '📊', categoria: 'INVERSION', xp: 120 },
  { codigo: 'GASTO_100', nombre: 'Centurión', descripcion: 'Has registrado 100 gastos', icono: '💯', categoria: 'GASTO', xp: 60 },
  { codigo: 'SIN_DEUDA', nombre: 'Libertad Financiera', descripcion: 'Todos tus créditos están liquidados', icono: '🕊️', categoria: 'DEUDA', xp: 500 },
]

async function main() {
  console.log('Seeding logros...')
  for (const logro of LOGROS_SEED) {
    await prisma.logro.upsert({
      where: { codigo: logro.codigo },
      update: {},
      create: { ...logro, categoria: logro.categoria as any },
    })
  }

  // Crear streaks iniciales
  await prisma.streak.upsert({
    where: { tipo: 'GASTOS_DIARIOS' },
    update: {},
    create: { tipo: 'GASTOS_DIARIOS' },
  })
  await prisma.streak.upsert({
    where: { tipo: 'METAS_CONTRIBUCION' },
    update: {},
    create: { tipo: 'METAS_CONTRIBUCION' },
  })

  // Crear nivel inicial si no existe
  const count = await prisma.nivelUsuario.count()
  if (count === 0) {
    await prisma.nivelUsuario.create({ data: {} })
  }

  console.log('Gamificación seed completado: 15 logros, 2 streaks, 1 nivel')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

### Step 4: Ejecutar seed de gamificación

```bash
npx ts-node prisma/gamificacion-seed.ts
```

Expected: `Gamificación seed completado: 15 logros, 2 streaks, 1 nivel`

### Step 5: Crear tipos de gamificación

Crear `src/features/gamificacion/types.ts`:
```typescript
export interface LogroConEstado {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  icono: string
  categoria: string
  xp: number
  desbloqueado: boolean
  fechaLogro: Date | null
}

export interface CheckLogrosResult {
  nuevos: LogroConEstado[]
  xpGanado: number
}
```

### Step 6: Escribir tests del logros-checker (TDD)

Crear `src/features/gamificacion/services/__tests__/logros-checker.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkLogros } from '../logros-checker'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    logro: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    gasto: { count: vi.fn() },
    credito: { findMany: vi.fn() },
    meta: { findMany: vi.fn() },
    inversione: { findMany: vi.fn() },
    inversion: { findMany: vi.fn() },
    nivelUsuario: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  }
}))

describe('checkLogros', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty when all logros already unlocked', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.count).mockResolvedValue(5)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({ id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100 } as any)

    const result = await checkLogros()

    expect(result.nuevos).toHaveLength(0)
    expect(result.xpGanado).toBe(0)
  })

  it('unlocks PRIMER_GASTO when count >= 1', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([
      { id: '1', codigo: 'PRIMER_GASTO', xp: 10, desbloqueado: false, nombre: 'Primer Registro', descripcion: '', icono: '📝', categoria: 'GASTO', fechaLogro: null, createdAt: new Date() } as any
    ])
    vi.mocked(prisma.gasto.count).mockResolvedValue(1)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.logro.update).mockResolvedValue({} as any)
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({ id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100 } as any)
    vi.mocked(prisma.nivelUsuario.update).mockResolvedValue({} as any)

    const result = await checkLogros()

    expect(result.nuevos).toHaveLength(1)
    expect(result.nuevos[0].codigo).toBe('PRIMER_GASTO')
    expect(result.xpGanado).toBe(10)
  })

  it('unlocks DEUDA_PAGADA when credito saldoActual is 0', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([
      { id: '2', codigo: 'DEUDA_PAGADA', xp: 300, desbloqueado: false, nombre: 'Deuda Libre', descripcion: '', icono: '🎉', categoria: 'DEUDA', fechaLogro: null, createdAt: new Date() } as any
    ])
    vi.mocked(prisma.gasto.count).mockResolvedValue(0)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: { toNumber: () => 0 }, montoTotal: { toNumber: () => 5000 }, activo: true } as any
    ])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.logro.update).mockResolvedValue({} as any)
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({ id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100 } as any)
    vi.mocked(prisma.nivelUsuario.update).mockResolvedValue({} as any)

    const result = await checkLogros()

    expect(result.nuevos[0].codigo).toBe('DEUDA_PAGADA')
  })
})
```

### Step 7: Verificar que tests fallan

```bash
npm test -- logros-checker.test
```

Expected: FAIL — cannot find module `../logros-checker`

### Step 8: Implementar logros-checker

Crear `src/features/gamificacion/services/logros-checker.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import type { CheckLogrosResult, LogroConEstado } from '../types'

const NIVELES = [
  { nivel: 1, nombre: 'Principiante', xpSiguiente: 100 },
  { nivel: 2, nombre: 'Consciente', xpSiguiente: 250 },
  { nivel: 3, nombre: 'Organizado', xpSiguiente: 500 },
  { nivel: 4, nombre: 'Planificador', xpSiguiente: 900 },
  { nivel: 5, nombre: 'Ahorrista', xpSiguiente: 1400 },
  { nivel: 6, nombre: 'Inversor', xpSiguiente: 2000 },
  { nivel: 7, nombre: 'Estratega', xpSiguiente: 2800 },
  { nivel: 8, nombre: 'Experto', xpSiguiente: 3800 },
  { nivel: 9, nombre: 'Maestro', xpSiguiente: 5000 },
  { nivel: 10, nombre: 'Élite Financiero', xpSiguiente: 99999 },
]

function toNum(v: any): number {
  return typeof v === 'object' && v !== null && 'toNumber' in v ? v.toNumber() : Number(v)
}

async function evaluarLogro(codigo: string): Promise<boolean> {
  switch (codigo) {
    case 'PRIMER_GASTO':
      return (await prisma.gasto.count()) >= 1
    case 'GASTO_100':
      return (await prisma.gasto.count()) >= 100
    case 'CREDITO_PRIMERO': {
      const creditos = await prisma.credito.findMany()
      return creditos.length >= 1
    }
    case 'DEUDA_50': {
      const creditos = await prisma.credito.findMany({ where: { activo: true } })
      return creditos.some(c => toNum(c.saldoActual) <= toNum(c.montoTotal) * 0.5 && toNum(c.montoTotal) > 0)
    }
    case 'DEUDA_PAGADA': {
      const creditos = await prisma.credito.findMany()
      return creditos.some(c => toNum(c.saldoActual) === 0 && toNum(c.montoTotal) > 0)
    }
    case 'SIN_DEUDA': {
      const activos = await prisma.credito.findMany({ where: { activo: true } })
      return activos.length > 0 && activos.every(c => toNum(c.saldoActual) === 0)
    }
    case 'META_PRIMERA': {
      const metas = await prisma.meta.findMany()
      return metas.length >= 1
    }
    case 'META_3': {
      const activas = await prisma.meta.findMany({ where: { estado: 'EN_PROGRESO', activo: true } })
      return activas.length >= 3
    }
    case 'META_COMPLETA': {
      const metas = await prisma.meta.findMany({ where: { estado: 'COMPLETADA' } })
      return metas.length >= 1
    }
    case 'AHORRO_10K': {
      const metas = await prisma.meta.findMany({ where: { activo: true } })
      const total = metas.reduce((acc, m) => acc + toNum(m.montoActual), 0)
      return total >= 10000
    }
    case 'INVERSION_PRIMERA': {
      const inv = await prisma.inversion.findMany()
      return inv.length >= 1
    }
    case 'INVERSION_10K': {
      const inv = await prisma.inversion.findMany({ where: { activo: true } })
      const total = inv.reduce((acc, i) => acc + toNum(i.valorActual), 0)
      return total >= 10000
    }
    default:
      return false
  }
}

export async function checkLogros(): Promise<CheckLogrosResult> {
  const pendientes = await prisma.logro.findMany({ where: { desbloqueado: false } })
  if (pendientes.length === 0) return { nuevos: [], xpGanado: 0 }

  const nuevos: LogroConEstado[] = []
  let xpGanado = 0

  for (const logro of pendientes) {
    const cumple = await evaluarLogro(logro.codigo)
    if (cumple) {
      await prisma.logro.update({
        where: { id: logro.id },
        data: { desbloqueado: true, fechaLogro: new Date() },
      })
      nuevos.push({ ...logro, desbloqueado: true, fechaLogro: new Date() })
      xpGanado += logro.xp
    }
  }

  if (xpGanado > 0) {
    const nivel = await prisma.nivelUsuario.findFirst()
    if (nivel) {
      const nuevoXp = nivel.xpTotal + xpGanado
      const nivelObj = NIVELES.findLast(n => n.nivel <= nivel.nivelActual) ?? NIVELES[0]
      const siguienteNivel = NIVELES.find(n => n.nivel === nivel.nivelActual + 1)
      await prisma.nivelUsuario.update({
        where: { id: nivel.id },
        data: {
          xpTotal: nuevoXp,
          nivelActual: siguienteNivel && nuevoXp >= nivelObj.xpSiguiente ? nivel.nivelActual + 1 : nivel.nivelActual,
        },
      })
    }
  }

  return { nuevos, xpGanado }
}
```

### Step 9: Crear API routes de logros

Crear `src/app/api/gamificacion/logros/route.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

export const GET = withErrorHandling(async () => {
  const logros = await prisma.logro.findMany({ orderBy: [{ desbloqueado: 'desc' }, { xp: 'desc' }] })
  return logros
})
```

Crear `src/app/api/gamificacion/check-logros/route.ts`:
```typescript
import { withErrorHandling } from '@/lib/api-error'
import { checkLogros } from '@/features/gamificacion/services/logros-checker'

export const POST = withErrorHandling(async () => {
  const result = await checkLogros()
  return result
})
```

### Step 10: Correr tests

```bash
npm test -- logros-checker.test
```

Expected: PASS

### Step 11: Commit

```bash
git add prisma/ src/features/gamificacion/ src/app/api/gamificacion/
git commit -m "feat: add achievement system (Logros) for gamification (Task 23)"
```

---

## Task 24: Gamificación — Racha (Streak)

**Files:**
- Create: `src/features/gamificacion/services/streak-service.ts`
- Create: `src/app/api/gamificacion/streaks/route.ts`
- Create: `src/app/api/gamificacion/streaks/check/route.ts`
- Modify: `src/app/api/gastos/route.ts` (llamar streak check al crear gasto)
- Create: `src/features/gamificacion/services/__tests__/streak-service.test.ts`

### Step 1: Escribir tests del streak-service (TDD)

Crear `src/features/gamificacion/services/__tests__/streak-service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkGastosStreak, getStreaks } from '../streak-service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    streak: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    }
  }
}))

describe('checkGastosStreak', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts streak at 1 when no prior activity', async () => {
    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 0, rachaMayor: 0, ultimaActividad: null, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(1)
    expect(result.actualizado).toBe(true)
  })

  it('increments streak when last activity was yesterday', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 5, rachaMayor: 5, ultimaActividad: yesterday, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(6)
    expect(result.actualizado).toBe(true)
  })

  it('resets streak when last activity was 2+ days ago', async () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 10, rachaMayor: 10, ultimaActividad: twoDaysAgo, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(1)
  })

  it('does not update when activity already registered today', async () => {
    const today = new Date()
    today.setHours(8, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 3, rachaMayor: 3, ultimaActividad: today, activo: true
    } as any)

    const result = await checkGastosStreak()

    expect(result.actualizado).toBe(false)
    expect(result.nuevaRacha).toBe(3)
  })

  it('updates rachaMayor when current streak exceeds it', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 7, rachaMayor: 7, ultimaActividad: yesterday, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(8)
    expect(vi.mocked(prisma.streak.update).mock.calls[0][0].data.rachaMayor).toBe(8)
  })
})
```

### Step 2: Verificar que falla

```bash
npm test -- streak-service.test
```

Expected: FAIL

### Step 3: Implementar streak-service

Crear `src/features/gamificacion/services/streak-service.ts`:
```typescript
import { prisma } from '@/lib/prisma'

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export async function checkGastosStreak(): Promise<{ actualizado: boolean; nuevaRacha: number }> {
  const streak = await prisma.streak.findFirst({ where: { tipo: 'GASTOS_DIARIOS' } })
  if (!streak) return { actualizado: false, nuevaRacha: 0 }

  const now = new Date()

  if (streak.ultimaActividad && isSameDay(streak.ultimaActividad, now)) {
    return { actualizado: false, nuevaRacha: streak.rachaActual }
  }

  let nuevaRacha: number
  if (!streak.ultimaActividad || isYesterday(streak.ultimaActividad)) {
    nuevaRacha = streak.rachaActual + 1
  } else {
    nuevaRacha = 1
  }

  const rachaMayor = Math.max(nuevaRacha, streak.rachaMayor)

  await prisma.streak.update({
    where: { id: streak.id },
    data: { rachaActual: nuevaRacha, rachaMayor, ultimaActividad: now },
  })

  return { actualizado: true, nuevaRacha }
}

export async function getStreaks() {
  return prisma.streak.findMany({ where: { activo: true } })
}
```

### Step 4: Crear API routes de streaks

Crear `src/app/api/gamificacion/streaks/route.ts`:
```typescript
import { withErrorHandling } from '@/lib/api-error'
import { getStreaks } from '@/features/gamificacion/services/streak-service'

export const GET = withErrorHandling(async () => {
  const streaks = await getStreaks()
  return streaks
})
```

Crear `src/app/api/gamificacion/streaks/check/route.ts`:
```typescript
import { withErrorHandling } from '@/lib/api-error'
import { checkGastosStreak } from '@/features/gamificacion/services/streak-service'

export const POST = withErrorHandling(async () => {
  const result = await checkGastosStreak()
  return result
})
```

### Step 5: Llamar streak check al crear un gasto

En `src/app/api/gastos/route.ts`, dentro del handler POST, después de crear el gasto, agregar:
```typescript
// Trigger streak check (fire-and-forget — no bloquea la respuesta)
import { checkGastosStreak } from '@/features/gamificacion/services/streak-service'
// ... después del prisma.gasto.create(...)
checkGastosStreak().catch(() => {}) // no bloquea
```

### Step 6: Correr tests

```bash
npm test -- streak-service.test
```

Expected: PASS

### Step 7: Commit

```bash
git add src/features/gamificacion/services/streak-service.ts src/app/api/gamificacion/streaks/ src/app/api/gastos/route.ts
git commit -m "feat: add streak tracking system for gamification (Task 24)"
```

---

## Task 25: Gamificación — Sistema de Niveles + Frontend completo

**Files:**
- Create: `src/app/api/gamificacion/perfil/route.ts`
- Create: `src/features/gamificacion/hooks/useGamificacion.ts`
- Create: `src/features/gamificacion/components/PerfilNivel.tsx`
- Create: `src/features/gamificacion/components/LogrosGrid.tsx`
- Create: `src/features/gamificacion/components/StreakCard.tsx`
- Create: `src/features/gamificacion/components/__tests__/PerfilNivel.test.tsx`
- Create: `src/app/(dashboard)/gamificacion/page.tsx`
- Modify: `src/components/Sidebar.tsx` (agregar link /gamificacion)

### Step 1: Crear API de perfil/nivel

Crear `src/app/api/gamificacion/perfil/route.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/api-error'

const NIVELES = [
  { nivel: 1, nombre: 'Principiante', xpSiguiente: 100 },
  { nivel: 2, nombre: 'Consciente', xpSiguiente: 250 },
  { nivel: 3, nombre: 'Organizado', xpSiguiente: 500 },
  { nivel: 4, nombre: 'Planificador', xpSiguiente: 900 },
  { nivel: 5, nombre: 'Ahorrista', xpSiguiente: 1400 },
  { nivel: 6, nombre: 'Inversor', xpSiguiente: 2000 },
  { nivel: 7, nombre: 'Estratega', xpSiguiente: 2800 },
  { nivel: 8, nombre: 'Experto', xpSiguiente: 3800 },
  { nivel: 9, nombre: 'Maestro', xpSiguiente: 5000 },
  { nivel: 10, nombre: 'Élite Financiero', xpSiguiente: 99999 },
]

export const GET = withErrorHandling(async () => {
  let nivel = await prisma.nivelUsuario.findFirst()
  if (!nivel) {
    nivel = await prisma.nivelUsuario.create({ data: {} })
  }
  const nivelInfo = NIVELES.find(n => n.nivel === nivel!.nivelActual) ?? NIVELES[0]
  const nivelPrevio = NIVELES.find(n => n.nivel === nivel!.nivelActual - 1)
  const xpParaNivel = nivelPrevio?.xpSiguiente ?? 0
  const xpEnNivel = nivel.xpTotal - xpParaNivel
  const xpNecesario = nivelInfo.xpSiguiente - xpParaNivel
  const progresoPct = xpNecesario > 0 ? Math.round((xpEnNivel / xpNecesario) * 100) : 100

  return {
    nivelActual: nivel.nivelActual,
    nivelNombre: nivelInfo.nombre,
    xpTotal: nivel.xpTotal,
    xpSiguiente: nivelInfo.xpSiguiente,
    progresoPct: Math.min(progresoPct, 100),
  }
})
```

### Step 2: Escribir tests de PerfilNivel (TDD)

Crear `src/features/gamificacion/components/__tests__/PerfilNivel.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerfilNivel from '../PerfilNivel'

const mockPerfil = {
  nivelActual: 3,
  nivelNombre: 'Organizado',
  xpTotal: 350,
  xpSiguiente: 500,
  progresoPct: 70,
}

describe('PerfilNivel', () => {
  it('renders nivel nombre', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText('Organizado')).toBeDefined()
  })

  it('renders nivel number', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText(/nivel 3/i)).toBeDefined()
  })

  it('renders XP total', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    expect(screen.getByText(/350/)).toBeDefined()
  })

  it('renders progress bar', () => {
    render(<PerfilNivel perfil={mockPerfil} />)
    const bar = document.querySelector('[data-testid="xp-bar"]')
    expect(bar).toBeDefined()
  })
})
```

### Step 3: Verificar que falla

```bash
npm test -- PerfilNivel.test
```

Expected: FAIL

### Step 4: Implementar componentes de gamificación

Crear `src/features/gamificacion/components/PerfilNivel.tsx`:
```typescript
interface Perfil {
  nivelActual: number
  nivelNombre: string
  xpTotal: number
  xpSiguiente: number
  progresoPct: number
}

export default function PerfilNivel({ perfil }: { perfil: Perfil }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
          <span className="text-2xl font-bold text-emerald-400">{perfil.nivelActual}</span>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Nivel {perfil.nivelActual}</p>
          <h2 className="text-xl font-bold text-slate-100">{perfil.nivelNombre}</h2>
          <p className="text-sm text-slate-400">{perfil.xpTotal} XP total</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progreso al siguiente nivel</span>
          <span>{perfil.progresoPct}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            data-testid="xp-bar"
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${perfil.progresoPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 text-right">{perfil.xpSiguiente} XP para siguiente nivel</p>
      </div>
    </div>
  )
}
```

Crear `src/features/gamificacion/components/LogrosGrid.tsx`:
```typescript
import type { LogroConEstado } from '../types'

export default function LogrosGrid({ logros }: { logros: LogroConEstado[] }) {
  const desbloqueados = logros.filter(l => l.desbloqueado)
  const bloqueados = logros.filter(l => !l.desbloqueado)

  return (
    <div>
      <p className="text-sm text-slate-400 mb-3">
        {desbloqueados.length}/{logros.length} logros desbloqueados
      </p>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {[...desbloqueados, ...bloqueados].map(logro => (
          <div
            key={logro.codigo}
            title={`${logro.nombre}: ${logro.descripcion} (+${logro.xp} XP)`}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
              logro.desbloqueado
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/40 border-slate-700 text-slate-600 grayscale opacity-40'
            }`}
          >
            <span className="text-2xl mb-1">{logro.icono}</span>
            <span className="text-xs text-center leading-tight font-medium">{logro.nombre}</span>
            <span className="text-xs mt-1 opacity-70">+{logro.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Crear `src/features/gamificacion/components/StreakCard.tsx`:
```typescript
interface StreakData {
  tipo: string
  rachaActual: number
  rachaMayor: number
  ultimaActividad: string | null
}

export default function StreakCard({ streak }: { streak: StreakData }) {
  const label = streak.tipo === 'GASTOS_DIARIOS' ? 'Gastos diarios' : 'Contribuciones a metas'
  const isActive = streak.ultimaActividad
    ? new Date(streak.ultimaActividad).toDateString() === new Date().toDateString()
    : false

  return (
    <div className={`bg-slate-800 border rounded-xl p-4 flex items-center gap-4 ${isActive ? 'border-orange-500/40' : 'border-slate-700'}`}>
      <span className="text-3xl">{isActive ? '🔥' : '💤'}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{streak.rachaActual} <span className="text-sm font-normal text-slate-400">días</span></p>
        <p className="text-xs text-slate-500">Récord: {streak.rachaMayor} días</p>
      </div>
    </div>
  )
}
```

### Step 5: Crear hooks de gamificación

Crear `src/features/gamificacion/hooks/useGamificacion.ts`:
```typescript
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function usePerfil() {
  return useQuery({
    queryKey: ['gamificacion', 'perfil'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/perfil')
      const json = await res.json()
      return json.data
    },
  })
}

export function useLogros() {
  return useQuery({
    queryKey: ['gamificacion', 'logros'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/logros')
      const json = await res.json()
      return json.data
    },
  })
}

export function useStreaks() {
  return useQuery({
    queryKey: ['gamificacion', 'streaks'],
    queryFn: async () => {
      const res = await fetch('/api/gamificacion/streaks')
      const json = await res.json()
      return json.data
    },
  })
}

export function useCheckLogros() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/gamificacion/check-logros', { method: 'POST' })
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamificacion'] })
    },
  })
}
```

### Step 6: Crear página de gamificación

Crear `src/app/(dashboard)/gamificacion/page.tsx`:
```typescript
'use client'
import { usePerfil, useLogros, useStreaks, useCheckLogros } from '@/features/gamificacion/hooks/useGamificacion'
import PerfilNivel from '@/features/gamificacion/components/PerfilNivel'
import LogrosGrid from '@/features/gamificacion/components/LogrosGrid'
import StreakCard from '@/features/gamificacion/components/StreakCard'
import { useEffect } from 'react'

export default function GamificacionPage() {
  const { data: perfil, isLoading: loadingPerfil } = usePerfil()
  const { data: logros, isLoading: loadingLogros } = useLogros()
  const { data: streaks, isLoading: loadingStreaks } = useStreaks()
  const checkLogros = useCheckLogros()

  useEffect(() => {
    checkLogros.mutate()
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-100">🏆 Gamificación</h1>

      {loadingPerfil ? (
        <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
      ) : perfil ? (
        <PerfilNivel perfil={perfil} />
      ) : null}

      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Rachas Activas</h2>
        {loadingStreaks ? (
          <div className="h-20 bg-slate-800 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {streaks?.map((s: any) => <StreakCard key={s.tipo} streak={s} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-200 mb-3">Logros</h2>
        {loadingLogros ? (
          <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
        ) : logros ? (
          <LogrosGrid logros={logros} />
        ) : null}
      </section>
    </div>
  )
}
```

### Step 7: Agregar link al Sidebar

En `src/components/Sidebar.tsx`, en el array `links`, agregar:
```typescript
{ href: '/gamificacion', label: '🏆 Gamificación' },
```

### Step 8: Correr todos los tests

```bash
npm test -- PerfilNivel.test
```

Expected: PASS

### Step 9: Commit

```bash
git add src/features/gamificacion/components/ src/features/gamificacion/hooks/ src/app/\(dashboard\)/gamificacion/ src/app/api/gamificacion/perfil/ src/components/Sidebar.tsx
git commit -m "feat: add levels system and gamification frontend page (Task 25)"
```

---

## Task 26: Polish UX/Visual

**Files:**
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Modify: múltiples páginas del dashboard (agregar skeletons y empty states)

### Step 1: Implementar componente Skeleton

Crear `src/components/ui/Skeleton.tsx`:
```typescript
interface SkeletonProps {
  variant?: 'card' | 'table-row' | 'text' | 'circle'
  className?: string
  lines?: number
}

export default function Skeleton({ variant = 'text', className = '', lines = 1 }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-slate-800 rounded-xl p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/3" />
        <div className="h-8 bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    )
  }
  if (variant === 'table-row') {
    return (
      <div className={`flex gap-3 py-3 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/4" />
        <div className="h-4 bg-slate-700 rounded flex-1" />
        <div className="h-4 bg-slate-700 rounded w-20" />
      </div>
    )
  }
  if (variant === 'circle') {
    return <div className={`rounded-full bg-slate-700 animate-pulse ${className}`} />
  }
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-700 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}
```

### Step 2: Implementar componente EmptyState

Crear `src/components/ui/EmptyState.tsx`:
```typescript
interface EmptyStateProps {
  icon?: string
  message: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export default function EmptyState({ icon = '📭', message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-medium text-slate-300 mb-1">{message}</p>
      {description && <p className="text-xs text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action && (
        action.href ? (
          <a href={action.href} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            {action.label} →
          </a>
        ) : (
          <button onClick={action.onClick} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            {action.label} →
          </button>
        )
      )}
    </div>
  )
}
```

### Step 3: Agregar EmptyState a páginas vacías

En cada página que liste datos, importar `EmptyState` y agregar condición cuando `data.length === 0`:

**`src/app/(dashboard)/gastos/page.tsx`** — si no hay gastos:
```typescript
<EmptyState icon="💸" message="Aún no hay gastos registrados" description="Registra gastos desde Telegram con /gasto o desde aquí" />
```

**`src/app/(dashboard)/creditos/page.tsx`** — si no hay créditos:
```typescript
<EmptyState icon="💳" message="Sin créditos registrados" action={{ label: 'Agregar crédito', href: '#nuevo' }} />
```

**`src/app/(dashboard)/ingresos/page.tsx`** — si no hay ingresos:
```typescript
<EmptyState icon="💰" message="Sin fuentes de ingreso configuradas" action={{ label: 'Agregar ingreso', href: '#nuevo' }} />
```

**`src/app/(dashboard)/metas/page.tsx`** (si existe) — si no hay metas:
```typescript
<EmptyState icon="🎯" message="Sin metas de ahorro" action={{ label: 'Crear primera meta', href: '#nueva' }} />
```

### Step 4: Agregar transición en barras de progreso

En cualquier componente con barras de progreso (créditos, metas), asegurarse de que el div de la barra tenga:
```
className="... transition-all duration-500 ease-out"
```

### Step 5: Commit

```bash
git add src/components/ui/
git commit -m "feat: add Skeleton and EmptyState UI components for polish (Task 26)"
```

---

## Task 27: Documentación

**Files:**
- Create/Update: `README.md`
- Create: `docs/SETUP.md`
- Create: `docs/API.md`
- Create: `docs/TELEGRAM.md`
- Create: `docs/FEATURES.md`

### Step 1: Crear README.md principal

El README debe incluir:
- Header con nombre del proyecto, badges de stack
- Descripción en 2-3 oraciones
- Tabla completa de las 27 features implementadas
- Stack tecnológico
- Setup rápido (5 comandos)
- Link a docs/ para más detalle

### Step 2: Crear docs/SETUP.md

Guía completa paso a paso:
1. Pre-requisitos (Node 20, PostgreSQL, ngrok)
2. Clonar repo
3. Crear base de datos PostgreSQL
4. Variables de entorno (`.env.local`)
5. `npm install`
6. `npx prisma migrate dev`
7. `npx prisma db seed` + `npx ts-node prisma/gamificacion-seed.ts`
8. `npm run dev`
9. Setup bot Telegram (obtener token, ngrok, setWebhook)

### Step 3: Crear docs/API.md

Para cada endpoint:
```markdown
### GET /api/insights
Genera insights financieros personalizados via Claude AI.

**Response:**
```json
{
  "ok": true,
  "data": [{ "tipo": "ALERTA", "titulo": "...", ... }]
}
```
```

Cubrir todos los endpoints de las APIs principales.

### Step 4: Crear docs/TELEGRAM.md

```markdown
## Comandos del Bot

| Comando | Ejemplo | Descripción |
|---------|---------|-------------|
| /gasto [cat] [monto] [desc] | /gasto comida 150 tacos | Registra un gasto |
| /resumen | /resumen | Gastos del día |
| /quincena | /quincena | Gastos del mes |
| /creditos | /creditos | Lista créditos activos |
| /ahorro | /ahorro | Recomendación próximo cobro |
| /ayuda | /ayuda | Lista todos los comandos |
```

### Step 5: Correr suite completa de tests

```bash
npm test
```

Expected: 418+ tests PASS (más los nuevos de Week 8).

### Step 6: Commit final

```bash
git add README.md docs/
git commit -m "docs: add complete documentation - README, SETUP, API, Telegram guide (Task 27)"
```

---

## Resumen de Commits Esperados

| Task | Commit message |
|------|---------------|
| 21 | `feat: add AI Smart Insights backend with Claude API` |
| 22 | `feat: add AI Smart Insights frontend with React Query` |
| 23 | `feat: add achievement system (Logros) for gamification` |
| 24 | `feat: add streak tracking system for gamification` |
| 25 | `feat: add levels system and gamification frontend page` |
| 26 | `feat: add Skeleton and EmptyState UI components for polish` |
| 27 | `docs: add complete documentation` |

## Tests Estimados al Final

- Tests actuales: ~418 passing
- Nuevos de Week 8: ~84 adicionales
- **Total esperado: ~500+ tests passing**
