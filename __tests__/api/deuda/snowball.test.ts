/**
 * Integration tests for Snowball Strategy API
 * Tests the full API endpoint including database queries and calculation
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Snowball Strategy API', () => {
  let creditoIds: string[] = []

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.credito.deleteMany({})
  })

  afterEach(async () => {
    // Clean up test credits after each test
    await prisma.credito.deleteMany({
      where: {
        id: {
          in: creditoIds,
        },
      },
    })
    creditoIds = []
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.credito.deleteMany({})
    await prisma.$disconnect()
  })

  describe('GET /api/deuda/snowball', () => {
    it('calculates snowball strategy for active debts', async () => {
      // Create test debts
      const credito1 = await prisma.credito.create({
        data: {
          nombre: 'Small Debt',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: true,
        },
      })

      const credito2 = await prisma.credito.create({
        data: {
          nombre: 'Large Debt',
          tipo: 'PRESTAMO',
          montoTotal: 5000,
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 12,
          diaPago: 20,
          activo: true,
        },
      })

      creditoIds.push(credito1.id, credito2.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=200')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toBeDefined()

      const { data } = response.body

      // Verify result structure
      expect(data.orden).toEqual(['Small Debt', 'Large Debt'])
      expect(Array.isArray(data.timeline)).toBe(true)
      expect(data.timeline.length).toBeGreaterThan(0)
      expect(data.totalPagado).toBeGreaterThan(6000) // Principal + interest
      expect(data.totalIntereses).toBeGreaterThan(0)
      expect(data.mesesLibertad).toBeGreaterThan(0)

      // Verify metadata
      expect(data.metadata.totalCreditosActivos).toBe(2)
      expect(data.metadata.pagoMensualMinimo).toBe(200) // 50 + 150
      expect(data.metadata.pagoMensualTotal).toBe(400) // 200 + 200 extra
    })

    it('works with zero extra payment', async () => {
      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test Debt',
          tipo: 'TARJETA',
          montoTotal: 1200,
          saldoActual: 1200,
          pagoMensual: 100,
          tasaInteres: 12,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(credito.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball') // No pagoExtra param
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.orden).toEqual(['Test Debt'])
      expect(response.body.data.metadata.pagoMensualTotal).toBe(100)
    })

    it('handles zero interest rate debts', async () => {
      const credito = await prisma.credito.create({
        data: {
          nombre: 'Zero Interest',
          tipo: 'PRESTAMO',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
          diaPago: 1,
          activo: true,
        },
      })

      creditoIds.push(credito.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=0')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.totalIntereses).toBe(0)
      expect(response.body.data.mesesLibertad).toBe(10) // 1000 / 100
    })

    it('only includes active debts with positive balance', async () => {
      // Active with balance
      const activeDebt = await prisma.credito.create({
        data: {
          nombre: 'Active',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 500,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: true,
        },
      })

      // Inactive
      const inactiveDebt = await prisma.credito.create({
        data: {
          nombre: 'Inactive',
          tipo: 'PRESTAMO',
          montoTotal: 1000,
          saldoActual: 500,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: false,
        },
      })

      // Zero balance
      const paidDebt = await prisma.credito.create({
        data: {
          nombre: 'Paid Off',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 0,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(activeDebt.id, inactiveDebt.id, paidDebt.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=100')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.metadata.totalCreditosActivos).toBe(1)
      expect(response.body.data.orden).toEqual(['Active'])
    })
  })

  describe('Validation', () => {
    it('returns error when no active debts', async () => {
      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=100')
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.message).toContain('No hay créditos activos')
    })

    it('returns error for negative extra payment', async () => {
      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(credito.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=-50')
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.message).toContain('mayor o igual a 0')
    })

    it('returns error for invalid pagoExtra parameter', async () => {
      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 10,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(credito.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=invalid')
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.message).toContain('número válido')
    })
  })

  describe('Real-world scenarios', () => {
    it('calculates realistic debt payoff timeline', async () => {
      // Create realistic debt portfolio
      const creditCard = await prisma.credito.create({
        data: {
          nombre: 'Credit Card',
          tipo: 'TARJETA',
          montoTotal: 3000,
          saldoActual: 2500,
          pagoMensual: 75,
          tasaInteres: 18,
          diaPago: 5,
          activo: true,
        },
      })

      const personalLoan = await prisma.credito.create({
        data: {
          nombre: 'Personal Loan',
          tipo: 'PRESTAMO',
          montoTotal: 8000,
          saldoActual: 6000,
          pagoMensual: 200,
          tasaInteres: 12,
          diaPago: 15,
          activo: true,
        },
      })

      const carLoan = await prisma.credito.create({
        data: {
          nombre: 'Car Loan',
          tipo: 'PRESTAMO',
          montoTotal: 15000,
          saldoActual: 12000,
          pagoMensual: 350,
          tasaInteres: 6,
          diaPago: 20,
          activo: true,
        },
      })

      creditoIds.push(creditCard.id, personalLoan.id, carLoan.id)

      const response = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=400')
        .expect(200)

      expect(response.body.ok).toBe(true)

      const { data } = response.body

      // Verify snowball order (smallest to largest)
      expect(data.orden[0]).toBe('Credit Card')
      expect(data.orden[1]).toBe('Personal Loan')
      expect(data.orden[2]).toBe('Car Loan')

      // Verify reasonable payoff timeline
      expect(data.mesesLibertad).toBeGreaterThan(12)
      expect(data.mesesLibertad).toBeLessThan(60)

      // Verify total paid > principal (due to interest)
      const totalPrincipal = 2500 + 6000 + 12000
      expect(data.totalPagado).toBeGreaterThan(totalPrincipal)

      // Verify metadata
      expect(data.metadata.pagoMensualMinimo).toBe(625) // 75 + 200 + 350
      expect(data.metadata.pagoMensualTotal).toBe(1025) // 625 + 400
    })

    it('shows faster payoff with larger extra payment', async () => {
      const credito = await prisma.credito.create({
        data: {
          nombre: 'Test Debt',
          tipo: 'TARJETA',
          montoTotal: 5000,
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 18,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(credito.id)

      // Calculate with small extra
      const response1 = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=50')
        .expect(200)

      // Calculate with large extra
      const response2 = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=300')
        .expect(200)

      // Larger extra payment should result in:
      // 1. Fewer months to freedom
      // 2. Less total interest paid
      expect(response2.body.data.mesesLibertad).toBeLessThan(
        response1.body.data.mesesLibertad
      )
      expect(response2.body.data.totalIntereses).toBeLessThan(
        response1.body.data.totalIntereses
      )
    })
  })
})
