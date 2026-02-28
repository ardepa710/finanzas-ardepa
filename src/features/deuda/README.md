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

### Avalanche Strategy
**Goal:** Pay off highest interest rate first to minimize total interest paid.

**How it works:**
1. Sort all debts by interest rate (highest to lowest)
2. Pay minimum on all debts
3. Apply extra payment to highest rate debt
4. When a debt is paid off, add its minimum payment to the extra pool (avalanche effect)
5. Continue until all debts are eliminated

**Best for:** People who want to save the most money (mathematically optimal)

**Special handling:** Zero/null interest rates are treated as 0% and paid last

**API Endpoint:** `GET /api/deuda/avalanche?pagoExtra=200`

### Comparison

| Aspect | Snowball | Avalanche |
|--------|----------|-----------|
| **Ordering** | Smallest balance first | Highest rate first |
| **Psychology** | Motivational wins | Mathematical optimal |
| **Total Interest** | Higher | Lower (saves money) |
| **Timeline** | Same | Same |

## Files

### Backend
- `types.ts` - TypeScript interfaces for strategy results
- `calculators/snowball.ts` - Snowball strategy implementation
- `calculators/avalanche.ts` - Avalanche strategy implementation

### Frontend
- `hooks/useDeudaStrategies.ts` - React Query hooks for data fetching
- `hooks/useDeudaStrategies.test.ts` - Hook tests (10 tests)

### UI Components (in `src/components/deuda/`)
- `ActiveDebtsSummary.tsx` - Displays active debts overview
- `StrategyCard.tsx` - Displays single strategy results
- `StrategyComparison.tsx` - Side-by-side strategy comparison
- `PaymentTimeline.tsx` - CSS-based timeline visualization

### Page
- `src/app/(dashboard)/deuda/page.tsx` - Main debt planning page

## Usage

```typescript
import { calculateSnowball, calculateAvalanche } from '@/features/deuda'

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

// Snowball: Pay smallest balance first
const snowball = calculateSnowball(creditos, 300)
console.log(`Snowball order: ${snowball.orden.join(' → ')}`)
console.log(`Snowball interest: $${snowball.totalIntereses}`)

// Avalanche: Pay highest rate first
const avalanche = calculateAvalanche(creditos, 300)
console.log(`Avalanche order: ${avalanche.orden.join(' → ')}`)
console.log(`Avalanche interest: $${avalanche.totalIntereses}`)

// Compare savings
const savings = snowball.totalIntereses - avalanche.totalIntereses
console.log(`Avalanche saves: $${savings.toFixed(2)}`)
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
# Run all deuda tests (101 tests total)
npm test -- __tests__/features/deuda/ __tests__/api/deuda/ src/features/deuda/hooks/ src/components/deuda/

# Backend tests (66 tests)
npm test -- __tests__/features/deuda/ __tests__/api/deuda/

# Run Snowball unit tests (19 tests)
npm test -- __tests__/features/deuda/calculators/snowball.test.ts

# Run Avalanche unit tests (27 tests)
npm test -- __tests__/features/deuda/calculators/avalanche.test.ts

# Run Snowball API tests (9 tests)
npm test -- __tests__/api/deuda/snowball.test.ts

# Run Avalanche API tests (11 tests)
npm test -- __tests__/api/deuda/avalanche.test.ts

# Frontend tests (35 tests)
npm test -- src/features/deuda/hooks/ src/components/deuda/

# Run hook tests (10 tests)
npm test -- src/features/deuda/hooks/useDeudaStrategies.test.ts

# Run component tests (25 tests)
npm test -- src/components/deuda/
```

**Test Coverage:**
- Snowball calculator: 19 tests
- Avalanche calculator: 27 tests
- Snowball API: 9 tests
- Avalanche API: 11 tests
- React Query hooks: 10 tests
- ActiveDebtsSummary: 7 tests
- StrategyCard: 9 tests
- StrategyComparison: 4 tests
- PaymentTimeline: 5 tests

**Total: 101 tests (all passing)**

## UI Features

### Debt Planning Page (`/deuda`)
- **Active Debts Summary**: Overview of current debts with total balance
- **Extra Payment Slider**: Interactive slider (0-1000) to adjust monthly extra payment
- **Side-by-Side Comparison**: Snowball vs Avalanche strategies
- **Winner Detection**: Automatic highlighting of best strategy
- **Timeline Visualization**: CSS-based horizontal bars showing payment schedule
- **Responsive Design**: Mobile-friendly layout with stacked cards

### React Query Integration
```typescript
import { useSnowballStrategy, useAvalancheStrategy } from '@/features/deuda/hooks/useDeudaStrategies'

// In component
const { data: snowball, isLoading } = useSnowballStrategy(200)
const { data: avalanche } = useAvalancheStrategy(200)
```

### Navigation
- Sidebar link: `💳 Planificación Deuda` → `/deuda`
- Accessible from main navigation menu

## Documentation

- [Snowball Strategy Guide](../../../docs/deuda-snowball-strategy.md)
- [Avalanche Strategy Guide](../../../docs/deuda-avalanche-strategy.md)
- [Frontend Implementation Guide](../../../docs/features/deuda-strategies.md)

## Future Enhancements

### Implemented
- [x] Snowball strategy calculator
- [x] Avalanche strategy calculator
- [x] API endpoints
- [x] Visual timeline charts
- [x] What-if scenarios (compare different extra payment amounts via slider)
- [x] Frontend UI with strategy comparison
- [x] React Query hooks for data fetching
- [x] Component testing

### Planned
- [ ] Hybrid strategy (combination of snowball and avalanche)
- [ ] Debt consolidation calculator
- [ ] Payoff progress tracking (actual vs projected)
- [ ] Export comparison as PDF
- [ ] Save favorite scenarios
- [ ] Payment reminders integration
- [ ] Custom debt ordering
- [ ] Detailed month-by-month breakdown view
