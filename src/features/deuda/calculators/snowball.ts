/**
 * Snowball Debt Payoff Strategy Calculator
 *
 * Strategy: Pay off smallest balance first, then roll that payment into the next smallest.
 * This creates a "snowball effect" where freed payments accelerate debt elimination.
 *
 * Algorithm:
 * 1. Sort debts by balance (smallest first)
 * 2. Each month:
 *    - Calculate interest on remaining balances
 *    - Pay minimum on all debts
 *    - Apply extra payment + freed payments to smallest remaining debt
 * 3. When a debt is paid off, add its minimum payment to the extra pool
 * 4. Continue until all debts are eliminated
 */

import type { MonthlyPayment, StrategyResult } from '../types'

interface Credito {
  id: string
  nombre: string
  saldoActual: number
  pagoMensual: number
  tasaInteres: number | null
}

interface DebtState {
  id: string
  nombre: string
  saldo: number
  pagoMinimo: number
  tasaMensual: number // Monthly interest rate (APR / 12 / 100)
  orden: number // Original sort order
}

export function calculateSnowball(
  creditos: Credito[],
  pagoExtra: number
): StrategyResult {
  // Validation
  if (!creditos || creditos.length === 0) {
    throw new Error('No hay créditos activos')
  }

  if (pagoExtra < 0) {
    throw new Error('El pago extra debe ser mayor o igual a 0')
  }

  // Sort by balance (smallest first) and create working state
  const sortedDebts: DebtState[] = creditos
    .map((c, index) => ({
      id: c.id,
      nombre: c.nombre,
      saldo: c.saldoActual,
      pagoMinimo: c.pagoMensual,
      tasaMensual: c.tasaInteres ? c.tasaInteres / 12 / 100 : 0,
      orden: index,
    }))
    .sort((a, b) => {
      // Sort by balance ascending
      if (a.saldo !== b.saldo) {
        return a.saldo - b.saldo
      }
      // For equal balances, maintain stable sort by original order
      return a.orden - b.orden
    })

  // Track results
  const orden: string[] = []
  const timeline: MonthlyPayment[] = []
  let totalPagado = 0
  let totalIntereses = 0
  let mes = 1
  let extraPool = pagoExtra

  // Track active debts (not yet paid off)
  const activeDebts = [...sortedDebts]

  // Safety limit to prevent infinite loops
  const MAX_MONTHS = 1000

  // Simulate month-by-month until all debts paid
  while (activeDebts.length > 0 && mes <= MAX_MONTHS) {
    // For this month, process all active debts
    const monthPayments: MonthlyPayment[] = []

    // Calculate minimum payments total (needed to determine extra allocation)
    const minimumTotal = activeDebts.reduce((sum, debt) => sum + debt.pagoMinimo, 0)

    // Process each debt
    for (let i = 0; i < activeDebts.length; i++) {
      const debt = activeDebts[i]

      // Calculate interest for this month
      const interes = debt.saldo * debt.tasaMensual

      // Determine payment for this debt
      let pago: number

      if (i === 0) {
        // First debt (smallest) gets minimum + all extra
        pago = debt.pagoMinimo + extraPool
      } else {
        // Other debts get only their minimum
        pago = debt.pagoMinimo
      }

      // Cap payment at what's needed to pay off the debt
      const totalOwed = debt.saldo + interes
      if (pago > totalOwed) {
        pago = totalOwed
      }

      // Calculate principal (payment minus interest)
      const principal = pago - interes

      // Update balance
      const nuevoSaldo = debt.saldo + interes - pago

      // Record this month's payment
      monthPayments.push({
        mes,
        deuda: debt.nombre,
        pago: Math.round(pago * 100) / 100,
        interes: Math.round(interes * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        saldoRestante: Math.max(0, Math.round(nuevoSaldo * 100) / 100),
      })

      // Update totals
      totalPagado += pago
      totalIntereses += interes

      // Update debt state
      debt.saldo = Math.max(0, nuevoSaldo)
    }

    // Add this month's payments to timeline
    timeline.push(...monthPayments)

    // Check for paid-off debts and handle snowball effect
    const paidOffDebts: DebtState[] = []

    for (let i = activeDebts.length - 1; i >= 0; i--) {
      if (activeDebts[i].saldo <= 0.01) { // Consider paid if balance < 1 cent
        const paidDebt = activeDebts.splice(i, 1)[0]
        paidOffDebts.push(paidDebt)

        // Add to payoff order
        orden.push(paidDebt.nombre)

        // Snowball: Add this debt's minimum payment to the extra pool
        extraPool += paidDebt.pagoMinimo
      }
    }

    // Move to next month
    mes++
  }

  // Safety check
  if (mes > MAX_MONTHS) {
    throw new Error('Cálculo excedió límite de meses (posible error en datos)')
  }

  return {
    orden,
    timeline,
    totalPagado: Math.round(totalPagado * 100) / 100,
    totalIntereses: Math.round(totalIntereses * 100) / 100,
    mesesLibertad: mes - 1, // Last month with payments
  }
}
