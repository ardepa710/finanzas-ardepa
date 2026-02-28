# Gastos Fijos Recurrentes — Plan de Implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar gastos fijos recurrentes (SEMANAL/QUINCENAL/MENSUAL) que se aplican automáticamente al cargar el dashboard y se descuentan del disponible en el plan de ahorro.

**Architecture:** Nuevo modelo `GastoFijo` con `lastApplied` para idempotencia. Al cargar el dashboard (Server Component), se detectan gastos fijos pendientes y se crean entradas en `Gasto` automáticamente. `calcularResumenAhorro` recibe un parámetro opcional `gastosFijos[]` (backward-compatible) y los incluye en el `disponible` de cada cobro.

**Tech Stack:** Next.js 15 App Router, Prisma 7.4.1 + @prisma/adapter-pg, PostgreSQL, Vitest, Tailwind CSS v4.

**Design doc:** `docs/plans/2026-02-27-gastos-fijos-design.md`

---

## Task 1: Schema — Agregar modelo GastoFijo

**Files:**
- Modify: `prisma/schema.prisma`

### Step 1: Agregar modelo al final de `prisma/schema.prisma`

Abrir el archivo y agregar antes del cierre (al final):

```prisma
model GastoFijo {
  id          String         @id @default(cuid())
  nombre      String
  monto       Decimal        @db.Decimal(10, 2)
  categoria   CategoriaGasto
  frecuencia  FrecuenciaPago
  diaSemana   Int?
  diaMes      Int?
  fechaBase   DateTime
  activo      Boolean        @default(true)
  lastApplied DateTime?
  createdAt   DateTime       @default(now())

  @@index([activo])
}
```

### Step 2: Crear y aplicar la migración

```bash
cd /home/ardepa/finanzas-ardepa
DATABASE_URL="postgresql://ktcadmin:ktcpass123@127.0.0.1:5432/finanzas_ardepa" npx prisma migrate dev --name add_gasto_fijo
```

Expected: migration SQL con `CREATE TABLE "GastoFijo"` aplicado exitosamente.

### Step 3: Regenerar cliente Prisma

```bash
npx prisma generate
```

### Step 4: Commit

```bash
git add prisma/
git commit -m "feat: agregar modelo GastoFijo con frecuencia y lastApplied"
```

---

## Task 2: savings-calculator.ts — Agregar GastoFijoInput, getLastOccurrence y actualizar calcularResumenAhorro (TDD)

**Files:**
- Modify: `src/lib/savings-calculator.ts`
- Modify: `src/lib/savings-calculator.test.ts`

### Step 1: Agregar tests PRIMERO (failing)

Abrir `src/lib/savings-calculator.test.ts` y AGREGAR al final del archivo (no reemplazar — los 10 tests existentes deben mantenerse):

```typescript
// ─── GastoFijo tests ───────────────────────────────────────────

describe('getLastOccurrence', () => {
  it('MENSUAL: returns this month date if diaMes has passed', () => {
    // HOY = 5 mar 2026, diaMes=1 → el 1 mar ya pasó
    const gasto: GastoFijoInput = {
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 1,
      fechaBase: new Date(2026, 0, 1),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 1)) // 1 mar
  })

  it('MENSUAL: returns previous month if diaMes has not passed yet', () => {
    // HOY = 5 mar 2026, diaMes=15 → el 15 mar no ha pasado → feb 15
    const gasto: GastoFijoInput = {
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 1, 15)) // 15 feb
  })

  it('QUINCENAL: returns the most recent 14-day cycle date <= today', () => {
    // fechaBase = 2 mar (lunes), HOY = 5 mar → last occurrence is 2 mar
    const gasto: GastoFijoInput = {
      nombre: 'Netflix',
      monto: 300,
      categoria: 'ENTRETENIMIENTO',
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 2)) // 2 mar
  })

  it('SEMANAL: returns the most recent 7-day cycle date <= today', () => {
    // fechaBase = 2 mar (lunes), HOY = 5 mar (jue) → last occurrence is 2 mar
    const gasto: GastoFijoInput = {
      nombre: 'Mercado',
      monto: 800,
      categoria: 'ALIMENTACION',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 2)) // 2 mar
  })

  it('returns null if fechaBase is in the future', () => {
    const gasto: GastoFijoInput = {
      nombre: 'Nuevo gasto',
      monto: 100,
      categoria: 'OTROS',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 3, 1), // 1 abr (futuro)
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toBeNull()
  })
})

describe('calcularResumenAhorro con gastosFijos', () => {
  it('includes gastos fijos in disponible calculation', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 22000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }]
    const creditos: CreditoInput[] = []
    const gastosFijos: GastoFijoInput[] = [{
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 20,
      fechaBase: new Date(2026, 0, 20),
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY, 3, gastosFijos)
    // Renta vence el 20 mar, cobro el 16 mar → debe aparecer en cobro[0]
    const cobro0 = result.cobros[0]
    expect(cobro0.desgloseGastosFijos.length).toBeGreaterThan(0)
    expect(cobro0.desgloseGastosFijos[0].creditoNombre).toBe('Renta')
    expect(cobro0.disponible).toBeLessThan(22000)
  })

  it('backward compatible: works with no gastosFijos argument', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 10000,
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }]
    const creditos: CreditoInput[] = []
    // Old signature: no gastosFijos
    const result = calcularResumenAhorro(creditos, fuentes, HOY)
    expect(result.cobros[0].desgloseGastosFijos).toEqual([])
  })
})
```

### Step 2: Ejecutar para confirmar que los nuevos tests FALLAN

```bash
cd /home/ardepa/finanzas-ardepa && npx vitest run src/lib/savings-calculator.test.ts
```

Expected: los 10 tests anteriores PASS, los nuevos FAIL con "getLastOccurrence is not a function" o "desgloseGastosFijos is not a property".

### Step 3: Actualizar `src/lib/savings-calculator.ts`

**3a.** Agregar la interfaz `GastoFijoInput` después de `CreditoInput`:

```typescript
export interface GastoFijoInput {
  nombre: string
  monto: number
  categoria: string
  frecuencia: FrecuenciaPago
  diaMes?: number        // solo MENSUAL
  diaSemana?: number     // solo SEMANAL/QUINCENAL (display only)
  fechaBase?: Date       // requerido para SEMANAL/QUINCENAL; referencia para MENSUAL
}
```

**3b.** Actualizar `ProyeccionCobro` — agregar `desgloseGastosFijos`:

```typescript
export interface ProyeccionCobro {
  fecha: Date
  fuenteNombre: string
  montoIngreso: number
  desglose: DesgloseCobro[]           // créditos
  desgloseGastosFijos: DesgloseCobro[] // gastos fijos
  totalApartar: number
  disponible: number
}
```

**3c.** Agregar función `getLastOccurrence` después de `getNextByInterval`:

```typescript
/**
 * Devuelve la ocurrencia más reciente del gasto fijo que ya ocurrió (≤ hoy).
 * Returns null si fechaBase está en el futuro.
 */
export function getLastOccurrence(gasto: GastoFijoInput, hoy: Date): Date | null {
  const today = startOfDay(hoy)

  if (gasto.frecuencia === 'MENSUAL') {
    if (gasto.diaMes == null) throw new Error('GastoFijo MENSUAL requiere diaMes')
    const dia = gasto.diaMes
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dia)
    if (thisMonth <= today) return thisMonth
    return new Date(today.getFullYear(), today.getMonth() - 1, dia)
  }

  const step = gasto.frecuencia === 'SEMANAL' ? 7 : 14
  if (!gasto.fechaBase) throw new Error(`GastoFijo ${gasto.frecuencia} requiere fechaBase`)

  let cursor = startOfDay(gasto.fechaBase)
  if (cursor > today) return null

  let last: Date = new Date(cursor)
  while (true) {
    const next = addDays(cursor, step)
    if (next > today) break
    last = new Date(next)
    cursor = next
  }
  return last
}
```

**3d.** Actualizar `calcularResumenAhorro` — agregar parámetro opcional `gastosFijos` al final y calcular `desgloseGastosFijos`:

```typescript
export function calcularResumenAhorro(
  creditos: CreditoInput[],
  fuentes: FuenteIngresoInput[],
  hoy: Date,
  horizonte = 3,
  gastosFijos: GastoFijoInput[] = []
): ResumenAhorro {
  const todosLosCobros: Array<{ fecha: Date; fuente: FuenteIngresoInput }> = []
  for (const fuente of fuentes) {
    const fechas = getNextOccurrences(fuente, hoy, horizonte)
    fechas.forEach(fecha => todosLosCobros.push({ fecha, fuente }))
  }
  todosLosCobros.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const cobrosFinal = todosLosCobros.slice(0, horizonte)

  const cobros: ProyeccionCobro[] = cobrosFinal.map(({ fecha, fuente }, idx) => {
    // ── Créditos ──
    const desglose: DesgloseCobro[] = []
    for (const credito of creditos) {
      const vencimiento = getNextCreditDueDate(credito, hoy)
      const allFuente = getNextOccurrences(fuente, hoy, horizonte * 2)
      const cobrosAntesDeVencer = allFuente.filter(f => f < vencimiento)
      const n = cobrosAntesDeVencer.length || 1
      if (fecha < vencimiento || cobrosAntesDeVencer.length === 0) {
        const porCobro = Math.round((credito.pagoMensual / n) * 100) / 100
        desglose.push({ creditoNombre: credito.nombre, monto: porCobro })
      }
    }

    // ── Gastos fijos ──
    // Ventana: desde esta fecha de cobro hasta la siguiente (o +30 días si es el último)
    const nextCobroFecha = cobrosFinal[idx + 1]?.fecha ?? addDays(fecha, 30)
    const desgloseGastosFijos: DesgloseCobro[] = []
    for (const gf of gastosFijos) {
      // Próxima ocurrencia del gasto fijo desde la fecha de este cobro
      const occurrences = getNextOccurrences(
        { frecuencia: gf.frecuencia, diaMes: gf.diaMes, fechaBase: gf.fechaBase ?? gf.fechaBase },
        fecha,
        1
      )
      const nextOcc = occurrences[0]
      if (nextOcc && nextOcc < nextCobroFecha) {
        desgloseGastosFijos.push({ creditoNombre: gf.nombre, monto: gf.monto })
      }
    }

    const totalApartar = Math.round(
      [...desglose, ...desgloseGastosFijos].reduce((s, d) => s + d.monto, 0) * 100
    ) / 100
    const montoIngreso = fuente.monto ?? 0

    return {
      fecha,
      fuenteNombre: fuente.nombre ?? 'Ingreso',
      montoIngreso,
      desglose,
      desgloseGastosFijos,
      totalApartar,
      disponible: Math.round((montoIngreso - totalApartar) * 100) / 100,
    }
  })

  return { cobros }
}
```

### Step 4: Ejecutar todos los tests — deben pasar todos

```bash
cd /home/ardepa/finanzas-ardepa && npx vitest run src/lib/savings-calculator.test.ts
```

Expected: **17 tests PASS** (10 anteriores + 7 nuevos), 0 fail.

### Step 5: Commit

```bash
git add src/lib/savings-calculator.ts src/lib/savings-calculator.test.ts
git commit -m "feat: agregar GastoFijoInput, getLastOccurrence y gastosFijos en calcularResumenAhorro (TDD)"
```

---

## Task 3: API — Nuevas rutas de gastos fijos

**Files:**
- Create: `src/app/api/gastos-fijos/route.ts`
- Create: `src/app/api/gastos-fijos/[id]/route.ts`

### Step 1: Crear `src/app/api/gastos-fijos/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const gastosFijos = await prisma.gastoFijo.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(gastosFijos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const gastoFijo = await prisma.gastoFijo.create({
    data: {
      nombre: body.nombre,
      monto: body.monto,
      categoria: body.categoria,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
    },
  })
  return NextResponse.json(gastoFijo, { status: 201 })
}
```

### Step 2: Crear `src/app/api/gastos-fijos/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const gastoFijo = await prisma.gastoFijo.update({
    where: { id },
    data: {
      nombre: body.nombre,
      monto: body.monto,
      categoria: body.categoria,
      frecuencia: body.frecuencia,
      diaSemana: body.diaSemana != null && body.diaSemana !== '' ? Number(body.diaSemana) : null,
      diaMes: body.diaMes ? Number(body.diaMes) : null,
      fechaBase: new Date(body.fechaBase),
      activo: body.activo ?? true,
    },
  })
  return NextResponse.json(gastoFijo)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.gastoFijo.update({ where: { id }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}
```

### Step 3: Commit

```bash
git add src/app/api/gastos-fijos/
git commit -m "feat: agregar API routes para GastoFijo"
```

---

## Task 4: UI — GastoFijoForm + página /gastos-fijos

**Files:**
- Create: `src/components/gastos-fijos/GastoFijoForm.tsx`
- Create: `src/app/(dashboard)/gastos-fijos/page.tsx`

### Step 1: Crear `src/components/gastos-fijos/GastoFijoForm.tsx`

```typescript
'use client'
import { useState } from 'react'

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const CATEGORIAS = [
  'ALIMENTACION', 'TRANSPORTE', 'ENTRETENIMIENTO', 'SALUD', 'SERVICIOS', 'OTROS',
] as const
const CAT_LABEL: Record<string, string> = {
  ALIMENTACION: 'Alimentación', TRANSPORTE: 'Transporte',
  ENTRETENIMIENTO: 'Entretenimiento', SALUD: 'Salud',
  SERVICIOS: 'Servicios', OTROS: 'Otros',
}

export interface GastoFijoFormData {
  nombre: string
  monto: string
  categoria: string
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL'
  diaSemana: string
  diaMes: string
  fechaBase: string
}

interface Props {
  initial?: Partial<GastoFijoFormData> & { id?: string }
  onSave: (data: GastoFijoFormData) => void
  onCancel: () => void
}

export default function GastoFijoForm({ initial, onSave, onCancel }: Props) {
  const [frecuencia, setFrecuencia] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>(
    (initial?.frecuencia as any) ?? 'MENSUAL'
  )
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    monto: initial?.monto ?? '',
    categoria: initial?.categoria ?? 'SERVICIOS',
    diaSemana: initial?.diaSemana ?? '',
    diaMes: initial?.diaMes ?? '',
    fechaBase: initial?.fechaBase ?? '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, frecuencia })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-slate-100">{initial?.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nombre</label>
          <input required value={form.nombre} onChange={set('nombre')} className="input" placeholder="Ej: Renta" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monto</label>
          <input required type="number" step="0.01" min="0" value={form.monto} onChange={set('monto')} className="input" placeholder="5000" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Categoría</label>
          <select value={form.categoria} onChange={set('categoria')} className="input">
            {CATEGORIAS.map(c => (
              <option key={c} value={c}>{CAT_LABEL[c]}</option>
            ))}
          </select>
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
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día del mes</label>
              <input required type="number" min="1" max="31" value={form.diaMes} onChange={set('diaMes')} className="input" placeholder="15" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha de referencia</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Día de la semana</label>
              <select value={form.diaSemana} onChange={set('diaSemana')} className="input">
                <option value="">Seleccionar...</option>
                {DIAS_SEMANA.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha del primer gasto</label>
              <input required type="date" value={form.fechaBase} onChange={set('fechaBase')} className="input" />
            </div>
          </>
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

### Step 2: Crear `src/app/(dashboard)/gastos-fijos/page.tsx`

```typescript
'use client'
import { useEffect, useState } from 'react'
import GastoFijoForm from '@/components/gastos-fijos/GastoFijoForm'

interface GastoFijo {
  id: string
  nombre: string
  monto: string | number
  categoria: string
  frecuencia: string
  diaSemana?: number | null
  diaMes?: number | null
  fechaBase: string
  activo: boolean
  lastApplied?: string | null
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FREC_LABEL: Record<string, string> = {
  MENSUAL: 'Mensual', QUINCENAL: 'Quincenal', SEMANAL: 'Semanal',
}
const CAT_EMOJI: Record<string, string> = {
  ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬',
  SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦',
}

export default function GastosFijosPage() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<GastoFijo | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const data = await fetch('/api/gastos-fijos').then(r => r.json())
    setGastosFijos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async (data: any) => {
    const res = editando
      ? await fetch(`/api/gastos-fijos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      : await fetch('/api/gastos-fijos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
    if (!res.ok) { alert('Error al guardar'); return }
    setShowForm(false)
    setEditando(null)
    cargar()
  }

  const desactivar = async (id: string) => {
    if (!confirm('¿Desactivar este gasto fijo?')) return
    await fetch(`/api/gastos-fijos/${id}`, { method: 'DELETE' })
    cargar()
  }

  const totalMensual = gastosFijos
    .filter(g => g.activo)
    .reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">🔒 Gastos Fijos</h1>
          <p className="text-slate-400 text-sm">
            Total recurrente: <span className="text-orange-400 font-semibold">${totalMensual.toLocaleString('es-MX')} MXN</span>
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditando(null) }} className="btn-primary">
          + Nuevo gasto fijo
        </button>
      </div>

      {showForm && (
        <GastoFijoForm onSave={guardar} onCancel={() => setShowForm(false)} />
      )}
      {editando && (
        <GastoFijoForm
          initial={{
            ...editando,
            monto: String(editando.monto),
            diaSemana: editando.diaSemana != null ? String(editando.diaSemana) : '',
            diaMes: editando.diaMes != null ? String(editando.diaMes) : '',
            fechaBase: editando.fechaBase?.split('T')[0] ?? '',
          }}
          onSave={guardar}
          onCancel={() => setEditando(null)}
        />
      )}

      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : gastosFijos.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">Sin gastos fijos registrados.</p>
          <p className="text-slate-500 text-sm mt-1">Agrega renta, suscripciones, servicios, etc.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {gastosFijos.map(g => (
            <div key={g.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{CAT_EMOJI[g.categoria] ?? '📦'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{g.nombre}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                      {FREC_LABEL[g.frecuencia]}
                    </span>
                    {!g.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">Inactivo</span>}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ${Number(g.monto).toLocaleString('es-MX')} MXN
                    {g.frecuencia !== 'MENSUAL' && g.diaSemana != null && ` · ${DIAS_SEMANA[g.diaSemana]}`}
                    {g.frecuencia === 'MENSUAL' && g.diaMes && ` · día ${g.diaMes} de cada mes`}
                    {g.lastApplied && ` · aplicado ${new Date(g.lastApplied).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setEditando(g); setShowForm(false) }} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                {g.activo && (
                  <button onClick={() => desactivar(g.id)} className="text-xs text-slate-500 hover:text-red-400">Desactivar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 3: Commit

```bash
git add src/components/gastos-fijos/ 'src/app/(dashboard)/gastos-fijos/'
git commit -m "feat: nueva página /gastos-fijos con CRUD de gastos fijos recurrentes"
```

---

## Task 5: Dashboard — Auto-apply y pasar gastosFijos al calculador

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

### Step 1: Leer el archivo actual completo

Antes de modificar, leer `src/app/(dashboard)/page.tsx` para entender el estado actual.

### Step 2: Actualizar page.tsx

El Server Component ahora debe:
1. Consultar `gastosFijos` activos
2. Para cada GastoFijo, calcular su última ocurrencia con lógica inline (equivalente a `getLastOccurrence`)
3. Si procede, crear el `Gasto` y actualizar `lastApplied`
4. Pasar `gastosFijos` a `calcularResumenAhorro` como 5to argumento

Reemplazar la función completa con:

```typescript
import SavingsCard from '@/components/dashboard/SavingsCard'
import ExpensesPieChart from '@/components/dashboard/ExpensesPieChart'
import { prisma } from '@/lib/prisma'
import { calcularResumenAhorro, getLastOccurrence } from '@/lib/savings-calculator'

export const dynamic = 'force-dynamic'

const EMOJI: Record<string, string> = {
  ALIMENTACION: '🍽️', TRANSPORTE: '🚗', ENTRETENIMIENTO: '🎬',
  SALUD: '💊', SERVICIOS: '🏠', OTROS: '📦',
}

export default async function DashboardPage() {
  const hoy = new Date()

  const [creditos, fuentes, gastosFijosDB] = await Promise.all([
    prisma.credito.findMany({ where: { activo: true }, orderBy: { diaPago: 'asc' } }),
    prisma.fuenteIngreso.findMany({ where: { activo: true } }),
    prisma.gastoFijo.findMany({ where: { activo: true } }),
  ])

  // ── Auto-apply gastos fijos ──────────────────────────────────
  for (const gf of gastosFijosDB) {
    const ocurrencia = getLastOccurrence(
      {
        nombre: gf.nombre,
        monto: Number(gf.monto),
        categoria: gf.categoria as string,
        frecuencia: gf.frecuencia as any,
        diaMes: gf.diaMes ?? undefined,
        fechaBase: gf.fechaBase,
      },
      hoy
    )

    if (!ocurrencia) continue
    if (gf.lastApplied && gf.lastApplied >= ocurrencia) continue

    // Crear Gasto real y actualizar lastApplied en paralelo
    await Promise.all([
      prisma.gasto.create({
        data: {
          descripcion: gf.nombre,
          monto: gf.monto,
          categoria: gf.categoria,
          fecha: ocurrencia,
          fuente: 'WEB',
        },
      }),
      prisma.gastoFijo.update({
        where: { id: gf.id },
        data: { lastApplied: ocurrencia },
      }),
    ])
  }
  // ────────────────────────────────────────────────────────────

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [gastosMes, gastosRecientes] = await Promise.all([
    prisma.gasto.findMany({ where: { fecha: { gte: inicioMes } } }),
    prisma.gasto.findMany({ orderBy: { fecha: 'desc' }, take: 8 }),
  ])

  const totalMes = gastosMes.reduce((s, g) => s + Number(g.monto), 0)
  const totalDeuda = creditos.reduce((s, c) => s + Number(c.saldoActual), 0)
  const salarioTotal = fuentes.reduce((s, f) => s + Number(f.monto), 0)

  const porCategoria = gastosMes.reduce((acc, g) => {
    const key = g.categoria as string
    acc[key] = (acc[key] || 0) + Number(g.monto)
    return acc
  }, {} as Record<string, number>)

  const gastosFijosInput = gastosFijosDB.map(gf => ({
    nombre: gf.nombre,
    monto: Number(gf.monto),
    categoria: gf.categoria as string,
    frecuencia: gf.frecuencia as any,
    diaMes: gf.diaMes ?? undefined,
    fechaBase: gf.fechaBase,
  }))

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
        hoy,
        3,
        gastosFijosInput
      )
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">📊 Dashboard</h1>
        <p className="text-slate-500 text-sm">
          {hoy.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Ingresos configurados</p>
          <p className="text-2xl font-bold text-emerald-400">${salarioTotal.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">MXN · {fuentes.length} {fuentes.length === 1 ? 'fuente' : 'fuentes'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Gastos del mes</p>
          <p className="text-2xl font-bold text-red-400">${totalMes.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">{gastosMes.length} transacciones</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 mb-1">Deuda total</p>
          <p className="text-2xl font-bold text-orange-400">${totalDeuda.toLocaleString('es-MX')}</p>
          <p className="text-xs text-slate-600 mt-1">{creditos.length} créditos activos</p>
        </div>
      </div>

      {/* Savings + Pie chart */}
      <div className="grid grid-cols-2 gap-4">
        {resumenAhorro ? (
          <SavingsCard resumen={resumenAhorro} />
        ) : (
          <div className="card flex items-center justify-center h-48">
            <p className="text-slate-500 text-sm">Configura tus ingresos para ver el plan de ahorro</p>
          </div>
        )}
        <ExpensesPieChart porCategoria={porCategoria} />
      </div>

      {/* Credits status */}
      {creditos.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">💳 Estado de créditos</h2>
          <div className="space-y-4">
            {creditos.map(c => {
              const pct = Math.max(0, Math.min(100, 100 - (Number(c.saldoActual) / Number(c.montoTotal)) * 100))
              const diasParaPago = (() => {
                const hoyLocal = new Date()
                const pago = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), c.diaPago)
                if (pago <= hoyLocal) pago.setMonth(pago.getMonth() + 1)
                return Math.ceil((pago.getTime() - hoyLocal.getTime()) / (1000 * 60 * 60 * 24))
              })()
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200">{c.nombre}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${diasParaPago <= 5 ? 'bg-red-500/20 text-red-400' : diasParaPago <= 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                        {diasParaPago <= 0 ? 'Vencido' : `${diasParaPago}d`}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">${Number(c.saldoActual).toLocaleString('es-MX')} restante</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-400 mb-4">🕐 Gastos recientes</h2>
        {gastosRecientes.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin gastos registrados aún.</p>
        ) : (
          <div className="space-y-3">
            {gastosRecientes.map(g => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{EMOJI[g.categoria as string] ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{g.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(g.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    {' · '}{g.fuente === 'TELEGRAM' ? '📱' : '🌐'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-400 shrink-0">${Number(g.monto).toLocaleString('es-MX')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 3: Commit

```bash
git add 'src/app/(dashboard)/page.tsx'
git commit -m "feat: auto-apply gastos fijos en dashboard y pasar al calculador de ahorro"
```

---

## Task 6: UI — Actualizar SavingsCard para mostrar desgloseGastosFijos

**Files:**
- Modify: `src/components/dashboard/SavingsCard.tsx`

### Step 1: Leer el archivo actual

Antes de editar, leer `src/components/dashboard/SavingsCard.tsx`.

### Step 2: Reemplazar con versión que muestra secciones separadas

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
            {/* Cobro header */}
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <p className="text-xs text-slate-500">{cobro.fuenteNombre}</p>
                <p className="text-sm font-semibold text-slate-200">
                  {new Date(cobro.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="text-emerald-400 font-semibold">${cobro.montoIngreso.toLocaleString('es-MX')}</p>
            </div>

            {/* Créditos */}
            {cobro.desglose.length > 0 && (
              <div className="space-y-1 mb-1">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-0.5">Créditos</p>
                {cobro.desglose.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">Apartar para {d.creditoNombre}</span>
                    <span className="text-orange-400">−${d.monto.toLocaleString('es-MX')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Gastos fijos */}
            {cobro.desgloseGastosFijos.length > 0 && (
              <div className="space-y-1 mb-1">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-0.5">Gastos fijos</p>
                {cobro.desgloseGastosFijos.map((d, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-500">{d.creditoNombre}</span>
                    <span className="text-red-400">−${d.monto.toLocaleString('es-MX')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Disponible */}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-700/30 mt-2">
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

### Step 3: Commit

```bash
git add src/components/dashboard/SavingsCard.tsx
git commit -m "feat: actualizar SavingsCard para mostrar créditos y gastos fijos separados"
```

---

## Task 7: Sidebar + verificación final + deploy

**Files:**
- Modify: `src/components/Sidebar.tsx`

### Step 1: Leer y actualizar Sidebar

Leer `src/components/Sidebar.tsx`. Agregar enlace `'🔒 Gastos fijos'` → `'/gastos-fijos'` entre Ingresos y Gastos, siguiendo el mismo patrón de los links existentes.

### Step 2: Run all tests

```bash
cd /home/ardepa/finanzas-ardepa && npx vitest run
```

Expected: 17 tests PASS (los 10 anteriores + 7 nuevos de gastos fijos), 0 fail.

### Step 3: Build de producción

```bash
cd /home/ardepa/finanzas-ardepa && npm run build
```

Expected: sin errores TypeScript. Si hay errores de tipo (ej. `desgloseGastosFijos` faltante en algún caller), corregirlos y re-buildear.

### Step 4: Commit Sidebar + push

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: agregar enlace Gastos fijos en Sidebar"
git push origin main
```

Expected: GitHub Actions dispara redeploy automático en VPS.

### Step 5: Verificar git log

```bash
git log --oneline -8
```
