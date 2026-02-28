import { describe, it, expect } from 'vitest'
import {
  calculateMesesParaMeta,
  projectFechaComplecion,
  esMetaAlcanzable,
  calcularAhorroMensualRequerido,
} from '../proyeccion'

describe('Metas Proyeccion Calculator', () => {
  describe('calculateMesesParaMeta', () => {
    it('calculates months for goal with exact amount', () => {
      const resultado = calculateMesesParaMeta(12000, 0, 1000)
      expect(resultado).toBe(12)
    })

    it('calculates months for goal with partial progress', () => {
      const resultado = calculateMesesParaMeta(10000, 4000, 1000)
      expect(resultado).toBe(6)
    })

    it('handles zero savings - returns Infinity', () => {
      const resultado = calculateMesesParaMeta(5000, 0, 0)
      expect(resultado).toBe(Infinity)
    })

    it('handles overfunded goal - returns 0', () => {
      const resultado = calculateMesesParaMeta(5000, 6000, 1000)
      expect(resultado).toBe(0)
    })

    it('handles negative savings - returns Infinity', () => {
      const resultado = calculateMesesParaMeta(5000, 0, -100)
      expect(resultado).toBe(Infinity)
    })

    it('rounds up partial months', () => {
      const resultado = calculateMesesParaMeta(5500, 0, 1000)
      expect(resultado).toBe(6) // 5.5 months rounds to 6
    })

    it('handles decimal amounts correctly', () => {
      const resultado = calculateMesesParaMeta(1234.56, 234.56, 100)
      expect(resultado).toBe(10) // 1000/100 = 10
    })

    it('handles very small amounts', () => {
      const resultado = calculateMesesParaMeta(10, 5, 1)
      expect(resultado).toBe(5)
    })

    it('handles very large amounts', () => {
      const resultado = calculateMesesParaMeta(1000000, 100000, 10000)
      expect(resultado).toBe(90)
    })

    it('handles goal exactly met', () => {
      const resultado = calculateMesesParaMeta(5000, 5000, 1000)
      expect(resultado).toBe(0)
    })
  })

  describe('projectFechaComplecion', () => {
    it('projects completion date 1 month away', () => {
      const resultado = projectFechaComplecion(1)
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 1)

      expect(resultado.getFullYear()).toBe(expected.getFullYear())
      expect(resultado.getMonth()).toBe(expected.getMonth())
    })

    it('projects completion date 1 year away', () => {
      const resultado = projectFechaComplecion(12)
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 12)

      expect(resultado.getFullYear()).toBe(expected.getFullYear())
    })

    it('projects completion date 0 months - returns today', () => {
      const resultado = projectFechaComplecion(0)
      const today = new Date()

      expect(resultado.getFullYear()).toBe(today.getFullYear())
      expect(resultado.getMonth()).toBe(today.getMonth())
      expect(resultado.getDate()).toBe(today.getDate())
    })

    it('handles end-of-month edge cases', () => {
      // If today is Jan 31 and we add 1 month, should be Feb 28/29
      const resultado = projectFechaComplecion(1)
      expect(resultado).toBeInstanceOf(Date)
    })

    it('handles leap years in date calculations', () => {
      const resultado = projectFechaComplecion(24) // 2 years
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 24)

      expect(resultado.getFullYear()).toBe(expected.getFullYear())
    })
  })

  describe('esMetaAlcanzable', () => {
    it('returns true when plenty of time', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = esMetaAlcanzable(10000, 1000, futuro)
      expect(resultado).toBe(true) // Need 10 months, have 12
    })

    it('returns false when tight deadline', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 5)

      const resultado = esMetaAlcanzable(10000, 1000, futuro)
      expect(resultado).toBe(false) // Need 10 months, have 5
    })

    it('returns false when impossible deadline', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 1)

      const resultado = esMetaAlcanzable(100000, 1000, futuro)
      expect(resultado).toBe(false) // Need 100 months, have 1
    })

    it('returns true when no deadline', () => {
      const resultado = esMetaAlcanzable(10000, 1000, null)
      expect(resultado).toBe(true) // Always achievable with no deadline
    })

    it('returns true when already completed', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = esMetaAlcanzable(0, 1000, futuro)
      expect(resultado).toBe(true) // No money left to save
    })

    it('returns true when exact deadline match', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 11) // Give 1 month buffer for rounding

      const resultado = esMetaAlcanzable(10000, 1000, futuro)
      expect(resultado).toBe(true) // Close to 10 months needed
    })

    it('returns false when past date', () => {
      const pasado = new Date()
      pasado.setMonth(pasado.getMonth() - 1)

      const resultado = esMetaAlcanzable(5000, 1000, pasado)
      expect(resultado).toBe(false)
    })

    it('handles zero savings capacity', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = esMetaAlcanzable(5000, 0, futuro)
      expect(resultado).toBe(false) // Can't save anything
    })
  })

  describe('calcularAhorroMensualRequerido', () => {
    it('calculates required monthly savings for 1 year', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = calcularAhorroMensualRequerido(12000, futuro)
      expect(resultado).toBeGreaterThan(950)
      expect(resultado).toBeLessThan(1050)
    })

    it('calculates required monthly savings for 6 months', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 6)

      const resultado = calcularAhorroMensualRequerido(6000, futuro)
      expect(resultado).toBeGreaterThan(950)
      expect(resultado).toBeLessThan(1050)
    })

    it('calculates required monthly savings for 1 month', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 1)

      const resultado = calcularAhorroMensualRequerido(1000, futuro)
      expect(resultado).toBeGreaterThan(900)
      expect(resultado).toBeLessThan(1200)
    })

    it('handles past date - returns Infinity', () => {
      const pasado = new Date()
      pasado.setMonth(pasado.getMonth() - 1)

      const resultado = calcularAhorroMensualRequerido(5000, pasado)
      expect(resultado).toBe(Infinity)
    })

    it('handles decimal precision', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 10)

      const resultado = calcularAhorroMensualRequerido(12345.67, futuro)
      expect(resultado).toBeGreaterThan(1200)
      expect(resultado).toBeLessThan(1300)
    })

    it('handles very small amounts', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = calcularAhorroMensualRequerido(12, futuro)
      expect(resultado).toBeGreaterThan(0.8)
      expect(resultado).toBeLessThan(1.5)
    })

    it('handles very large amounts', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 24)

      const resultado = calcularAhorroMensualRequerido(240000, futuro)
      expect(resultado).toBeGreaterThan(9500)
      expect(resultado).toBeLessThan(10500)
    })

    it('handles zero monto faltante', () => {
      const futuro = new Date()
      futuro.setMonth(futuro.getMonth() + 12)

      const resultado = calcularAhorroMensualRequerido(0, futuro)
      expect(resultado).toBe(0)
    })
  })
})
