# Reportes Feature

Análisis financiero y generación de reportes con tendencias.

## API Endpoints

### GET /api/reportes/gastos
Reporte de gastos con desglose por categoría y tendencias.

**Query params:**
- `inicio` (ISO date) - Fecha de inicio
- `fin` (ISO date) - Fecha de fin

**Response:**
```typescript
{
  ok: true,
  data: {
    periodo: { inicio: Date, fin: Date },
    total: number,
    promedio: number,
    porCategoria: Array<{
      categoria: string,
      monto: number,
      porcentaje: number,
      tendencia: 'subida' | 'bajada' | 'estable'
    }>,
    tendenciaGeneral: 'subida' | 'bajada' | 'estable'
  }
}
```

### GET /api/reportes/ingresos
Comparación de ingresos vs gastos con tasa de ahorro.

**Query params:**
- `inicio` (ISO date)
- `fin` (ISO date)

**Response:**
```typescript
{
  ok: true,
  data: {
    periodo: { inicio: Date, fin: Date },
    totalIngresos: number,
    totalGastos: number,
    balance: number,
    tasaAhorro: number,
    porFuente: Array<{
      fuente: string,
      monto: number,
      porcentaje: number
    }>,
    porCategoriaGasto: Array<{
      categoria: string,
      monto: number,
      porcentaje: number
    }>
  }
}
```

### GET /api/reportes/deuda
Evolución de deuda por crédito.

**Query params:**
- `inicio` (ISO date)
- `fin` (ISO date)

**Response:**
```typescript
{
  ok: true,
  data: {
    periodo: { inicio: Date, fin: Date },
    deudaTotal: number,
    deudaInicial: number,
    pagosTotales: number,
    interesesPagados: number,
    porCredito: Array<{
      nombre: string,
      saldoActual: number,
      saldoInicial: number,
      pagoMensual: number,
      progreso: number
    }>
  }
}
```

### GET /api/reportes/cashflow
Análisis de flujo de efectivo por periodo.

**Query params:**
- `periodo` (mensual | semanal | quincenal) - Default: mensual

**Response:**
```typescript
{
  ok: true,
  data: {
    periodos: Array<{
      periodo: string,
      inicio: Date,
      fin: Date,
      ingresos: number,
      gastos: number,
      neto: number,
      balance: number
    }>,
    totalIngresos: number,
    totalGastos: number,
    netoTotal: number,
    balanceFinal: number
  }
}
```

## Services

### report-generator.ts
Generador principal de reportes. Consulta la base de datos y genera reportes estructurados.

### trend-analyzer.ts
Lógica de detección de tendencias:
- Compara periodo actual vs anterior
- Umbral de 10% para considerar cambio significativo
- Retorna: 'subida', 'bajada', o 'estable'

### comparator.ts
Utilidades de comparación entre periodos:
- Cálculo de periodo anterior equivalente
- Cambio absoluto y porcentual
- Formato para UI

## Tests

Todos los servicios tienen cobertura de tests en `__tests__/features/reportes/services/`:
- `trend-analyzer.test.ts` - 11 tests
- `comparator.test.ts` - 5 tests
- `report-generator.test.ts` - 5 tests

Ejecutar: `npm test -- __tests__/features/reportes/`

## Usage Example

```typescript
// Frontend
const response = await fetch('/api/reportes/gastos?inicio=2026-02-01&fin=2026-02-28')
const { ok, data } = await response.json()

if (ok) {
  console.log('Total gastos:', data.total)
  console.log('Tendencia:', data.tendenciaGeneral)
  data.porCategoria.forEach(cat => {
    console.log(`${cat.categoria}: $${cat.monto} (${cat.porcentaje}%)`)
  })
}
```
