# Inversiones Tracking System

## Overview

The Inversiones Tracking system provides comprehensive investment management capabilities for the Finanzas Ardepa application. It tracks investment performance, returns, transactions, and provides portfolio-level analytics.

## Schema Structure

### Models

#### Inversion
Represents an individual investment linked to an Activo of type `INVERSION`.

```prisma
model Inversion {
  id                String              @id @default(cuid())
  activoId          String
  activo            Activo              @relation(fields: [activoId], references: [id])

  // Investment details
  montoInvertido    Decimal             @db.Decimal(12, 2)  // Original investment amount
  fechaInversion    DateTime                                 // Date of initial investment

  // Performance tracking
  valorActual       Decimal             @db.Decimal(12, 2)  // Current market value
  rendimientoTotal  Decimal             @db.Decimal(12, 2)  // Absolute return (valorActual - montoInvertido)
  rendimientoPct    Decimal             @db.Decimal(5, 2)   // Percentage return ((rendimiento / montoInvertido) * 100)

  // Income tracking
  dividendos        Decimal             @default(0) @db.Decimal(12, 2)  // Cumulative dividends received
  intereses         Decimal             @default(0) @db.Decimal(12, 2)  // Cumulative interest received

  // Metadata
  descripcion       String?             @db.Text
  activa            Boolean             @default(true)      // Soft delete flag
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  transacciones     TransaccionInversion[]
}
```

#### TransaccionInversion
Tracks all investment-related transactions.

```prisma
model TransaccionInversion {
  id              String           @id @default(cuid())
  inversionId     String
  inversion       Inversion        @relation(fields: [inversionId], references: [id], onDelete: Cascade)

  tipo            TipoTransaccion  // COMPRA, VENTA, DIVIDENDO, INTERES, RETIRO, APORTE
  monto           Decimal          @db.Decimal(12, 2)
  fecha           DateTime
  descripcion     String?          @db.Text

  createdAt       DateTime         @default(now())
}
```

#### TipoTransaccion Enum
```prisma
enum TipoTransaccion {
  COMPRA      // Initial purchase or additional buy
  VENTA       // Sale of investment
  DIVIDENDO   // Dividend payment received
  INTERES     // Interest payment received
  RETIRO      // Withdrawal of funds
  APORTE      // Additional contribution
}
```

## API Endpoints

### POST /api/inversiones
Creates a new investment.

**Request Body:**
```json
{
  "activoId": "string (cuid)",
  "montoInvertido": 10000,
  "fechaInversion": "2024-01-01T00:00:00Z",
  "valorActual": 10000,
  "dividendos": 0,        // optional
  "intereses": 0,         // optional
  "descripcion": "string" // optional
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clxxxxx",
    "activoId": "clxxxxx",
    "montoInvertido": "10000",
    "valorActual": "10000",
    "rendimientoTotal": "0",
    "rendimientoPct": "0",
    "dividendos": "0",
    "intereses": "0",
    "activa": true,
    "transacciones": [
      {
        "tipo": "COMPRA",
        "monto": "10000",
        "fecha": "2024-01-01T00:00:00.000Z",
        "descripcion": "Inversión inicial"
      }
    ],
    "activo": { ... }
  }
}
```

**Notes:**
- Automatically creates an initial `COMPRA` transaction
- Validates that `activoId` exists and is of tipo `INVERSION`
- Automatically calculates `rendimientoTotal` and `rendimientoPct`

### GET /api/inversiones
Lists all active investments.

**Query Parameters:**
- `activa` (optional): Filter by active status (default: true)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "clxxxxx",
      "activoId": "clxxxxx",
      "montoInvertido": "10000",
      "valorActual": "12000",
      "rendimientoTotal": "2000",
      "rendimientoPct": "20",
      "activa": true,
      "activo": { ... },
      "transacciones": [ ... ] // Last 5 transactions
    }
  ]
}
```

### GET /api/inversiones/:id
Gets detailed information about a specific investment.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clxxxxx",
    "montoInvertido": "10000",
    "valorActual": "12000",
    "rendimientoTotal": "2000",
    "rendimientoPct": "20",
    "dividendos": "300",
    "intereses": "100",
    "activo": { ... },
    "transacciones": [ ... ] // All transactions, sorted by date desc
  }
}
```

### PUT /api/inversiones/:id
Updates an investment.

**Request Body:**
```json
{
  "valorActual": 15000,     // optional
  "dividendos": 500,        // optional
  "intereses": 100,         // optional
  "descripcion": "string",  // optional
  "activa": false           // optional (soft delete)
}
```

**Notes:**
- If `valorActual` is updated, automatically recalculates returns
- Returns updated investment with recalculated `rendimientoTotal` and `rendimientoPct`

### DELETE /api/inversiones/:id
Soft deletes an investment (sets `activa` to false).

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clxxxxx",
    "activa": false
  }
}
```

### POST /api/inversiones/:id/transacciones
Adds a new transaction to an investment.

**Request Body:**
```json
{
  "tipo": "DIVIDENDO",
  "monto": 250,
  "fecha": "2024-06-15T00:00:00Z",
  "descripcion": "Q2 dividend" // optional
}
```

**Valid Transaction Types:**
- `COMPRA` - Purchase
- `VENTA` - Sale
- `DIVIDENDO` - Dividend received
- `INTERES` - Interest received
- `RETIRO` - Withdrawal
- `APORTE` - Additional contribution

### GET /api/inversiones/resumen
Gets portfolio summary with performance metrics.

**Response:**
```json
{
  "ok": true,
  "data": {
    "totalInversiones": 3,
    "montoTotalInvertido": "50000",
    "valorActualTotal": "65000",
    "rendimientoTotal": "15000",
    "rendimientoPct": "30",
    "dividendosTotal": "1200",
    "interesesTotal": "800",
    "porActivo": [
      {
        "activoId": "clxxxxx",
        "activoNombre": "Tech Stocks",
        "montoInvertido": 20000,
        "valorActual": 28000,
        "rendimiento": 8000,
        "rendimientoPct": 40
      }
    ],
    "mejores": [
      {
        "activoId": "clxxxxx",
        "activoNombre": "Tech Stocks",
        "rendimientoPct": 40
      }
    ],
    "peores": [
      {
        "activoId": "clxxxxx",
        "activoNombre": "Energy Stocks",
        "rendimientoPct": -10
      }
    ]
  }
}
```

**Notes:**
- `mejores` returns top 3 performers
- `peores` returns bottom 3 performers
- Returns empty structure with zeros if no investments exist

## Return Calculations

### Absolute Return (Rendimiento Total)
```
rendimientoTotal = valorActual - montoInvertido
```

Example: `$15,000 - $10,000 = $5,000`

### Percentage Return (Rendimiento Porcentual)
```
rendimientoPct = (rendimientoTotal / montoInvertido) * 100
```

Example: `($5,000 / $10,000) * 100 = 50%`

### Compound Annual Growth Rate (CAGR)
```
CAGR = ((valorActual / montoInvertido) ^ (1 / years)) - 1) * 100
```

Example for 5 years:
- Initial: $10,000
- Final: $16,105
- CAGR: `((16105 / 10000) ^ (1 / 5)) - 1) * 100 ≈ 10%`

## Transaction Types and Effects

| Type | Effect | Example Use Case |
|------|--------|-----------------|
| `COMPRA` | Initial investment or additional purchase | Buying stocks, initial investment |
| `VENTA` | Sale of investment position | Selling stocks, closing position |
| `DIVIDENDO` | Dividend payment received | Quarterly dividend from stocks |
| `INTERES` | Interest payment received | Bond interest, savings interest |
| `RETIRO` | Withdrawal of funds | Taking money out without selling |
| `APORTE` | Additional contribution | Adding more money to investment |

## Integration with Patrimonio

Investments are linked to the `Activo` model with `tipo = 'INVERSION'`:

1. Create an `Activo` of type `INVERSION`
2. Link `Inversion` to that `Activo` via `activoId`
3. The `Inversion` provides detailed tracking beyond basic `Activo` management
4. Net worth calculations include the `valorActual` from both `Activo` and `Inversion`

## Example Workflows

### 1. Create New Stock Investment
```bash
# Step 1: Create Activo
POST /api/activos
{
  "nombre": "AAPL Stock",
  "tipo": "INVERSION",
  "valorActual": 10000,
  "liquidez": "ALTA"
}

# Step 2: Create Inversion
POST /api/inversiones
{
  "activoId": "<activo_id>",
  "montoInvertido": 10000,
  "fechaInversion": "2024-01-01T00:00:00Z",
  "valorActual": 10000
}
```

### 2. Receive Dividend Payment
```bash
POST /api/inversiones/:id/transacciones
{
  "tipo": "DIVIDENDO",
  "monto": 250,
  "fecha": "2024-06-15T00:00:00Z",
  "descripcion": "Q2 2024 dividend"
}
```

### 3. Update Investment Value
```bash
PUT /api/inversiones/:id
{
  "valorActual": 15000
}
# Returns automatically recalculated rendimientoTotal and rendimientoPct
```

### 4. Sell Investment
```bash
POST /api/inversiones/:id/transacciones
{
  "tipo": "VENTA",
  "monto": 15000,
  "fecha": "2024-12-31T00:00:00Z",
  "descripcion": "Full position sale"
}

# Then soft delete
DELETE /api/inversiones/:id
```

## Performance Tracking

The system automatically tracks:
- **Absolute returns**: Total gain/loss in currency
- **Percentage returns**: Return as percentage of initial investment
- **Income generation**: Cumulative dividends and interest
- **Portfolio performance**: Aggregate metrics across all investments
- **Ranking**: Best and worst performing investments

## Best Practices

1. **Regular Updates**: Update `valorActual` regularly to track performance accurately
2. **Transaction Logging**: Record all dividends, interest, and contributions as transactions
3. **Soft Delete**: Use soft delete (DELETE endpoint) instead of hard deletion to preserve history
4. **Portfolio Reviews**: Use `/resumen` endpoint for regular portfolio performance reviews
5. **CAGR Tracking**: For long-term investments, calculate CAGR to evaluate compound growth

## Testing

The system includes comprehensive test coverage:
- **Unit Tests**: 25 tests for calculator functions (returns, CAGR, ranking)
- **Integration Tests**: 20 tests for API endpoints
- **Total Coverage**: 45 tests ensuring reliability

Run tests with:
```bash
npm test -- src/features/inversiones
npm test -- __tests__/api/inversiones.test.ts
```

## Future Enhancements

Potential additions for future versions:
- Historical performance charts
- Asset allocation visualization
- Benchmark comparison (vs S&P 500, etc.)
- Tax reporting (capital gains, dividend income)
- Multi-currency support
- Automated value updates via market data APIs
