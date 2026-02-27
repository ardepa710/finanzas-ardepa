import { describe, it, expect } from 'vitest'
import {
  getNextPaydays,
  calcularAhorroPorCredito,
  calcularResumenAhorro,
} from './savings-calculator'

describe('getNextPaydays', () => {
  it('returns future paydays starting from base date', () => {
    const base = new Date('2026-03-02T12:00:00Z') // known Monday payday
    const today = new Date('2026-02-26T12:00:00Z')
    const paydays = getNextPaydays(base, today, 3)
    expect(paydays).toHaveLength(3)
    // First payday should be March 2 (14 days after a past reference)
    const d0 = paydays[0].toISOString().slice(0, 10)
    expect(d0).toBe('2026-03-02')
    // Second payday: 14 days later
    const d1 = paydays[1].toISOString().slice(0, 10)
    expect(d1).toBe('2026-03-16')
    // Third: 14 days after that
    const d2 = paydays[2].toISOString().slice(0, 10)
    expect(d2).toBe('2026-03-30')
  })

  it('skips past dates and returns future ones', () => {
    const base = new Date('2026-03-02T12:00:00Z')
    const today = new Date('2026-03-10T12:00:00Z') // between 1st and 2nd payday
    const paydays = getNextPaydays(base, today, 2)
    expect(paydays[0].toISOString().slice(0, 10)).toBe('2026-03-16')
    expect(paydays[1].toISOString().slice(0, 10)).toBe('2026-03-30')
  })
})

describe('calcularAhorroPorCredito', () => {
  it('puts all payment in first payday when due date is before second payday', () => {
    const credito = { nombre: 'Crédito Nómina', pagoMensual: 2000, diaPago: 15 }
    const paydays = [
      new Date('2026-03-02T12:00:00Z'),
      new Date('2026-03-16T12:00:00Z'),
    ]
    const dueDate = new Date('2026-03-15T23:59:00Z')
    const result = calcularAhorroPorCredito(credito, paydays, dueDate)
    // Only 1 payday before due date, so all goes in first slot
    expect(result.porPago[0]).toBeCloseTo(2000)
  })

  it('splits payment evenly across 2 paydays before due date', () => {
    const credito = { nombre: 'Tarjeta', pagoMensual: 3000, diaPago: 20 }
    const paydays = [
      new Date('2026-03-02T12:00:00Z'),
      new Date('2026-03-16T12:00:00Z'),
      new Date('2026-03-30T12:00:00Z'),
    ]
    const dueDate = new Date('2026-03-19T23:59:00Z') // after 2nd payday, before 3rd
    const result = calcularAhorroPorCredito(credito, paydays, dueDate)
    expect(result.porPago[0]).toBeCloseTo(1500)
    expect(result.porPago[1]).toBeCloseTo(1500)
  })
})

describe('calcularResumenAhorro', () => {
  it('sums savings from multiple credits for next payday', () => {
    const creditos = [
      { nombre: 'Crédito A', pagoMensual: 2000, diaPago: 10 },
      { nombre: 'Crédito B', pagoMensual: 1500, diaPago: 25 },
    ]
    const result = calcularResumenAhorro(
      creditos,
      new Date('2026-03-02T12:00:00Z'), // base payday
      new Date('2026-02-26T12:00:00Z'), // today
      22000
    )
    expect(result.totalProximoPago).toBeGreaterThan(0)
    expect(result.desglose).toHaveLength(2)
    expect(result.salarioDisponible).toBe(22000 - result.totalProximoPago)
    expect(result.diasParaProximoPago).toBeGreaterThan(0)
  })

  it('returns salarioDisponible = salary - totalProximoPago', () => {
    const creditos = [{ nombre: 'Test', pagoMensual: 5000, diaPago: 20 }]
    const result = calcularResumenAhorro(
      creditos,
      new Date('2026-03-02T12:00:00Z'),
      new Date('2026-02-26T12:00:00Z'),
      22000
    )
    expect(result.salarioDisponible).toBeCloseTo(22000 - result.totalProximoPago)
  })
})
