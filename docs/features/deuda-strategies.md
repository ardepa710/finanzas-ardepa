# Debt Strategy Comparator - Planificación de Deuda

## Overview

The Debt Strategy Comparator helps users find the most effective way to pay off their debts by comparing two popular strategies:

- **❄️ Snowball Method**: Pay off debts from smallest to largest balance
- **⚡ Avalanche Method**: Pay off debts from highest to lowest interest rate

## Features

### 1. Active Debts Summary
- Displays all active debts with balances > 0
- Shows total debt balance
- Shows minimum monthly payment required
- Lists each debt with balance and interest rate

### 2. Strategy Comparison
- Side-by-side comparison of both methods
- Interactive slider to adjust extra monthly payment (0-1000)
- Real-time calculation of payoff timeline
- Winner detection (which strategy saves more in interest)
- Detailed breakdown for each strategy:
  - Months until debt-free
  - Total amount paid
  - Total interest paid
  - Savings compared to other strategy

### 3. Visual Timeline
- CSS-based visualization of payment schedule
- Color-coded bars for each debt
- Sequential payoff order display
- Month count for each debt

## API Endpoints

### GET /api/deuda/snowball
Calculate Snowball strategy results.

**Query Parameters:**
- `pagoExtra` (number): Additional monthly payment (default: 0)

**Response:**
```json
{
  "ok": true,
  "data": {
    "orden": ["Tarjeta", "Préstamo"],
    "timeline": [...],
    "totalPagado": 5950,
    "totalIntereses": 450,
    "mesesLibertad": 16,
    "metadata": {
      "totalCreditosActivos": 2,
      "pagoMensualMinimo": 200,
      "pagoMensualTotal": 400,
      "calculadoEn": "2026-02-28T..."
    }
  }
}
```

### GET /api/deuda/avalanche
Calculate Avalanche strategy results.

**Query Parameters:**
- `pagoExtra` (number): Additional monthly payment (default: 0)

**Response:**
Same format as Snowball endpoint.

### GET /api/creditos?activo=true
Fetch active credits for display.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "1",
      "nombre": "Tarjeta",
      "saldoActual": 800,
      "pagoMensual": 100,
      "tasaInteres": 18,
      "activo": true
    }
  ]
}
```

## React Components

### Page Component
**File:** `src/app/(dashboard)/deuda/page.tsx`
- Main page component
- Manages extra payment state
- Fetches data using React Query hooks
- Handles loading and error states
- Responsive layout

### ActiveDebtsSummary
**File:** `src/components/deuda/ActiveDebtsSummary.tsx`
- Displays current active debts overview
- Shows total balance and minimum payment
- Lists each debt with details
- Empty state with CTA to add credit

### StrategyComparison
**File:** `src/components/deuda/StrategyComparison.tsx`
- Side-by-side comparison of strategies
- Winner announcement banner
- Renders two StrategyCard components

### StrategyCard
**File:** `src/components/deuda/StrategyCard.tsx`
- Displays single strategy results
- Strategy icon and description
- Winner badge if applicable
- Summary stats (months, total paid, interest)
- Savings vs other strategy
- Payoff order list
- Timeline visualization

### PaymentTimeline
**File:** `src/components/deuda/PaymentTimeline.tsx`
- CSS-based horizontal bar visualization
- Color-coded bars for each debt
- Sequential layout showing order
- Legend with debt names

## React Query Hooks

**File:** `src/features/deuda/hooks/useDeudaStrategies.ts`

### useSnowballStrategy(pagoExtra)
Fetches Snowball strategy calculation.
- Only enabled when pagoExtra > 0
- Returns strategy result with loading/error states

### useAvalancheStrategy(pagoExtra)
Fetches Avalanche strategy calculation.
- Only enabled when pagoExtra > 0
- Returns strategy result with loading/error states

### useActiveCreditos()
Fetches active credits.
- Always enabled
- Returns filtered active credits

### useCompareStrategies(pagoExtra)
Combines both strategies and determines winner.
- Depends on both snowball and avalanche hooks
- Calculates winner and savings
- Only enabled when both strategies loaded

## Types

**File:** `src/features/deuda/types.ts`

```typescript
interface MonthlyPayment {
  mes: number
  deuda: string
  pago: number
  interes: number
  principal: number
  saldoRestante: number
}

interface StrategyResult {
  orden: string[]
  timeline: MonthlyPayment[]
  totalPagado: number
  totalIntereses: number
  mesesLibertad: number
}
```

## Calculator Logic

**Files:**
- `src/features/deuda/calculators/snowball.ts`
- `src/features/deuda/calculators/avalanche.ts`

Both calculators implement a month-by-month simulation:
1. Sort debts by strategy (balance or interest rate)
2. Each month:
   - Calculate interest accrued
   - Pay minimums on all debts
   - Apply extra payment to priority debt
   - Track payments in timeline
3. Move to next debt when one is paid off
4. Return totals and timeline

## Testing

### Hook Tests
**File:** `src/features/deuda/hooks/useDeudaStrategies.test.ts`
- 10 tests covering all hooks
- Mocked fetch responses
- Test success/error states
- Test winner calculation
- Test enabled/disabled conditions

### Component Tests
**Files:**
- `src/components/deuda/ActiveDebtsSummary.test.tsx` (7 tests)
- `src/components/deuda/StrategyCard.test.tsx` (9 tests)
- `src/components/deuda/StrategyComparison.test.tsx` (4 tests)
- `src/components/deuda/PaymentTimeline.test.tsx` (5 tests)

Total: **35 tests** (all passing)

## UI/UX Design

### Color Scheme
- Dark theme with Tailwind slate colors
- Emerald accent for positive metrics (months to freedom)
- Red for debt balances and interest
- Green for savings and winner badges
- Blue/purple/pink for timeline bars

### Responsive Layout
- Max width: 7xl (1280px)
- Grid: 1 column mobile, 2 columns desktop
- Stacked cards on mobile
- Side-by-side comparison on desktop

### Interactive Elements
- Range slider for extra payment (0-1000)
- Smooth transitions on hover
- Loading states during calculations
- Error messages for API failures

## User Flow

1. User navigates to `/deuda` from sidebar
2. System loads active debts
3. User sees summary of current debts
4. User adjusts extra payment slider
5. System calculates both strategies
6. User sees side-by-side comparison
7. Winner is highlighted with savings amount
8. User can adjust payment to see different scenarios

## Empty States

### No Active Debts
Shows message with CTA to add credit:
```
No tienes deudas activas registradas
[Agregar Crédito]
```

### No Extra Payment Set
Shows prompt to adjust slider:
```
Ajusta el pago extra mensual arriba para comparar estrategias
Las estrategias Snowball y Avalanche te ayudarán a salir de deudas más rápido
```

## Error Handling

- API errors show in red alert banner
- Loading states during data fetching
- Validation: pagoExtra must be >= 0
- Graceful handling of missing data
- Empty state for no active debts

## Integration Points

### Sidebar Navigation
Added link: `💳 Planificación Deuda` → `/deuda`

### Credits Page
Could add "Quick link" button to strategy planner when user has active debts.

### Dashboard
Could show recommendation badge if user has debts (future enhancement).

## Performance Considerations

- React Query caching prevents unnecessary API calls
- Hooks only fetch when conditions are met (pagoExtra > 0)
- Debouncing could be added to slider in future
- CSS animations instead of JavaScript for timeline

## Future Enhancements

1. **Export Results**: Download comparison as PDF
2. **Save Strategies**: Bookmark favorite scenarios
3. **Payment Reminders**: Set up notifications for payment dates
4. **Custom Order**: Allow manual debt ordering
5. **What-If Scenarios**: Save multiple extra payment scenarios
6. **Progress Tracking**: Track actual vs planned payoff
7. **Debt-Free Date**: Countdown to freedom
8. **Interest Saved Meter**: Visual progress of savings
9. **Monthly Breakdown**: Detailed month-by-month table view
10. **Mobile App**: Native iOS/Android version

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Screen reader friendly

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript required
- CSS Grid and Flexbox for layout
- No IE11 support
