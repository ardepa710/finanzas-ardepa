# Snowball Debt Payoff Strategy - Implementation Guide

## Overview

The Snowball debt payoff strategy is a method of debt elimination that focuses on paying off the smallest balance first, regardless of interest rate. This creates psychological wins and momentum as debts are eliminated quickly.

## Implementation Details

### Algorithm

1. **Sort debts** by current balance (smallest to largest)
2. **Each month:**
   - Calculate interest on all remaining balances
   - Pay minimum on all debts
   - Apply extra payment + freed payments to smallest debt
3. **When debt paid off:**
   - Add its minimum payment to extra pool (snowball effect)
   - Move to next smallest debt
4. **Continue** until all debts eliminated

### Key Features

- Zero-downtime calculation (no schema changes needed)
- Works with existing Credito model
- Handles varying interest rates
- Accurate interest calculation (monthly compounding)
- Supports zero-interest debts
- Safety limits to prevent infinite loops

## API Usage

### Endpoint

```
GET /api/deuda/snowball?pagoExtra={amount}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pagoExtra | number | No | Additional monthly payment (default: 0) |

### Response

```typescript
{
  ok: true,
  data: {
    orden: string[]              // Payoff order (debt names)
    timeline: MonthlyPayment[]   // Month-by-month breakdown
    totalPagado: number          // Total paid (principal + interest)
    totalIntereses: number       // Total interest paid
    mesesLibertad: number        // Months to debt freedom
    metadata: {
      totalCreditosActivos: number
      pagoMensualMinimo: number
      pagoMensualTotal: number
      calculadoEn: string
    }
  }
}
```

### MonthlyPayment Structure

```typescript
{
  mes: number              // Month number (1-based)
  deuda: string           // Debt name
  pago: number            // Total payment this month
  interes: number         // Interest charged this month
  principal: number       // Principal paid this month
  saldoRestante: number   // Remaining balance after payment
}
```

## Examples

### Example 1: Basic Usage

**Scenario:** Two debts, $200 extra payment

```bash
curl "http://localhost:3000/api/deuda/snowball?pagoExtra=200"
```

**Debts:**
- Credit Card: $800 balance, $50 minimum, 18% APR
- Personal Loan: $4500 balance, $150 minimum, 12% APR

**Result:**
- Payoff order: Credit Card → Personal Loan
- Months to freedom: 15
- Total paid: $5,744.48
- Total interest: $444.48

**How it works:**

Months 1-3: Credit Card gets $50 min + $200 extra = $250/month
- Month 4: Credit Card paid off ($76 final payment)

Months 5-15: Personal Loan gets $150 min + $200 extra + $50 (freed) = $400/month
- Snowball effect accelerates payoff

### Example 2: Zero Extra Payment

**Scenario:** Testing with minimum payments only

```bash
curl "http://localhost:3000/api/deuda/snowball"
```

**Result:**
- Uses only minimum payments
- Longer payoff timeline
- Higher total interest

### Example 3: Large Extra Payment

**Scenario:** Aggressive debt elimination

```bash
curl "http://localhost:3000/api/deuda/snowball?pagoExtra=1000"
```

**Result:**
- Very fast payoff (1-2 months in many cases)
- Minimal interest paid
- All debts eliminated quickly

### Example 4: Realistic Portfolio

**Debts:**
- Store Card: $800, $50/month, 24% APR (highest rate)
- Personal Loan: $3500, $120/month, 12% APR (medium)
- Car Loan: $8000, $250/month, 6% APR (lowest rate)

**Strategy:** Despite Car Loan having lowest rate, Store Card is paid first (smallest balance)

```bash
curl "http://localhost:3000/api/deuda/snowball?pagoExtra=300"
```

**Payoff Order:**
1. Store Card (month ~4)
2. Personal Loan (month ~12)
3. Car Loan (month ~20)

**Snowball Timeline:**
- Months 1-4: Store Card gets $350 ($50 + $300)
- Months 5-12: Personal Loan gets $470 ($120 + $300 + $50)
- Months 13-20: Car Loan gets $720 ($250 + $300 + $50 + $120)

## Interest Calculation

Interest is calculated monthly using the formula:

```
Monthly Interest = Balance × (APR / 12 / 100)
```

**Example:**
- Balance: $1000
- APR: 18%
- Monthly Rate: 18 / 12 / 100 = 0.015 (1.5%)
- Interest: $1000 × 0.015 = $15

Each month:
1. Interest is added to balance
2. Payment is applied
3. New balance = Old Balance + Interest - Payment

## Validation Rules

### Input Validation

- `pagoExtra` must be >= 0
- Must have at least one active debt
- Debt balance must be > 0

### Error Responses

**No active debts:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "No hay créditos activos con saldo pendiente"
  }
}
```

**Negative extra payment:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El pago extra debe ser mayor o igual a 0"
  }
}
```

**Invalid parameter:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El parámetro pagoExtra debe ser un número válido"
  }
}
```

## Performance

### Complexity

- **Time:** O(n × m) where n = debts, m = months to payoff
- **Space:** O(n × m) for timeline storage

### Limits

- Maximum months: 1000 (safety limit)
- Typical scenarios: 6-60 months
- Large portfolios: < 100ms response time

### Optimization Notes

- Uses single DB query (includes only needed fields)
- In-memory calculation (no repeated DB hits)
- Decimal precision handled (round to 2 decimals)

## Testing

### Unit Tests (19 tests)

```bash
npm test -- __tests__/features/deuda/calculators/snowball.test.ts
```

**Coverage:**
- Debt ordering
- Payment calculations
- Interest accuracy
- Snowball effect
- Edge cases
- Real-world scenarios

### Integration Tests (9 tests)

```bash
npm test -- __tests__/api/deuda/snowball.test.ts
```

**Coverage:**
- API endpoint
- Database queries
- Validation
- Error handling
- Real-world portfolios

## Database Schema

Uses existing `Credito` model - no schema changes needed:

```prisma
model Credito {
  id          String   @id @default(cuid())
  nombre      String
  saldoActual Decimal  @db.Decimal(10, 2)
  pagoMensual Decimal  @db.Decimal(10, 2)
  tasaInteres Decimal? @db.Decimal(5, 2)
  activo      Boolean  @default(true)
  // ... other fields
}
```

## Future Enhancements

### Planned Features

1. **Avalanche Strategy**
   - Pay highest interest rate first
   - Mathematically optimal
   - Compare side-by-side with Snowball

2. **Hybrid Strategy**
   - Combine Snowball and Avalanche
   - Balance psychology and math
   - Customizable weighting

3. **What-If Scenarios**
   - Compare different extra payment amounts
   - See impact of rate changes
   - Calculate break-even points

4. **Progress Tracking**
   - Compare actual vs projected
   - Update projections based on progress
   - Celebrate milestones

5. **Visual Timeline**
   - Chart showing debt elimination
   - Monthly payment breakdown
   - Interest vs principal over time

## Related Documentation

- [Avalanche Strategy](./deuda-avalanche-strategy.md) (Future)
- [Debt Comparison Tool](./deuda-comparison.md) (Future)
- [API Reference](../api/deuda.md) (Future)

## Support

For questions or issues:
- Review test files for usage examples
- Check API error messages for validation issues
- Ensure debts have positive balances and valid rates
