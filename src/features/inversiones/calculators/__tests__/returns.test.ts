import { describe, it, expect } from 'vitest'
import {
  calculateRendimientoTotal,
  calculateRendimientoPct,
  calculateCAGR,
  rankInvestments,
} from '../returns'
import type { InversionRanked } from '../../types'
import { Decimal } from '@prisma/client/runtime/client'

describe('Investment Returns Calculator', () => {
  describe('calculateRendimientoTotal', () => {
    it('calculates positive absolute return', () => {
      expect(calculateRendimientoTotal(15000, 10000)).toBe(5000)
    })

    it('calculates negative absolute return', () => {
      expect(calculateRendimientoTotal(8000, 10000)).toBe(-2000)
    })

    it('handles zero investment edge case', () => {
      expect(calculateRendimientoTotal(5000, 0)).toBe(5000)
    })

    it('handles decimal precision correctly', () => {
      expect(calculateRendimientoTotal(10000.55, 9999.45)).toBeCloseTo(1.1, 2)
    })

    it('handles very large amounts', () => {
      expect(calculateRendimientoTotal(1000000000, 500000000)).toBe(500000000)
    })

    it('handles very small amounts', () => {
      expect(calculateRendimientoTotal(0.02, 0.01)).toBeCloseTo(0.01, 4)
    })
  })

  describe('calculateRendimientoPct', () => {
    it('calculates positive percentage return', () => {
      expect(calculateRendimientoPct(15000, 10000)).toBeCloseTo(50, 2)
    })

    it('calculates negative percentage return', () => {
      expect(calculateRendimientoPct(8000, 10000)).toBeCloseTo(-20, 2)
    })

    it('handles zero investment edge case', () => {
      expect(calculateRendimientoPct(5000, 0)).toBe(0)
    })

    it('calculates 100% return', () => {
      expect(calculateRendimientoPct(20000, 10000)).toBeCloseTo(100, 2)
    })

    it('calculates -100% return (total loss)', () => {
      expect(calculateRendimientoPct(0, 10000)).toBeCloseTo(-100, 2)
    })

    it('handles decimal precision correctly', () => {
      expect(calculateRendimientoPct(10500, 10000)).toBeCloseTo(5, 2)
    })

    it('handles very small percentage changes', () => {
      expect(calculateRendimientoPct(10000.01, 10000)).toBeCloseTo(0.0001, 4)
    })
  })

  describe('calculateCAGR', () => {
    it('calculates CAGR for 1 year', () => {
      const cagr = calculateCAGR(11000, 10000, 1)
      expect(cagr).toBeCloseTo(10, 2)
    })

    it('calculates CAGR for 5 years', () => {
      const cagr = calculateCAGR(16105.1, 10000, 5)
      expect(cagr).toBeCloseTo(10, 1)
    })

    it('calculates negative CAGR', () => {
      const cagr = calculateCAGR(8000, 10000, 2)
      expect(cagr).toBeLessThan(0)
    })

    it('handles zero years edge case', () => {
      expect(calculateCAGR(11000, 10000, 0)).toBe(0)
    })

    it('handles valorActual = montoInvertido (0% return)', () => {
      expect(calculateCAGR(10000, 10000, 5)).toBeCloseTo(0, 2)
    })

    it('handles zero investment edge case', () => {
      expect(calculateCAGR(5000, 0, 3)).toBe(0)
    })

    it('handles negative montoInvertido (short selling)', () => {
      const cagr = calculateCAGR(5000, -10000, 2)
      expect(typeof cagr).toBe('number')
    })

    it('calculates very high CAGR', () => {
      const cagr = calculateCAGR(100000, 10000, 3)
      expect(cagr).toBeGreaterThan(100)
    })
  })

  describe('rankInvestments', () => {
    const mockInversiones: InversionRanked[] = [
      {
        id: '1',
        activoId: 'a1',
        montoInvertido: new Decimal(10000),
        fechaInversion: new Date('2020-01-01'),
        valorActual: new Decimal(15000),
        rendimientoTotal: new Decimal(5000),
        rendimientoPct: new Decimal(50),
        dividendos: new Decimal(0),
        intereses: new Decimal(0),
        descripcion: null,
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activo: {
          id: 'a1',
          nombre: 'Stock A',
          tipo: 'INVERSION',
          valorActual: new Decimal(15000),
          valorCompra: null,
          fechaAdquisicion: null,
          descripcion: null,
          liquidez: 'ALTA',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        rank: 0,
      },
      {
        id: '2',
        activoId: 'a2',
        montoInvertido: new Decimal(5000),
        fechaInversion: new Date('2020-01-01'),
        valorActual: new Decimal(3000),
        rendimientoTotal: new Decimal(-2000),
        rendimientoPct: new Decimal(-40),
        dividendos: new Decimal(0),
        intereses: new Decimal(0),
        descripcion: null,
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activo: {
          id: 'a2',
          nombre: 'Stock B',
          tipo: 'INVERSION',
          valorActual: new Decimal(3000),
          valorCompra: null,
          fechaAdquisicion: null,
          descripcion: null,
          liquidez: 'ALTA',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        rank: 0,
      },
      {
        id: '3',
        activoId: 'a3',
        montoInvertido: new Decimal(8000),
        fechaInversion: new Date('2020-01-01'),
        valorActual: new Decimal(9600),
        rendimientoTotal: new Decimal(1600),
        rendimientoPct: new Decimal(20),
        dividendos: new Decimal(0),
        intereses: new Decimal(0),
        descripcion: null,
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activo: {
          id: 'a3',
          nombre: 'Stock C',
          tipo: 'INVERSION',
          valorActual: new Decimal(9600),
          valorCompra: null,
          fechaAdquisicion: null,
          descripcion: null,
          liquidez: 'ALTA',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        rank: 0,
      },
    ]

    it('ranks investments from best to worst', () => {
      const ranked = rankInvestments(mockInversiones)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[0].activo.nombre).toBe('Stock A')
      expect(Number(ranked[0].rendimientoPct)).toBe(50)

      expect(ranked[1].rank).toBe(2)
      expect(ranked[1].activo.nombre).toBe('Stock C')
      expect(Number(ranked[1].rendimientoPct)).toBe(20)

      expect(ranked[2].rank).toBe(3)
      expect(ranked[2].activo.nombre).toBe('Stock B')
      expect(Number(ranked[2].rendimientoPct)).toBe(-40)
    })

    it('handles empty array', () => {
      const ranked = rankInvestments([])
      expect(ranked).toEqual([])
    })

    it('handles single investment', () => {
      const ranked = rankInvestments([mockInversiones[0]])
      expect(ranked).toHaveLength(1)
      expect(ranked[0].rank).toBe(1)
    })

    it('handles ties correctly', () => {
      const tiedInversiones: InversionRanked[] = [
        { ...mockInversiones[0], rendimientoPct: new Decimal(30) },
        { ...mockInversiones[1], rendimientoPct: new Decimal(30) },
        { ...mockInversiones[2], rendimientoPct: new Decimal(10) },
      ]

      const ranked = rankInvestments(tiedInversiones)

      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(1)
      expect(ranked[2].rank).toBe(3)
    })
  })
})
