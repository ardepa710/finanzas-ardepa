# Patrimonio Neto (Net Worth)

## Overview

The Net Worth feature provides a comprehensive calculation of the user's financial position by combining all assets and liabilities into a single unified view.

**Formula:**
```
Patrimonio Neto = Total Activos - Total Pasivos
```

## API Endpoint

### GET /api/patrimonio

Returns a complete net worth calculation with breakdowns by asset type, liquidity, top assets, and debt summary.

**Authentication:** None (future: requires user session)

**Request:**
```http
GET /api/patrimonio HTTP/1.1
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "patrimonio": {
      "totalActivos": 250000,
      "totalPasivos": 80000,
      "patrimonioNeto": 170000,

      "porTipo": [
        {
          "tipo": "INMUEBLE",
          "valor": 150000,
          "porcentaje": 60.0
        },
        {
          "tipo": "VEHICULO",
          "valor": 50000,
          "porcentaje": 20.0
        },
        {
          "tipo": "INVERSION",
          "valor": 30000,
          "porcentaje": 12.0
        },
        {
          "tipo": "AHORRO",
          "valor": 15000,
          "porcentaje": 6.0
        },
        {
          "tipo": "EFECTIVO",
          "valor": 5000,
          "porcentaje": 2.0
        }
      ],

      "porLiquidez": [
        {
          "liquidez": "ALTA",
          "valor": 20000,
          "porcentaje": 8.0
        },
        {
          "liquidez": "MEDIA",
          "valor": 80000,
          "porcentaje": 32.0
        },
        {
          "liquidez": "BAJA",
          "valor": 150000,
          "porcentaje": 60.0
        }
      ],

      "topActivos": [
        {
          "id": "clx123...",
          "nombre": "Casa Principal",
          "tipo": "INMUEBLE",
          "valorActual": 150000,
          "porcentajeDelTotal": 60.0
        },
        {
          "id": "clx456...",
          "nombre": "Carro",
          "tipo": "VEHICULO",
          "valorActual": 50000,
          "porcentajeDelTotal": 20.0
        },
        {
          "id": "clx789...",
          "nombre": "Acciones Tech",
          "tipo": "INVERSION",
          "valorActual": 30000,
          "porcentajeDelTotal": 12.0
        }
      ],

      "deudas": {
        "total": 80000,
        "porCredito": [
          {
            "id": "clx111...",
            "nombre": "Hipoteca",
            "saldoActual": 50000,
            "porcentajeDelTotal": 62.5
          },
          {
            "id": "clx222...",
            "nombre": "Préstamo Auto",
            "saldoActual": 20000,
            "porcentajeDelTotal": 25.0
          },
          {
            "id": "clx333...",
            "nombre": "Tarjeta Crédito",
            "saldoActual": 10000,
            "porcentajeDelTotal": 12.5
          }
        ]
      }
    }
  }
}
```

## Calculation Methodology

### 1. Total Assets
- Sum of `valorActual` for all **active** assets (`activo = true`)
- Includes all asset types: INMUEBLE, VEHICULO, INVERSION, AHORRO, EFECTIVO, OTRO

### 2. Total Liabilities
- Sum of `saldoActual` for all **active** credits (`activo = true`)
- Includes both PRESTAMO and TARJETA types

### 3. Net Worth
```
patrimonioNeto = totalActivos - totalPasivos
```
- Can be negative if liabilities exceed assets
- Real-time calculation based on current data

### 4. Breakdown by Asset Type
Groups assets by `tipo` enum:
- INMUEBLE - Real estate properties
- VEHICULO - Vehicles
- INVERSION - Investments (stocks, bonds, funds)
- AHORRO - Savings accounts
- EFECTIVO - Cash on hand
- OTRO - Other assets

**Percentage Calculation:**
```
porcentaje = (valorTipo / totalActivos) * 100
```

### 5. Breakdown by Liquidity
Groups assets by `liquidez` enum:
- ALTA - High liquidity (can convert to cash quickly)
- MEDIA - Medium liquidity (requires some time/effort)
- BAJA - Low liquidity (difficult to convert to cash quickly)

**Percentage Calculation:**
```
porcentaje = (valorLiquidez / totalActivos) * 100
```

### 6. Top Assets
- Sorted by `valorActual` in descending order
- Limited to top 5 highest-value assets
- Includes percentage of total assets for each

### 7. Debt Summary
- Total liabilities amount
- Breakdown by individual credit/loan
- Percentage each debt represents of total debt

## Edge Cases

### Zero Assets
When no assets exist:
- `totalActivos = 0`
- `patrimonioNeto = -totalPasivos` (negative net worth)
- `porTipo = []` (empty array)
- `porLiquidez = []` (empty array)
- `topActivos = []` (empty array)
- Percentages calculation avoids division by zero

### Zero Debts
When no debts exist:
- `totalPasivos = 0`
- `patrimonioNeto = totalActivos` (equals total assets)
- `deudas.total = 0`
- `deudas.porCredito = []` (empty array)

### Empty Database
When no assets or debts exist:
```json
{
  "patrimonio": {
    "totalActivos": 0,
    "totalPasivos": 0,
    "patrimonioNeto": 0,
    "porTipo": [],
    "porLiquidez": [],
    "topActivos": [],
    "deudas": {
      "total": 0,
      "porCredito": []
    }
  }
}
```

## Use Cases

### 1. Financial Dashboard
Display user's overall net worth as a key metric at the top of the dashboard.

```typescript
const { data } = await fetch('/api/patrimonio').then(r => r.json())
const { totalActivos, totalPasivos, patrimonioNeto } = data.patrimonio

console.log(`Net Worth: $${patrimonioNeto.toLocaleString()}`)
```

### 2. Asset Allocation Chart
Visualize asset distribution by type using pie/donut chart.

```typescript
const { porTipo } = data.patrimonio
// Pass to chart component
<PieChart data={porTipo.map(t => ({ label: t.tipo, value: t.valor }))} />
```

### 3. Liquidity Analysis
Assess how quickly assets can be converted to cash.

```typescript
const { porLiquidez } = data.patrimonio
const liquidAssets = porLiquidez.find(l => l.liquidez === 'ALTA')?.valor || 0
const emergencyFund = liquidAssets // Compare against recommended 3-6 months expenses
```

### 4. Wealth Tracking Over Time
Combine with asset valuation history to track net worth changes.

```typescript
// Current net worth
const { patrimonioNeto } = data.patrimonio

// Compare with previous month
const previousMonth = await fetch('/api/patrimonio?fecha=2024-01-01')
const change = patrimonioNeto - previousMonth.data.patrimonio.patrimonioNeto
const percentChange = (change / previousMonth.data.patrimonio.patrimonioNeto) * 100

console.log(`Net worth change: ${percentChange.toFixed(2)}%`)
```

### 5. Debt-to-Asset Ratio
Calculate leverage ratio for financial health assessment.

```typescript
const { totalActivos, totalPasivos } = data.patrimonio
const debtToAssetRatio = totalActivos > 0 ? (totalPasivos / totalActivos) * 100 : 0

if (debtToAssetRatio > 50) {
  console.warn('High debt-to-asset ratio - consider debt reduction')
}
```

## Related Features

- **[Activos](./activos.md)** - Asset management and valuation
- **[Créditos](./creditos.md)** - Debt/credit tracking
- **[Financial Ratios](./ratios.md)** - Additional financial health metrics
- **[Dashboard](./dashboard.md)** - Overview of all financial data

## Future Enhancements

1. **Historical Net Worth Tracking**
   - Store monthly snapshots
   - Chart net worth evolution over time

2. **Net Worth Goals**
   - Set target net worth milestones
   - Track progress with notifications

3. **Projected Net Worth**
   - Calculate future net worth based on current trends
   - Factor in expected income, expenses, and debt payments

4. **Asset Performance**
   - Track ROI for individual assets
   - Identify best/worst performing assets

5. **Comparative Analysis**
   - Compare with average net worth for user's age/region
   - Benchmark against financial goals

## TypeScript Types

```typescript
// Import from '@/features/patrimonio/types'

interface PatrimonioPorTipo {
  tipo: TipoActivo
  valor: number
  porcentaje: number
}

interface PatrimonioPorLiquidez {
  liquidez: Liquidez
  valor: number
  porcentaje: number
}

interface TopActivo {
  id: string
  nombre: string
  tipo: TipoActivo
  valorActual: number
  porcentajeDelTotal: number
}

interface DeudaPorCredito {
  id: string
  nombre: string
  saldoActual: number
  porcentajeDelTotal: number
}

interface PatrimonioDeudas {
  total: number
  porCredito: DeudaPorCredito[]
}

interface PatrimonioData {
  totalActivos: number
  totalPasivos: number
  patrimonioNeto: number
  porTipo: PatrimonioPorTipo[]
  porLiquidez: PatrimonioPorLiquidez[]
  topActivos: TopActivo[]
  deudas: PatrimonioDeudas
}

interface PatrimonioResponse {
  patrimonio: PatrimonioData
}
```

## Implementation Notes

- Uses Prisma Decimal type for monetary values - convert with `Number()`
- All calculations are real-time (no caching)
- Filters only active assets and debts (`activo = true`)
- Percentages rounded to 2 decimal places in calculations
- Handles division by zero gracefully
- Sort order: Top assets DESC by value
- Maximum 5 assets in topActivos array

## Error Handling

Wrapped with `withErrorHandling` HOF:

```typescript
{
  "ok": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Error interno"
  }
}
```

## Testing

See `__tests__/api/patrimonio.test.ts` for 12 integration tests covering:
- ✅ Correct net worth calculation
- ✅ Breakdown by asset type
- ✅ Breakdown by liquidity
- ✅ Top 5 assets sorting
- ✅ Debt summary
- ✅ Zero assets edge case
- ✅ Zero debts edge case
- ✅ Inactive assets/debts filtering
- ✅ Empty database
- ✅ Multiple assets of same type
- ✅ Response structure validation
- ✅ Percentage calculations

Run tests:
```bash
npm test -- __tests__/api/patrimonio.test.ts
```
