import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkLogros } from '../logros-checker'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    logro: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    gasto: { count: vi.fn() },
    credito: { findMany: vi.fn() },
    meta: { findMany: vi.fn() },
    inversion: { findMany: vi.fn() },
    nivelUsuario: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  }
}))

const makeLogro = (codigo: string, xp = 10) => ({
  id: `id-${codigo}`,
  codigo,
  xp,
  desbloqueado: false,
  nombre: codigo,
  descripcion: '',
  icono: '📝',
  categoria: 'GASTO' as const,
  fechaLogro: null,
  createdAt: new Date(),
})

describe('checkLogros', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty result when no pending logros', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.count).mockResolvedValue(0)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({
      id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100
    } as any)

    const result = await checkLogros()

    expect(result.nuevos).toHaveLength(0)
    expect(result.xpGanado).toBe(0)
  })

  it('unlocks PRIMER_GASTO when gasto count >= 1', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([makeLogro('PRIMER_GASTO', 10)] as any)
    vi.mocked(prisma.gasto.count).mockResolvedValue(1)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.logro.update).mockResolvedValue({} as any)
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({
      id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100
    } as any)
    vi.mocked(prisma.nivelUsuario.update).mockResolvedValue({} as any)

    const result = await checkLogros()

    expect(result.nuevos).toHaveLength(1)
    expect(result.nuevos[0].codigo).toBe('PRIMER_GASTO')
    expect(result.xpGanado).toBe(10)
  })

  it('does NOT unlock PRIMER_GASTO when gasto count is 0', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([makeLogro('PRIMER_GASTO', 10)] as any)
    vi.mocked(prisma.gasto.count).mockResolvedValue(0)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({
      id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100
    } as any)

    const result = await checkLogros()

    expect(result.nuevos).toHaveLength(0)
  })

  it('unlocks DEUDA_PAGADA when a credito has saldoActual === 0', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([makeLogro('DEUDA_PAGADA', 300)] as any)
    vi.mocked(prisma.gasto.count).mockResolvedValue(0)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: { toNumber: () => 0 }, montoTotal: { toNumber: () => 5000 }, activo: true }
    ] as any)
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.logro.update).mockResolvedValue({} as any)
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({
      id: '1', xpTotal: 0, nivelActual: 1, xpSiguiente: 100
    } as any)
    vi.mocked(prisma.nivelUsuario.update).mockResolvedValue({} as any)

    const result = await checkLogros()

    expect(result.nuevos[0].codigo).toBe('DEUDA_PAGADA')
    expect(result.xpGanado).toBe(300)
  })

  it('updates nivelUsuario xpTotal when XP is gained', async () => {
    vi.mocked(prisma.logro.findMany).mockResolvedValue([makeLogro('PRIMER_GASTO', 10)] as any)
    vi.mocked(prisma.gasto.count).mockResolvedValue(5)
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.meta.findMany).mockResolvedValue([])
    vi.mocked(prisma.inversion.findMany).mockResolvedValue([])
    vi.mocked(prisma.logro.update).mockResolvedValue({} as any)
    vi.mocked(prisma.nivelUsuario.findFirst).mockResolvedValue({
      id: '1', xpTotal: 50, nivelActual: 1, xpSiguiente: 100
    } as any)
    vi.mocked(prisma.nivelUsuario.update).mockResolvedValue({} as any)

    await checkLogros()

    expect(vi.mocked(prisma.nivelUsuario.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '1' },
        data: expect.objectContaining({ xpTotal: 60 }),
      })
    )
  })
})
