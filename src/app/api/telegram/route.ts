import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramMessage } from '@/lib/telegram-handler'

const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId: number = message.chat?.id
    const text: string = message.text ?? ''

    // Security: only respond to the authorized chat_id
    if (!ALLOWED_CHAT_ID || String(chatId) !== ALLOWED_CHAT_ID) {
      console.warn(`Unauthorized Telegram message from chat_id: ${chatId}`)
      return NextResponse.json({ ok: true })
    }

    const respuesta = await handleTelegramMessage(text)
    await sendMessage(chatId, respuesta)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}
