/**
 * Integration tests for Avalanche Strategy API
 * Tests the full API endpoint including database queries and calculation
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import request from 'supertest'
import { prisma } from '@/lib/prisma'

const baseURL = 'http://localhost:3000'

describe('Avalanche Strategy API', () => {
  let creditoIds: string[] = []

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.credito.deleteMany({})
  })

  afterEach(async () => {
    // Clean up ALL test credits after each test (not just tracked ones)
    // This ensures full isolation between tests
    await prisma.credito.deleteMany({})
    creditoIds = []
  })

  afterAll(async () => {
    // Final cleanup
    await prisma.credito.deleteMany({})
    await prisma.$disconnect()
  })

  describe('GET /api/deuda/avalanche', () => {
    it('calculates avalanche strategy for active debts (highest rate first)', async () => {
      // Create test debts - low rate small balance, high rate large balance
      const credito1 = await prisma.credito.create({
        data: {
          nombre: 'Low Rate',
          tipo: 'PRESTAMO',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 8,
          diaPago: 15,
          activo: true,
        },
      })

      const credito2 = await prisma.credito.create({
        data: {
          nombre: 'High Rate',
          tipo: 'TARJETA',
          montoTotal: 5000,
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 18,
          diaPago: 20,
          activo: true,
        },
      })

      creditoIds.push(credito1.id, credito2.id)

      const response = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=200')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data).toBeDefined()

      const { data } = response.body

      // Verify result structure
      // Avalanche targets high rate first (18%) even though it's larger
      expect(data.orden).toEqual(['High Rate', 'Low Rate'])
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
        .get('/api/deuda/avalanche') // No pagoExtra param
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.orden).toEqual(['Test Debt'])
      expect(response.body.data.metadata.pagoMensualTotal).toBe(100)
    })

    it('handles zero interest rate debts (pays them last)', async () => {
      const zeroInterest = await prisma.credito.create({
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

      const normalInterest = await prisma.credito.create({
        data: {
          nombre: 'Normal Interest',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 15,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(zeroInterest.id, normalInterest.id)

      const response = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=100')
        .expect(200)

      expect(response.body.ok).toBe(true)
      // Should pay high rate first, zero rate last
      expect(response.body.data.orden).toEqual(['Normal Interest', 'Zero Interest'])
    })

    it('handles null interest rate (treats as 0%, pays last)', async () => {
      const nullInterest = await prisma.credito.create({
        data: {
          nombre: 'Null Interest',
          tipo: 'PRESTAMO',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: null,
          diaPago: 1,
          activo: true,
        },
      })

      const normalInterest = await prisma.credito.create({
        data: {
          nombre: 'Normal Interest',
          tipo: 'TARJETA',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 12,
          diaPago: 15,
          activo: true,
        },
      })

      creditoIds.push(nullInterest.id, normalInterest.id)

      const response = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=50')
        .expect(200)

      expect(response.body.ok).toBe(true)
      // Should pay normal rate first, null last
      expect(response.body.data.orden).toEqual(['Normal Interest', 'Null Interest'])
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
        .get('/api/deuda/avalanche?pagoExtra=100')
        .expect(200)

      expect(response.body.ok).toBe(true)
      expect(response.body.data.metadata.totalCreditosActivos).toBe(1)
      expect(response.body.data.orden).toEqual(['Active'])
    })
  })

  describe('Validation', () => {
    it('returns error when no active debts', async () => {
      const response = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=100')
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
        .get('/api/deuda/avalanche?pagoExtra=-50')
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
        .get('/api/deuda/avalanche?pagoExtra=invalid')
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error.message).toContain('número válido')
    })
  })

  describe('Real-world scenarios', () => {
    it('calculates realistic debt payoff timeline (highest rate first)', async () => {
      // Create realistic debt portfolio
      const creditCard = await prisma.credito.create({
        data: {
          nombre: 'Credit Card',
          tipo: 'TARJETA',
          montoTotal: 3000,
          saldoActual: 2500,
          pagoMensual: 75,
          tasaInteres: 24, // HIGHEST rate - target first
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
          tasaInteres: 6, // LOWEST rate - target last
          diaPago: 20,
          activo: true,
        },
      })

      creditoIds.push(creditCard.id, personalLoan.id, carLoan.id)

      const response = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=400')
        .expect(200)

      expect(response.body.ok).toBe(true)

      const { data } = response.body

      // Verify avalanche order (highest rate to lowest)
      expect(data.orden[0]).toBe('Credit Card') // 24%
      expect(data.orden[1]).toBe('Personal Loan') // 12%
      expect(data.orden[2]).toBe('Car Loan') // 6%

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
        .get('/api/deuda/avalanche?pagoExtra=50')
        .expect(200)

      // Calculate with large extra
      const response2 = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=300')
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

    it('demonstrates avalanche saves more interest than snowball', async () => {
      // Scenario where avalanche clearly wins:
      // - Small debt with low rate
      // - Large debt with high rate
      const smallLowRate = await prisma.credito.create({
        data: {
          nombre: 'Small Low Rate',
          tipo: 'PRESTAMO',
          montoTotal: 1000,
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 5,
          diaPago: 15,
          activo: true,
        },
      })

      const largeHighRate = await prisma.credito.create({
        data: {
          nombre: 'Large High Rate',
          tipo: 'TARJETA',
          montoTotal: 5000,
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 20,
          diaPago: 20,
          activo: true,
        },
      })

      creditoIds.push(smallLowRate.id, largeHighRate.id)

      // Get avalanche result
      const avalancheResponse = await request(baseURL)
        .get('/api/deuda/avalanche?pagoExtra=200')
        .expect(200)

      // Get snowball result for comparison
      const snowballResponse = await request(baseURL)
        .get('/api/deuda/snowball?pagoExtra=200')
        .expect(200)

      const avalanche = avalancheResponse.body.data
      const snowball = snowballResponse.body.data

      // Verify different ordering
      expect(avalanche.orden[0]).toBe('Large High Rate') // Highest rate first
      expect(snowball.orden[0]).toBe('Small Low Rate') // Smallest balance first

      // Avalanche should save more on interest
      expect(avalanche.totalIntereses).toBeLessThan(snowball.totalIntereses)

      // Both should pay off all debt
      expect(avalanche.mesesLibertad).toBeGreaterThan(0)
      expect(snowball.mesesLibertad).toBeGreaterThan(0)
    })
  })
})
