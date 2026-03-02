# finanzas-ardepa

Personal Finance Manager — track expenses, manage debt, plan savings, and get AI-powered insights. Dual interface: web dashboard + Telegram bot.

## Features

| # | Task | Status | Description |
|---|------|--------|-------------|
| 1 | Expense Tracking (Gastos) | ✅ | CRUD for daily expenses with categories |
| 2 | Income Sources (Fuentes de Ingreso) | ✅ | Recurring income sources with frequency support |
| 3 | Fixed Expenses (Gastos Fijos) | ✅ | Recurring fixed expenses, auto-applied on dashboard load |
| 4 | Smart Savings Calculator | ✅ | Distributes debt payments across upcoming paychecks |
| 5 | Budget Management (Presupuestos) | ✅ | Category budgets with 80/90/100% alert thresholds |
| 6 | Alerts Backend | ✅ | Notification system with priorities and types |
| 7 | Alerts Frontend | ✅ | NotificationBell with panel, filters, real-time refresh |
| 8 | Alert Rules Engine | ✅ | Budget, credit, and expense anomaly alert triggers |
| 9 | Reports Backend | ✅ | Expense, income, debt, and cashflow report APIs |
| 10 | Reports Frontend | ✅ | Tab-based report views with trend indicators |
| 11 | Snowball Strategy | ✅ | Debt payoff calculator (lowest balance first) |
| 12 | Avalanche Strategy | ✅ | Debt payoff calculator (highest interest first) |
| 13 | Debt Strategy Comparator | ✅ | Side-by-side comparison with interactive extra-payment slider |
| 14 | Financial Ratios | ✅ | Debt-to-Income, Savings Rate, Emergency Fund, Liquidity Ratio |
| 15 | Cashflow Projection | ✅ | 1–12 month forward-looking cashflow forecast |
| 16 | Asset Tracking (Activos) | ✅ | Track assets by type (property, vehicle, investment, etc.) |
| 17 | Net Worth (Patrimonio) | ✅ | Assets minus liabilities with breakdown by type and liquidity |
| 18 | Long-term Projections | ✅ | 1–5 year financial projections with debt liberation modeling |
| 19 | Investment Tracking | ✅ | Track investments with returns, CAGR, and transaction history |
| 20 | Savings Goals (Metas) | ✅ | Goal tracking with contributions and time-to-goal projections |
| 21 | AI Smart Insights Backend | ✅ | Claude Haiku-powered personalized financial insights |
| 22 | AI Smart Insights Frontend | ✅ | Insights page with feedback (helpful/not helpful) |
| 23 | Achievement System (Logros) | ✅ | Gamification achievements with XP rewards |
| 24 | Streak Tracking | ✅ | Daily expense logging and goal contribution streaks |
| 25 | Levels + Gamification Page | ✅ | XP-based user level system with progress display |
| 26 | UX Polish | ✅ | Skeleton loaders, EmptyState components, visual refinements |
| 27 | Documentation | ✅ | Complete developer documentation |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 + React 19 |
| Database ORM | Prisma 7.4.1 + `@prisma/adapter-pg` |
| Database | PostgreSQL 15+ |
| Styling | Tailwind CSS v4 (dark theme) |
| Charts | Recharts 3.7.0 |
| State | TanStack React Query v5 + Zustand v5 |
| AI | Anthropic Claude Haiku (`@anthropic-ai/sdk`) |
| Bot | Telegram Bot API (`node-telegram-bot-api`) |
| Testing | Vitest 4 + Happy DOM |
| Validation | Zod v4 |

## Quick Start

```bash
npm install
cp .env.example .env.local  # ⚠️ Add DATABASE_URL before running next step — see docs/SETUP.md Step 3
npx prisma migrate dev
npx prisma db seed && npx tsx prisma/gamificacion-seed.ts
npm run dev
```

App runs at http://localhost:3000

## Documentation

| File | Description |
|------|-------------|
| [docs/SETUP.md](docs/SETUP.md) | Full setup guide with Telegram bot configuration |
| [docs/API.md](docs/API.md) | All REST API endpoints with request/response examples |
| [docs/TELEGRAM.md](docs/TELEGRAM.md) | Bot commands and category reference |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature index organized by development week |

## Key Design Decisions

- **No authentication** — 100% local app, privacy by design
- **Dual interface** — web dashboard + Telegram bot for on-the-go expense logging
- **Prisma 7** — uses `prisma.config.ts` + `@prisma/adapter-pg` (different from v6)
- **Soft delete** — credits and assets deactivated, not deleted (preserves history)
- **Currency** — MXN fixed, no conversions
- **Frequency normalization** — MENSUAL ×1, QUINCENAL ×2, SEMANAL ×4.33 for accurate projections

## Running Tests

```bash
npm test          # run all tests
npm run test:watch  # watch mode
```
