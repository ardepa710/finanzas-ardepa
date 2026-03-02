# Telegram Bot

The bot provides a quick interface for logging expenses and checking financial summaries without opening the web app.

## Setup

See [SETUP.md](SETUP.md) for full setup instructions.

Two modes are available:
- **Webhook** (via `/api/telegram`) — requires ngrok to expose a public URL
- **Polling** (via `npm run bot`) — standalone script, no public URL needed

The `TELEGRAM_ALLOWED_CHAT_ID` variable restricts the bot to a single authorized user. Messages from any other chat ID are silently ignored.

---

## Commands

| Command | Example | Description |
|---------|---------|-------------|
| `/gasto [cat] [monto] [desc]` | `/gasto comida 150 tacos` | Register an expense |
| `/resumen` | `/resumen` | Today's expenses summary |
| `/quincena` | `/quincena` | Current month expenses total |
| `/creditos` | `/creditos` | List active credits with balances |
| `/ahorro` | `/ahorro` | Savings recommendation for next paycheck |
| `/ayuda` | `/ayuda` | List all available commands |
| `/start` | `/start` | Same as `/ayuda` |
| `/help` | `/help` | Same as `/ayuda` |

---

## /gasto — Register Expense

**Format:** `/gasto [category] [amount] [description]`

The category argument accepts natural language words that get mapped to standard categories. The description is optional — if omitted, the category word is used.

**Examples:**
```
/gasto comida 180 McDonald's
/gasto uber 85
/gasto farmacia 320 antibiotico
/gasto renta 8500
```

---

## Category Shortcuts

| Words Accepted | Maps To |
|---------------|---------|
| comida, alimentacion, alimentos, desayuno, almuerzo, cena | ALIMENTACION |
| transporte, gasolina, uber, taxi, camion | TRANSPORTE |
| entretenimiento, ocio, cine | ENTRETENIMIENTO |
| salud, farmacia, doctor, medicina | SALUD |
| servicios, renta, luz, agua, internet, telefono | SERVICIOS |
| otros | OTROS |

Any word not in the list defaults to **OTROS**.

Category matching is **case-insensitive**: `Comida`, `COMIDA`, and `comida` all work.

---

## /resumen — Today's Summary

Lists all expenses registered today with individual amounts and a total.

**Example response:**
```
📊 Gastos de hoy
• McDonald's: $180.00
• Uber: $85.00

💰 Total: $265.00 MXN
```

---

## /quincena — Monthly Expenses

Returns the total number of expense records and sum for the current calendar month (from the 1st).

**Example response:**
```
📊 Gastos del mes
💰 Total: $4,250.00 MXN
📝 23 registros
```

---

## /creditos — Active Credits

Lists all active credit accounts with current balance and payment day.

**Example response:**
```
💳 Créditos activos
• Tarjeta Bancomer: $35,000 (pago día 15)
• Préstamo Auto: $120,000 (pago día 1)
```

---

## /ahorro — Savings Recommendation

Calculates how much to set aside from the next paycheck to cover upcoming credit payments. Uses the same Smart Savings Calculator as the web dashboard.

Shows: next paycheck date, income amount, per-credit breakdown, total to save, and remaining available.

**Example response:**
```
💰 Recomendación de ahorro
Próximo cobro (Salario Solytics): lunes 15 de marzo

• Tarjeta Bancomer: $1,500.00
• Préstamo Auto: $2,800.00

Apartar: $4,300.00
Disponible: $17,700.00
```

---

## Security

- Only one chat ID is authorized (`TELEGRAM_ALLOWED_CHAT_ID`)
- Messages from unauthorized chat IDs are ignored without response
- The bot token is stored in `.env.local` and never committed to version control
