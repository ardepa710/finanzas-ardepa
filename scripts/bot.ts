/**
 * FINANZAS ARDEPA — Bot Telegram en modo Polling
 *
 * Corre con: npm run bot
 * No requiere ngrok ni URL pública. Consulta Telegram directamente.
 *
 * Requisitos en .env.local:
 *   TELEGRAM_BOT_TOKEN=tu_token
 *   TELEGRAM_ALLOWED_CHAT_ID=tu_chat_id
 *   DATABASE_URL=postgresql://...
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Cargar .env.local (Next.js lo hace automático, aquí lo hacemos manual)
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config() // fallback a .env
}

import TelegramBot from 'node-telegram-bot-api'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { calcularResumenAhorro } from '../src/lib/savings-calculator'

// --- Setup Prisma ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// --- Setup Bot ---
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN no configurado en .env.local')
  process.exit(1)
}

if (!ALLOWED_CHAT_ID) {
  console.error('❌ TELEGRAM_ALLOWED_CHAT_ID no configurado en .env.local')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })

console.log('🤖 Bot FINANZAS ARDEPA iniciado en modo polling')
console.log(`🔐 Chat autorizado: ${ALLOWED_CHAT_ID}`)
console.log('⏳ Esperando mensajes...\n')

// --- Categorías ---
const CATEGORIAS_MAP: Record<string, string> = {
  comida: 'ALIMENTACION', alimentacion: 'ALIMENTACION', alimentos: 'ALIMENTACION',
  desayuno: 'ALIMENTACION', almuerzo: 'ALIMENTACION', cena: 'ALIMENTACION',
  transporte: 'TRANSPORTE', gasolina: 'TRANSPORTE', uber: 'TRANSPORTE',
  taxi: 'TRANSPORTE', camion: 'TRANSPORTE',
  entretenimiento: 'ENTRETENIMIENTO', ocio: 'ENTRETENIMIENTO', cine: 'ENTRETENIMIENTO',
  salud: 'SALUD', farmacia: 'SALUD', doctor: 'SALUD', medicina: 'SALUD',
  servicios: 'SERVICIOS', renta: 'SERVICIOS', luz: 'SERVICIOS',
  agua: 'SERVICIOS', internet: 'SERVICIOS', telefono: 'SERVICIOS',
  otros: 'OTROS',
}

function parseCategoria(texto: string): string {
  return CATEGORIAS_MAP[texto.toLowerCase()] ?? 'OTROS'
}

// --- Handler de mensajes ---
async function handleMessage(text: string): Promise<string> {
  const partes = text.trim().split(/\s+/)
  const comando = partes[0].toLowerCase()

  if (comando === '/gasto') {
    if (partes.length < 3) {
      return "❌ Formato: /gasto [categoría] [monto] [descripción]\nEjemplo: /gasto Comida 180 McDonald's"
    }
    const monto = parseFloat(partes[2])
    if (isNaN(monto) || monto <= 0) {
      return '❌ El monto debe ser un número positivo.\nEjemplo: /gasto Comida 180'
    }
    const categoriaTexto = partes[1]
    const descripcion = partes.slice(3).join(' ') || categoriaTexto
    const categoria = parseCategoria(categoriaTexto)

    await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        categoria: categoria as any,
        fuente: 'TELEGRAM',
      },
    })
    return `✅ Gasto registrado\n📁 ${categoria}\n💰 $${monto.toFixed(2)} MXN\n📝 ${descripcion}`
  }

  if (comando === '/resumen') {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({
      where: { fecha: { gte: hoy } },
      orderBy: { fecha: 'desc' },
    })
    if (gastos.length === 0) return '📊 Sin gastos registrados hoy.'
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    const lista = gastos.map(g => `• ${g.descripcion}: $${Number(g.monto).toFixed(2)}`).join('\n')
    return `📊 *Gastos de hoy*\n${lista}\n\n💰 *Total: $${total.toFixed(2)} MXN*`
  }

  if (comando === '/quincena') {
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    const gastos = await prisma.gasto.findMany({ where: { fecha: { gte: inicio } } })
    const total = gastos.reduce((s, g) => s + Number(g.monto), 0)
    return `📊 *Gastos del mes*\n💰 Total: *$${total.toFixed(2)} MXN*\n📝 ${gastos.length} registros`
  }

  if (comando === '/creditos') {
    const creditos = await prisma.credito.findMany({
      where: { activo: true },
      orderBy: { diaPago: 'asc' },
    })
    if (creditos.length === 0) return '💳 Sin créditos activos.'
    const lista = creditos.map(c =>
      `• *${c.nombre}*: $${Number(c.saldoActual).toLocaleString('es-MX')} (pago día ${c.diaPago})`
    ).join('\n')
    return `💳 *Créditos activos*\n${lista}`
  }

  if (comando === '/ahorro') {
    const [config, creditos] = await Promise.all([
      prisma.configuracionSalario.findFirst(),
      prisma.credito.findMany({ where: { activo: true } }),
    ])
    if (!config) return '⚙️ Sin configuración de salario.'
    if (creditos.length === 0) return '💳 Sin créditos activos para calcular ahorro.'

    const resumen = calcularResumenAhorro(
      creditos.map(c => ({ nombre: c.nombre, pagoMensual: Number(c.pagoMensual), diaPago: c.diaPago })),
      config.fechaBaseProximoPago,
      new Date(),
      Number(config.monto)
    )

    const desglose = resumen.desglose
      .filter(d => d.porPago[0] > 0)
      .map(d => `• ${d.nombre}: $${d.porPago[0].toFixed(2)}`)
      .join('\n')

    const fechaStr = resumen.proximaFechaPago.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    return `💰 *Recomendación de ahorro*\n` +
      `Próximo pago: *${fechaStr}* (en ${resumen.diasParaProximoPago} días)\n\n` +
      `${desglose || '(sin créditos próximos)'}\n\n` +
      `*Apartar: $${resumen.totalProximoPago.toFixed(2)}*\n` +
      `Disponible: $${resumen.salarioDisponible.toFixed(2)}`
  }

  if (comando === '/start' || comando === '/ayuda' || comando === '/help') {
    return `👋 *FINANZAS ARDEPA*\n\nComandos:\n\n` +
      `/gasto [cat] [monto] [desc] — Registrar gasto\n` +
      `/resumen — Gastos de hoy\n` +
      `/quincena — Gastos del mes\n` +
      `/creditos — Lista de créditos\n` +
      `/ahorro — Recomendación de ahorro quincenal\n\n` +
      `Categorías: Comida, Transporte, Entretenimiento, Salud, Servicios, Otros`
  }

  return '❓ Comando no reconocido. Escribe /ayuda para ver los comandos.'
}

// --- Listener principal ---
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text ?? ''

  // Seguridad: ignorar mensajes de otros usuarios
  if (String(chatId) !== ALLOWED_CHAT_ID) {
    console.log(`⚠️  Mensaje ignorado de chat_id: ${chatId}`)
    return
  }

  console.log(`📨 [${new Date().toLocaleTimeString('es-MX')}] ${text}`)

  try {
    const respuesta = await handleMessage(text)
    await bot.sendMessage(chatId, respuesta, { parse_mode: 'Markdown' })
    console.log(`✅ Respuesta enviada`)
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error)
    await bot.sendMessage(chatId, '❌ Error interno. Intenta de nuevo.')
  }
})

// --- Manejo de cierre limpio ---
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando bot...')
  bot.stopPolling()
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
})

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message)
})
