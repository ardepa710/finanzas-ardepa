# API Reference

All endpoints return JSON. Endpoints using the `withErrorHandling` HOF return `{ ok: true, data: ... }` on success and `{ ok: false, error: { code, message } }` on failure. Some older endpoints return the data directly (without the `ok` wrapper).

Base URL: `http://localhost:3000`

---

## Dashboard

### GET /api/dashboard

Returns a full snapshot for the main dashboard: active credits, income sources, current-month expenses grouped by category, and savings recommendation.

**Response:**
```json
{
  "creditos": [...],
  "fuentes": [...],
  "gastosMes": [...],
  "porCategoria": { "ALIMENTACION": 1500, "TRANSPORTE": 800 },
  "resumenAhorro": {
    "cobros": [
      {
        "fecha": "2026-03-15T00:00:00.000Z",
        "fuenteNombre": "Salario",
        "montoIngreso": 22000,
        "totalApartar": 3500,
        "disponible": 18500,
        "desglose": [
          { "creditoNombre": "Tarjeta Bancomer", "monto": 2000 }
        ]
      }
    ]
  }
}
```

---

## Gastos (Expenses)

### GET /api/gastos

Returns expenses. Supports optional query filters.

**Query params:**
- `desde` — ISO date string, filter from date
- `hasta` — ISO date string, filter to date
- `categoria` — category name (e.g., `ALIMENTACION`)

**Response:** Array of Gasto objects (up to 100, ordered by date desc).

### POST /api/gastos

Create a new expense. Triggers streak check after creation.

**Body:**
```json
{
  "descripcion": "Tacos",
  "monto": 150,
  "categoria": "ALIMENTACION",
  "fecha": "2026-03-01",
  "fuente": "WEB"
}
```

**Response:** Created Gasto object (HTTP 201).

### PUT /api/gastos/[id]

Update an existing expense.

### DELETE /api/gastos/[id]

Delete an expense.

---

## Categorias

### GET /api/categorias

Returns all active categories.

**Response:**
```json
{ "ok": true, "data": [
  { "id": "...", "nombre": "ALIMENTACION", "icono": "🍔", "color": "#...", "tipo": "GASTO" }
]}
```

---

## Creditos (Credit/Debt Accounts)

### GET /api/creditos

Returns all credit accounts.

**Query params:**
- `activo=true` — filter to active credits only

**Response:**
```json
{ "ok": true, "data": [
  {
    "id": "...", "nombre": "Tarjeta Bancomer", "tipo": "TARJETA",
    "montoTotal": "50000", "saldoActual": "35000", "pagoMensual": "3000",
    "tasaInteres": "45.00", "frecuencia": "MENSUAL", "diaPago": 15,
    "activo": true
  }
]}
```

### POST /api/creditos

Create a new credit account.

**Body:**
```json
{
  "nombre": "Tarjeta Bancomer",
  "tipo": "TARJETA",
  "montoTotal": 50000,
  "saldoActual": 35000,
  "pagoMensual": 3000,
  "pagoMinimo": 1500,
  "fechaCorte": 10,
  "diaPago": 15,
  "tasaInteres": 45.0,
  "frecuencia": "MENSUAL"
}
```

**Response:** Created Credito object (HTTP 201).

### PUT /api/creditos/[id]

Update a credit account (e.g., update balance after payment).

### DELETE /api/creditos/[id]

Soft-delete (sets `activo = false`).

---

## Ingresos (Income Sources)

### GET /api/ingresos

Returns all income sources with their last 5 manual entries.

### POST /api/ingresos

Create a new income source.

**Body:**
```json
{
  "nombre": "Salario Solytics",
  "monto": 22000,
  "frecuencia": "QUINCENAL",
  "fechaBase": "2026-01-15"
}
```

### PUT /api/ingresos/[id]

Update an income source.

### DELETE /api/ingresos/[id]

Delete an income source.

### GET /api/ingresos/manuales

Returns all manual income entries.

### POST /api/ingresos/manuales

Log a one-time manual income entry.

**Body:**
```json
{
  "monto": 5000,
  "descripcion": "Freelance project",
  "fuenteId": "optional-source-id",
  "fecha": "2026-03-01"
}
```

### PUT /api/ingresos/manuales/[id]

Update a manual income entry.

### DELETE /api/ingresos/manuales/[id]

Delete a manual income entry.

---

## Gastos Fijos (Fixed/Recurring Expenses)

### GET /api/gastos-fijos

Returns all active fixed expenses.

### POST /api/gastos-fijos

Create a recurring fixed expense.

**Body:**
```json
{
  "nombre": "Netflix",
  "monto": 299,
  "categoriaId": "...",
  "frecuencia": "MENSUAL",
  "diaMes": 5,
  "fechaBase": "2026-01-05"
}
```

### PUT /api/gastos-fijos/[id]

Update a fixed expense.

### DELETE /api/gastos-fijos/[id]

Delete a fixed expense.

---

## Presupuestos (Budgets)

### GET /api/presupuestos

Returns all active budgets with their categories.

**Response:**
```json
{ "ok": true, "data": [
  {
    "id": "...", "monto": "3000", "periodo": "MENSUAL",
    "alertaEn80": true, "alertaEn90": true, "alertaEn100": true,
    "categoria": { "nombre": "ALIMENTACION" }
  }
]}
```

### POST /api/presupuestos

Create a budget for a category + period combination (unique constraint).

**Body:**
```json
{
  "categoriaId": "...",
  "monto": 3000,
  "periodo": "MENSUAL"
}
```

### PUT /api/presupuestos/[id]

Update a budget.

### DELETE /api/presupuestos/[id]

Delete a budget.

### GET /api/presupuestos/status

Returns current spending vs budget for each active budget in the current period.

---

## Alertas (Notifications)

### GET /api/alertas

Returns notifications. By default returns only unread.

**Query params:**
- `todas=true` — include read notifications

**Response:**
```json
{ "ok": true, "data": [
  {
    "id": "...", "tipo": "PRESUPUESTO_90", "titulo": "Presupuesto al 90%",
    "mensaje": "...", "prioridad": "ALTA", "leida": false,
    "createdAt": "2026-03-01T..."
  }
]}
```

### POST /api/alertas

Create a notification manually.

### PUT /api/alertas/[id]

Mark a notification as read (`{ "leida": true }`).

### PUT /api/alertas/mark-all-read

Mark all unread notifications as read.

### POST /api/cron/check-alerts

Trigger the alert rules engine. Should be called periodically (cron job or manual trigger).

Checks: budget thresholds (80/90/100%), upcoming credit payments, expense anomalies.

---

## Reportes (Reports)

### GET /api/reportes/gastos

Expense report with category breakdown, trends, and period comparison.

**Query params:**
- `desde` — start date (ISO)
- `hasta` — end date (ISO)

### GET /api/reportes/ingresos

Income report with source breakdown and trends.

### GET /api/reportes/deuda

Debt report with payment history and projections.

### GET /api/reportes/cashflow

Cashflow report combining income and expenses.

---

## Deuda Strategies

### GET /api/deuda/snowball

Calculate debt payoff using the Snowball method (lowest balance first).

**Query params:**
- `pagoExtra` — additional monthly payment amount (default: 0)

**Response:**
```json
{ "ok": true, "data": {
  "meses": 24,
  "totalPagado": 85000,
  "totalIntereses": 12000,
  "orden": ["Tarjeta pequeña", "Prestamo", "Tarjeta grande"],
  "calendario": [...]
}}
```

### GET /api/deuda/avalanche

Calculate debt payoff using the Avalanche method (highest interest rate first).

**Query params:**
- `pagoExtra` — additional monthly payment amount (default: 0)

---

## Ratios Financieros

### GET /api/ratios

Returns 4 key financial health ratios with industry-standard thresholds.

**Response:**
```json
{ "ok": true, "data": {
  "debtToIncome": { "valor": 28.5, "nivel": "SALUDABLE", "umbral": 36 },
  "savingsRate": { "valor": 18.2, "nivel": "ACEPTABLE", "umbral": 20 },
  "emergencyFund": { "valor": 2.3, "nivel": "INSUFICIENTE", "umbral": 3 },
  "liquidityRatio": { "valor": 1.8, "nivel": "MODERADA", "umbral": 2 }
}}
```

---

## Cashflow Projection

### GET /api/cashflow/projection

Projects income vs expenses for the next N months.

**Query params:**
- `meses` — number of months to project (1–12, default: 6)
- `balanceInicial` — starting balance (default: 0)

---

## Activos (Assets)

### GET /api/activos

Returns all active assets.

### POST /api/activos

Create a new asset.

**Body:**
```json
{
  "nombre": "Casa Ardepa",
  "tipo": "INMUEBLE",
  "valorActual": 1500000,
  "valorCompra": 1200000,
  "fechaAdquisicion": "2020-01-15",
  "liquidez": "BAJA"
}
```

### GET /api/activos/[id]

Get a single asset with valuation history.

### PUT /api/activos/[id]

Update an asset.

### DELETE /api/activos/[id]

Soft-delete an asset.

### POST /api/activos/[id]/valoraciones

Add a new valuation entry for an asset (tracks value over time).

**Body:**
```json
{
  "valor": 1600000,
  "fecha": "2026-03-01",
  "notas": "Revaluation after appraisal"
}
```

---

## Patrimonio (Net Worth)

### GET /api/patrimonio

Returns full net worth breakdown.

**Response:**
```json
{ "ok": true, "data": {
  "patrimonio": {
    "totalActivos": 2500000,
    "totalPasivos": 400000,
    "patrimonioNeto": 2100000,
    "porTipo": [{ "tipo": "INMUEBLE", "valor": 1500000, "porcentaje": 60 }],
    "porLiquidez": [{ "liquidez": "BAJA", "valor": 1500000, "porcentaje": 60 }],
    "topActivos": [...],
    "deudas": { "total": 400000, "porCredito": [...] }
  }
}}
```

---

## Proyeccion Largo Plazo

### GET /api/proyeccion/largo-plazo

Projects financial position over 1–5 years.

**Query params:**
- `años` — projection years (1–5, default: 5)
- `balanceInicial` — starting balance (default: 0)

---

## Inversiones (Investments)

### GET /api/inversiones

Returns all active investments.

### POST /api/inversiones

Create a new investment.

**Body:**
```json
{
  "activoId": "...",
  "montoInvertido": 50000,
  "valorActual": 55000,
  "fechaInversion": "2024-01-01"
}
```

### GET /api/inversiones/[id]

Get a single investment with transaction history.

### PUT /api/inversiones/[id]

Update an investment (e.g., update current value).

### DELETE /api/inversiones/[id]

Soft-delete an investment.

### GET /api/inversiones/resumen

Returns portfolio summary: total invested, current value, overall return percentage, top/worst performers.

### POST /api/inversiones/[id]/transacciones

Add a transaction to an investment (COMPRA, VENTA, DIVIDENDO, etc.).

---

## Metas (Savings Goals)

### GET /api/metas

Returns all active goals.

**Query params:**
- `estado` — filter by state: `EN_PROGRESO`, `COMPLETADA`, `CANCELADA`, `PAUSADA`
- `categoria` — filter by category: `FONDO_EMERGENCIA`, `VACACIONES`, `ENGANCHE_CASA`, etc.

### POST /api/metas

Create a new savings goal.

**Body:**
```json
{
  "nombre": "Fondo de Emergencia",
  "categoria": "FONDO_EMERGENCIA",
  "montoObjetivo": 60000,
  "fechaObjetivo": "2026-12-31",
  "prioridad": "ALTA"
}
```

### GET /api/metas/resumen

Returns goal summary: total goals, completed, in-progress, total saved vs target.

### GET /api/metas/[id]

Get a single goal with contribution history.

### PUT /api/metas/[id]

Update a goal (name, target, status, etc.).

### DELETE /api/metas/[id]

Delete a goal (cascades contributions).

### POST /api/metas/[id]/contribuciones

Add a contribution to a goal. Automatically updates `montoActual` and `porcentajeProgreso`. Auto-completes goal if target is reached.

**Body:**
```json
{
  "monto": 5000,
  "descripcion": "Monthly contribution"
}
```

### GET /api/metas/[id]/proyeccion

Returns time-to-goal projection based on average contribution rate.

---

## Insights (AI)

### GET /api/insights

Generates (or retrieves cached) AI-powered financial insights using Claude Haiku. Analyzes spending patterns, debt levels, savings rate, and investment performance.

**Response:**
```json
{ "ok": true, "data": [
  {
    "id": "...",
    "tipo": "GASTOS",
    "titulo": "Gastos en comida aumentaron 30%",
    "contenido": "Este mes tu gasto en alimentación fue...",
    "prioridad": "ALTA",
    "modelo": "claude-haiku-4-5-20251001",
    "leido": false,
    "util": null
  }
]}
```

---

## Gamificacion

### GET /api/gamificacion/perfil

Returns the user's current level and XP progress.

**Response:**
```json
{ "ok": true, "data": {
  "nivelActual": 3,
  "nivelNombre": "Ahorrista",
  "xpTotal": 350,
  "xpSiguiente": 500,
  "progresoPct": 70
}}
```

### GET /api/gamificacion/logros

Returns all achievements (locked and unlocked), ordered by unlock status then XP value.

**Response:**
```json
{ "ok": true, "data": [
  {
    "id": "...", "codigo": "PRIMER_GASTO", "nombre": "Primer Paso",
    "descripcion": "Registra tu primer gasto",
    "icono": "👣", "categoria": "GASTO", "xp": 10,
    "desbloqueado": true, "fechaLogro": "2026-02-01T..."
  }
]}
```

### POST /api/gamificacion/check-logros

Evaluates all achievement unlock conditions based on current data. Unlocks any newly earned achievements and awards XP.

**Response:**
```json
{ "ok": true, "data": {
  "desbloqueados": ["PRIMER_GASTO", "SEMANA_PERFECTA"],
  "xpGanado": 60
}}
```

### GET /api/gamificacion/streaks

Returns current streak status for all tracked streak types.

**Response:**
```json
{ "ok": true, "data": [
  {
    "tipo": "GASTOS_DIARIOS",
    "rachaActual": 7,
    "rachaMayor": 14,
    "ultimaActividad": "2026-03-01T..."
  }
]}
```

### POST /api/gamificacion/streaks/check

Checks and updates streak status based on today's activity. Called automatically when a new expense is logged.

---

## Telegram Webhook

### POST /api/telegram

Telegram bot webhook endpoint. Receives updates from Telegram and dispatches bot command responses.

- Validates that the message comes from `TELEGRAM_ALLOWED_CHAT_ID`
- Always returns HTTP 200 (Telegram requirement)
- Supported commands: `/gasto`, `/resumen`, `/quincena`, `/creditos`, `/ahorro`, `/ayuda`

See [TELEGRAM.md](TELEGRAM.md) for full command reference.
