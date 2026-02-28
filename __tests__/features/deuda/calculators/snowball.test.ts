/**
 * Tests for Snowball Debt Payoff Strategy
 * Strategy: Pay off smallest balance first, snowball extra payments
 */

import { describe, it, expect } from 'vitest'
import { calculateSnowball } from '@/features/deuda/calculators/snowball'

describe('Snowball Strategy Calculator', () => {
  describe('Ordering - Smallest balance first', () => {
    it('orders debts by balance (smallest first)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Large Debt',
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 12,
        },
        {
          id: '2',
          nombre: 'Small Debt',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '3',
          nombre: 'Medium Debt',
          saldoActual: 3000,
          pagoMensual: 100,
          tasaInteres: 15,
        },
      ]

      const result = calculateSnowball(creditos, 200)

      // Verify order: Small -> Medium -> Large
      expect(result.orden).toEqual(['Small Debt', 'Medium Debt', 'Large Debt'])
    })

    it('handles equal balances by maintaining stable sort', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Debt A',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'Debt B',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 15,
        },
      ]

      const result = calculateSnowball(creditos, 100)

      // Should maintain input order for equal balances
      expect(result.orden).toEqual(['Debt A', 'Debt B'])
    })
  })

  describe('Payment Calculations', () => {
    it('calculates interest correctly for monthly payments', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Test Debt',
          saldoActual: 1200, // $1200 balance
          pagoMensual: 100, // $100 minimum
          tasaInteres: 12, // 12% APR = 1% monthly
        },
      ]

      const result = calculateSnowball(creditos, 0) // No extra payment

      // Month 1: 1% of 1200 = $12 interest, $88 principal
      const month1 = result.timeline.find((t) => t.mes === 1)
      expect(month1).toBeDefined()
      expect(month1!.interes).toBeCloseTo(12, 1)
      expect(month1!.principal).toBeCloseTo(88, 1)
      expect(month1!.saldoRestante).toBeCloseTo(1112, 1)
    })

    it('handles zero interest rate debts', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Zero Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
        },
      ]

      const result = calculateSnowball(creditos, 0)

      // All payment should go to principal
      const month1 = result.timeline.find((t) => t.mes === 1)
      expect(month1!.interes).toBe(0)
      expect(month1!.principal).toBe(100)
      expect(month1!.saldoRestante).toBe(900)
    })

    it('applies extra payment to smallest debt', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Small',
          saldoActual: 500,
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'Large',
          saldoActual: 2000,
          pagoMensual: 100,
          tasaInteres: 15,
        },
      ]

      const result = calculateSnowball(creditos, 200) // $200 extra

      // Month 1: Small gets minimum + extra = $50 + $200 = $250
      const month1Payments = result.timeline.filter((t) => t.mes === 1)
      const smallPayment = month1Payments.find((t) => t.deuda === 'Small')
      const largePayment = month1Payments.find((t) => t.deuda === 'Large')

      expect(smallPayment!.pago).toBeCloseTo(250, 1)
      expect(largePayment!.pago).toBeCloseTo(100, 1) // Only minimum
    })
  })

  describe('Snowball Effect', () => {
    it('applies snowball effect after first debt paid off', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Small',
          saldoActual: 300, // Pays off in ~2 months
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'Large',
          saldoActual: 2000,
          pagoMensual: 100,
          tasaInteres: 15,
        },
      ]

      const result = calculateSnowball(creditos, 200)

      // Find when Small is paid off (check for mes where Small has saldoRestante = 0)
      const smallPayments = result.timeline.filter((t) => t.deuda === 'Small')
      const lastSmallPayment = smallPayments[smallPayments.length - 1]
      const payoffMonth = lastSmallPayment.mes

      // After Small is paid, Large should get minimum ($100) + extra ($200) + Small's freed payment ($50)
      const nextMonthPayment = result.timeline.find(
        (t) => t.mes === payoffMonth + 1 && t.deuda === 'Large'
      )

      // Should be close to $350 (100 + 200 + 50)
      expect(nextMonthPayment).toBeDefined()
      expect(nextMonthPayment!.pago).toBeGreaterThan(300)
    })

    it('correctly accumulates freed payments as debts are eliminated', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Tiny',
          saldoActual: 200,
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'Small',
          saldoActual: 600,
          pagoMensual: 75,
          tasaInteres: 12,
        },
        {
          id: '3',
          nombre: 'Large',
          saldoActual: 3000,
          pagoMensual: 150,
          tasaInteres: 15,
        },
      ]

      const result = calculateSnowball(creditos, 100)

      // Verify debts are paid in order
      expect(result.orden).toEqual(['Tiny', 'Small', 'Large'])

      // Verify total paid includes all principal + interest
      const totalPrincipal = 200 + 600 + 3000
      expect(result.totalPagado).toBeGreaterThan(totalPrincipal)

      // Verify timeline shows payments for all debts across all months
      const uniqueDebts = new Set(result.timeline.map((t) => t.deuda))
      expect(uniqueDebts.size).toBe(3)
    })
  })

  describe('Final Results', () => {
    it('calculates total paid correctly (principal + interest)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Test',
          saldoActual: 1200,
          pagoMensual: 100,
          tasaInteres: 12,
        },
      ]

      const result = calculateSnowball(creditos, 0)

      // Total paid should be principal (1200) + interest accumulated
      expect(result.totalPagado).toBeGreaterThan(1200)
      expect(result.totalIntereses).toBeGreaterThan(0)
      expect(result.totalPagado).toBeCloseTo(1200 + result.totalIntereses, 1)
    })

    it('calculates months to freedom correctly', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Quick Payoff',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
        },
      ]

      const result = calculateSnowball(creditos, 0)

      // With $100/month on $1000 debt (0% interest), should take 10 months
      expect(result.mesesLibertad).toBe(10)

      // Timeline should have exactly 10 months
      const uniqueMonths = new Set(result.timeline.map((t) => t.mes))
      expect(uniqueMonths.size).toBe(10)
    })

    it('completes faster with extra payments', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Test',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
        },
      ]

      const resultNoExtra = calculateSnowball(creditos, 0)
      const resultWithExtra = calculateSnowball(creditos, 100)

      // With extra payment, should complete in half the time
      expect(resultWithExtra.mesesLibertad).toBeLessThan(resultNoExtra.mesesLibertad)
      expect(resultWithExtra.mesesLibertad).toBe(5) // $200/month on $1000 = 5 months
    })
  })

  describe('Edge Cases', () => {
    it('handles single debt', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Only Debt',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 10,
        },
      ]

      const result = calculateSnowball(creditos, 50)

      expect(result.orden).toEqual(['Only Debt'])
      expect(result.mesesLibertad).toBeGreaterThan(0)
      expect(result.totalPagado).toBeGreaterThan(1000)
    })

    it('handles empty array', () => {
      const creditos: any[] = []

      expect(() => calculateSnowball(creditos, 100)).toThrow('No hay créditos activos')
    })

    it('handles negative extra payment', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Test',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 10,
        },
      ]

      expect(() => calculateSnowball(creditos, -50)).toThrow('El pago extra debe ser mayor o igual a 0')
    })

    it('handles very small balances', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Tiny',
          saldoActual: 10,
          pagoMensual: 5,
          tasaInteres: 10,
        },
      ]

      const result = calculateSnowball(creditos, 0)

      expect(result.mesesLibertad).toBeLessThanOrEqual(3)
      expect(result.totalPagado).toBeGreaterThan(10)
    })

    it('handles large extra payment that pays off immediately', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Small',
          saldoActual: 100,
          pagoMensual: 50,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'Large',
          saldoActual: 500,
          pagoMensual: 100,
          tasaInteres: 12,
        },
      ]

      const result = calculateSnowball(creditos, 1000) // Huge extra payment

      // Should pay off quickly (1-2 months)
      expect(result.mesesLibertad).toBeLessThanOrEqual(2)
    })

    it('handles zero minimum payment (edge case)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Zero Min',
          saldoActual: 1000,
          pagoMensual: 0,
          tasaInteres: 10,
        },
      ]

      const result = calculateSnowball(creditos, 100)

      // Should still make progress with extra payment
      expect(result.mesesLibertad).toBeGreaterThan(0)
      expect(result.mesesLibertad).toBeLessThan(100) // Reasonable time
    })
  })

  describe('Interest Accuracy', () => {
    it('calculates declining interest as balance decreases', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Test',
          saldoActual: 1200,
          pagoMensual: 200,
          tasaInteres: 12, // 1% monthly
        },
      ]

      const result = calculateSnowball(creditos, 0)

      const payments = result.timeline.filter((t) => t.deuda === 'Test')

      // Interest should decrease each month as balance goes down
      expect(payments[0].interes).toBeGreaterThan(payments[1].interes)
      expect(payments[1].interes).toBeGreaterThan(payments[2].interes)
    })

    it('matches expected payoff for real-world scenario', () => {
      // Real scenario: $5000 debt, 18% APR, $150 minimum, $200 extra
      const creditos = [
        {
          id: '1',
          nombre: 'Credit Card',
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 18, // 1.5% monthly
        },
      ]

      const result = calculateSnowball(creditos, 200)

      // With $350/month payment on $5000 at 18%, should pay off in ~17 months
      expect(result.mesesLibertad).toBeGreaterThan(13)
      expect(result.mesesLibertad).toBeLessThan(20)

      // Total interest should be significant but not huge
      expect(result.totalIntereses).toBeGreaterThan(500)
      expect(result.totalIntereses).toBeLessThan(1500)
    })
  })

  describe('Multiple Debts Integration', () => {
    it('handles realistic debt portfolio', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Store Card',
          saldoActual: 800,
          pagoMensual: 50,
          tasaInteres: 24,
        },
        {
          id: '2',
          nombre: 'Personal Loan',
          saldoActual: 3500,
          pagoMensual: 120,
          tasaInteres: 12,
        },
        {
          id: '3',
          nombre: 'Car Loan',
          saldoActual: 8000,
          pagoMensual: 250,
          tasaInteres: 6,
        },
      ]

      const result = calculateSnowball(creditos, 300)

      // Should order: Store Card -> Personal Loan -> Car Loan
      expect(result.orden).toEqual(['Store Card', 'Personal Loan', 'Car Loan'])

      // Should complete all debts
      expect(result.mesesLibertad).toBeGreaterThan(0)

      // Total paid = all principal + interest
      const totalPrincipal = 800 + 3500 + 8000
      expect(result.totalPagado).toBeGreaterThan(totalPrincipal)

      // Should have timeline entries for all debts
      const debts = new Set(result.timeline.map((t) => t.deuda))
      expect(debts.size).toBe(3)
    })
  })
})
