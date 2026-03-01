import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import type { ContextoFinanciero, InsightGenerado } from '../types'

function toNum(v: any): number {
  return typeof v === 'object' && v !== null && 'toNumber' in v ? v.toNumber() : Number(v)
}

export async function buildContexto(): Promise<ContextoFinanciero> {
  const [fuentes, gastos90d, creditos, metas] = await Promise.all([
    prisma.fuenteIngreso.findMany({ where: { activo: true } }),
    prisma.gasto.findMany({
      where: { fecha: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.credito.findMany({ where: { activo: true } }),
    prisma.meta.findMany({ where: { activo: true } }),
  ])

  const ingresoMensual = fuentes.reduce((acc: number, f: any) => {
    const monto = toNum(f.monto)
    const factor = f.frecuencia === 'MENSUAL' ? 1 : f.frecuencia === 'QUINCENAL' ? 2 : 4.33
    return acc + monto * factor
  }, 0)

  const gastoPromedio90d = gastos90d.length > 0
    ? gastos90d.reduce((acc: number, g: any) => acc + toNum(g.monto), 0) / 3
    : 0

  const deudaTotal = creditos.reduce((acc: number, c: any) => acc + toNum(c.saldoActual), 0)
  const dti = ingresoMensual > 0
    ? (creditos.reduce((acc: number, c: any) => acc + toNum(c.pagoMensual), 0) / ingresoMensual) * 100
    : 0
  const savingsRate = ingresoMensual > 0
    ? Math.max(0, ((ingresoMensual - gastoPromedio90d) / ingresoMensual) * 100)
    : 0

  const metasActivas = (metas as any[]).filter((m: any) => m.estado === 'EN_PROGRESO').length
  const metasProgreso = metasActivas > 0
    ? (metas as any[]).filter((m: any) => m.estado === 'EN_PROGRESO')
        .reduce((acc: number, m: any) => acc + toNum(m.porcentajeProgreso), 0) / metasActivas
    : 0

  return {
    ingresoMensual: Math.round(ingresoMensual),
    gastoPromedio90d: Math.round(gastoPromedio90d),
    deudaTotal: Math.round(deudaTotal),
    dti: Math.round(dti * 10) / 10,
    savingsRate: Math.round(savingsRate * 10) / 10,
    metasActivas,
    metasProgreso: Math.round(metasProgreso),
    cashflowProximo: Math.round(ingresoMensual - gastoPromedio90d),
  }
}

const SYSTEM_PROMPT = `Eres un asesor financiero personal analizando los datos reales de un usuario mexicano.
Analiza el contexto financiero y genera entre 4 y 6 insights accionables.
IMPORTANTE: Responde ÚNICAMENTE con un JSON array válido, sin texto adicional, sin markdown, sin explicaciones.
Cada insight debe tener exactamente: tipo, titulo, descripcion, accion, prioridad (1-5, donde 5 es más urgente), datos.
tipos válidos: ALERTA, OPORTUNIDAD, LOGRO, SUGERENCIA`

export async function generarInsights(): Promise<InsightGenerado[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []

  const ctx = await buildContexto()

  const userPrompt = `Contexto financiero del usuario (MXN):
- Ingreso mensual: $${ctx.ingresoMensual.toLocaleString('es-MX')}
- Gasto promedio mensual (90 días): $${ctx.gastoPromedio90d.toLocaleString('es-MX')}
- Deuda total: $${ctx.deudaTotal.toLocaleString('es-MX')}
- Ratio deuda/ingreso (DTI): ${ctx.dti}%
- Tasa de ahorro: ${ctx.savingsRate}%
- Metas activas: ${ctx.metasActivas} (progreso promedio: ${ctx.metasProgreso}%)
- Cashflow próximo mes estimado: $${ctx.cashflowProximo.toLocaleString('es-MX')}

Genera insights específicos basados en estos números reales.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: SYSTEM_PROMPT,
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const insights: InsightGenerado[] = JSON.parse(text)

    // Persist top 4 insights to DB for history
    await Promise.all(insights.slice(0, 4).map((ins: InsightGenerado) =>
      prisma.insight.create({
        data: {
          tipo: ins.tipo === 'ALERTA' ? 'GASTOS' : ins.tipo === 'OPORTUNIDAD' ? 'AHORRO' : 'GENERAL',
          titulo: ins.titulo,
          contenido: `${ins.descripcion} ${ins.accion}`,
          prioridad: ins.prioridad >= 4 ? 'URGENTE' : ins.prioridad >= 3 ? 'ALTA' : 'NORMAL',
          modelo: 'claude-haiku-4-5-20251001',
          tokens: (message.usage.input_tokens + message.usage.output_tokens),
        }
      })
    ))

    return insights.sort((a, b) => b.prioridad - a.prioridad)
  } catch {
    return []
  }
}
