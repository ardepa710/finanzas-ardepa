# FINANZAS ARDEPA — Design Document
**Date:** 2026-02-26
**Owner:** ardepa
**Status:** Approved

---

## Overview

Aplicación de finanzas personales local para gestión de créditos, gastos diarios vía Telegram, y análisis financiero inteligente. Nombre: **FINANZAS ARDEPA**.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Estilos:** Tailwind CSS v4
- **ORM:** Prisma v6
- **Base de datos:** PostgreSQL local
- **Gráficas:** Recharts
- **Bot Telegram:** node-telegram-bot-api (modo webhook)
- **Tunnel local:** ngrok

---

## Contexto Financiero del Usuario

- **Salario:** $22,000 MXN por quincena
- **Frecuencia de pago:** Cada lunes alterno (un lunes sí, un lunes no)
- **Próximo lunes de pago:** calculado dinámicamente desde una fecha base configurable

---

## Arquitectura — Opción A: Monolito Next.js

```
finanzas-ardepa/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Redirect a dashboard
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              ← Layout con sidebar
│   │   │   ├── page.tsx                ← Dashboard principal
│   │   │   ├── gastos/
│   │   │   │   └── page.tsx            ← CRUD gastos
│   │   │   └── creditos/
│   │   │       └── page.tsx            ← CRUD créditos
│   │   └── api/
│   │       ├── telegram/
│   │       │   └── route.ts            ← Webhook Telegram
│   │       ├── gastos/
│   │       │   └── route.ts            ← API REST gastos
│   │       └── creditos/
│   │           └── route.ts            ← API REST créditos
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CashFlowChart.tsx
│   │   │   ├── ExpensesPieChart.tsx
│   │   │   ├── CreditProgressCard.tsx
│   │   │   └── SavingsRecommendation.tsx
│   │   ├── gastos/
│   │   │   └── GastoForm.tsx
│   │   └── creditos/
│   │       └── CreditoForm.tsx
│   └── lib/
│       ├── prisma.ts
│       ├── savings-calculator.ts       ← Lógica financiera central
│       └── telegram-handler.ts         ← Parser de comandos Telegram
├── prisma/
│   └── schema.prisma
└── .env.local
```

---

## Base de Datos — Schema Prisma

### Tabla: `Credito`
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | PK |
| nombre | String | Nombre del crédito |
| tipo | Enum: PRESTAMO / TARJETA | Tipo de crédito |
| montoTotal | Decimal | Monto total del crédito |
| saldoActual | Decimal | Saldo pendiente por pagar |
| pagoMensual | Decimal | Pago fijo mensual (PRESTAMO) |
| pagoMinimo | Decimal? | Pago mínimo (TARJETA) |
| fechaCorte | Int? | Día del mes en que corta (TARJETA) |
| fechaPago | Int | Día del mes límite de pago |
| tasaInteres | Decimal? | Tasa de interés anual |
| activo | Boolean | Si sigue vigente |
| createdAt | DateTime | — |

### Tabla: `Gasto`
| Campo | Tipo | Descripción |
|---|---|---|
| id | String (cuid) | PK |
| descripcion | String | Descripción del gasto |
| monto | Decimal | Monto en MXN |
| categoria | Enum | ALIMENTACION / TRANSPORTE / ENTRETENIMIENTO / SALUD / SERVICIOS / OTROS |
| fecha | DateTime | Fecha del gasto |
| fuente | Enum: TELEGRAM / WEB | Origen del registro |
| createdAt | DateTime | — |

### Tabla: `ConfiguracionSalario`
| Campo | Tipo | Descripción |
|---|---|---|
| id | Int | PK (siempre 1) |
| monto | Decimal | $22,000 MXN |
| fechaBaseProximoPago | DateTime | Fecha base para calcular lunes alternos |

---

## Bot de Telegram — Comandos

| Comando | Ejemplo | Acción |
|---|---|---|
| `/gasto [categoria] [monto] [descripcion]` | `/gasto Comida 180 McDonald's` | Registra un gasto |
| `/resumen` | `/resumen` | Resumen de gastos del día actual |
| `/quincena` | `/quincena` | Gastos totales de la quincena actual |
| `/creditos` | `/creditos` | Lista créditos con próximos pagos |
| `/ahorro` | `/ahorro` | Cuánto ahorrar en el próximo pago para cubrir créditos |

**Categorías válidas:** Comida, Transporte, Entretenimiento, Salud, Servicios, Otros

**Seguridad:** El bot filtra por `TELEGRAM_ALLOWED_CHAT_ID` en `.env.local`. Mensajes de otros chat_id son ignorados.

---

## Lógica Financiera — Calculadora de Ahorro

El `savings-calculator.ts` hace lo siguiente:

1. **Determina los próximos N pagos de salario** (lunes alternos desde fecha base)
2. **Para cada crédito activo**, determina en cuántos pagos de salario cae su próxima fecha límite
3. **Distribuye el monto a pagar** proporcionalmente entre los pagos de salario previos a esa fecha
4. **Suma todos los créditos** y genera una recomendación: "En tu próximo pago, aparta $X para créditos"
5. **Calcula dinero disponible:** Salario - Ahorro para créditos - Promedio gastos fijos

---

## Dashboard — Secciones

1. **Header:** Próximo pago de salario + días restantes + monto
2. **Card: Recomendación de ahorro** — Cuánto apartar en el próximo pago (desglosado por crédito)
3. **Gráfica: Flujo de caja** — Barras por quincena: ingresos vs gastos vs comprometido a créditos
4. **Gráfica: Distribución de gastos** — Pastel por categoría del mes actual
5. **Cards: Créditos** — Progreso de cada crédito (barra), próxima fecha de pago, estado (al corriente / próximo / vencido)
6. **Tabla: Gastos recientes** — Últimos 10 gastos con origen (Telegram/Web)

---

## CRUD Gastos (`/gastos`)

- Tabla con filtros por fecha y categoría
- Formulario: descripción, monto, categoría, fecha (manual para correcciones)
- Editar y eliminar registros
- Los gastos de Telegram también aparecen aquí

## CRUD Créditos (`/creditos`)

- Formulario diferenciado por tipo (PRESTAMO vs TARJETA)
- Campos condicionales: fecha de corte solo visible para TARJETA
- Marcar crédito como pagado/inactivo sin borrar historial
- Editar saldo actual cuando se hace un pago

---

## Decisiones de Diseño

- **Sin autenticación:** App 100% local, sin login
- **Sin multiusuario:** Bot filtrado por chat_id único
- **Categorías fijas:** 6 categorías predefinidas, sin CRUD de categorías
- **Sin internacionalización:** Todo en español
- **Moneda:** MXN fijo, sin conversiones

---

## Fases de Implementación

1. Setup proyecto (Next.js + Prisma + PostgreSQL)
2. Schema DB + migraciones
3. CRUD Créditos (API + UI)
4. CRUD Gastos (API + UI)
5. Bot de Telegram (webhook + comandos)
6. Calculadora de ahorro (lógica financiera)
7. Dashboard + gráficas
8. Polish UI + ngrok setup guide
