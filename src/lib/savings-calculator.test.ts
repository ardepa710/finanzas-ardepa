import { describe, it, expect } from 'vitest'
import {
  getNextOccurrences,
  getNextCreditDueDate,
  calcularResumenAhorro,
  getLastOccurrence,
  type FuenteIngresoInput,
  type CreditoInput,
  type GastoFijoInput,
} from './savings-calculator'

// Fixed test date: Wednesday March 5, 2026
const HOY = new Date(2026, 2, 5) // month is 0-indexed

describe('getNextOccurrences', () => {
  it('MENSUAL: returns next N dates on the given day of month', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(new Date(2026, 2, 15))  // Mar 15
    expect(result[1]).toEqual(new Date(2026, 3, 15))  // Apr 15
    expect(result[2]).toEqual(new Date(2026, 4, 15))  // May 15
  })

  it('MENSUAL: skips to next month if day already passed this month', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'MENSUAL',
      diaMes: 1,
      fechaBase: new Date(2026, 0, 1),
    }
    const result = getNextOccurrences(fuente, HOY, 2)
    // Today is Mar 5, so Mar 1 already passed — next is Apr 1
    expect(result[0]).toEqual(new Date(2026, 3, 1))
  })

  it('QUINCENAL: returns dates every 14 days from fechaBase', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2), // Mon Mar 2
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    // Mar 2 is past (today is Mar 5), next cycle is Mar 16, then Mar 30, then Apr 13
    expect(result[0]).toEqual(new Date(2026, 2, 16))
    expect(result[1]).toEqual(new Date(2026, 2, 30))
    expect(result[2]).toEqual(new Date(2026, 3, 13))
  })

  it('SEMANAL: returns dates every 7 days from fechaBase', () => {
    const fuente: FuenteIngresoInput = {
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2), // Mon Mar 2
    }
    const result = getNextOccurrences(fuente, HOY, 3)
    // Mar 2 is past, next is Mar 9, Mar 16, Mar 23
    expect(result[0]).toEqual(new Date(2026, 2, 9))
    expect(result[1]).toEqual(new Date(2026, 2, 16))
    expect(result[2]).toEqual(new Date(2026, 2, 23))
  })
})

describe('getNextCreditDueDate', () => {
  it('MENSUAL: returns diaPago this month if not yet passed', () => {
    const credito: CreditoInput = {
      nombre: 'Nómina',
      pagoMensual: 2500,
      frecuencia: 'MENSUAL',
      diaPago: 15,
    }
    const result = getNextCreditDueDate(credito, HOY) // today Mar 5
    expect(result).toEqual(new Date(2026, 2, 15, 23, 59, 0))
  })

  it('MENSUAL: advances to next month if diaPago already passed', () => {
    const credito: CreditoInput = {
      nombre: 'Nómina',
      pagoMensual: 2500,
      frecuencia: 'MENSUAL',
      diaPago: 1,
    }
    const result = getNextCreditDueDate(credito, HOY) // today Mar 5, Mar 1 passed
    expect(result).toEqual(new Date(2026, 3, 1, 23, 59, 0)) // Apr 1
  })

  it('QUINCENAL: returns next 14-day cycle from fechaBase', () => {
    const credito: CreditoInput = {
      nombre: 'Crédito quincenal',
      pagoMensual: 1000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2), // Mar 2
    }
    const result = getNextCreditDueDate(credito, HOY) // today Mar 5
    expect(result).toEqual(new Date(2026, 2, 16)) // Mar 16
  })

  it('SEMANAL: returns next 7-day cycle from fechaBase', () => {
    const credito: CreditoInput = {
      nombre: 'Crédito semanal',
      pagoMensual: 500,
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2), // Mon Mar 2
    }
    const result = getNextCreditDueDate(credito, HOY) // today is Thu Mar 5
    expect(result).toEqual(new Date(2026, 2, 9)) // Mon Mar 9
  })
})

describe('calcularResumenAhorro', () => {
  it('returns cobros projection with desglose per credit', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 22000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }]
    const creditos: CreditoInput[] = [{
      nombre: 'Nómina',
      pagoMensual: 2000,
      frecuencia: 'MENSUAL',
      diaPago: 20,
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY)

    expect(result.cobros).toHaveLength(3)
    expect(result.cobros[0].fecha).toEqual(new Date(2026, 2, 16))
    expect(result.cobros[0].montoIngreso).toBe(22000)
    expect(result.cobros[0].totalApartar).toBeGreaterThan(0)
    expect(result.cobros[0].disponible).toBeLessThan(22000)
  })

  it('disponible equals montoIngreso minus totalApartar', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 10000,
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }]
    const creditos: CreditoInput[] = [{
      nombre: 'Tarjeta',
      pagoMensual: 3000,
      frecuencia: 'MENSUAL',
      diaPago: 20,
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY)
    const c = result.cobros[0]
    expect(c.disponible).toBe(c.montoIngreso - c.totalApartar)
  })
})

// ─── GastoFijo tests ───────────────────────────────────────────

describe('getLastOccurrence', () => {
  it('MENSUAL: returns this month date if diaMes has passed', () => {
    // HOY = 5 mar 2026, diaMes=1 → el 1 mar ya pasó
    const gasto: GastoFijoInput = {
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 1,
      fechaBase: new Date(2026, 0, 1),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 1)) // 1 mar
  })

  it('MENSUAL: returns previous month if diaMes has not passed yet', () => {
    // HOY = 5 mar 2026, diaMes=15 → el 15 mar no ha pasado → feb 15
    const gasto: GastoFijoInput = {
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 1, 15)) // 15 feb
  })

  it('QUINCENAL: returns the most recent 14-day cycle date <= today', () => {
    // fechaBase = 2 mar (lunes), HOY = 5 mar → last occurrence is 2 mar
    const gasto: GastoFijoInput = {
      nombre: 'Netflix',
      monto: 300,
      categoria: 'ENTRETENIMIENTO',
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 2)) // 2 mar
  })

  it('SEMANAL: returns the most recent 7-day cycle date <= today', () => {
    // fechaBase = 2 mar (lunes), HOY = 5 mar (jue) → last occurrence is 2 mar
    const gasto: GastoFijoInput = {
      nombre: 'Mercado',
      monto: 800,
      categoria: 'ALIMENTACION',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2),
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toEqual(new Date(2026, 2, 2)) // 2 mar
  })

  it('returns null if fechaBase is in the future', () => {
    const gasto: GastoFijoInput = {
      nombre: 'Nuevo gasto',
      monto: 100,
      categoria: 'OTROS',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 3, 1), // 1 abr (futuro)
    }
    const result = getLastOccurrence(gasto, HOY)
    expect(result).toBeNull()
  })
})

describe('calcularResumenAhorro con gastosFijos', () => {
  it('includes gastos fijos in disponible calculation', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 22000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }]
    const creditos: CreditoInput[] = []
    const gastosFijos: GastoFijoInput[] = [{
      nombre: 'Renta',
      monto: 5000,
      categoria: 'SERVICIOS',
      frecuencia: 'MENSUAL',
      diaMes: 20,
      fechaBase: new Date(2026, 0, 20),
    }]
    const result = calcularResumenAhorro(creditos, fuentes, HOY, 3, gastosFijos)
    // Renta vence el 20 mar, cobro el 16 mar → debe aparecer en cobro[0]
    const cobro0 = result.cobros[0]
    expect(cobro0.desgloseGastosFijos.length).toBeGreaterThan(0)
    expect(cobro0.desgloseGastosFijos[0].creditoNombre).toBe('Renta')
    expect(cobro0.disponible).toBeLessThan(22000)
  })

  it('SEMANAL gasto with QUINCENAL income counts multiple occurrences in window', () => {
    // HOY = Mar 5. QUINCENAL income fechaBase=Mar 2 → cobros: Mar 16, Mar 30, Apr 13
    // Window cobro[0]: (Mar 16, Mar 30) = 14 days
    // SEMANAL gasto fechaBase=Mar 10 → from Mar 16: Mar 17, Mar 24 (both < Mar 30) → 2 hits
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 22000,
      frecuencia: 'QUINCENAL',
      fechaBase: new Date(2026, 2, 2),
    }]
    const gastosFijos: GastoFijoInput[] = [{
      nombre: 'Mercado',
      monto: 800,
      categoria: 'ALIMENTACION',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 10), // Mar 10 → next from Mar 16: Mar 17, Mar 24
    }]
    const result = calcularResumenAhorro([], fuentes, HOY, 3, gastosFijos)
    const cobro0 = result.cobros[0] // fecha=Mar 16, nextCobro=Mar 30
    // Must account for 2 weekly expenses (800 × 2 = 1600), not just 800
    expect(cobro0.desgloseGastosFijos).toHaveLength(1)
    expect(cobro0.desgloseGastosFijos[0].monto).toBe(1600)
    expect(cobro0.disponible).toBe(22000 - 1600)
  })

  it('SEMANAL gasto with MENSUAL income counts all 4-5 occurrences in ~30-day window', () => {
    // HOY = Mar 5. MENSUAL income diaMes=15 → cobros: Mar 15, Apr 15, May 15
    // Window cobro[0]: (Mar 15, Apr 15) = 31 days
    // SEMANAL gasto fechaBase=Mar 2 → from Mar 15: Mar 16, 23, 30, Apr 6, 13 → 5 hits < Apr 15
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 30000,
      frecuencia: 'MENSUAL',
      diaMes: 15,
    }]
    const gastosFijos: GastoFijoInput[] = [{
      nombre: 'Gym',
      monto: 200,
      categoria: 'SALUD',
      frecuencia: 'SEMANAL',
      fechaBase: new Date(2026, 2, 2), // Mar 2 → from Mar 15: Mar 16, 23, 30, Apr 6, 13
    }]
    const result = calcularResumenAhorro([], fuentes, HOY, 3, gastosFijos)
    const cobro0 = result.cobros[0] // fecha=Mar 15, nextCobro=Apr 15
    // 5 weekly occurrences in the ~31-day window
    expect(cobro0.desgloseGastosFijos[0].monto).toBe(200 * 5)
  })

  it('backward compatible: works with no gastosFijos argument', () => {
    const fuentes: FuenteIngresoInput[] = [{
      nombre: 'Salario',
      monto: 10000,
      frecuencia: 'MENSUAL',
      diaMes: 15,
      fechaBase: new Date(2026, 0, 15),
    }]
    const creditos: CreditoInput[] = []
    // Old signature: no gastosFijos
    const result = calcularResumenAhorro(creditos, fuentes, HOY)
    expect(result.cobros[0].desgloseGastosFijos).toEqual([])
  })
})
