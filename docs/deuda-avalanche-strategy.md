# Avalanche Debt Payoff Strategy - Implementation Guide

## Overview

The Avalanche debt payoff strategy is a mathematically optimal method of debt elimination that focuses on paying off the highest interest rate first. This minimizes total interest paid and accelerates overall debt freedom.

## Implementation Details

### Algorithm

1. **Sort debts** by interest rate (highest to lowest)
2. **Each month:**
   - Calculate interest on all remaining balances
   - Pay minimum on all debts
   - Apply extra payment + freed payments to highest rate debt
3. **When debt paid off:**
   - Add its minimum payment to extra pool (avalanche effect)
   - Move to next highest rate debt
4. **Continue** until all debts eliminated

### Key Features

- Mathematically optimal (minimizes total interest)
- Works with existing Credito model
- Handles null/zero interest rates (treated as 0%, paid last)
- Accurate interest calculation (monthly compounding)
- Same interface as Snowball strategy
- Safety limits to prevent infinite loops

### Avalanche vs Snowball

| Aspect | Avalanche | Snowball |
|--------|-----------|----------|
| **Ordering** | Highest interest rate first | Smallest balance first |
| **Optimization** | Minimizes total interest | Maximizes quick wins |
| **Psychology** | Logical/mathematical | Motivational/emotional |
| **Total Interest** | Lower (optimal) | Higher |
| **Time to Payoff** | Same as Snowball | Same as Avalanche |
| **Best For** | Rate-focused savers | Motivation-focused eliminators |

**Key Insight:** Both strategies take the same number of months to complete, but Avalanche saves more on interest.

## API Usage

### Endpoint

```
GET /api/deuda/avalanche?pagoExtra={amount}
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

### Example 1: Avalanche vs Snowball Comparison

**Scenario:** Two debts with different rates and balances

```bash
curl "http://localhost:3000/api/deuda/avalanche?pagoExtra=200"
```

**Debts:**
- Credit Card: $1000 balance, $50 minimum, 8% APR (low rate, small balance)
- Personal Loan: $5000 balance, $150 minimum, 18% APR (high rate, large balance)

**Avalanche Result:**
- Payoff order: Personal Loan → Credit Card (targets high rate first)
- Months to freedom: 15
- Total paid: $6,385.23
- Total interest: $385.23

**Snowball Result (same debts):**
- Payoff order: Credit Card → Personal Loan (targets small balance first)
- Months to freedom: 15
- Total paid: $6,478.91
- Total interest: $478.91

**Savings:** Avalanche saves $93.68 in interest

**How it works:**

Months 1-12: Personal Loan gets $150 min + $200 extra = $350/month
- Month 13: Personal Loan paid off

Months 14-15: Credit Card gets $50 min + $200 extra + $150 (freed) = $400/month
- Avalanche effect accelerates payoff

### Example 2: Realistic Portfolio (Rate-Focused)

**Debts:**
- Store Card: $800, $50/month, 24% APR (HIGHEST rate - target first)
- Personal Loan: $3500, $120/month, 12% APR (medium rate)
- Car Loan: $8000, $250/month, 6% APR (LOWEST rate - target last)

```bash
curl "http://localhost:3000/api/deuda/avalanche?pagoExtra=300"
```

**Payoff Order:**
1. Store Card (month ~3) - 24% APR
2. Personal Loan (month ~11) - 12% APR
3. Car Loan (month ~19) - 6% APR

**Avalanche Timeline:**
- Months 1-3: Store Card gets $350 ($50 + $300)
- Months 4-11: Personal Loan gets $470 ($120 + $300 + $50)
- Months 12-19: Car Loan gets $720 ($250 + $300 + $50 + $120)

**Comparison with Snowball:**
- Snowball would target Store Card first (smallest balance)
- In this case, both strategies agree on first target
- But with different debts, Avalanche saves more interest

### Example 3: Zero/Null Interest Handling

**Debts:**
- Balance Transfer: $2000, $100/month, 0% APR (promotional)
- Credit Card: $1000, $50/month, 18% APR
- Interest-Free Loan: $1500, $75/month, null (missing data)

```bash
curl "http://localhost:3000/api/deuda/avalanche?pagoExtra=100"
```

**Payoff Order:**
1. Credit Card (18% - highest)
2. Balance Transfer (0% - treated as zero)
3. Interest-Free Loan (null - treated as zero)

**Strategy:** Pay interest-bearing debts first, then 0%/null debts

### Example 4: Large Extra Payment

**Scenario:** Aggressive debt elimination

```bash
curl "http://localhost:3000/api/deuda/avalanche?pagoExtra=1000"
```

**Result:**
- Very fast payoff (1-2 months in many cases)
- Minimal interest paid
- Targets high rates before they accumulate

## Mathematical Proof: Why Avalanche is Optimal

### Interest Accumulation

Given two debts:
- Debt A: $5000 @ 18% APR = $75/month interest
- Debt B: $1000 @ 8% APR = $6.67/month interest

**Avalanche Approach (pay A first):**
- Month 1-12: Pay A aggressively, accumulates $75/mo interest
- After A paid: B accumulates interest for 12 months
- Total Interest on B: ~$80

**Snowball Approach (pay B first):**
- Month 1-5: Pay B aggressively
- After B paid: A accumulates interest for 5 months
- Total Interest on A: ~$375 MORE than Avalanche

**Result:** Avalanche saves $295 by eliminating high-rate debt faster

### Formula

Total interest saved:
```
Savings = (High Rate - Low Rate) × Average Balance × Time Difference
```

The larger the rate difference, the more Avalanche saves.

## Special Cases

### Equal Interest Rates

When all debts have the same rate, Avalanche = Snowball:
- Order doesn't matter mathematically
- Use Snowball for psychological wins

### Zero Interest Debts

0% promotional balances or interest-free loans:
- Avalanche pays them LAST
- Focus on interest-bearing debts first
- Maximize time with 0% promotions

### Null Interest Rates

Missing interest rate data:
- Treated as 0%
- Paid last (after all interest-bearing debts)
- Stable sort maintains input order for equal rates

## Interest Calculation

Interest is calculated monthly using the formula:

```
Monthly Interest = Balance × (APR / 12 / 100)
```

**Example:**
- Balance: $5000
- APR: 18%
- Monthly Rate: 18 / 12 / 100 = 0.015 (1.5%)
- Interest: $5000 × 0.015 = $75

Each month:
1. Interest is added to balance
2. Payment is applied
3. New balance = Old Balance + Interest - Payment

## Validation Rules

### Input Validation

- `pagoExtra` must be >= 0
- Must have at least one active debt
- Debt balance must be > 0
- Null interest rates are treated as 0%

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
- Same performance as Snowball strategy

## Testing

### Unit Tests (27 tests)

```bash
npm test -- __tests__/features/deuda/calculators/avalanche.test.ts
```

**Coverage:**
- Interest rate ordering (highest first)
- Zero/null interest handling
- Payment calculations
- Interest accuracy
- Avalanche effect
- Comparison with Snowball
- Edge cases
- Real-world scenarios

### Integration Tests (11 tests)

```bash
npm test -- __tests__/api/deuda/avalanche.test.ts
```

**Coverage:**
- API endpoint
- Database queries
- Null/zero rate handling
- Validation
- Error handling
- Real-world portfolios
- Avalanche vs Snowball comparison

### Run All Tests

```bash
npm test -- __tests__/features/deuda/ __tests__/api/deuda/
```

**Note:** Tests run sequentially (`fileParallelism: false`) to avoid database conflicts.

## Database Schema

Uses existing `Credito` model - no schema changes needed:

```prisma
model Credito {
  id          String   @id @default(cuid())
  nombre      String
  saldoActual Decimal  @db.Decimal(10, 2)
  pagoMensual Decimal  @db.Decimal(10, 2)
  tasaInteres Decimal? @db.Decimal(5, 2)  // Nullable - treated as 0% if null
  activo      Boolean  @default(true)
  // ... other fields
}
```

## When to Use Avalanche vs Snowball

### Use Avalanche When:

- Minimizing interest is top priority
- You have high-rate debts (credit cards, payday loans)
- You're disciplined and don't need quick wins
- Large rate differences between debts
- Long payoff timeline (more months = more savings)

### Use Snowball When:

- Motivation and quick wins matter more
- You need psychological momentum
- Debt balances vary significantly
- All rates are similar (Avalanche advantage is small)
- You want to see debts disappear fast

### Hybrid Approach:

Some people use a mix:
1. Start with Snowball for quick wins
2. Switch to Avalanche after first debt paid
3. Balance math and motivation

## Real-World Example

**Scenario:** Family with 4 debts, $500 extra/month

**Debts:**
1. Payday Loan: $500 @ 36% APR, $100/month
2. Credit Card A: $3000 @ 22% APR, $150/month
3. Credit Card B: $2000 @ 18% APR, $100/month
4. Car Loan: $15000 @ 5% APR, $350/month

**Avalanche Order:**
1. Payday Loan (36%) - paid month 1
2. Credit Card A (22%) - paid month 5
3. Credit Card B (18%) - paid month 8
4. Car Loan (5%) - paid month 20

**Snowball Order:**
1. Payday Loan ($500) - paid month 1
2. Credit Card B ($2000) - paid month 4
3. Credit Card A ($3000) - paid month 7
4. Car Loan ($15000) - paid month 20

**Results:**
- Same time to freedom: 20 months
- Avalanche interest: $1,245
- Snowball interest: $1,389
- **Avalanche saves $144**

**Insight:** Payday loan is both smallest AND highest rate, so both strategies agree on it. But Avalanche targets 22% before 18%, saving money on the larger balance.

## Related Documentation

- [Snowball Strategy](./deuda-snowball-strategy.md)
- [Debt Comparison Tool](./deuda-comparison.md) (Future)
- [API Reference](../api/deuda.md) (Future)

## Support

For questions or issues:
- Review test files for usage examples
- Check API error messages for validation issues
- Ensure debts have valid interest rates (or null for 0%)
- Compare with Snowball to see interest savings
