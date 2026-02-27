# Diseño: Frecuencias de Pago en Créditos + Módulo de Ingresos

**Fecha:** 2026-02-27
**Estado:** Aprobado

## Resumen

Extender el sistema para soportar créditos con frecuencia semanal, quincenal y mensual. Agregar un módulo de ingresos con fuentes recurrentes configurables e ingresos manuales. El calculador de ahorro usará todas las fuentes para proyectar cuánto apartar de cada cobro para cubrir los créditos.

---

## 1. Schema de Base de Datos

### Nuevo enum
```prisma
enum FrecuenciaPago {
  SEMANAL
  QUINCENAL
  MENSUAL
}
```

### Cambios a `Credito`
```prisma
model Credito {
  // campos existentes sin cambio...
  frecuencia   FrecuenciaPago  @default(MENSUAL)
  diaSemana    Int?            // 0=Dom..6=Sáb — solo para SEMANAL y QUINCENAL
  fechaBase    DateTime?       // fecha de referencia — solo para SEMANAL y QUINCENAL
  // diaPago Int — se mantiene, usado solo cuando frecuencia=MENSUAL
}
```

### Nuevo modelo `FuenteIngreso`
Reemplaza `ConfiguracionSalario`. Permite múltiples fuentes (salario, freelance, renta, etc.).

```prisma
model FuenteIngreso {
  id          String          @id @default(cuid())
  nombre      String
  monto       Decimal         @db.Decimal(10, 2)
  frecuencia  FrecuenciaPago
  diaSemana   Int?            // 0=Dom..6=Sáb — para SEMANAL/QUINCENAL
  diaMes      Int?            // 1-31 — para MENSUAL
  fechaBase   DateTime        // fecha de referencia para calcular próximos pagos
  activo      Boolean         @default(true)
  createdAt   DateTime        @default(now())
  ingresos    IngresoManual[]
}
```

### Nuevo modelo `IngresoManual`
Pagos reales recibidos (complementa el calendario recurrente).

```prisma
model IngresoManual {
  id          String         @id @default(cuid())
  monto       Decimal        @db.Decimal(10, 2)
  fecha       DateTime       @default(now())
  descripcion String?
  fuenteId    String?
  fuente      FuenteIngreso? @relation(fields: [fuenteId], references: [id])
  createdAt   DateTime       @default(now())
}
```

### Migración de datos
- La fila existente de `ConfiguracionSalario` se convierte en una `FuenteIngreso` con:
  - nombre: "Salario"
  - frecuencia: QUINCENAL
  - fechaBase: el valor de `fechaBaseProximoPago`
  - monto: el valor de `monto`
- `ConfiguracionSalario` se elimina del schema tras la migración.

---

## 2. Lógica del Calculador de Ahorro

### Nuevas funciones en `savings-calculator.ts`

**`getNextOccurrences(fuente, hoy, n)`**
Genera las próximas N fechas de pago para una `FuenteIngreso`:
- MENSUAL: próximos N meses en `diaMes`
- SEMANAL: cada 7 días desde `fechaBase`
- QUINCENAL: cada 14 días desde `fechaBase`

**`getNextCreditDueDate(credito, hoy)`**
Calcula la próxima fecha de vencimiento de un crédito:
- MENSUAL: usa `diaPago` (lógica actual)
- SEMANAL: próximo `diaSemana` dentro de 7 días
- QUINCENAL: próximo ciclo de 14 días desde `fechaBase`

**`calcularResumenAhorro(creditos, fuentes, hoy)`**
Por cada fuente activa, proyecta 6 cobros futuros. Por cada crédito, distribuye su pago entre los cobros que caen antes de su vencimiento.

Output por cobro:
```
Cobro: 2026-03-02 (Salario) — $22,000
  ├─ Crédito Nómina (vence 15/03): apartar $2,500
  ├─ Tarjeta Azul   (vence 20/03): apartar $800
  └─ Disponible: $18,700
```

---

## 3. UI

### Créditos (`/creditos`) — `CreditoForm`
- Selector de frecuencia: MENSUAL / SEMANAL / QUINCENAL
- Si MENSUAL: campo "Día del mes" (comportamiento actual)
- Si SEMANAL o QUINCENAL: selector día de semana (Lun-Dom) + campo "Fecha primer pago"

### Nueva página `/ingresos`
- Sección **Fuentes de ingreso**: CRUD de `FuenteIngreso`
  - Formulario: nombre, monto, frecuencia, día/fecha base
  - Lista con próximas 3 fechas proyectadas
- Sección **Pagos recibidos**: tabla de `IngresoManual` + botón "Registrar cobro"
  - Formulario rápido: monto, fecha, descripción, fuente (opcional)

### Dashboard — `SavingsCard` actualizada
- Muestra proyección de los próximos 3 cobros
- Por cada cobro: monto recibido, cuánto apartar, disponible real

### Sidebar
- Nuevo enlace "💰 Ingresos" entre Dashboard y Créditos

---

## 4. Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `prisma/schema.prisma` | Agregar FrecuenciaPago, campos a Credito, FuenteIngreso, IngresoManual, eliminar ConfiguracionSalario |
| `prisma/migrations/...` | Nueva migración con script de migración de datos |
| `src/lib/savings-calculator.ts` | Reescribir con soporte de frecuencias y múltiples fuentes |
| `src/lib/savings-calculator.test.ts` | Actualizar/agregar tests |
| `src/components/creditos/CreditoForm.tsx` | Agregar selector frecuencia + campos condicionales |
| `src/app/api/creditos/route.ts` | Manejar nuevos campos |
| `src/app/api/creditos/[id]/route.ts` | Manejar nuevos campos |
| `src/app/api/ingresos/route.ts` | NUEVO — CRUD FuenteIngreso |
| `src/app/api/ingresos/[id]/route.ts` | NUEVO |
| `src/app/api/ingresos/manuales/route.ts` | NUEVO — CRUD IngresoManual |
| `src/app/(dashboard)/ingresos/page.tsx` | NUEVA — página /ingresos |
| `src/components/ingresos/FuenteIngresoForm.tsx` | NUEVO |
| `src/components/ingresos/IngresoManualForm.tsx` | NUEVO |
| `src/components/dashboard/SavingsCard.tsx` | Actualizar para nueva estructura |
| `src/app/(dashboard)/page.tsx` | Actualizar query (usar FuenteIngreso en vez de ConfiguracionSalario) |
| `src/components/Sidebar.tsx` | Agregar enlace Ingresos |
