/**
 * Integration tests for GET /api/proyeccion/largo-plazo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/proyeccion/largo-plazo/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    activo: {
      findMany: vi.fn()
    },
    credito: {
      findMany: vi.fn()
    },
    fuenteIngreso: {
      findMany: vi.fn()
    },
    gasto: {
      findMany: vi.fn()
    }
  }
}))

describe('GET /api/proyeccion/largo-plazo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default empty data
    vi.mocked(prisma.activo.findMany).mockResolvedValue([])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([])
  })

  it('should return default 5-year projection', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.data).toHaveProperty('proyeccion')
    expect(body.data.proyeccion.proyecciones).toHaveLength(5)
    expect(body.data.proyeccion).toHaveProperty('resumen')
    expect(body.data.proyeccion).toHaveProperty('añoInicial')
  })

  it('should return custom 3-year projection', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=3')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones).toHaveLength(3)
  })

  it('should accept positive initial balance', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?balanceInicial=10000')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones).toHaveLength(5)
  })

  it('should accept negative initial balance', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?balanceInicial=-5000')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones).toHaveLength(5)
  })

  it('should calculate correct annual income with MENSUAL frequency', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones[0].ingresosAnuales).toBe(60000)
  })

  it('should calculate correct annual income with QUINCENAL frequency', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    // QUINCENAL: 2 per month × 12 = 24 per year
    expect(body.data.proyeccion.proyecciones[0].ingresosAnuales).toBe(60000)
  })

  it('should calculate correct annual income with SEMANAL frequency', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    // SEMANAL: 4.33 per month × 12
    expect(body.data.proyeccion.proyecciones[0].ingresosAnuales).toBeCloseTo(500 * 4.33 * 12, 0)
  })

  it('should calculate expenses from last 90 days average', async () => {
    vi.mocked(prisma.gasto.findMany).mockResolvedValue([
      { monto: 100, fecha: new Date() },
      { monto: 200, fecha: new Date() },
      { monto: 150, fecha: new Date() },
    ] as any)

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    // Total = 450, daily average = 450/90 = 5, annual = 5 * 365 = 1825
    expect(body.data.proyeccion.proyecciones[0].gastosAnuales).toBeCloseTo(1825, 0)
  })

  it('should calculate debt payments correctly', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    // (500 + 300) × 12 = 9600
    expect(body.data.proyeccion.proyecciones[0].pagoDeudaAnual).toBe(9600)
  })

  it('should project debt reduction over time', async () => {
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      {
        id: '1',
        nombre: 'Tarjeta',
        pagoMensual: 600,
        saldoActual: 12000,
        activo: true,
      } as any,
    ])

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=3')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    const proyecciones = body.data.proyeccion.proyecciones

    // Year 1: 12000 - 7200 = 4800
    expect(proyecciones[0].deudaRestante).toBe(4800)
    // Year 2: 4800 - 7200 = 0 (paid off)
    expect(proyecciones[1].deudaRestante).toBe(0)
    // Year 3: 0
    expect(proyecciones[2].deudaRestante).toBe(0)
  })

  it('should handle zero income scenario', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones[0].ingresosAnuales).toBe(0)
  })

  it('should handle zero expenses scenario', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones[0].gastosAnuales).toBe(0)
  })

  it('should handle no debts scenario', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.proyeccion.proyecciones[0].pagoDeudaAnual).toBe(0)
    expect(body.data.proyeccion.proyecciones[0].deudaRestante).toBe(0)
  })

  it('should calculate accumulated balance correctly', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      {
        monto: 5000,
        frecuencia: 'MENSUAL',
        activo: true,
        diaMes: 15,
      } as any,
    ])

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=3')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    const proyecciones = body.data.proyeccion.proyecciones

    // Each year saves 60000 (no expenses, no debts)
    expect(proyecciones[0].balanceAcumulado).toBe(60000)
    expect(proyecciones[1].balanceAcumulado).toBe(120000)
    expect(proyecciones[2].balanceAcumulado).toBe(180000)
  })

  it('should calculate net worth growth', async () => {
    vi.mocked(prisma.activo.findMany).mockResolvedValue([
      { valorActual: 50000, activo: true } as any,
    ])
    vi.mocked(prisma.credito.findMany).mockResolvedValue([
      { saldoActual: 10000, pagoMensual: 500, activo: true } as any,
    ])
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true, diaMes: 15 } as any,
    ])

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=2')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    const proyecciones = body.data.proyeccion.proyecciones

    // Initial net worth: 50000 - 10000 = 40000
    // Should grow over time
    expect(proyecciones[0].patrimonioNeto).toBeGreaterThan(40000)
    expect(proyecciones[1].patrimonioNeto).toBeGreaterThan(proyecciones[0].patrimonioNeto)
  })

  it('should calculate summary statistics correctly', async () => {
    vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([
      { monto: 5000, frecuencia: 'MENSUAL', activo: true, diaMes: 15 } as any,
    ])

    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=3')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(200)
    const resumen = body.data.proyeccion.resumen

    expect(resumen).toHaveProperty('patrimonioNetoInicial')
    expect(resumen).toHaveProperty('patrimonioNetoFinal')
    expect(resumen).toHaveProperty('crecimientoTotal')
    expect(resumen).toHaveProperty('crecimientoAnualPromedio')
    expect(resumen).toHaveProperty('totalAhorrado')
    expect(resumen).toHaveProperty('deudaEliminada')

    // Should have saved 180000 total
    expect(resumen.totalAhorrado).toBe(180000)
    expect(resumen.crecimientoAnualPromedio).toBeCloseTo(60000, 0)
  })

  it('should reject invalid años parameter (0)', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=0')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('should reject invalid años parameter (6)', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=6')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('should reject invalid años parameter (negative)', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?años=-1')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('should reject invalid balanceInicial format', async () => {
    const request = new NextRequest('http://localhost:3000/api/proyeccion/largo-plazo?balanceInicial=invalid')
    const response = await GET(request, {})
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toBeDefined()
  })
})
