/**
 * Tests for Avalanche Debt Payoff Strategy
 * Strategy: Pay off highest interest rate first, mathematically optimal
 */

import { describe, it, expect } from 'vitest'
import { calculateAvalanche } from '@/features/deuda/calculators/avalanche'
import { calculateSnowball } from '@/features/deuda/calculators/snowball'

describe('Avalanche Strategy Calculator', () => {
  describe('Ordering - Highest interest rate first', () => {
    it('orders debts by interest rate (highest first)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Low Rate',
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 8,
        },
        {
          id: '2',
          nombre: 'High Rate',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 18,
        },
        {
          id: '3',
          nombre: 'Medium Rate',
          saldoActual: 3000,
          pagoMensual: 100,
          tasaInteres: 12,
        },
      ]

      const result = calculateAvalanche(creditos, 200)

      // Verify order: High Rate (18%) -> Medium Rate (12%) -> Low Rate (8%)
      expect(result.orden).toEqual(['High Rate', 'Medium Rate', 'Low Rate'])
    })

    it('handles equal rates by maintaining stable sort', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Debt A',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 15,
        },
        {
          id: '2',
          nombre: 'Debt B',
          saldoActual: 2000,
          pagoMensual: 100,
          tasaInteres: 15,
        },
      ]

      const result = calculateAvalanche(creditos, 100)

      // Should maintain input order for equal rates
      expect(result.orden).toEqual(['Debt A', 'Debt B'])
    })

    it('orders by rate even when smaller balance has higher rate', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Large Low',
          saldoActual: 10000,
          pagoMensual: 200,
          tasaInteres: 5,
        },
        {
          id: '2',
          nombre: 'Small High',
          saldoActual: 500,
          pagoMensual: 25,
          tasaInteres: 22,
        },
      ]

      const result = calculateAvalanche(creditos, 150)

      // Avalanche targets high rate first (22%), even though it's larger balance
      expect(result.orden[0]).toBe('Small High')
      expect(result.orden[1]).toBe('Large Low')
    })
  })

  describe('Zero and Null Interest Rate Handling', () => {
    it('handles zero interest rate debts (treats as 0%, pays last)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Zero Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
        },
        {
          id: '2',
          nombre: 'High Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 15,
        },
      ]

      const result = calculateAvalanche(creditos, 100)

      // High interest first, zero last
      expect(result.orden).toEqual(['High Interest', 'Zero Interest'])
    })

    it('handles null interest rate (treats as 0%, pays last)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Null Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: null,
        },
        {
          id: '2',
          nombre: 'Normal Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 12,
        },
      ]

      const result = calculateAvalanche(creditos, 100)

      // Normal interest first, null last
      expect(result.orden).toEqual(['Normal Interest', 'Null Interest'])
    })

    it('orders correctly with mix of null, zero, and positive rates', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Null Rate',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: null,
        },
        {
          id: '2',
          nombre: 'High Rate',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 18,
        },
        {
          id: '3',
          nombre: 'Zero Rate',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 0,
        },
        {
          id: '4',
          nombre: 'Medium Rate',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 12,
        },
      ]

      const result = calculateAvalanche(creditos, 100)

      // Order: 18% -> 12% -> 0% -> null (both 0 and null treated as 0%, stable sort)
      expect(result.orden[0]).toBe('High Rate')
      expect(result.orden[1]).toBe('Medium Rate')
      // Zero and null can be in either order (both 0%), check they're last
      const lastTwo = result.orden.slice(2)
      expect(lastTwo).toContain('Zero Rate')
      expect(lastTwo).toContain('Null Rate')
    })

    it('calculates zero interest correctly (all payment goes to principal)', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Zero Interest',
          saldoActual: 1000,
          pagoMensual: 100,
          tasaInteres: 0,
        },
      ]

      const result = calculateAvalanche(creditos, 0)

      // All payment should go to principal
      const month1 = result.timeline.find((t) => t.mes === 1)
      expect(month1!.interes).toBe(0)
      expect(month1!.principal).toBe(100)
      expect(month1!.saldoRestante).toBe(900)
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

      const result = calculateAvalanche(creditos, 0) // No extra payment

      // Month 1: 1% of 1200 = $12 interest, $88 principal
      const month1 = result.timeline.find((t) => t.mes === 1)
      expect(month1).toBeDefined()
      expect(month1!.interes).toBeCloseTo(12, 1)
      expect(month1!.principal).toBeCloseTo(88, 1)
      expect(month1!.saldoRestante).toBeCloseTo(1112, 1)
    })

    it('applies extra payment to highest rate debt', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Low Rate',
          saldoActual: 2000,
          pagoMensual: 100,
          tasaInteres: 10,
        },
        {
          id: '2',
          nombre: 'High Rate',
          saldoActual: 500,
          pagoMensual: 50,
          tasaInteres: 20,
        },
      ]

      const result = calculateAvalanche(creditos, 200) // $200 extra

      // Month 1: High Rate gets minimum + extra = $50 + $200 = $250
      const month1Payments = result.timeline.filter((t) => t.mes === 1)
      const highRatePayment = month1Payments.find((t) => t.deuda === 'High Rate')
      const lowRatePayment = month1Payments.find((t) => t.deuda === 'Low Rate')

      expect(highRatePayment!.pago).toBeCloseTo(250, 1)
      expect(lowRatePayment!.pago).toBeCloseTo(100, 1) // Only minimum
    })
  })

  describe('Avalanche Effect', () => {
    it('applies avalanche effect after first debt paid off', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'High Rate Small',
          saldoActual: 300, // Pays off quickly
          pagoMensual: 50,
          tasaInteres: 20,
        },
        {
          id: '2',
          nombre: 'Medium Rate Large',
          saldoActual: 2000,
          pagoMensual: 100,
          tasaInteres: 12,
        },
      ]

      const result = calculateAvalanche(creditos, 200)

      // Find when High Rate is paid off
      const highRatePayments = result.timeline.filter((t) => t.deuda === 'High Rate Small')
      const lastHighRatePayment = highRatePayments[highRatePayments.length - 1]
      const payoffMonth = lastHighRatePayment.mes

      // After High Rate is paid, Medium Rate should get minimum ($100) + extra ($200) + freed payment ($50)
      const nextMonthPayment = result.timeline.find(
        (t) => t.mes === payoffMonth + 1 && t.deuda === 'Medium Rate Large'
      )

      // Should be close to $350 (100 + 200 + 50)
      expect(nextMonthPayment).toBeDefined()
      expect(nextMonthPayment!.pago).toBeGreaterThan(300)
    })

    it('correctly accumulates freed payments as debts are eliminated', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Highest',
          saldoActual: 200,
          pagoMensual: 50,
          tasaInteres: 22,
        },
        {
          id: '2',
          nombre: 'Medium',
          saldoActual: 600,
          pagoMensual: 75,
          tasaInteres: 15,
        },
        {
          id: '3',
          nombre: 'Lowest',
          saldoActual: 3000,
          pagoMensual: 150,
          tasaInteres: 8,
        },
      ]

      const result = calculateAvalanche(creditos, 100)

      // Verify debts are paid in rate order
      expect(result.orden).toEqual(['Highest', 'Medium', 'Lowest'])

      // Verify total paid includes all principal + interest
      const totalPrincipal = 200 + 600 + 3000
      expect(result.totalPagado).toBeGreaterThan(totalPrincipal)

      // Verify timeline shows payments for all debts across all months
      const uniqueDebts = new Set(result.timeline.map((t) => t.deuda))
      expect(uniqueDebts.size).toBe(3)
    })
  })

  describe('Avalanche vs Snowball Comparison', () => {
    it('saves more interest than Snowball with same debts', () => {
      // Scenario where strategies differ:
      // - Small balance, low rate
      // - Large balance, high rate
      const creditos = [
        {
          id: '1',
          nombre: 'Small Low',
          saldoActual: 1000,
          pagoMensual: 50,
          tasaInteres: 8,
        },
        {
          id: '2',
          nombre: 'Large High',
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 18,
        },
      ]

      const avalanche = calculateAvalanche(creditos, 200)
      const snowball = calculateSnowball(creditos, 200)

      // Avalanche should save more on interest
      expect(avalanche.totalIntereses).toBeLessThan(snowball.totalIntereses)

      // Verify strategies target different debts first
      expect(avalanche.orden[0]).toBe('Large High') // Highest rate
      expect(snowball.orden[0]).toBe('Small Low') // Smallest balance
    })

    it('both strategies agree when high rate also has smallest balance', () => {
      // When highest rate IS smallest balance, both strategies target same debt
      const creditos = [
        {
          id: '1',
          nombre: 'Small High',
          saldoActual: 800,
          pagoMensual: 50,
          tasaInteres: 18,
        },
        {
          id: '2',
          nombre: 'Large Low',
          saldoActual: 4500,
          pagoMensual: 150,
          tasaInteres: 12,
        },
      ]

      const avalanche = calculateAvalanche(creditos, 200)
      const snowball = calculateSnowball(creditos, 200)

      // Both should target same debt first
      expect(avalanche.orden[0]).toBe('Small High')
      expect(snowball.orden[0]).toBe('Small High')

      // Results might still differ slightly due to interest accumulation
      // but should be very close
      const interestDiff = Math.abs(avalanche.totalIntereses - snowball.totalIntereses)
      expect(interestDiff).toBeLessThan(50) // Small difference
    })

    it('demonstrates mathematical optimality of avalanche', () => {
      // Complex portfolio where avalanche clearly wins
      const creditos = [
        {
          id: '1',
          nombre: 'Card A',
          saldoActual: 2000,
          pagoMensual: 75,
          tasaInteres: 24, // HIGHEST rate
        },
        {
          id: '2',
          nombre: 'Card B',
          saldoActual: 1000, // SMALLEST balance
          pagoMensual: 50,
          tasaInteres: 8,
        },
        {
          id: '3',
          nombre: 'Loan',
          saldoActual: 5000,
          pagoMensual: 150,
          tasaInteres: 12,
        },
      ]

      const avalanche = calculateAvalanche(creditos, 250)
      const snowball = calculateSnowball(creditos, 250)

      // Avalanche targets Card A (24% rate) first
      expect(avalanche.orden[0]).toBe('Card A')

      // Snowball targets Card B (smallest) first
      expect(snowball.orden[0]).toBe('Card B')

      // Avalanche should save significantly on interest
      const savingsAmount = snowball.totalIntereses - avalanche.totalIntereses
      expect(savingsAmount).toBeGreaterThan(0)

      // Savings should be substantial (at least $100)
      expect(savingsAmount).toBeGreaterThan(100)
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

      const result = calculateAvalanche(creditos, 0)

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

      const result = calculateAvalanche(creditos, 0)

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

      const resultNoExtra = calculateAvalanche(creditos, 0)
      const resultWithExtra = calculateAvalanche(creditos, 100)

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

      const result = calculateAvalanche(creditos, 50)

      expect(result.orden).toEqual(['Only Debt'])
      expect(result.mesesLibertad).toBeGreaterThan(0)
      expect(result.totalPagado).toBeGreaterThan(1000)
    })

    it('handles empty array', () => {
      const creditos: any[] = []

      expect(() => calculateAvalanche(creditos, 100)).toThrow('No hay créditos activos')
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

      expect(() => calculateAvalanche(creditos, -50)).toThrow('El pago extra debe ser mayor o igual a 0')
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

      const result = calculateAvalanche(creditos, 0)

      expect(result.mesesLibertad).toBeLessThanOrEqual(3)
      expect(result.totalPagado).toBeGreaterThan(10)
    })

    it('handles large extra payment that pays off immediately', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'High Rate',
          saldoActual: 100,
          pagoMensual: 50,
          tasaInteres: 20,
        },
        {
          id: '2',
          nombre: 'Low Rate',
          saldoActual: 500,
          pagoMensual: 100,
          tasaInteres: 8,
        },
      ]

      const result = calculateAvalanche(creditos, 1000) // Huge extra payment

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

      const result = calculateAvalanche(creditos, 100)

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

      const result = calculateAvalanche(creditos, 0)

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

      const result = calculateAvalanche(creditos, 200)

      // With $350/month payment on $5000 at 18%, should pay off in ~17 months
      expect(result.mesesLibertad).toBeGreaterThan(13)
      expect(result.mesesLibertad).toBeLessThan(20)

      // Total interest should be significant but not huge
      expect(result.totalIntereses).toBeGreaterThan(500)
      expect(result.totalIntereses).toBeLessThan(1500)
    })
  })

  describe('Multiple Debts Integration', () => {
    it('handles realistic debt portfolio ordered by rate', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Store Card',
          saldoActual: 800,
          pagoMensual: 50,
          tasaInteres: 24, // HIGHEST - target first
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
          tasaInteres: 6, // LOWEST - target last
        },
      ]

      const result = calculateAvalanche(creditos, 300)

      // Should order by rate: Store Card (24%) -> Personal Loan (12%) -> Car Loan (6%)
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

    it('prioritizes high rate even on large balance', () => {
      const creditos = [
        {
          id: '1',
          nombre: 'Small Balance Low Rate',
          saldoActual: 2000,
          pagoMensual: 75,
          tasaInteres: 5,
        },
        {
          id: '2',
          nombre: 'Large Balance High Rate',
          saldoActual: 10000,
          pagoMensual: 300,
          tasaInteres: 20,
        },
      ]

      const result = calculateAvalanche(creditos, 200)

      // Should target high rate first despite larger balance
      // Avalanche targets highest rate (20%) first, even though it's a larger debt
      expect(result.orden[0]).toBe('Large Balance High Rate')
      expect(result.orden[1]).toBe('Small Balance Low Rate')
    })
  })
})
