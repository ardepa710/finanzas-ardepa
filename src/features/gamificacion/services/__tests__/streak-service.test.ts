import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkGastosStreak, getStreaks } from '../streak-service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    streak: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    }
  }
}))

describe('checkGastosStreak', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts streak at 1 when no prior activity', async () => {
    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 0, rachaMayor: 0, ultimaActividad: null, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(1)
    expect(result.actualizado).toBe(true)
  })

  it('increments streak when last activity was yesterday', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    yesterday.setUTCHours(12, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 5, rachaMayor: 5, ultimaActividad: yesterday, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(6)
    expect(result.actualizado).toBe(true)
  })

  it('resets streak when last activity was 2+ days ago', async () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 10, rachaMayor: 10, ultimaActividad: twoDaysAgo, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(1)
  })

  it('does not update when activity already registered today', async () => {
    const today = new Date()
    today.setUTCHours(8, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 3, rachaMayor: 3, ultimaActividad: today, activo: true
    } as any)

    const result = await checkGastosStreak()

    expect(result.actualizado).toBe(false)
    expect(result.nuevaRacha).toBe(3)
  })

  it('updates rachaMayor when current streak exceeds it', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    yesterday.setUTCHours(12, 0, 0, 0)

    vi.mocked(prisma.streak.findFirst).mockResolvedValue({
      id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 7, rachaMayor: 7, ultimaActividad: yesterday, activo: true
    } as any)
    vi.mocked(prisma.streak.update).mockResolvedValue({} as any)

    const result = await checkGastosStreak()

    expect(result.nuevaRacha).toBe(8)
    expect(vi.mocked(prisma.streak.update).mock.calls[0][0].data.rachaMayor).toBe(8)
  })
})

describe('getStreaks', () => {
  it('returns active streaks', async () => {
    const mockStreaks = [
      { id: '1', tipo: 'GASTOS_DIARIOS', rachaActual: 3, rachaMayor: 5, ultimaActividad: null, activo: true }
    ]
    vi.mocked(prisma.streak.findMany).mockResolvedValue(mockStreaks as any)

    const result = await getStreaks()

    expect(vi.mocked(prisma.streak.findMany).mock.calls[0][0]).toEqual({ where: { activo: true } })
    expect(result).toEqual(mockStreaks)
  })
})
