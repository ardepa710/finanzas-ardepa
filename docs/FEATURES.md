# Features

Complete index of all 27 implemented features organized by development week.

---

## Week 1–2: Foundation (Tasks 1–4)

### Task 1: Expense Tracking (Gastos)
Daily expense CRUD with 6 categories (ALIMENTACION, TRANSPORTE, ENTRETENIMIENTO, SALUD, SERVICIOS, OTROS). Tracks source (WEB or TELEGRAM) for each entry. API: `GET/POST /api/gastos`, `GET/PUT/DELETE /api/gastos/[id]`.

### Task 2: Income Sources (Fuentes de Ingreso)
Recurring income source management with 3 frequency modes: MENSUAL (by day-of-month), QUINCENAL (bi-weekly from base date), and SEMANAL (weekly from base date). Also supports one-time manual income entries. API: `/api/ingresos`, `/api/ingresos/manuales`.

### Task 3: Fixed Expenses (Gastos Fijos)
Recurring fixed expense management. Dashboard auto-applies pending fixed expenses on page load by comparing `lastApplied` to the calculated last occurrence date. API: `/api/gastos-fijos`.

### Task 4: Smart Savings Calculator
Core financial logic (`src/lib/savings-calculator.ts`). Projects upcoming paychecks, distributes debt payment obligations equitably across pay periods before each due date, and calculates how much to set aside per paycheck. Frequency normalization: MENSUAL ×1, QUINCENAL ×2, SEMANAL ×4.33. Covered by unit tests in `src/lib/savings-calculator.test.ts`.

---

## Week 3: Budgets (Task 5)

### Task 5: Budget Management (Presupuestos)
Category-level budgets with configurable alert thresholds at 80%, 90%, and 100% of spend. Unique constraint per category + period combination. API: `/api/presupuestos`, `/api/presupuestos/[id]`, `/api/presupuestos/status`.

---

## Week 4: Alerts and Reports (Tasks 6–10)

### Task 6: Alerts Backend
Notification system with `Notificacion` model. 10 notification types (budget thresholds, credit alerts, savings anomalies, AI insights, achievement unlocks). Priority levels: BAJA, NORMAL, ALTA, URGENTE. API: `/api/alertas`.

### Task 7: Alerts Frontend
`NotificationBell` component in the sidebar with unread counter badge. `NotificationPanel` with read/archive actions and type filters. Auto-refreshes every 30 seconds via React Query.

### Task 8: Alert Rules Engine
Three rule engines — budget alerts, credit alerts, expense anomaly detection. Triggered via `POST /api/cron/check-alerts`. 14 unit tests cover rule evaluation logic.

### Task 9: Reports Backend
Four report endpoints with trend analysis and period comparison:
- `GET /api/reportes/gastos` — expense trends by category
- `GET /api/reportes/ingresos` — income trends by source
- `GET /api/reportes/deuda` — debt payment history
- `GET /api/reportes/cashflow` — combined income vs expense

### Task 10: Reports Frontend
Tab-based `/reportes` page with one view per report type. Shared components: `DateRangePicker`, `TrendBadge` (up/down/flat indicators), `ProgressBar`. React Query hooks for data fetching.

---

## Week 5: Debt Strategy and Financial Analysis (Tasks 11–15)

### Task 11: Snowball Strategy Calculator
Debt payoff calculator using the Snowball method (pay minimums on all debts, put extra toward the lowest balance). Returns full monthly payment schedule and total interest paid. API: `GET /api/deuda/snowball?pagoExtra={amount}`.

### Task 12: Avalanche Strategy Calculator
Debt payoff calculator using the Avalanche method (pay minimums on all debts, put extra toward the highest interest rate). Handles null/zero interest rates by placing those debts last. API: `GET /api/deuda/avalanche?pagoExtra={amount}`.

### Task 13: Debt Strategy Comparator Frontend
Interactive `/deuda` page with side-by-side Snowball vs Avalanche comparison. Slider for extra monthly payment (0–1,000 MXN, step 50). Automatic winner badge for the strategy that saves more interest. Timeline visualization with CSS bars.

### Task 14: Financial Ratios
Four financial health ratios with industry-standard thresholds:
- **Debt-to-Income** — `<36%` healthy (CFPB mortgage guidelines)
- **Savings Rate** — `≥20%` excellent (50/30/20 rule)
- **Emergency Fund** — `≥6 months` robust (Fidelity standard)
- **Liquidity Ratio** — `≥2.0` high
API: `GET /api/ratios`.

### Task 15: Cashflow Projection
Forward-looking monthly cashflow: projects recurring income, subtracts fixed debt payments and estimated variable expenses (based on 90-day average), calculates cumulative balance. API: `GET /api/cashflow/projection?meses=6&balanceInicial=0`.

---

## Week 6: Patrimony and Projections (Tasks 16–18)

### Task 16: Asset Tracking (Activos)
Track assets by type (INMUEBLE, VEHICULO, INVERSION, AHORRO, EFECTIVO, OTRO) and liquidity (ALTA, MEDIA, BAJA). Valuation history tracked in `ValoracionActivo`. Auto-creates initial valuation on asset creation. API: `/api/activos`, `/api/activos/[id]`, `/api/activos/[id]/valoraciones`.

### Task 17: Net Worth (Patrimonio Neto)
Calculates net worth = total assets − total liabilities. Returns five views: total net worth, breakdown by asset type, breakdown by liquidity, top 5 assets by value, and per-credit debt breakdown. API: `GET /api/patrimonio`.

### Task 18: Long-term Projections
1–5 year financial outlook with annual modeling of income (normalized across frequencies), fixed expenses, debt payments, and resulting savings. Models debt liberation: when a debt is fully paid off, its payment amount becomes additional savings. API: `GET /api/proyeccion/largo-plazo?años=5&balanceInicial=0`.

---

## Week 7: Investments and Savings Goals (Tasks 19–20)

### Task 19: Investment Tracking
Track investments with full transaction history (COMPRA, VENTA, DIVIDENDO, INTERES, RETIRO, APORTE). Auto-calculates `rendimientoTotal`, `rendimientoPct`, and CAGR. Portfolio summary endpoint with top/worst performers. API: `/api/inversiones`, `/api/inversiones/resumen`, `/api/inversiones/[id]/transacciones`.

### Task 20: Savings Goals (Metas)
Goal-based savings tracking with 9 categories (FONDO_EMERGENCIA, VACACIONES, ENGANCHE_CASA, etc.) and 4 statuses (EN_PROGRESO, COMPLETADA, CANCELADA, PAUSADA). Contributions use Prisma transactions for data integrity. Auto-completes goal when target is reached. Projection endpoint calculates months-to-goal and required monthly savings. API: `/api/metas`, `/api/metas/[id]/contribuciones`, `/api/metas/[id]/proyeccion`, `/api/metas/resumen`.

---

## Week 8: AI, Gamification, and Polish (Tasks 21–27)

### Task 21: AI Smart Insights Backend
Generates personalized financial insights using Anthropic Claude Haiku. Analyzes spending patterns, debt levels, savings rate, and investment performance. Insights stored in `Insight` model with AI metadata (model name, token count). API: `GET /api/insights`.

### Task 22: AI Smart Insights Frontend
Dedicated `/insights` page displaying AI-generated insights with type badges, priority indicators, and helpful/not-helpful feedback buttons. Read state tracking per insight.

### Task 23: Achievement System (Logros)
Gamification achievement system with 20+ achievements across 6 categories (DEUDA, AHORRO, GASTO, INVERSION, RACHA, META). Each achievement awards XP on first unlock. Check endpoint evaluates all conditions against current data. API: `GET /api/gamificacion/logros`, `POST /api/gamificacion/check-logros`.

### Task 24: Streak Tracking
Two streak types: `GASTOS_DIARIOS` (log at least one expense per day) and `METAS_CONTRIBUCION` (contribute to a savings goal). Tracks current streak, personal best, and last activity date. Streak check fires automatically when an expense is created. API: `GET /api/gamificacion/streaks`, `POST /api/gamificacion/streaks/check`.

### Task 25: Levels + Gamification Page
XP-based level system with named levels (e.g., Novato → Ahorrista → Experto Financiero). Dedicated `/gamificacion` page showing current level, XP progress bar, achievement grid, and streak cards. API: `GET /api/gamificacion/perfil`.

### Task 26: UX Polish
Skeleton loader components for async data states. `EmptyState` components with contextual messages and call-to-action buttons. Visual refinements: consistent spacing, dark theme color improvements, responsive layout fixes.

### Task 27: Documentation
Complete developer documentation: README with feature table, SETUP guide, API reference, Telegram bot guide, and this feature index.
