# Cashflow Projection (6-Month Forecast)

## Overview

The cashflow projection feature provides forward-looking financial projections for the next 1-12 months based on:
- **Recurring income** from active FuenteIngreso (MENSUAL, QUINCENAL, SEMANAL)
- **Fixed debt payments** from active Credito
- **Variable expense estimates** based on 90-day historical average from Gasto

This differs from the historical cashflow report (Task 9) which analyzes past data. The projection forecasts future cashflow to help with planning and budgeting.

## API Endpoint

### GET /api/cashflow/projection

**Query Parameters:**
- `meses` (optional): Number of months to project (1-12, default: 6)
- `balanceInicial` (optional): Starting balance (default: 0)

**Example Request:**
```bash
GET /api/cashflow/projection?meses=6&balanceInicial=1000
```

**Response Structure:**
```typescript
{
  proyecciones: [
    {
      mes: 1,
      fecha: "2026-03-01T00:00:00.000Z",
      nombreMes: "Marzo 2026",
      ingresos: {
        total: 4000,
        fuentes: [
          {
            nombre: "Salario",
            monto: 3000,
            fecha: "2026-03-15T00:00:00.000Z"
          },
          {
            nombre: "Freelance",
            monto: 500,
            fecha: "2026-03-01T00:00:00.000Z"
          },
          {
            nombre: "Freelance",
            monto: 500,
            fecha: "2026-03-15T00:00:00.000Z"
          }
        ]
      },
      gastos: {
        total: 2930,
        fijos: 450,      // Debt payments
        variables: 2480, // Estimated from daily average
        desglose: {
          deudas: 450,
          promedioDiario: 80
        }
      },
      flujoNeto: 1070,
      balanceAcumulado: 2070  // 1000 initial + 1070 net
    },
    // ... 5 more months
  ],
  resumen: {
    totalIngresos: 24000,
    totalGastos: 17580,
    flujoNetoTotal: 6420,
    balanceFinal: 7420,  // 1000 initial + 6420 net
    promedioMensual: {
      ingresos: 4000,
      gastos: 2930,
      flujoNeto: 1070
    }
  }
}
```

## Projection Methodology

### 1. Income Projection

Income is projected based on the `frecuencia` field of each active FuenteIngreso:

#### MENSUAL (Monthly)
Occurs once per month on the specified `diaMes`.

**Example:**
```typescript
{
  nombre: "Salario",
  monto: 3000,
  frecuencia: "MENSUAL",
  diaMes: 15  // Paid on the 15th of each month
}
```

**Projection:**
- March 15, 2026: $3,000
- April 15, 2026: $3,000
- May 15, 2026: $3,000
- ... (once per month)

#### QUINCENAL (Biweekly)
Occurs every 14 days from the `fechaBase`.

**Example:**
```typescript
{
  nombre: "Freelance",
  monto: 500,
  frecuencia: "QUINCENAL",
  fechaBase: "2026-03-01"  // Starting March 1
}
```

**Projection:**
- March 1, 2026: $500
- March 15, 2026: $500
- March 29, 2026: $500
- April 12, 2026: $500
- ... (every 14 days)

#### SEMANAL (Weekly)
Occurs every 7 days from the `fechaBase`.

**Example:**
```typescript
{
  nombre: "Weekly Gig",
  monto: 200,
  frecuencia: "SEMANAL",
  fechaBase: "2026-03-03"  // Starting Monday, March 3
}
```

**Projection:**
- March 3, 2026: $200
- March 10, 2026: $200
- March 17, 2026: $200
- March 24, 2026: $200
- March 31, 2026: $200
- ... (every 7 days, ~4.3 times per month)

### 2. Fixed Expense Projection (Debt Payments)

All active credits contribute their `pagoMensual` to the fixed expenses for each month.

**Example:**
```typescript
[
  { nombre: "Tarjeta Visa", pagoMensual: 150 },
  { nombre: "Préstamo Auto", pagoMensual: 300 }
]
```

**Result:**
- Fixed expenses per month: $450

### 3. Variable Expense Estimation

Variable expenses are estimated using a **90-day rolling average** of historical Gasto data.

**Calculation:**
1. Query all Gasto records from the last 90 days
2. Sum total spending
3. Divide by 90 to get daily average
4. Multiply by days in projected month

**Example:**
- Last 90 days total spending: $7,200
- Daily average: $7,200 ÷ 90 = $80/day
- March 2026 (31 days): $80 × 31 = $2,480
- April 2026 (30 days): $80 × 30 = $2,400

### 4. Cashflow Calculation

For each month:
```typescript
flujoNeto = ingresos.total - gastos.total
balanceAcumulado = previousBalance + flujoNeto
```

### 5. Summary Calculation

```typescript
resumen = {
  totalIngresos: sum of all months' income,
  totalGastos: sum of all months' expenses,
  flujoNetoTotal: totalIngresos - totalGastos,
  balanceFinal: final month's balanceAcumulado,
  promedioMensual: {
    ingresos: totalIngresos / meses,
    gastos: totalGastos / meses,
    flujoNeto: flujoNetoTotal / meses
  }
}
```

## Use Cases

### 1. Budget Planning
Project cashflow to determine if income will cover planned expenses.

```bash
# Project 3 months with current balance
GET /api/cashflow/projection?meses=3&balanceInicial=2500
```

### 2. Savings Goal Feasibility
Determine if you can save for a goal given current income and expenses.

```bash
# Project 6 months to see final balance
GET /api/cashflow/projection?meses=6&balanceInicial=1000
```

### 3. Debt Payoff Planning
See how long it takes to accumulate enough to pay off a debt.

```bash
# Project 12 months to see if surplus can cover debt
GET /api/cashflow/projection?meses=12&balanceInicial=0
```

### 4. Income Increase Impact
Add a new income source, then project to see the impact.

```bash
# After adding new FuenteIngreso
GET /api/cashflow/projection?meses=6
```

## Example Scenario

**Setup:**
- Salario: $3,000/month (MENSUAL, día 15)
- Freelance: $500/quincena (QUINCENAL, fechaBase: 2026-03-01)
- Tarjeta Visa: $150/month payment
- Préstamo Auto: $300/month payment
- Historical daily spending: $80/day
- Starting balance: $1,000

**Projection for March 2026 (31 days):**

**Income:**
- March 1: Freelance $500
- March 15: Salario $3,000 + Freelance $500
- March 29: Freelance $500
- **Total: $4,500**

**Expenses:**
- Fixed (debts): $450
- Variable (31 × $80): $2,480
- **Total: $2,930**

**Cashflow:**
- Net: $4,500 - $2,930 = **$1,570**
- Balance: $1,000 + $1,570 = **$2,570**

## Implementation Details

### Helper Functions

**getMonthStart(monthsFromNow)**
Returns the first day of a month N months from now.

**calculateIncomeOccurrences(fuente, startDate, endDate)**
Calculates all occurrences of a recurring income source within a date range based on its frequency.

**getDailyExpenseAverage(days = 90)**
Queries Gasto table and calculates the daily spending average over the last N days.

### Edge Cases

1. **No Income Sources**
   - All months show $0 income
   - Net cashflow equals negative expenses

2. **No Debts**
   - Fixed expenses = $0
   - Only variable expenses estimated

3. **No Historical Expenses**
   - Daily average = $0
   - Only debt payments counted

4. **Negative Initial Balance**
   - Projection still works
   - Shows deficit accumulation

5. **Month with Unusual Income**
   - Biweekly/weekly sources may have 2-5 occurrences per month
   - Monthly projection reflects actual occurrence count

## Assumptions

1. **Income patterns remain stable**
   - Assumes all active FuenteIngreso continue unchanged
   - Does not predict income source changes

2. **Debt payments remain constant**
   - Uses current `pagoMensual` value
   - Does not account for payoff completion

3. **Expense patterns continue**
   - Uses 90-day average as baseline
   - Assumes similar spending behavior going forward

4. **No one-time events**
   - Does not predict bonuses, windfalls, or large purchases
   - User must manually adjust projections for known future events

5. **Daily expense distribution**
   - Distributes variable expenses evenly across month
   - Actual spending may be irregular

## Related Features

- **Task 9: Cashflow Report** - Historical analysis (backward-looking)
- **Task 14: Financial Ratios** - Current financial health metrics
- **Task 12: Savings Goals** - Goal tracking with target dates
- **FuenteIngreso** - Income source management
- **Credito** - Debt management
- **Gasto** - Expense tracking

## Testing

The feature includes comprehensive test coverage:
- **Unit Tests**: 20+ tests for helpers and projection logic
- **Integration Tests**: 8+ tests for API endpoint
- **Test Coverage**: Income calculation, expense estimation, balance accumulation, validation, edge cases

Run tests:
```bash
npm test -- cashflow/projection
npm test -- cashflow/helpers
```

## Future Enhancements

Potential improvements:
1. **What-if scenarios** - Adjust income/expenses without modifying DB
2. **Confidence intervals** - Show high/low projections based on expense variance
3. **One-time events** - Allow adding future one-time income/expenses
4. **Seasonal adjustments** - Account for known seasonal expense changes
5. **Goal integration** - Show if savings goals are achievable
6. **Debt payoff simulation** - Project when debts will be paid off
7. **Export/chart** - Visualize projection as line graph
8. **Alerts** - Warn if projected balance goes negative

## Performance Notes

- **Fast execution**: Single DB query per entity type (FuenteIngreso, Credito, Gasto)
- **Efficient date calculations**: Pure JavaScript date math, no external dependencies
- **Scalable**: Works with any number of income sources/debts
- **Caching potential**: Results can be cached (invalidate on income/debt changes)
