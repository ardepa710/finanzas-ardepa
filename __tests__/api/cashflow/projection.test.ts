/**
 * Integration tests for cashflow projection API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cashflow/projection/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    fuenteIngreso: {
      findMany: vi.fn()
    },
    credito: {
      findMany: vi.fn()
    },
    gasto: {
      findMany: vi.fn()
    }
  }
}))

describe('GET /api/cashflow/projection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('default parameters', () => {
    it('returns 6-month projection with default params', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection')
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones).toHaveLength(6)
      expect(body.data.proyecciones[0].balanceAcumulado).toBe(0) // Default balance
    })
  })

  describe('custom meses parameter', () => {
    it('returns 3-month projection when meses=3', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=3')
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones).toHaveLength(3)
    })

    it('returns 12-month projection when meses=12', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=12')
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones).toHaveLength(12)
    })

    it('returns 1-month projection when meses=1', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=1')
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones).toHaveLength(1)
    })
  })

  describe('custom balanceInicial parameter', () => {
    it('applies custom initial balance', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/cashflow/projection?balanceInicial=1000'
      )
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones[0].balanceAcumulado).toBe(1000)
    })

    it('handles negative initial balance', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/cashflow/projection?balanceInicial=-500'
      )
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones[0].balanceAcumulado).toBe(-500)
    })

    it('handles decimal initial balance', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/cashflow/projection?balanceInicial=1234.56'
      )
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones[0].balanceAcumulado).toBe(1234.56)
    })
  })

  describe('combined parameters', () => {
    it('handles both meses and balanceInicial', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/cashflow/projection?meses=3&balanceInicial=500'
      )
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data.proyecciones).toHaveLength(3)
      expect(body.data.proyecciones[0].balanceAcumulado).toBe(500)
    })
  })

  describe('validation errors', () => {
    it('returns 400 if meses < 1', async () => {
      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=0')
      const response = await GET(request, {})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.message).toContain('meses debe estar entre 1 y 12')
    })

    it('returns 400 if meses > 12', async () => {
      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=13')
      const response = await GET(request, {})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.message).toContain('meses debe estar entre 1 y 12')
    })

    it('returns 400 if meses is negative', async () => {
      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=-5')
      const response = await GET(request, {})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.message).toContain('meses debe estar entre 1 y 12')
    })

    it('returns 400 if meses is not a number', async () => {
      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=abc')
      const response = await GET(request, {})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.message).toContain('meses debe estar entre 1 y 12')
    })

    it('returns 400 if balanceInicial is not a number', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/cashflow/projection?balanceInicial=abc'
      )
      const response = await GET(request, {})
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error.message).toContain('balanceInicial debe ser un número válido')
    })
  })

  describe('response structure', () => {
    it('returns complete projection structure', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection')
      const response = await GET(request, {})
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.ok).toBe(true)
      expect(body.data).toHaveProperty('proyecciones')
      expect(body.data).toHaveProperty('resumen')
      expect(Array.isArray(body.data.proyecciones)).toBe(true)
    })

    it('includes all required projection fields', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection?meses=1')
      const response = await GET(request, {})
      const body = await response.json()

      const projection = body.data.proyecciones[0]
      expect(projection).toHaveProperty('mes')
      expect(projection).toHaveProperty('fecha')
      expect(projection).toHaveProperty('nombreMes')
      expect(projection).toHaveProperty('ingresos')
      expect(projection).toHaveProperty('gastos')
      expect(projection).toHaveProperty('flujoNeto')
      expect(projection).toHaveProperty('balanceAcumulado')
    })

    it('includes all required summary fields', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection')
      const response = await GET(request, {})
      const body = await response.json()

      expect(body.data.resumen).toHaveProperty('totalIngresos')
      expect(body.data.resumen).toHaveProperty('totalGastos')
      expect(body.data.resumen).toHaveProperty('flujoNetoTotal')
      expect(body.data.resumen).toHaveProperty('balanceFinal')
      expect(body.data.resumen).toHaveProperty('promedioMensual')
    })
  })

  describe('database queries', () => {
    it('queries only active income sources', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection')
      await GET(request, {})

      expect(prisma.fuenteIngreso.findMany).toHaveBeenCalledWith({
        where: {
          activo: true
        }
      })
    })

    it('queries only active credits', async () => {
      vi.mocked(prisma.fuenteIngreso.findMany).mockResolvedValue([])
      vi.mocked(prisma.credito.findMany).mockResolvedValue([])
      vi.mocked(prisma.gasto.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/cashflow/projection')
      await GET(request, {})

      expect(prisma.credito.findMany).toHaveBeenCalledWith({
        where: {
          activo: true
        }
      })
    })
  })
})
