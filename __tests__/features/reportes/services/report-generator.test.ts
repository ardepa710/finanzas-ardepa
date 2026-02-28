/**
 * Tests for report generator service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Prisma with factory function to avoid hoisting issues
vi.mock('@/lib/prisma', () => ({
  prisma: {
    gasto: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    categoria: {
      findMany: vi.fn(),
    },
    ingresoManual: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    fuenteIngreso: {
      findMany: vi.fn(),
    },
    credito: {
      findMany: vi.fn(),
    },
  },
}))

// Now import the functions to test
import { prisma } from '@/lib/prisma'
import { generateGastosReport, generateIngresosReport, generateCashflowReport } from '@/features/reportes/services/report-generator'
import type { DateRange } from '@/features/reportes/services/report-generator'

const prismaMock = prisma as any

describe('report-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateGastosReport', () => {
    it('should generate report with correct totals and percentages', async () => {
      const range: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }

      // Mock gastos grouped by category (current period)
      prismaMock.gasto.groupBy.mockResolvedValueOnce([
        { categoriaId: 'cat1', _sum: { monto: 500 } },
        { categoriaId: 'cat2', _sum: { monto: 300 } },
        { categoriaId: 'cat3', _sum: { monto: 200 } },
      ] as any)

      // Mock categorias
      prismaMock.categoria.findMany.mockResolvedValueOnce([
        { id: 'cat1', nombre: 'Comida' },
        { id: 'cat2', nombre: 'Transporte' },
        { id: 'cat3', nombre: 'Entretenimiento' },
      ] as any)

      // Mock previous period for trend
      prismaMock.gasto.groupBy.mockResolvedValueOnce([
        { categoriaId: 'cat1', _sum: { monto: 450 } },
        { categoriaId: 'cat2', _sum: { monto: 350 } },
        { categoriaId: 'cat3', _sum: { monto: 200 } },
      ] as any)

      const report = await generateGastosReport(range)

      expect(report.periodo).toEqual(range)
      expect(report.total).toBe(1000)
      expect(report.promedio).toBeCloseTo(1000 / 28, 1) // 28 days in Feb 2026

      expect(report.porCategoria).toHaveLength(3)
      expect(report.porCategoria[0]).toMatchObject({
        categoria: 'Comida',
        monto: 500,
        porcentaje: 50,
      })
      expect(report.porCategoria[0].tendencia).toBe('subida') // 500 vs 450 > 10%

      expect(report.porCategoria[1]).toMatchObject({
        categoria: 'Transporte',
        monto: 300,
        porcentaje: 30,
      })
      expect(report.porCategoria[1].tendencia).toBe('bajada') // 300 vs 350 > 10% decrease

      expect(report.tendenciaGeneral).toBe('estable') // 1000 vs 1000 (total)
    })

    it('should handle empty date range gracefully', async () => {
      const range: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }

      prismaMock.gasto.groupBy.mockResolvedValueOnce([])
      prismaMock.categoria.findMany.mockResolvedValueOnce([])
      prismaMock.gasto.groupBy.mockResolvedValueOnce([])

      const report = await generateGastosReport(range)

      expect(report.total).toBe(0)
      expect(report.promedio).toBe(0)
      expect(report.porCategoria).toEqual([])
      expect(report.tendenciaGeneral).toBe('estable')
    })
  })

  describe('generateIngresosReport', () => {
    it('should calculate income vs expenses and savings rate', async () => {
      const range: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }

      // Mock ingresos aggregate
      prismaMock.ingresoManual.aggregate.mockResolvedValueOnce({
        _sum: { monto: 5000 },
      } as any)

      // Mock gastos aggregate
      prismaMock.gasto.aggregate.mockResolvedValueOnce({
        _sum: { monto: 3000 },
      } as any)

      // Mock ingresos by fuente
      prismaMock.ingresoManual.groupBy.mockResolvedValueOnce([
        { fuenteId: 'fuente1', _sum: { monto: 5000 } },
      ] as any)

      // Mock fuentes
      prismaMock.fuenteIngreso.findMany.mockResolvedValueOnce([
        { id: 'fuente1', nombre: 'Salario' },
      ] as any)

      // Mock gastos by category
      prismaMock.gasto.groupBy.mockResolvedValueOnce([
        { categoriaId: 'cat1', _sum: { monto: 3000 } },
      ] as any)

      // Mock categorias
      prismaMock.categoria.findMany.mockResolvedValueOnce([
        { id: 'cat1', nombre: 'Comida' },
      ] as any)

      const report = await generateIngresosReport(range)

      expect(report.totalIngresos).toBe(5000)
      expect(report.totalGastos).toBe(3000)
      expect(report.balance).toBe(2000)
      expect(report.tasaAhorro).toBe(40) // (5000 - 3000) / 5000 * 100
    })

    it('should handle zero income correctly', async () => {
      const range: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }

      prismaMock.ingresoManual.aggregate.mockResolvedValueOnce({
        _sum: { monto: null },
      } as any)

      prismaMock.gasto.aggregate.mockResolvedValueOnce({
        _sum: { monto: 1000 },
      } as any)

      prismaMock.ingresoManual.groupBy.mockResolvedValueOnce([])
      prismaMock.fuenteIngreso.findMany.mockResolvedValueOnce([])
      prismaMock.gasto.groupBy.mockResolvedValueOnce([
        { categoriaId: 'cat1', _sum: { monto: 1000 } },
      ] as any)
      prismaMock.categoria.findMany.mockResolvedValueOnce([
        { id: 'cat1', nombre: 'Comida' },
      ] as any)

      const report = await generateIngresosReport(range)

      expect(report.totalIngresos).toBe(0)
      expect(report.totalGastos).toBe(1000)
      expect(report.balance).toBe(-1000)
      expect(report.tasaAhorro).toBe(0)
    })
  })

  describe('generateCashflowReport', () => {
    it('should group by monthly periods correctly', async () => {
      // Mock data with multiple months
      prismaMock.ingresoManual.findMany.mockResolvedValueOnce([
        { fecha: new Date('2026-01-15'), monto: 2000 },
        { fecha: new Date('2026-02-15'), monto: 2500 },
      ] as any)

      prismaMock.gasto.findMany.mockResolvedValueOnce([
        { fecha: new Date('2026-01-10'), monto: 1000 },
        { fecha: new Date('2026-02-10'), monto: 1200 },
      ] as any)

      const report = await generateCashflowReport('mensual')

      expect(report.periodos).toHaveLength(2)
      expect(report.periodos[0]).toMatchObject({
        ingresos: 2000,
        gastos: 1000,
        neto: 1000,
      })
      expect(report.periodos[1]).toMatchObject({
        ingresos: 2500,
        gastos: 1200,
        neto: 1300,
      })
    })
  })
})
