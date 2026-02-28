# Finanzas Ardepa - Advanced Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Finanzas Ardepa from basic expense tracking to a complete personal financial assistant with 12 advanced features.

**Architecture:** Modular feature-based architecture with independent feature modules in `src/features/`, shared components in `src/shared/`, and REST APIs in `app/api/`. Each feature is self-contained with its own components, hooks, services, and tests.

**Tech Stack:** Next.js 16 + React 19, Tremor (charts), Zustand (global state), React Query (server state), Prisma 7 + PostgreSQL, Zod (validation), Claude API (AI), Vitest + Supertest (testing)

**Timeline:** 8 weeks (3 phases)

**Testing Strategy:** 60-70% coverage - Unit tests (Vitest) for calculators/algorithms, Integration tests (Supertest) for API routes

---

## Phase 1: Fundamentos (Weeks 1-3)

### Task 1: Project Setup & Dependencies

**Goal:** Install new dependencies and configure tools

**Files:**
- Modify: `package.json`
- Create: `src/store/useStore.ts` (Zustand)
- Create: `src/lib/query-client.ts` (React Query)
- Modify: `src/app/layout.tsx` (add providers)

**Steps:**

1. Install dependencies:
```bash
npm install zustand @tanstack/react-query zod @anthropic-ai/sdk
npm install -D supertest @types/supertest
```

**Note:** Originally planned to use @tremor/react for charts, but it requires React 18 (project uses React 19). Using **Recharts** instead (already installed, compatible with React 19).

2. Create Zustand store (`src/store/useStore.ts`):
```typescript
import { create } from 'zustand'

interface Store {
  notificacionesNoLeidas: number
  sidebarOpen: boolean
  setNotificacionesNoLeidas: (count: number) => void
  toggleSidebar: () => void
}

export const useStore = create<Store>((set) => ({
  notificacionesNoLeidas: 0,
  sidebarOpen: true,
  setNotificacionesNoLeidas: (count) => set({ notificacionesNoLeidas: count }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

3. Create Query Client (`src/lib/query-client.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

4. Wrap app with providers (modify `src/app/layout.tsx`):
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

5. Commit:
```bash
git add package.json package-lock.json src/store src/lib/query-client.ts src/app/layout.tsx
git commit -m "feat: add Zustand, React Query, Tremor, and Claude SDK

- Zustand for global UI state
- React Query for server state management
- Tremor for data visualizations
- Anthropic SDK for AI insights
- Supertest for API integration tests"
```

---

### Task 2: Schema Migration - Categorías Personalizables

**Goal:** Migrate from enum categories to customizable database table

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/.../migration.sql` (auto-generated)
- Create: `prisma/seed-categories.ts`
- Modify: `prisma/seed.ts`

**Steps:**

1. Update Prisma schema (`prisma/schema.prisma`):

```prisma
// ADD new models
enum TipoCategoria {
  GASTO
  INGRESO
}

model Categoria {
  id          String   @id @default(cuid())
  nombre      String
  icono       String
  color       String
  tipo        TipoCategoria
  activa      Boolean  @default(true)
  orden       Int

  parentId    String?
  parent      Categoria?  @relation("SubCategorias", fields: [parentId], references: [id])
  hijos       Categoria[] @relation("SubCategorias")

  gastos      Gasto[]
  presupuestos Presupuesto[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([nombre, tipo])
  @@index([activa])
}

// MODIFY Gasto model
model Gasto {
  id          String   @id @default(cuid())
  descripcion String
  monto       Decimal  @db.Decimal(10, 2)

  // CHANGE: from enum to relation
  categoriaId String
  categoria   Categoria @relation(fields: [categoriaId], references: [id])

  fecha       DateTime @default(now())
  fuente      FuenteGasto @default(WEB)
  createdAt   DateTime @default(now())

  @@index([categoriaId, fecha])
}

// REMOVE old enum
// enum CategoriaGasto {
//   ALIMENTACION
//   TRANSPORTE
//   ENTRETENIMIENTO
//   SALUD
//   SERVICIOS
//   OTROS
// }
```

2. Create migration seed script (`prisma/seed-categories.ts`):

```typescript
import { PrismaClient, TipoCategoria } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedCategories() {
  const categories = [
    { nombre: 'Alimentación', icono: '🍽️', color: '#10b981', tipo: 'GASTO', orden: 1 },
    { nombre: 'Transporte', icono: '🚗', color: '#3b82f6', tipo: 'GASTO', orden: 2 },
    { nombre: 'Entretenimiento', icono: '🎬', color: '#8b5cf6', tipo: 'GASTO', orden: 3 },
    { nombre: 'Salud', icono: '💊', color: '#ef4444', tipo: 'GASTO', orden: 4 },
    { nombre: 'Servicios', icono: '🏠', color: '#f59e0b', tipo: 'GASTO', orden: 5 },
    { nombre: 'Otros', icono: '📦', color: '#6b7280', tipo: 'GASTO', orden: 6 },
  ]

  for (const cat of categories) {
    await prisma.categoria.upsert({
      where: { nombre_tipo: { nombre: cat.nombre, tipo: cat.tipo as TipoCategoria } },
      update: {},
      create: cat as any,
    })
  }

  console.log('✅ Categorías seeded')
}
```

3. Update main seed (`prisma/seed.ts`):
```typescript
import { seedCategories } from './seed-categories'

async function main() {
  await seedCategories()
  // ... existing seed logic
}
```

4. Create migration:
```bash
npx prisma migrate dev --name add_categorias_personalizables
```

5. Run seed:
```bash
npx prisma db seed
```

6. Commit:
```bash
git add prisma/
git commit -m "feat: migrate to customizable categories

- Add Categoria model with hierarchical support
- Migrate Gasto from enum to FK relationship
- Seed script for default 6 categories
- Migration handles existing data"
```

---

### Task 3: Shared Components & Utilities

**Goal:** Create reusable UI components and utilities before building features

**Files:**
- Create: `src/shared/components/ui/Toast.tsx`
- Create: `src/shared/components/ui/Modal.tsx`
- Create: `src/shared/hooks/useToast.ts`
- Create: `src/shared/hooks/useAPI.ts`
- Create: `src/shared/utils/formatters.ts`
- Create: `src/shared/validations/schemas.ts`
- Create: `src/lib/api-error.ts`

**Steps:**

1. Create Toast system (`src/shared/hooks/useToast.ts`):
```typescript
import { create } from 'zustand'

type Toast = {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, toast.duration || 5000)
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
```

2. Create API Error handler (`src/lib/api-error.ts`):
```typescript
export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export function withErrorHandling(
  handler: (req: Request, context: any) => Promise<Response>
) {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      console.error('API Error:', error)
      if (error instanceof APIError) {
        return Response.json(
          { ok: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        )
      }
      return Response.json(
        { ok: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno' } },
        { status: 500 }
      )
    }
  }
}
```

3. Create Zod schemas (`src/shared/validations/schemas.ts`):
```typescript
import { z } from 'zod'

export const gastoSchema = z.object({
  descripcion: z.string().min(1).max(200),
  monto: z.number().positive(),
  categoriaId: z.string().cuid(),
  fecha: z.string().datetime(),
})

export const presupuestoSchema = z.object({
  categoriaId: z.string().cuid(),
  monto: z.number().positive(),
  periodo: z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL']),
})

export const creditoSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['PRESTAMO', 'TARJETA']),
  montoTotal: z.number().positive(),
  saldoActual: z.number().min(0),
  pagoMensual: z.number().positive(),
  diaPago: z.number().int().min(1).max(31),
  tasaInteres: z.number().min(0).max(100).optional(),
})
```

4. Create formatters (`src/shared/utils/formatters.ts`):
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
```

5. Commit:
```bash
git add src/shared/ src/lib/api-error.ts
git commit -m "feat: add shared components and utilities

- Toast notification system (Zustand)
- API error handling utilities
- Zod validation schemas
- Currency/date formatters
- Reusable hooks (useToast, useAPI)"
```

---

### Task 4: Presupuestos - Schema & Backend

**Goal:** Add budget models and API

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `app/api/presupuestos/route.ts`
- Create: `app/api/presupuestos/[id]/route.ts`
- Create: `app/api/presupuestos/status/route.ts`
- Create: `__tests__/api/presupuestos.test.ts`

**Steps:**

1. Add to Prisma schema:
```prisma
enum PeriodoPresupuesto {
  SEMANAL
  QUINCENAL
  MENSUAL
}

model Presupuesto {
  id           String    @id @default(cuid())
  categoriaId  String
  categoria    Categoria @relation(fields: [categoriaId], references: [id])

  monto        Decimal   @db.Decimal(10, 2)
  periodo      PeriodoPresupuesto

  alertaEn80   Boolean   @default(true)
  alertaEn90   Boolean   @default(true)
  alertaEn100  Boolean   @default(true)

  activo       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([categoriaId, periodo])
  @@index([activo])
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add_presupuestos
```

3. Create API route (`app/api/presupuestos/route.ts`):
```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, APIError, ErrorCodes } from '@/lib/api-error'
import { presupuestoSchema } from '@/shared/validations/schemas'

export const GET = withErrorHandling(async () => {
  const presupuestos = await prisma.presupuesto.findMany({
    where: { activo: true },
    include: { categoria: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ ok: true, data: presupuestos })
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json()
  const result = presupuestoSchema.safeParse(body)

  if (!result.success) {
    throw new APIError(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message)
  }

  const presupuesto = await prisma.presupuesto.create({
    data: result.data,
    include: { categoria: true },
  })

  return Response.json({ ok: true, data: presupuesto })
})
```

4. Create status endpoint (`app/api/presupuestos/status/route.ts`):
```typescript
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'MENSUAL'

  const presupuestos = await prisma.presupuesto.findMany({
    where: { activo: true, periodo },
    include: { categoria: true },
  })

  // Calculate spent amount for each budget
  const inicio = getStartOfPeriod(periodo)
  const fin = new Date()

  const statuses = await Promise.all(
    presupuestos.map(async (p) => {
      const gastado = await prisma.gasto.aggregate({
        where: {
          categoriaId: p.categoriaId,
          fecha: { gte: inicio, lte: fin },
        },
        _sum: { monto: true },
      })

      const monto = Number(gastado._sum.monto || 0)
      const limite = Number(p.monto)
      const porcentaje = (monto / limite) * 100

      return {
        presupuesto: p,
        gastado: monto,
        restante: Math.max(0, limite - monto),
        porcentaje,
        estado: porcentaje >= 100 ? 'EXCEDIDO' : porcentaje >= 90 ? 'ALERTA' : 'OK',
      }
    })
  )

  return Response.json({ ok: true, data: statuses })
})

function getStartOfPeriod(periodo: string): Date {
  const now = new Date()
  if (periodo === 'MENSUAL') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  // Simplificado: implementar lógica quincenal/semanal
  return now
}
```

5. Write integration test (`__tests__/api/presupuestos.test.ts`):
```typescript
import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Presupuestos API', () => {
  let categoriaId: string

  beforeAll(async () => {
    const categoria = await prisma.categoria.findFirst()
    categoriaId = categoria!.id
  })

  it('POST /api/presupuestos creates budget', async () => {
    const response = await request(baseURL)
      .post('/api/presupuestos')
      .send({
        categoriaId,
        monto: 5000,
        periodo: 'MENSUAL',
      })
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(response.body.data.monto).toBe('5000')
  })

  it('GET /api/presupuestos/status returns status', async () => {
    const response = await request(baseURL)
      .get('/api/presupuestos/status?periodo=MENSUAL')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})
```

6. Run tests:
```bash
npm test __tests__/api/presupuestos.test.ts
```

7. Commit:
```bash
git add prisma/ app/api/presupuestos/ __tests__/
git commit -m "feat: add presupuestos backend API

- Presupuesto model with period support
- CRUD API routes
- Status endpoint (gastado vs limite)
- Integration tests with Supertest"
```

---

### Task 5: Presupuestos - Frontend UI

**Goal:** Build budget management UI

**Files:**
- Create: `src/app/(dashboard)/presupuestos/page.tsx`
- Create: `src/components/presupuestos/PresupuestoForm.tsx`
- Create: `src/components/presupuestos/PresupuestoCard.tsx`
- Create: `src/features/presupuestos/hooks/usePresupuestos.ts`

**Steps:**

1. Create hooks (`src/features/presupuestos/hooks/usePresupuestos.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function usePresupuestos() {
  return useQuery({
    queryKey: ['presupuestos'],
    queryFn: () => fetch('/api/presupuestos').then(r => r.json()),
  })
}

export function usePresupuestoStatus(periodo: string) {
  return useQuery({
    queryKey: ['presupuesto-status', periodo],
    queryFn: () => fetch(`/api/presupuestos/status?periodo=${periodo}`).then(r => r.json()),
  })
}

export function useCreatePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => fetch('/api/presupuestos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] })
      queryClient.invalidateQueries({ queryKey: ['presupuesto-status'] })
    },
  })
}
```

2. Create page (`src/app/(dashboard)/presupuestos/page.tsx`):
```typescript
'use client'
import { useState } from 'react'
import { usePresupuestos, usePresupuestoStatus } from '@/features/presupuestos/hooks/usePresupuestos'
import PresupuestoForm from '@/components/presupuestos/PresupuestoForm'
import PresupuestoCard from '@/components/presupuestos/PresupuestoCard'

export default function PresupuestosPage() {
  const [showForm, setShowForm] = useState(false)
  const [periodo, setPeriodo] = useState('MENSUAL')

  const { data: presupuestos } = usePresupuestos()
  const { data: statuses } = usePresupuestoStatus(periodo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">💰 Presupuestos</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nuevo presupuesto
        </button>
      </div>

      {showForm && (
        <PresupuestoForm onClose={() => setShowForm(false)} />
      )}

      <div className="grid gap-4">
        {statuses?.data?.map((status: any) => (
          <PresupuestoCard key={status.presupuesto.id} status={status} />
        ))}
      </div>
    </div>
  )
}
```

3. Create PresupuestoCard with progress bar (`src/components/presupuestos/PresupuestoCard.tsx`):
```typescript
export default function PresupuestoCard({ status }) {
  const { presupuesto, gastado, restante, porcentaje, estado } = status

  const color = estado === 'EXCEDIDO' ? 'red' : estado === 'ALERTA' ? 'yellow' : 'green'

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">
            {presupuesto.categoria.icono} {presupuesto.categoria.nombre}
          </h3>
          <p className="text-xs text-slate-500">{presupuesto.periodo}</p>
        </div>
        <span className="text-sm font-semibold text-emerald-400">
          ${Number(presupuesto.monto).toLocaleString('es-MX')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Gastado: ${gastado.toLocaleString('es-MX')}</span>
          <span className="text-slate-400">Restante: ${restante.toLocaleString('es-MX')}</span>
        </div>

        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 transition-all duration-500`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{porcentaje.toFixed(1)}%</span>
          {estado === 'EXCEDIDO' && (
            <span className="text-red-400 font-semibold">¡Presupuesto excedido!</span>
          )}
        </div>
      </div>
    </div>
  )
}
```

4. Commit:
```bash
git add src/app/\(dashboard\)/presupuestos/ src/components/presupuestos/ src/features/presupuestos/
git commit -m "feat: add presupuestos frontend UI

- Budget management page
- Budget cards with progress bars
- React Query hooks
- Real-time status updates"
```

---

## Phase 2: Análisis Avanzado (Weeks 4-5)

Due to the massive scope (12 features, 8 weeks), this implementation plan provides detailed guidance for Phase 1 (weeks 1-3) with comprehensive file paths, code examples, and testing steps.

**For Phases 2 & 3**, follow the same pattern established in Phase 1:

### Task Pattern for Remaining Features:

Each feature should follow this structure:

1. **Schema** - Add Prisma models + migration
2. **Backend** - API routes + error handling + integration tests
3. **Calculators/Services** - Business logic + unit tests
4. **Frontend Hooks** - React Query hooks
5. **Frontend UI** - Components + pages
6. **Integration** - Wire up with existing features
7. **Testing** - Achieve 60-70% coverage

### Remaining Features to Implement:

**Week 4:**
- Alertas/Notificaciones (Task 6-8)
- Reportes básicos (Task 9-10)

**Week 5:**
- Planificación Deuda (Task 11-13)
- Ratios Financieros (Task 14)
- Cashflow (Task 15)

**Week 6:**
- Patrimonio/Activos (Task 16-17)
- Proyecciones (Task 18)

**Week 7:**
- Inversiones (Task 19)
- Metas de Ahorro (Task 20)

**Week 8:**
- AI Insights (Task 21-22)
- Gamificación (Task 23-25)
- Polish & Testing (Task 26-27)

---

## Testing Guidelines

**Unit Tests (Vitest):**
```typescript
// Example: src/features/deuda/calculators/__tests__/snowball.test.ts
import { describe, it, expect } from 'vitest'
import { calculateSnowball } from '../snowball'

describe('Snowball Strategy', () => {
  it('orders debts by balance (smallest first)', () => {
    const creditos = [
      { nombre: 'A', saldoActual: 1000, pagoMensual: 100 },
      { nombre: 'B', saldoActual: 500, pagoMensual: 50 },
    ]

    const result = calculateSnowball(creditos, 200)
    expect(result.orden).toEqual(['B', 'A'])
  })
})
```

**Integration Tests (Supertest):**
```typescript
// Pattern for all API routes
describe('API /api/[feature]', () => {
  it('GET returns list', async () => {
    const response = await request(baseURL)
      .get('/api/[feature]')
      .expect(200)

    expect(response.body.ok).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('POST creates record', async () => {
    const response = await request(baseURL)
      .post('/api/[feature]')
      .send({ /* valid data */ })
      .expect(200)

    expect(response.body.ok).toBe(true)
  })

  it('POST validates input', async () => {
    const response = await request(baseURL)
      .post('/api/[feature]')
      .send({ /* invalid data */ })
      .expect(400)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

---

## Commit Guidelines

Follow conventional commits:

```
feat: add [feature name]
fix: correct [issue]
test: add tests for [component]
docs: update [documentation]
refactor: improve [code]
```

**Commit frequency:** After each completed task (every 2-4 hours of work)

---

## CI/CD Setup

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: finanzas_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/finanzas_test

      - run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/finanzas_test

      - uses: codecov/codecov-action@v3
```

---

## Final Checklist

Before considering the project complete:

- [ ] All 12 features implemented
- [ ] 60-70% test coverage achieved
- [ ] All API routes have integration tests
- [ ] All calculators have unit tests
- [ ] Error handling on all routes
- [ ] Zod validation on all inputs
- [ ] React Query caching configured
- [ ] Tremor charts integrated
- [ ] Claude API working
- [ ] Gamification engine functional
- [ ] CI/CD pipeline passing
- [ ] Documentation updated
- [ ] Design doc followed

---

**Plan complete.** Proceed with execution using `superpowers:executing-plans` or `superpowers:subagent-driven-development` skill.
