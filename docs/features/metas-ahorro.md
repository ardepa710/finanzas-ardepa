# Metas de Ahorro - Savings Goals System

## Overview

The Savings Goals system allows users to set financial targets, track progress through manual contributions, and project completion timelines. This feature is independent of the Assets (Activo) system and provides dedicated goal tracking functionality.

## Database Schema

### Meta Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Unique identifier |
| `nombre` | String | Goal name (3-100 chars) |
| `descripcion` | String (nullable) | Optional description |
| `categoria` | CategoriaMeta | Goal category (see enum below) |
| `montoObjetivo` | Decimal(12,2) | Target amount |
| `montoActual` | Decimal(12,2) | Current saved amount (default: 0) |
| `porcentajeProgreso` | Decimal(5,2) | Progress percentage (auto-calculated) |
| `fechaInicio` | DateTime | Start date (default: now) |
| `fechaObjetivo` | DateTime (nullable) | Optional target completion date |
| `fechaCompletada` | DateTime (nullable) | Completion date (auto-set) |
| `estado` | EstadoMeta | Current state (default: EN_PROGRESO) |
| `prioridad` | PrioridadMeta | Priority level (default: MEDIA) |
| `activo` | Boolean | Soft delete flag (default: true) |
| `contribuciones` | Contribucion[] | Related contributions |

**Indexes:**
- `estado`
- `activo`
- `categoria`

### Contribucion Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Unique identifier |
| `metaId` | String | Foreign key to Meta |
| `monto` | Decimal(12,2) | Contribution amount |
| `fecha` | DateTime | Contribution date (default: now) |
| `descripcion` | String (nullable) | Optional note |

**Indexes:**
- `metaId`
- `fecha`

**Cascade:** Contributions are deleted when parent Meta is deleted.

### Enums

#### CategoriaMeta
- `FONDO_EMERGENCIA` - Emergency fund
- `VACACIONES` - Vacation savings
- `ENGANCHE_CASA` - House down payment
- `ENGANCHE_AUTO` - Car down payment
- `EDUCACION` - Education expenses
- `RETIRO` - Retirement savings
- `DEUDA` - Debt payoff
- `COMPRA_GRANDE` - Large purchase
- `OTRO` - Other

#### EstadoMeta
- `EN_PROGRESO` - In progress (default)
- `COMPLETADA` - Completed
- `CANCELADA` - Cancelled
- `PAUSADA` - Paused

#### PrioridadMeta
- `ALTA` - High priority
- `MEDIA` - Medium priority (default)
- `BAJA` - Low priority

## API Endpoints

### POST /api/metas

Create a new savings goal.

**Request Body:**
```json
{
  "nombre": "Fondo Emergencia",
  "descripcion": "6 meses de gastos",
  "categoria": "FONDO_EMERGENCIA",
  "montoObjetivo": 50000,
  "fechaObjetivo": "2026-12-31T00:00:00Z",
  "prioridad": "ALTA"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clz...",
    "nombre": "Fondo Emergencia",
    "descripcion": "6 meses de gastos",
    "categoria": "FONDO_EMERGENCIA",
    "montoObjetivo": "50000",
    "montoActual": "0",
    "porcentajeProgreso": "0",
    "fechaInicio": "2026-02-28T...",
    "fechaObjetivo": "2026-12-31T...",
    "fechaCompletada": null,
    "estado": "EN_PROGRESO",
    "prioridad": "ALTA",
    "activo": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET /api/metas

List all active goals. Supports filtering.

**Query Parameters:**
- `estado` (optional) - Filter by estado (EN_PROGRESO, COMPLETADA, etc.)
- `categoria` (optional) - Filter by categoria

**Examples:**
- `GET /api/metas` - All active goals
- `GET /api/metas?estado=EN_PROGRESO` - Only in-progress goals
- `GET /api/metas?categoria=FONDO_EMERGENCIA` - Only emergency fund goals

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "nombre": "Fondo Emergencia",
      "montoObjetivo": "50000",
      "montoActual": "15000",
      "porcentajeProgreso": "30",
      "estado": "EN_PROGRESO",
      ...
    }
  ]
}
```

### GET /api/metas/[id]

Get goal details with all contributions.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "...",
    "nombre": "Fondo Emergencia",
    "montoObjetivo": "50000",
    "montoActual": "15000",
    "porcentajeProgreso": "30",
    "contribuciones": [
      {
        "id": "...",
        "monto": "5000",
        "fecha": "2026-02-15T...",
        "descripcion": "Ahorro quincenal"
      },
      ...
    ]
  }
}
```

### PUT /api/metas/[id]

Update goal details. All fields are optional.

**Request Body:**
```json
{
  "nombre": "Nuevo nombre",
  "montoObjetivo": 60000,
  "prioridad": "ALTA",
  "estado": "PAUSADA"
}
```

**Note:** When updating `montoActual` or `montoObjetivo`, `porcentajeProgreso` is automatically recalculated.

### DELETE /api/metas/[id]

Soft delete a goal (sets `activo = false`).

**Response:**
```json
{
  "ok": true,
  "data": { "success": true }
}
```

### POST /api/metas/[id]/contribuciones

Add a contribution to a goal. This operation is **transactional** and automatically:
1. Creates the contribution record
2. Updates `montoActual` on the goal
3. Recalculates `porcentajeProgreso`
4. Checks if goal is completed (montoActual >= montoObjetivo)
5. If completed, sets `estado = 'COMPLETADA'` and `fechaCompletada`

**Request Body:**
```json
{
  "monto": 5000,
  "fecha": "2026-02-28T00:00:00Z",
  "descripcion": "Ahorro quincenal"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "contribucion": {
      "id": "...",
      "monto": "5000",
      "fecha": "2026-02-28T...",
      "descripcion": "Ahorro quincenal"
    },
    "meta": {
      "id": "...",
      "nombre": "Fondo Emergencia",
      "montoActual": "20000",
      "porcentajeProgreso": "40",
      "estado": "EN_PROGRESO",
      ...
    }
  }
}
```

**Auto-Completion Example:**

When a contribution reaches or exceeds the goal:

```json
// Request: Add 30000 to a goal with 20000 saved (target: 50000)
{
  "monto": 30000
}

// Response:
{
  "ok": true,
  "data": {
    "meta": {
      "montoActual": "50000",
      "porcentajeProgreso": "100",
      "estado": "COMPLETADA",
      "fechaCompletada": "2026-02-28T19:45:00Z"
    }
  }
}
```

### GET /api/metas/resumen

Get summary statistics across all active goals.

**Response:**
```json
{
  "ok": true,
  "data": {
    "totalMetas": 5,
    "metasActivas": 3,
    "metasCompletadas": 2,
    "montoObjetivoTotal": "150000",
    "montoAhorradoTotal": "75000",
    "progresoPromedio": "50",
    "porCategoria": [
      {
        "categoria": "FONDO_EMERGENCIA",
        "cantidad": 2,
        "monto": "80000"
      },
      {
        "categoria": "VACACIONES",
        "cantidad": 1,
        "monto": "20000"
      }
    ]
  }
}
```

### GET /api/metas/[id]/proyeccion

Calculate projection for goal completion based on monthly savings capacity.

**Query Parameters:**
- `ahorroMensual` (required) - User's monthly savings capacity (number > 0)

**Example Request:**
```
GET /api/metas/cly.../proyeccion?ahorroMensual=5000
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "metaId": "...",
    "nombreMeta": "Fondo Emergencia",
    "montoFaltante": "35000",
    "ahorroMensualRequerido": "3500",
    "mesesEstimados": 7,
    "fechaEstimadaComplecion": "2026-09-28T...",
    "esAlcanzable": true
  }
}
```

**Field Descriptions:**
- `montoFaltante` - Amount still needed to reach goal
- `ahorroMensualRequerido` - Monthly savings needed to meet `fechaObjetivo` (0 if no deadline)
- `mesesEstimados` - Months needed at given `ahorroMensual` rate
- `fechaEstimadaComplecion` - Projected completion date
- `esAlcanzable` - Whether goal can be reached by `fechaObjetivo` (always true if no deadline)

## Business Logic

### Auto-Calculation: porcentajeProgreso

Automatically calculated whenever `montoActual` or `montoObjetivo` changes:

```
porcentajeProgreso = (montoActual / montoObjetivo) * 100
```

Rounded to 2 decimal places. Can exceed 100% if contributions surpass the target.

### Auto-Completion

When a contribution is added, the system checks:

```
if (montoActual >= montoObjetivo && estado !== 'COMPLETADA') {
  estado = 'COMPLETADA'
  fechaCompletada = now()
}
```

**Important:** Once `estado = 'COMPLETADA'` and `fechaCompletada` is set, it's permanent (no auto-reversion even if contributions are manually reduced).

### Projection Calculations

#### Months Needed
```
mesesNecesarios = ceil((montoObjetivo - montoActual) / ahorroMensual)
```

Returns `0` if goal is already met, `Infinity` if ahorroMensual <= 0.

#### Is Achievable
```
if (no deadline) return true
if (already completed) return true
if (ahorroMensual <= 0) return false

mesesDisponibles = months between now and fechaObjetivo
return mesesDisponibles >= mesesNecesarios
```

#### Required Monthly Savings
```
if (no deadline) return 0
if (already completed) return 0

mesesDisponibles = months between now and fechaObjetivo
return montoFaltante / mesesDisponibles
```

Returns `Infinity` if deadline is in the past.

## Goal Lifecycle

1. **Creation** → `estado = EN_PROGRESO`, `montoActual = 0`, `porcentajeProgreso = 0`
2. **Add Contributions** → `montoActual` increases, `porcentajeProgreso` recalculates
3. **Reaches Target** → `estado = COMPLETADA`, `fechaCompletada` auto-set
4. **Manual Pause** → User can set `estado = PAUSADA`
5. **Manual Cancel** → User can set `estado = CANCELADA`
6. **Soft Delete** → `activo = false` (contributions remain, cascade on hard delete)

## Example Workflows

### Example 1: Emergency Fund

```bash
# Create goal
POST /api/metas
{
  "nombre": "Fondo Emergencia",
  "categoria": "FONDO_EMERGENCIA",
  "montoObjetivo": 50000,
  "prioridad": "ALTA"
}

# Add monthly contributions
POST /api/metas/{id}/contribuciones
{ "monto": 5000, "descripcion": "Enero" }

POST /api/metas/{id}/contribuciones
{ "monto": 5000, "descripcion": "Febrero" }

# Check progress
GET /api/metas/{id}
# → montoActual: 10000, porcentajeProgreso: 20

# Project completion
GET /api/metas/{id}/proyeccion?ahorroMensual=5000
# → mesesEstimados: 8, esAlcanzable: true
```

### Example 2: Vacation with Deadline

```bash
# Create goal with deadline
POST /api/metas
{
  "nombre": "Vacaciones Europa",
  "categoria": "VACACIONES",
  "montoObjetivo": 30000,
  "fechaObjetivo": "2026-07-01T00:00:00Z"
}

# Check if achievable
GET /api/metas/{id}/proyeccion?ahorroMensual=4000
# → ahorroMensualRequerido: 6000, esAlcanzable: false
# (Need 6000/month but only saving 4000/month)

# Adjust savings or extend deadline
PUT /api/metas/{id}
{ "fechaObjetivo": "2026-09-01T00:00:00Z" }

# Check again
GET /api/metas/{id}/proyeccion?ahorroMensual=4000
# → esAlcanzable: true
```

## Integration with Existing Features

### Potential Integrations (Future Enhancements)

1. **FuenteIngreso (Income Sources)**
   - Use monthly income totals to suggest realistic `ahorroMensual` values
   - Auto-calculate savings capacity = income - fixed expenses

2. **Presupuesto (Budget System)**
   - Create a "Ahorro" (Savings) budget category
   - Track actual savings vs. budgeted savings
   - Alert when savings are below target

3. **Activo (Assets)**
   - Link completed savings goals to asset purchases
   - Track conversion: Meta → Activo when goal is used

4. **Notificaciones (Notifications)**
   - Alert when goal is 80%, 90%, 100% complete
   - Remind when monthly contribution is due
   - Warn when goal deadline is at risk

## Testing

### Unit Tests (31 passing)
Location: `src/features/metas/calculators/__tests__/proyeccion.test.ts`

Tests cover:
- `calculateMesesParaMeta` - Various scenarios (exact, partial, overfunded, zero savings)
- `projectFechaComplecion` - Date calculations including edge cases
- `esMetaAlcanzable` - Achievability logic (plenty of time, tight deadline, no deadline)
- `calcularAhorroMensualRequerido` - Required savings calculations

### Integration Tests (37 passing)
Location: `__tests__/api/metas.test.ts`

Tests cover:
- CRUD operations (create, read, update, delete)
- Filtering (by estado, by categoria)
- Contribution system (add, multiple, auto-completion)
- Summary statistics
- Projections (achievable, tight, no deadline)
- Validation errors
- Transaction safety
- Cascade delete

**Total: 68 tests passing**

## Notes

- Goals are **independent** of Assets - they represent savings targets, not actual holdings
- Contributions are **manual** - user decides when to add them
- Projection uses **simple linear calculation** (no compound interest)
- `fechaCompletada` is **immutable** once set
- Soft delete (`activo = false`) preserves data; hard delete cascades to contributions

## Future Enhancements

1. **Auto-contributions from income**
   - Link to FuenteIngreso
   - Auto-add contributions when income is received

2. **Recurring contributions**
   - Set up automatic monthly/weekly contributions
   - Similar to GastoFijo but for savings

3. **Goal templates**
   - Pre-defined goals with recommended amounts (3-6 months expenses for emergency fund)
   - Category-specific guidance

4. **Compound interest**
   - For investment-focused goals (retirement, education)
   - Project returns over time

5. **Visual progress tracking**
   - Progress charts
   - Historical contribution graphs
   - Category breakdown visualizations
