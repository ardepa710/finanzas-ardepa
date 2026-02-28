/**
 * Tests for trend analyzer service
 */

import { describe, it, expect } from 'vitest'
import { detectTrend, analyzeTrend, type Tendencia } from '@/features/reportes/services/trend-analyzer'

describe('trend-analyzer', () => {
  describe('detectTrend', () => {
    it('should detect upward trend when increase > 10%', () => {
      const result = detectTrend(1100, 1000)
      expect(result).toBe('subida')
    })

    it('should detect downward trend when decrease > 10%', () => {
      const result = detectTrend(850, 1000)
      expect(result).toBe('bajada')
    })

    it('should detect stable trend when change < 10%', () => {
      const stable1 = detectTrend(1050, 1000)
      const stable2 = detectTrend(950, 1000)
      expect(stable1).toBe('estable')
      expect(stable2).toBe('estable')
    })

    it('should handle zero previous value', () => {
      const result = detectTrend(100, 0)
      expect(result).toBe('subida')
    })

    it('should handle zero current value', () => {
      const result = detectTrend(0, 100)
      expect(result).toBe('bajada')
    })

    it('should handle both zero values', () => {
      const result = detectTrend(0, 0)
      expect(result).toBe('estable')
    })
  })

  describe('analyzeTrend', () => {
    it('should detect upward trend from data points', () => {
      const result = analyzeTrend([100, 120, 150, 180])
      expect(result.tendencia).toBe('subida')
      expect(result.porcentajeCambio).toBeGreaterThan(10)
    })

    it('should detect downward trend from data points', () => {
      const result = analyzeTrend([200, 180, 150, 120])
      expect(result.tendencia).toBe('bajada')
      expect(result.porcentajeCambio).toBeLessThan(-10)
    })

    it('should detect stable trend from data points', () => {
      const result = analyzeTrend([100, 105, 98, 103])
      expect(result.tendencia).toBe('estable')
      expect(Math.abs(result.porcentajeCambio)).toBeLessThan(10)
    })

    it('should handle single data point', () => {
      const result = analyzeTrend([100])
      expect(result.tendencia).toBe('estable')
      expect(result.porcentajeCambio).toBe(0)
    })

    it('should handle empty array', () => {
      const result = analyzeTrend([])
      expect(result.tendencia).toBe('estable')
      expect(result.porcentajeCambio).toBe(0)
    })
  })
})
