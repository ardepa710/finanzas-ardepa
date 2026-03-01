import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generarInsights, buildContexto } from '../insight-generator'
import { prisma } from '@/lib/prisma'

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: JSON.stringify([
    {
      tipo: 'ALERTA',
      titulo: 'Deuda alta',
      descripcion: 'Tu DTI es 45%.',
      accion: 'Aumenta el pago mínimo',
      prioridad: 5,
      datos: { dti: 45 }
    }
  ])}],
  usage: { input_tokens: 500, output_tokens: 200 }
})

vi.mock('@anthropic-ai/sdk', () => ({
  default: function MockAnthropic() {
    return {
      messages: { create: mockCreate }
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fuenteIngreso: { findMany: vi.fn() },
    gasto: { findMany: vi.fn() },
    credito: { findMany: vi.fn() },
    meta: { findMany: vi.fn() },
    insight: { create: vi.fn(), findMany: vi.fn() },
  }
}))

describe('buildContexto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns zero context when DB is empty', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const ctx = await buildContexto()

    expect(ctx.ingresoMensual).toBe(0)
    expect(ctx.deudaTotal).toBe(0)
    expect(ctx.metasActivas).toBe(0)
  })

  it('normalizes QUINCENAL income to monthly (×2)', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: { toNumber: () => 10000 }, frecuencia: 'QUINCENAL', activo: true } as any
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const ctx = await buildContexto()

    expect(ctx.ingresoMensual).toBe(20000)
  })

  it('normalizes SEMANAL income to monthly (×4.33)', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: { toNumber: () => 1000 }, frecuencia: 'SEMANAL', activo: true } as any
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const ctx = await buildContexto()

    expect(ctx.ingresoMensual).toBe(4330)
  })
})

describe('generarInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('calls Claude API and returns parsed insights', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.insight.create).mockResolvedValue({} as any)

    const insights = await generarInsights()

    expect(Array.isArray(insights)).toBe(true)
    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]).toHaveProperty('titulo')
    expect(insights[0]).toHaveProperty('tipo')
  })

  it('returns empty array when ANTHROPIC_API_KEY is missing', async () => {
    const original = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])

    const insights = await generarInsights()
    expect(insights).toEqual([])
    process.env.ANTHROPIC_API_KEY = original
  })
})
