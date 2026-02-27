# FINANZAS ARDEPA

App de finanzas personales local — gestión de créditos, gastos diarios vía Telegram y dashboard financiero inteligente.

**Stack:** Next.js 15 · Tailwind CSS v4 · Prisma 7 · PostgreSQL · Recharts · Telegram Bot API

---

## Requisitos previos

- Node.js 20+
- PostgreSQL local corriendo en puerto 5432
- Bot de Telegram creado via [@BotFather](https://t.me/BotFather)
- [ngrok](https://ngrok.com) para exponer el webhook

---

## Setup inicial

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd finanzas-ardepa
npm install
```

### 2. Crear base de datos PostgreSQL

```bash
# Ajusta usuario y contraseña según tu instalación
psql -U postgres -c "CREATE DATABASE finanzas_ardepa;"
```

### 3. Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://ktcadmin:ktcpass123@127.0.0.1:5432/finanzas_ardepa"
TELEGRAM_BOT_TOKEN="tu_token_de_botfather"
TELEGRAM_ALLOWED_CHAT_ID="tu_chat_id"
```

**¿Cómo obtener tu `TELEGRAM_ALLOWED_CHAT_ID`?**
Habla con [@userinfobot](https://t.me/userinfobot) en Telegram — te responde con tu chat_id.

Crear también `.env` (para Prisma CLI):
```env
DATABASE_URL="postgresql://ktcadmin:ktcpass123@127.0.0.1:5432/finanzas_ardepa"
```

### 4. Migrar base de datos

```bash
npx prisma migrate dev
npx prisma db seed   # Carga salario base $22,000 MXN
```

### 5. Correr la app

```bash
npm run dev
```

Abrir: [http://localhost:3000](http://localhost:3000)

---

## Activar bot de Telegram

El bot funciona via webhook — necesita que tu servidor local sea accesible desde internet.

### Terminal 1 — App
```bash
npm run dev
```

### Terminal 2 — Túnel ngrok
```bash
ngrok http 3000
```

Copia la URL de ngrok (ej: `https://abc123.ngrok-free.app`).

### Registrar webhook con Telegram
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok-free.app/api/telegram"}'
```

Respuesta esperada: `{"ok":true,"result":true}`

> **Nota:** ngrok genera una URL nueva cada vez que lo reinicias. Deberás re-registrar el webhook cuando cambies de URL.

---

## Comandos del bot

| Comando | Ejemplo | Descripción |
|---------|---------|-------------|
| `/gasto [cat] [monto] [desc]` | `/gasto Comida 180 Tacos` | Registra un gasto |
| `/resumen` | `/resumen` | Gastos del día actual |
| `/quincena` | `/quincena` | Gastos y total del mes |
| `/creditos` | `/creditos` | Lista créditos activos con saldos |
| `/ahorro` | `/ahorro` | Cuánto apartar en el próximo pago |
| `/ayuda` | `/ayuda` | Lista de comandos |

### Categorías válidas

| Palabras aceptadas | Categoría |
|-------------------|-----------|
| comida, alimentacion, desayuno, almuerzo, cena | ALIMENTACION |
| transporte, gasolina, uber, taxi, camion | TRANSPORTE |
| entretenimiento, ocio, cine | ENTRETENIMIENTO |
| salud, farmacia, doctor, medicina | SALUD |
| servicios, renta, luz, agua, internet, telefono | SERVICIOS |
| otros | OTROS |

---

## Lógica financiera — Calculadora de ahorro

La app calcula automáticamente cuánto apartar de cada quincena para cubrir tus créditos:

1. Detecta tu próxima fecha de cobro (lunes alterno desde fecha base)
2. Para cada crédito, identifica cuántos cobros caen antes de su fecha límite
3. Distribuye el monto a pagar equitativamente entre esos cobros
4. Muestra el desglose en el dashboard y via `/ahorro`

**Ejemplo:** Si tienes 2 quincenas antes de pagar una tarjeta de $3,000, te recomienda apartar $1,500 en cada una.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Layout con sidebar
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── gastos/page.tsx    # CRUD gastos
│   │   └── creditos/page.tsx  # CRUD créditos
│   └── api/
│       ├── telegram/          # Webhook bot
│       ├── gastos/            # REST API gastos
│       ├── creditos/          # REST API créditos
│       └── dashboard/         # Endpoint resumen
├── components/
│   ├── Sidebar.tsx
│   ├── creditos/CreditoForm.tsx
│   └── dashboard/
│       ├── SavingsCard.tsx
│       └── ExpensesPieChart.tsx
└── lib/
    ├── prisma.ts              # Singleton Prisma
    ├── savings-calculator.ts  # Lógica financiera (TDD)
    └── telegram-handler.ts    # Parser comandos bot
```

---

## Tests

```bash
npm test          # Correr todos los tests
npm run test:watch  # Modo watch
```

Los tests cubren la calculadora de ahorro (`src/lib/savings-calculator.test.ts`).

---

## Notas de implementación

- **Prisma 7.4.1** — Usa `prisma.config.ts` y `@prisma/adapter-pg` (arquitectura diferente a v6)
- **PostgreSQL user** — Se usa `ktcadmin` (usuario existente en el sistema). Ajusta en `.env` y `.env.local`
- **Moneda** — MXN fijo, sin conversiones
- **Sin autenticación** — App 100% local
- **Soft delete** — Los créditos se desactivan, no se borran (preserva historial)
