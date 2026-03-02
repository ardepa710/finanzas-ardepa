# Setup Guide

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** running locally on port 5432
- **ngrok** — only needed for Telegram webhook mode (optional if using polling mode)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An Anthropic API key (for AI insights feature)

---

## 1. Clone the Repository

```bash
git clone https://github.com/ardepa710/finanzas-ardepa.git
cd finanzas-ardepa
```

---

## 2. Create the PostgreSQL Database

```bash
createdb finanzas_ardepa
# or using psql:
psql -U postgres -h localhost -c "CREATE DATABASE finanzas_ardepa;"
```

---

## 3. Environment Variables

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finanzas_ardepa"
ANTHROPIC_API_KEY="sk-ant-..."
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_ALLOWED_CHAT_ID="your_personal_chat_id"
```

Also create `.env` (required by Prisma CLI):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finanzas_ardepa"
```

**How to get your `TELEGRAM_ALLOWED_CHAT_ID`:** Talk to [@userinfobot](https://t.me/userinfobot) on Telegram — it replies with your numeric chat ID.

**How to get your `ANTHROPIC_API_KEY`:** Create an account at [console.anthropic.com](https://console.anthropic.com) and generate an API key.

---

## 4. Install Dependencies

```bash
npm install
```

---

## 5. Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all tables in your PostgreSQL database.

---

## 6. Seed Base Data

```bash
npx prisma db seed
```

This loads:
- Default expense categories (ALIMENTACION, TRANSPORTE, ENTRETENIMIENTO, SALUD, SERVICIOS, OTROS)
- A sample income source (configurable)

---

## 7. Seed Gamification Data

```bash
npx tsx prisma/gamificacion-seed.ts
```

This loads:
- Achievement definitions (Logros) with XP values
- Streak tracking records
- Initial user level (Nivel 1)

---

## 8. Start the Development Server

```bash
npm run dev
```

App is available at **http://localhost:3000** (or http://192.168.1.48:3000 on local network).

---

## 9. Telegram Bot Setup

There are two modes for running the Telegram bot:

### Mode A: Webhook (via Next.js API route)

Requires your local server to be publicly accessible via ngrok.

**Terminal 1 — App:**
```bash
npm run dev
```

**Terminal 2 — ngrok tunnel:**
```bash
ngrok http 3000
```

Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`).

**Register the webhook with Telegram:**
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok-free.app/api/telegram"}'
```

Expected response: `{"ok":true,"result":true}`

> Note: ngrok generates a new URL every restart. Re-register the webhook after each restart.

### Mode B: Polling (standalone script)

Does not require ngrok. Runs as a separate process.

```bash
npm run bot
```

This starts `scripts/bot.ts` in long-polling mode — it connects directly to Telegram's API without exposing a public endpoint.

---

## 10. Verify Everything Works

1. Open http://localhost:3000 — you should see the main dashboard
2. Send `/ayuda` to your Telegram bot — it should respond with the command list
3. Run the test suite: `npm test` — all tests should pass

---

## Docker (Alternative)

A `docker-compose.yml` is included that runs the app + PostgreSQL:

```bash
docker compose up -d --build
```

Services:
- `web` — Next.js app on port 3000
- `db` — PostgreSQL 15 on port 5432

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `P1001: Can't reach database` | Check PostgreSQL is running: `pg_isready -h localhost` |
| `Peer authentication failed` | Use `-h localhost` (TCP) not the default Unix socket |
| `prisma.newModel is undefined` | Restart dev server after schema changes |
| `stale .next/dev/lock` | Run `pkill -9 -f "next" && rm -f .next/dev/lock` |
| Telegram bot not responding | Verify `TELEGRAM_ALLOWED_CHAT_ID` matches your actual chat ID |
| ngrok URL expired | Re-register webhook with new ngrok URL |
