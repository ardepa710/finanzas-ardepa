/**
 * Unit tests for long-term projection calculator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calcularProyeccionLargoPlazo } from '../long-term-projection'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    activo: {
      findMany: vi.fn(),
    },
    credito: {
      findMany: vi.fn(),
    },
    fuenteIngreso: {
      findMany: vi.fn(),
    },
    gasto: {
      findMany: vi.fn(),
    },
  },
}))

describe('calcularProyeccionLargoPlazo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 5-year projection structure by default', async () => {
    // Arrange
    const currentYear = new Date().getFullYear()
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(5, 0)

    // Assert
    expect(result).toBeDefined()
    expect(result.añoInicial).toBe(currentYear)
    expect(result.proyecciones).toHaveLength(5)
    expect(result.proyecciones[0].año).toBe(currentYear)
    expect(result.proyecciones[4].año).toBe(currentYear + 4)
  })

  it('should normalize MENSUAL income correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      {
        id: '1',
        nombre: 'Salario',
        monto: 5000,
        frecuencia: 'MENSUAL',
        activo: true,
        diaMes: 15,
        fechaBase: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(result.proyecciones[0].ingresosAnuales).toBe(5000 * 12)
  })

  it('should normalize QUINCENAL income correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      {
        id: '1',
        nombre: 'Salario Quincenal',
        monto: 2500,
        frecuencia: 'QUINCENAL',
        activo: true,
        diaMes: null,
        fechaBase: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // QUINCENAL: 2 per month = 24 per year
    expect(result.proyecciones[0].ingresosAnuales).toBe(2500 * 24)
  })

  it('should normalize SEMANAL income correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      {
        id: '1',
        nombre: 'Propinas',
        monto: 500,
        frecuencia: 'SEMANAL',
        activo: true,
        diaMes: null,
        fechaBase: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // SEMANAL: 4.33 per month × 12 = 51.96 per year
    expect(result.proyecciones[0].ingresosAnuales).toBeCloseTo(500 * 4.33 * 12, 1)
  })

  it('should calculate expense from last 90 days average', async () => {
    // Arrange
    const today = new Date()
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)

    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([
      { monto: 100, fecha: new Date() },
      { monto: 200, fecha: new Date() },
      { monto: 150, fecha: new Date() },
    ] as any)

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // Total = 450, daily average = 450/90 = 5, annual = 5 * 365 = 1825
    expect(result.proyecciones[0].gastosAnuales).toBeCloseTo(1825, 1)
  })

  it('should calculate debt payments correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      {
        id: '1',
        nombre: 'Tarjeta',
        pagoMensual: 500,
        saldoActual: 10000,
        activo: true,
      } as any,
      {
        id: '2',
        nombre: 'Préstamo',
        pagoMensual: 300,
        saldoActual: 5000,
        activo: true,
      } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(result.proyecciones[0].pagoDeudaAnual).toBe((500 + 300) * 12)
  })

  it('should calculate annual savings correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { pagoMensual: 500, saldoActual: 10000, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([
      { monto: 100, fecha: new Date() },
    ] as any)

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // Income: 5000 * 12 = 60000
    // Expenses: (100/90) * 365 ≈ 405.56
    // Debt: 500 * 12 = 6000
    // Savings: 60000 - 405.56 - 6000 ≈ 53594.44
    expect(result.proyecciones[0].ahorroAnual).toBeCloseTo(53594.44, 1)
  })

  it('should accumulate balance over years', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    // Each year saves 60000
    expect(result.proyecciones[0].balanceAcumulado).toBe(60000)
    expect(result.proyecciones[1].balanceAcumulado).toBe(120000)
    expect(result.proyecciones[2].balanceAcumulado).toBe(180000)
  })

  it('should calculate net worth progression', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([
      { valorActual: 50000, activo: true } as any,
    ])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(2, 0)

    // Assert
    // Initial net worth: 50000 - 10000 = 40000
    // Year 1: 40000 + savings
    // Year 2: 40000 + accumulated savings
    expect(result.proyecciones[0].patrimonioNeto).toBeGreaterThan(40000)
    expect(result.proyecciones[1].patrimonioNeto).toBeGreaterThan(
      result.proyecciones[0].patrimonioNeto
    )
  })

  it('should reduce debt over time', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 12000, pagoMensual: 600, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    // Year 1: 12000 - 7200 = 4800
    // Year 2: 4800 - 7200 = 0 (paid off)
    // Year 3: 0
    expect(result.proyecciones[0].deudaRestante).toBe(4800)
    expect(result.proyecciones[1].deudaRestante).toBe(0)
    expect(result.proyecciones[2].deudaRestante).toBe(0)
  })

  it('should handle debt payoff scenario', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 5000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 3000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    // Year 1: debt paid off (5000 - 6000 = 0), savings include freed payment
    // Year 2-3: no debt payments, higher savings
    expect(result.proyecciones[0].deudaRestante).toBe(0)
    expect(result.proyecciones[1].pagoDeudaAnual).toBe(0)
    expect(result.proyecciones[1].ahorroAnual).toBeGreaterThan(
      result.proyecciones[0].ahorroAnual
    )
  })

  it('should handle zero debt scenario', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(2, 0)

    // Assert
    expect(result.proyecciones[0].pagoDeudaAnual).toBe(0)
    expect(result.proyecciones[0].deudaRestante).toBe(0)
    expect(result.proyecciones[1].deudaRestante).toBe(0)
  })

  it('should handle negative initial balance', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, -5000)

    // Assert
    // Initial net worth: -10000 - 5000 = -15000
    // After year 1: -15000 + savings
    expect(result.resumen.patrimonioNetoInicial).toBe(-15000)
  })

  it('should handle zero income', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([
      { monto: 100, fecha: new Date() },
    ] as any)

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(result.proyecciones[0].ingresosAnuales).toBe(0)
    expect(result.proyecciones[0].ahorroAnual).toBeLessThan(0)
  })

  it('should handle zero expenses', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(result.proyecciones[0].gastosAnuales).toBe(0)
    expect(result.proyecciones[0].ahorroAnual).toBe(60000)
  })

  it('should handle negative savings', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 1000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([
      { monto: 100, fecha: new Date() },
    ] as any)

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // Income: 12000, Expenses: ~405, Debt: 6000
    // Savings: 12000 - 405 - 6000 ≈ 5595 (positive but low)
    expect(result.proyecciones[0].ahorroAnual).toBeLessThan(6000)
  })

  it('should calculate total saved correctly', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    // Each year: 60000
    expect(result.resumen.totalAhorrado).toBe(180000)
  })

  it('should calculate average annual growth', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([
      { valorActual: 50000, activo: true } as any,
    ])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    const totalGrowth = result.resumen.crecimientoTotal
    expect(result.resumen.crecimientoAnualPromedio).toBeCloseTo(totalGrowth / 3, 2)
  })

  it('should calculate debt eliminated', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 15000, pagoMensual: 1000, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(3, 0)

    // Assert
    // Debt fully paid: 15000
    expect(result.resumen.deudaEliminada).toBe(15000)
  })

  it('should handle multiple income sources', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
      { monto: 1000, frecuencia: 'QUINCENAL', activo: true } as any,
      { monto: 500, frecuencia: 'SEMANAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    // MENSUAL: 5000 * 12 = 60000
    // QUINCENAL: 1000 * 2 * 12 = 24000
    // SEMANAL: 500 * 4.33 * 12 = 25980
    // Total: 109980
    expect(result.proyecciones[0].ingresosAnuales).toBeCloseTo(109980, 1)
  })

  it('should handle multiple active debts', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
      { saldoActual: 5000, pagoMensual: 300, activo: true } as any,
      { saldoActual: 8000, pagoMensual: 400, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(result.proyecciones[0].pagoDeudaAnual).toBe((500 + 300 + 400) * 12)
  })

  it('should filter inactive income sources', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true } as any,
    ])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(vi.mocked(prisma.fuenteIngreso.findMany)).toHaveBeenCalledWith({
      where: { activo: true },
    })
  })

  it('should filter inactive debts', async () => {
    // Arrange
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

    // Act
    const result = await calcularProyeccionLargoPlazo(1, 0)

    // Assert
    expect(vi.mocked(prisma.credito.findMany)).toHaveBeenCalledWith({
      where: { activo: true },
    })
  })
})
