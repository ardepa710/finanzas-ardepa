# Diseño: Gastos Fijos Recurrentes

**Fecha:** 2026-02-27
**Estado:** Aprobado

## Resumen

Nuevo modelo `GastoFijo` con frecuencia semanal/quincenal/mensual. Al cargar el dashboard, el sistema detecta automáticamente si hay gastos fijos pendientes de aplicar y crea los registros en `Gasto`. El calculador de ahorro descuenta los gastos fijos del disponible por cobro.

---

## 1. Schema

```prisma
model GastoFijo {
  id          String         @id @default(cuid())
  nombre      String
  monto       Decimal        @db.Decimal(10, 2)
  categoria   CategoriaGasto
  frecuencia  FrecuenciaPago   // reutiliza enum existente (SEMANAL/QUINCENAL/MENSUAL)
  diaSemana   Int?             // 0=Dom..6=Sáb — para SEMANAL y QUINCENAL
  diaMes      Int?             // 1-31 — para MENSUAL
  fechaBase   DateTime         // fecha de referencia para calcular ocurrencias
  activo      Boolean        @default(true)
  lastApplied DateTime?        // última ocurrencia aplicada (anti-duplicados)
  createdAt   DateTime       @default(now())

  @@index([activo])
}
```

- Reutiliza los enums `FrecuenciaPago` y `CategoriaGasto` (sin nuevas migraciones de enum)
- No modifica la tabla `Gasto` existente
- `lastApplied` es la clave de idempotencia: solo se aplica si la ocurrencia calculada > lastApplied

---

## 2. Lógica de auto-apply

En `src/app/(dashboard)/page.tsx` (Server Component), antes de renderizar:

```
para cada GastoFijo activo:
  1. Calcular la ocurrencia más reciente que ya pasó: getLastOccurrence(gastoFijo, hoy)
  2. Si ocurrencia ≤ hoy Y (lastApplied == null OR lastApplied < ocurrencia):
     a. prisma.gasto.create({ nombre, monto, categoria, fecha: ocurrencia, fuente: WEB })
     b. prisma.gastoFijo.update({ lastApplied: ocurrencia })
```

Nueva función en `savings-calculator.ts`:

```typescript
export function getLastOccurrence(gasto: GastoFijoInput, hoy: Date): Date | null
```

- MENSUAL: si diaMes ≤ hoy.date → este mes; si no → mes anterior
- SEMANAL: retrocede desde hoy en pasos de 7 días desde fechaBase
- QUINCENAL: retrocede desde hoy en pasos de 14 días desde fechaBase

---

## 3. Impacto en el calculador de ahorro

`calcularResumenAhorro` recibe un nuevo parámetro:

```typescript
calcularResumenAhorro(
  creditos: CreditoInput[],
  fuentes: FuenteIngresoInput[],
  gastosFijos: GastoFijoInput[],    // NUEVO
  hoy: Date,
  horizonte?: number
): ResumenAhorro
```

Para cada `ProyeccionCobro`:

```
totalApartar = apartarParaCreditos + gastosFixosEntreCobros
disponible   = montoIngreso - totalApartar
```

`gastosFixosEntreCobros`: suma de gastos fijos cuya próxima ocurrencia cae entre este cobro y el siguiente cobro.

`ProyeccionCobro` incluye nuevo campo `desgloseGastosFijos: DesgloseCobro[]` separado de `desglose` (créditos).

---

## 4. Nuevas interfaces en savings-calculator.ts

```typescript
export interface GastoFijoInput {
  nombre: string
  monto: number
  frecuencia: FrecuenciaPago
  diaMes?: number
  diaSemana?: number
  fechaBase: Date
}
```

---

## 5. UI

### Nueva página `/gastos-fijos`
- Enlace en Sidebar: "🔒 Gastos fijos" (entre Ingresos y Gastos)
- Lista de GastoFijo con: nombre, monto, frecuencia, próxima fecha proyectada, estado
- CRUD: crear / editar / desactivar
- Formulario idéntico al de créditos y fuentes de ingreso: MENSUAL → diaMes, SEMANAL/QUINCENAL → diaSemana + fechaBase

### SavingsCard actualizada
Cada cobro muestra desglose separado:
```
Cobro: lun 16 mar — Salario $22,000
  ── Créditos ──
  Apartar para Nómina (vence 20/03):   −$2,500
  ── Gastos fijos ──
  Renta (día 15/mes):                  −$5,000
  Netflix (quincenal):                 −$300
  ── Total ──
  Disponible:                          $14,200
```

---

## 6. Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `prisma/schema.prisma` | Agregar modelo GastoFijo |
| `prisma/migrations/...` | Nueva migración |
| `src/lib/savings-calculator.ts` | Agregar GastoFijoInput, getLastOccurrence, actualizar calcularResumenAhorro |
| `src/lib/savings-calculator.test.ts` | Tests para getLastOccurrence y nuevo calcularResumenAhorro |
| `src/app/api/gastos-fijos/route.ts` | NUEVO — GET/POST GastoFijo |
| `src/app/api/gastos-fijos/[id]/route.ts` | NUEVO — PUT/DELETE |
| `src/components/gastos-fijos/GastoFijoForm.tsx` | NUEVO — formulario |
| `src/app/(dashboard)/gastos-fijos/page.tsx` | NUEVA — página /gastos-fijos |
| `src/app/(dashboard)/page.tsx` | Auto-apply logic + pasar gastosFijos a calcularResumenAhorro |
| `src/components/dashboard/SavingsCard.tsx` | Mostrar desgloseGastosFijos separado |
| `src/components/Sidebar.tsx` | Agregar enlace Gastos fijos |
