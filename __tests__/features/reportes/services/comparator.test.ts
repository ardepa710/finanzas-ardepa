/**
 * Tests for period comparator service
 */

import { describe, it, expect } from 'vitest'
import { comparePeriods, getPreviousPeriod } from '@/features/reportes/services/comparator'
import type { DateRange } from '@/features/reportes/services/report-generator'

describe('comparator', () => {
  describe('getPreviousPeriod', () => {
    it('should calculate previous period of same duration', () => {
      const range: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }
      const previous = getPreviousPeriod(range)

      // Feb has 28 days, so previous should be Jan 4 - Feb 1 (28 days)
      expect(previous.fin).toEqual(new Date('2026-02-01'))
      const duration = range.fin.getTime() - range.inicio.getTime()
      const previousDuration = previous.fin.getTime() - previous.inicio.getTime()
      expect(previousDuration).toBe(duration)
    })

    it('should handle single day range', () => {
      const range: DateRange = {
        inicio: new Date('2026-02-15'),
        fin: new Date('2026-02-15'),
      }
      const previous = getPreviousPeriod(range)

      expect(previous.fin).toEqual(new Date('2026-02-15'))
      expect(previous.inicio).toEqual(new Date('2026-02-15'))
    })
  })

  describe('comparePeriods', () => {
    it('should calculate change and percentage correctly', () => {
      const current: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }
      const previous: DateRange = {
        inicio: new Date('2026-01-01'),
        fin: new Date('2026-01-31'),
      }

      const result = comparePeriods(
        { range: current, value: 1100 },
        { range: previous, value: 1000 }
      )

      expect(result.actual).toBe(1100)
      expect(result.anterior).toBe(1000)
      expect(result.cambio).toBe(100)
      expect(result.cambioPorcentaje).toBe(10)
    })

    it('should handle zero previous value', () => {
      const current: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }
      const previous: DateRange = {
        inicio: new Date('2026-01-01'),
        fin: new Date('2026-01-31'),
      }

      const result = comparePeriods(
        { range: current, value: 1000 },
        { range: previous, value: 0 }
      )

      expect(result.cambio).toBe(1000)
      expect(result.cambioPorcentaje).toBe(100)
    })

    it('should handle negative change', () => {
      const current: DateRange = {
        inicio: new Date('2026-02-01'),
        fin: new Date('2026-02-28'),
      }
      const previous: DateRange = {
        inicio: new Date('2026-01-01'),
        fin: new Date('2026-01-31'),
      }

      const result = comparePeriods(
        { range: current, value: 800 },
        { range: previous, value: 1000 }
      )

      expect(result.cambio).toBe(-200)
      expect(result.cambioPorcentaje).toBe(-20)
    })
  })
})
