# Deuda Feature - Debt Payoff Strategies

This feature provides debt payoff strategy calculators to help users optimize their debt elimination plans.

## Strategies

### Snowball Strategy
**Goal:** Pay off smallest balance first to build momentum and motivation.

**How it works:**
1. Sort all debts by balance (smallest to largest)
2. Pay minimum on all debts
3. Apply extra payment to smallest debt
4. When a debt is paid off, add its minimum payment to the extra pool (snowball effect)
5. Continue until all debts are eliminated

**Best for:** People who need psychological wins to stay motivated

**API Endpoint:** `GET /api/deuda/snowball?pagoExtra=200`

## Files

- `types.ts` - TypeScript interfaces for strategy results
- `calculators/snowball.ts` - Snowball strategy implementation
- `calculators/avalanche.ts` - (Future) Avalanche strategy (highest interest first)

## Usage

```typescript
import { calculateSnowball } from '@/features/deuda/calculators/snowball'

const creditos = [
  {
    id: '1',
    nombre: 'Credit Card',
    saldoActual: 2000,
    pagoMensual: 100,
    tasaInteres: 18,
  },
  {
    id: '2',
    nombre: 'Personal Loan',
    saldoActual: 5000,
    pagoMensual: 200,
    tasaInteres: 12,
  },
]

const result = calculateSnowball(creditos, 300) // $300 extra per month

console.log(`Payoff order: ${result.orden.join(' → ')}`)
console.log(`Months to freedom: ${result.mesesLibertad}`)
console.log(`Total paid: $${result.totalPagado}`)
console.log(`Total interest: $${result.totalIntereses}`)
```

## API Response

```json
{
  "ok": true,
  "data": {
    "orden": ["Credit Card", "Personal Loan"],
    "timeline": [
      {
        "mes": 1,
        "deuda": "Credit Card",
        "pago": 400,
        "interes": 30,
        "principal": 370,
        "saldoRestante": 1630
      }
    ],
    "totalPagado": 7450.23,
    "totalIntereses": 450.23,
    "mesesLibertad": 15,
    "metadata": {
      "totalCreditosActivos": 2,
      "pagoMensualMinimo": 300,
      "pagoMensualTotal": 600
    }
  }
}
```

## Testing

```bash
# Run unit tests
npm test -- __tests__/features/deuda/calculators/snowball.test.ts

# Run integration tests
npm test -- __tests__/api/deuda/snowball.test.ts
```

## Future Enhancements

- [ ] Avalanche strategy (highest interest rate first)
- [ ] Hybrid strategy (combination of snowball and avalanche)
- [ ] What-if scenarios (compare different extra payment amounts)
- [ ] Debt consolidation calculator
- [ ] Payoff progress tracking (actual vs projected)
